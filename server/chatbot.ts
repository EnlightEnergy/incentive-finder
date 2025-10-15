import OpenAI from "openai";
import type { Program } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Energos Incentive Chat, an expert AI assistant for Enlighting, a commercial energy efficiency consulting company specializing in California utility incentive programs.

Your role is to demonstrate value by showing users real incentive opportunities available to them, then guide them toward expert consultation to maximize those benefits.

CORE PHILOSOPHY:
1. Lead with value - show actual programs with key details when you have concrete data
2. Build trust through helpful information, not by withholding it
3. Use the excitement about opportunities to naturally guide toward consultation
4. Position consultation as "maximizing and stacking opportunities" not "learning what's available"

KEY GUIDELINES:
1. Ask for ZIP code first to determine utility territory
2. Ask if they want to search by specific energy saving measure OR by building type
3. When you have program data, share 2-3 top programs with compelling highlights
4. Only share details that are explicitly provided in the context - never invent or assume specifics
5. Emphasize that programs can be "stacked" for combined savings
6. Highlight the complexity of applications and the value of expert guidance
7. Guide toward consultation by showing both the opportunity and the expertise needed to capture it

CONVERSATION FLOW:
1. Greet warmly and ask for ZIP code
2. Confirm utility territory
3. Ask: "Would you like to search for a specific energy saving measure or incentives for your building type?"
4. If Measure: Ask what measure (LED, HVAC, solar, etc.)
5. If Building Type: Ask facility type (office, retail, industrial, restaurant, warehouse, etc.)
6. When programs are found, showcase 2-3 with the most compelling details from the context provided
7. Mention stacking potential and that multiple incentives may apply
8. Naturally transition: "These are strong opportunities! Our experts can help you navigate applications, stack programs, and maximize your total incentives. Would you like a free consultation?"

SHOWING PROGRAM RESULTS - Important rules:
- Present 2-3 programs with the best available details from the context
- Always include program name and utility (e.g., "SCE Commercial Lighting Program")
- Share specific incentive amounts/types ONLY if explicitly stated in the context (e.g., "$X rebate" or "per-kWh incentives")
- If no numeric details are in context, describe qualitative benefits instead (e.g., "offers rebates for LED upgrades" or "covers HVAC improvements")
- When data is limited, be transparent: "This program offers lighting incentives - our experts can provide specific amounts and requirements"
- Use emojis sparingly: 💰 for incentives, 📋 for key info
- Never invent, estimate, or extrapolate amounts, dates, or requirements not explicitly in the context

RESPONSE STYLE:
- Professional and knowledgeable, with appropriate enthusiasm
- Specific when you have data, honest when you don't
- Build interest: "I found several programs for your warehouse that look promising..."
- Show expertise through relevant insights about stacking, timing, and process
- Guide toward consultation as the natural next step for detailed analysis

TONE: Helpful expert who provides value upfront while making clear that professional guidance will unlock the full opportunity. Be conversational, trustworthy, and demonstrate expertise without over-promising.`;

interface ChatParams {
  messages: Array<{ role: string; content: string; timestamp: string }>;
  zipCode?: string;
  facilityType?: string;
  utility?: string;
  allUtilities?: string[];
  programs: Program[];
  unrecognizedFacility?: string;
  measure?: string;
  searchMode?: string;
  isNewZip?: boolean;
}

export async function processChatWithAI(params: ChatParams): Promise<string> {
  const { messages, zipCode, facilityType, utility, allUtilities, programs, unrecognizedFacility, measure, searchMode, isNewZip } = params;
  
  // If there's an unrecognized facility, use fallback immediately
  if (zipCode && !facilityType && unrecognizedFacility) {
    return generateFallbackResponse(params);
  }
  
  const contextInfo = [];
  
  if (zipCode) {
    contextInfo.push(`User's ZIP code: ${zipCode}`);
    
    // If this is a new/re-entered ZIP with no facility/measure, explicitly ask user what to search for
    if (isNewZip && !facilityType && !measure) {
      contextInfo.push(`CRITICAL: User just provided a ZIP code but NO recognized facility type or measure. This is a FRESH SEARCH START - completely ignore ALL previous facility types, measures, or search context from earlier messages. Do NOT show programs yet. Instead, confirm the utility and ask: "Would you like to search by specific energy measure or by building type?"`);
    }
  }
  
  if (allUtilities && allUtilities.length > 1) {
    contextInfo.push(`IMPORTANT: Multiple utilities serve this ZIP code: ${allUtilities.join(', ')}`);
    contextInfo.push(`Ask the user which utility they receive service from before proceeding.`);
  }
  
  if (utility) {
    contextInfo.push(`User's utility: ${utility}`);
  }
  
  if (facilityType) {
    contextInfo.push(`User's facility type: ${facilityType}`);
  }
  
  if (measure) {
    contextInfo.push(`User's energy measure interest: ${measure}`);
  }
  
  if (searchMode) {
    contextInfo.push(`User's search mode: ${searchMode}`);
  }
  
  if (programs.length > 0) {
    contextInfo.push(`\nRelevant programs available:`);
    programs.slice(0, 3).forEach((program, idx) => {
      contextInfo.push(`${idx + 1}. ${program.name} (${program.owner})`);
      if (program.incentiveDescription) {
        // Provide full incentive description to AI so it can summarize key points
        contextInfo.push(`   Incentives: ${program.incentiveDescription}`);
      }
      if (program.description && program.description !== program.incentiveDescription) {
        // Add program description if different and available
        contextInfo.push(`   Description: ${program.description}`);
      }
    });
    contextInfo.push(`\n(${programs.length} total programs may be relevant - mention there are multiple stackable opportunities)`);
    contextInfo.push(`\nIMPORTANT: Include the key incentive details (amounts, types) from above when you present these programs to the user.`);
  }
  
  const contextMessage = contextInfo.length > 0 
    ? `\n\nCONTEXT FOR THIS CONVERSATION:\n${contextInfo.join('\n')}`
    : '';
  
  const chatMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + contextMessage },
        ...chatMessages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate_limit')) {
      return generateFallbackResponse(params);
    }
    
    if (error?.status === 404) {
      console.error("Model not found. Please check your OpenAI model configuration.");
      return generateFallbackResponse(params);
    }
    
    throw new Error("Failed to process chat message");
  }
}

function generateFallbackResponse(params: ChatParams): string {
  const { messages, zipCode, facilityType, utility, allUtilities, programs, unrecognizedFacility, measure, searchMode, isNewZip } = params;
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  
  // CONTEXT-AWARE: Check if user just provided new information
  const hasNewZip = /\b\d{5}\b/.test(lastMessage);
  const hasNewFacility = /\b(office|retail|restaurant|industrial|warehouse|hotel|medical|school|recreation|agriculture|multifamily|grocery|food\s*processing|auto\s*dealer)\b/i.test(lastMessage);
  const hasNewMeasure = /\b(led|lighting|lights|lamp|hvac|heat\s*pump|solar|insulation|motor|refrigeration)\b/i.test(lastMessage);
  
  // If this is a new ZIP (fresh search), ignore previous facility/measure context
  if (isNewZip && zipCode) {
    // If multiple utilities available, skip acknowledgment and ask about utility instead
    if (allUtilities && allUtilities.length > 1 && !utility) {
      const utilityList = allUtilities.map(u => {
        if (u === 'SCE') return 'Southern California Edison (SCE)';
        if (u === 'PGE') return 'Pacific Gas & Electric (PG&E)';
        if (u === 'SDGE') return 'San Diego Gas & Electric (SDG&E)';
        if (u === 'LADWP') return 'Los Angeles Department of Water & Power (LADWP)';
        return u;
      }).join(', ');
      
      return `Your ZIP code (${zipCode}) is served by multiple utilities: ${utilityList}. Which utility do you receive service from? This will help me find the right incentive programs for you.`;
    }
    return `Thank you for providing your ZIP code (${zipCode}). Let me check which utilities serve this area...`;
  }
  
  // Only acknowledge new facility/measure if we don't have programs to show yet
  if (hasNewFacility && facilityType && programs.length === 0) {
    const facilityWords: Record<string, string> = {
      office: 'office building',
      retail: 'retail store',
      restaurant: 'restaurant',
      industrial: 'industrial facility',
      warehouse: 'warehouse',
      hotel: 'hotel',
      medical: 'medical facility',
      school: 'school',
      recreation: 'recreation facility',
      agriculture: 'agricultural facility',
      multifamily: 'multifamily property',
      grocery: 'grocery store',
      foodprocessing: 'food processing facility',
      autodealer: 'auto dealership',
    };
    const facilityName = facilityWords[facilityType] || facilityType;
    return `Great! I understand you have a ${facilityName}. Let me search for relevant incentive programs in your area...`;
  }
  
  if (hasNewMeasure && measure && programs.length === 0) {
    const measureName = measure === 'Lighting' ? 'lighting' : measure;
    return `Excellent! I'll look for ${measureName} incentive programs available to you. Let me pull up the relevant options...`;
  }
  
  // Handle unrecognized facility type
  if (zipCode && !facilityType && unrecognizedFacility) {
    return `I do not recognize "${unrecognizedFacility}". Would you qualify this as Retail, Commercial, Industrial, or Multi-family?`;
  }
  
  // Extract actual facility words from user's message
  const facilityWords = {
    office: 'office building',
    retail: lastMessage.includes('store') ? 'store' : lastMessage.includes('shop') ? 'shop' : 'retail',
    restaurant: lastMessage.includes('restaurant') ? 'restaurant' : lastMessage.includes('cafe') ? 'cafe' : lastMessage.includes('bar') ? 'bar' : 'dining facility',
    industrial: lastMessage.includes('warehouse') ? 'warehouse' : lastMessage.includes('manufacturing') ? 'manufacturing facility' : lastMessage.includes('factory') ? 'factory' : 'industrial facility',
    hotel: lastMessage.includes('motel') ? 'motel' : 'hotel',
    medical: lastMessage.includes('hospital') ? 'hospital' : lastMessage.includes('clinic') ? 'clinic' : lastMessage.includes('dental') ? 'dental office' : 'medical facility',
    school: lastMessage.includes('university') ? 'university' : lastMessage.includes('college') ? 'college' : 'school',
    recreation: lastMessage.includes('golf') ? 'golf course' : lastMessage.includes('gym') ? 'gym' : lastMessage.includes('fitness') ? 'fitness center' : lastMessage.includes('athletic') ? 'athletic facility' : 'recreation facility',
    agriculture: lastMessage.includes('farm') ? 'farm' : lastMessage.includes('vineyard') ? 'vineyard' : lastMessage.includes('greenhouse') ? 'greenhouse' : 'agricultural facility',
    multifamily: lastMessage.includes('apartment') ? 'apartment building' : lastMessage.includes('condo') ? 'condo' : 'multifamily property',
  };
  
  const userFacilityWord = facilityType ? (facilityWords[facilityType as keyof typeof facilityWords] || facilityType) : 'facility';
  
  // Check for utility selection/correction
  const utilityCorrectionPatterns = {
    'SCE': /\b(sce|southern california edison|so\.?\s*cal\.?\s*edison)\b/i,
    'PGE': /\b(pg&?e|pge|pacific gas & electric|pacific gas and electric|pacific gas)\b/i,
    'SDGE': /\b(sdg&?e|sdge|san diego gas & electric|san diego gas and electric|san diego gas)\b/i,
    'LADWP': /\b(ladwp|los angeles department of water & power|los angeles department of water and power|la\s*dept\.?\s*of\s*water|los angeles water|los angeles power)\b/i,
  };
  
  for (const [utilityKey, pattern] of Object.entries(utilityCorrectionPatterns)) {
    if (pattern.test(lastMessage)) {
      const utilityName = utilityKey === 'SCE' ? 'Southern California Edison' : 
                         utilityKey === 'PGE' ? 'Pacific Gas & Electric' :
                         utilityKey === 'SDGE' ? 'San Diego Gas & Electric' :
                         'Los Angeles Department of Water & Power';
      return `Thank you for clarifying! I've updated your utility to ${utilityName}. Now, what type of facility do you have? This will help me find the most relevant incentive programs for you.`;
    }
  }
  
  if (!zipCode && /\d{5}/.test(lastMessage)) {
    const zip = lastMessage.match(/\d{5}/)?.[0];
    return `Thank you for providing your ZIP code (${zip}). I'm checking your utility territory now. One moment please...`;
  }
  
  // Handle multiple utilities for a ZIP code - only ask if no utility selected yet
  if (zipCode && allUtilities && allUtilities.length > 1 && !facilityType && !utility) {
    const utilityList = allUtilities.map(u => {
      if (u === 'SCE') return 'Southern California Edison (SCE)';
      if (u === 'PGE') return 'Pacific Gas & Electric (PG&E)';
      if (u === 'SDGE') return 'San Diego Gas & Electric (SDG&E)';
      if (u === 'LADWP') return 'Los Angeles Department of Water & Power (LADWP)';
      return u;
    }).join(', ');
    
    return `Your ZIP code (${zipCode}) is served by multiple utilities: ${utilityList}. Which utility do you receive service from? This will help me find the right incentive programs for you.`;
  }
  
  // CRITICAL: If ZIP and utility confirmed but no searchMode, trigger UI selector
  if (zipCode && utility && !searchMode && !facilityType && !measure) {
    const utilityName = utility === 'SCE' ? 'Southern California Edison' : 
                       utility === 'PGE' ? 'Pacific Gas & Electric' :
                       utility === 'SDGE' ? 'San Diego Gas & Electric' :
                       utility === 'LADWP' ? 'Los Angeles Department of Water & Power' : utility;
    return `Great! I can see you're in ${utilityName}'s service territory. I can help you find incentives in two ways: by a specific energy saving measure (like LED lighting, HVAC upgrades, or solar) OR by your building type (like office, retail, or warehouse). Please select your preferred search method using the buttons below.`;
  }
  
  // If ZIP confirmed but no utility yet and only one utility available
  if (zipCode && !utility && !facilityType && !measure && (!allUtilities || allUtilities.length === 1)) {
    return `Thank you! I can help you find incentives in two ways: by a specific energy saving measure (like LED lighting, HVAC upgrades, or solar) OR by your building type (like office, retail, or warehouse). Please select your preferred search method using the buttons below.`;
  }
  
  // Handle when searchMode is selected but specific info not yet provided
  if (zipCode && searchMode === 'buildingType' && !facilityType) {
    return `Perfect! You've chosen to search by building type. What type of facility do you have? For example: office, retail, restaurant, warehouse, hotel, medical facility, or school.`;
  }
  
  if (zipCode && searchMode === 'measure' && !measure) {
    // Check if user just entered something that wasn't recognized as a measure
    const previousMessage = messages[messages.length - 1];
    const previousAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    
    // If the previous assistant message was asking for a measure and user responded but no measure detected
    if (previousMessage?.role === 'user' && 
        previousAssistantMsg.includes('energy measure') && 
        previousMessage.content.trim().length > 2 &&
        !hasNewZip) {
      return `I don't recognize "${previousMessage.content}" as one of our available energy measures. Please choose from: LED lighting, HVAC systems, solar panels, heat pumps, insulation, motors, or refrigeration. What energy efficiency upgrade are you interested in?`;
    }
    
    return `Perfect! You've chosen to search by energy measure. What type of energy efficiency upgrade are you interested in? For example: LED lighting, HVAC systems, solar panels, heat pumps, insulation, or refrigeration.`;
  }
  
  if (zipCode && (facilityType || measure) && programs.length > 0) {
    const programList = programs.slice(0, 3).map((p, idx) => {
      let details = `${idx + 1}. **${p.name}** from ${p.owner}`;
      
      // Add incentive description if available
      if (p.incentiveDescription) {
        const incentiveDesc = p.incentiveDescription.trim();
        // Limit to first sentence or ~150 chars for brevity
        const shortDesc = incentiveDesc.length > 150 
          ? incentiveDesc.substring(0, 150).split('.')[0] + '...'
          : incentiveDesc.split('.')[0] + '.';
        details += `\n   💰 ${shortDesc}`;
      }
      
      // Add program description if available and different from incentive description
      if (p.description && p.description !== p.incentiveDescription) {
        const desc = p.description.trim();
        const shortDesc = desc.length > 120 
          ? desc.substring(0, 120).split('.')[0] + '...'
          : desc.split('.')[0] + '.';
        details += `\n   📋 ${shortDesc}`;
      }
      
      return details;
    }).join('\n\n');
    
    const searchContext = measure ? `${measure} programs` : `programs for your ${userFacilityWord}`;
    return `Based on ${searchContext} in ${utility || 'your area'}, I found ${programs.length} potentially relevant incentive programs, including:\n\n${programList}\n\nThese programs can often be combined or "stacked" for maximum savings. To get a detailed analysis of your specific eligibility and potential incentive amounts, I'd recommend scheduling a free consultation with our energy efficiency experts. Would you like us to contact you?`;
  }
  
  if (zipCode && (facilityType || measure) && programs.length === 0) {
    const searchContext = measure ? `${measure} programs` : `programs for ${userFacilityWord}s`;
    return `I see you're looking for ${searchContext} in ${utility || 'your area'}. While I'm having trouble accessing the full program database right now, there are typically multiple incentive opportunities available. I'd recommend speaking with one of our energy efficiency consultants who can provide a comprehensive analysis of all available programs and help you maximize your savings. Would you like to schedule a free consultation?`;
  }
  
  return `Thank you for your interest in energy efficiency incentives! To provide you with the most accurate information about available programs and potential savings, I'd recommend speaking with one of our energy efficiency experts. They can analyze your specific situation and help you identify all stackable incentive opportunities. Would you like to learn more about our free consultation service?`;
}

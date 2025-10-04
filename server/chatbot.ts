import OpenAI from "openai";
import type { Program } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant for Enlighting, a commercial energy efficiency consulting company specializing in California utility incentive programs.

Your role is to help facility managers and business owners understand incentive opportunities while guiding them toward a consultation with Enlighting's experts.

KEY GUIDELINES:
1. Be helpful and informative, but avoid giving away complete details or doing the consultant's job
2. Always steer the conversation toward scheduling a consultation for detailed analysis
3. Ask for ZIP code first to determine utility territory
4. Ask about facility type to narrow down relevant programs
5. Provide teasers about potential savings but emphasize the need for professional assessment
6. Mention that multiple incentives can often be "stacked" for maximum savings
7. Never promise specific dollar amounts without proper assessment
8. If asked for detailed program requirements, suggest the user explore the full details through a consultation

CONVERSATION FLOW:
1. Greet and ask for ZIP code
2. Confirm utility territory
3. Ask about facility type (office, retail, industrial, restaurant, etc.)
4. Provide high-level overview of 2-3 relevant programs
5. Highlight potential benefits but emphasize complexity
6. Guide toward lead capture for detailed consultation

TONE: Professional, knowledgeable, helpful but not overly detailed. Focus on creating interest and demonstrating value while positioning the consultation as the next step.`;

interface ChatParams {
  messages: Array<{ role: string; content: string; timestamp: string }>;
  zipCode?: string;
  facilityType?: string;
  utility?: string;
  allUtilities?: string[];
  programs: Program[];
}

export async function processChatWithAI(params: ChatParams): Promise<string> {
  const { messages, zipCode, facilityType, utility, allUtilities, programs } = params;
  
  const contextInfo = [];
  
  if (zipCode) {
    contextInfo.push(`User's ZIP code: ${zipCode}`);
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
  
  if (programs.length > 0) {
    contextInfo.push(`\nRelevant programs available:`);
    programs.slice(0, 3).forEach((program, idx) => {
      contextInfo.push(`${idx + 1}. ${program.name} (${program.owner})`);
      if (program.incentiveDescription) {
        contextInfo.push(`   - ${program.incentiveDescription.substring(0, 150)}...`);
      }
    });
    contextInfo.push(`\n(${programs.length} total programs may be relevant - mention there are multiple stackable opportunities)`);
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
  const { messages, zipCode, facilityType, utility, allUtilities, programs } = params;
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  
  // Check for utility selection/correction
  const utilityCorrectionPatterns = {
    'SCE': /\b(sce|southern california edison|socal edison)\b/i,
    'PGE': /\b(pg&?e|pacific gas|pacific gas & electric)\b/i,
    'SDGE': /\b(sdg&?e|san diego gas|san diego gas & electric)\b/i,
    'LADWP': /\b(ladwp|los angeles|la water|la power)\b/i,
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
  
  if (zipCode && !facilityType) {
    if (utility) {
      const utilityName = utility === 'SCE' ? 'Southern California Edison' : 
                         utility === 'PGE' ? 'Pacific Gas & Electric' :
                         utility === 'SDGE' ? 'San Diego Gas & Electric' :
                         utility === 'LADWP' ? 'Los Angeles Department of Water & Power' : utility;
      return `Great! I can see you're in ${utilityName}'s service territory. Now, to help you find the most relevant incentive programs, what type of facility do you have?`;
    }
    return `Thank you! What type of facility do you have? This will help me identify the best incentive programs for you. (For example: office building, retail store, restaurant, industrial facility)`;
  }
  
  if (zipCode && facilityType && programs.length > 0) {
    const programList = programs.slice(0, 3).map((p, idx) => 
      `${idx + 1}. ${p.name} from ${p.owner}`
    ).join('\n');
    
    return `Based on your ${facilityType} in ${utility || 'your area'}, I found ${programs.length} potentially relevant incentive programs, including:\n\n${programList}\n\nThese programs can often be combined or "stacked" for maximum savings. To get a detailed analysis of your specific eligibility and potential incentive amounts, I'd recommend scheduling a free consultation with our energy efficiency experts. Would you like to learn more about our consultation services?`;
  }
  
  if (zipCode && facilityType && programs.length === 0) {
    return `I see you have a ${facilityType} in ${utility || 'your area'}. While I'm having trouble accessing the full program database right now, there are typically multiple incentive opportunities available for ${facilityType} facilities in California. I'd recommend speaking with one of our energy efficiency consultants who can provide a comprehensive analysis of all available programs and help you maximize your savings. Would you like to schedule a free consultation?`;
  }
  
  return `Thank you for your interest in energy efficiency incentives! To provide you with the most accurate information about available programs and potential savings, I'd recommend speaking with one of our energy efficiency experts. They can analyze your specific situation and help you identify all stackable incentive opportunities. Would you like to learn more about our free consultation service?`;
}

import { 
  programs, 
  programGeos, 
  eligibilityRules, 
  benefitStructures, 
  documentation,
  leads,
  ratesCache,
  utilityZipCodes,
  chatConversations,
  type Program, 
  type InsertProgram,
  type Lead,
  type InsertLead,
  type SearchProgramsParams,
  type UtilityZipCode,
  type ChatConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, inArray, sql, desc } from "drizzle-orm";
import { processChatWithAI } from "./chatbot";

function mapFacilityTypeToSector(facilityType: string): string[] {
  const mapping: Record<string, string[]> = {
    'retail': ['Commercial', 'Small Business'],
    'office': ['Commercial', 'Small Business'],
    'restaurant': ['Commercial', 'Small Business'],
    'hotel': ['Commercial'],
    'medical': ['Commercial'],
    'school': ['Commercial'],
    'recreation': ['Commercial', 'Small Business'],
    'agriculture': ['Agricultural'],
    'multifamily': ['Residential'],
    'industrial': ['Industrial'],
    'warehouse': ['Industrial'],
    'manufacturing': ['Industrial'],
  };
  
  return mapping[facilityType.toLowerCase()] || [facilityType.charAt(0).toUpperCase() + facilityType.slice(1)];
}

function mapUtilityToSearchTerms(utility: string): string[] {
  // Normalize to uppercase and strip ALL non-alphanumeric characters for comprehensive matching
  const normalizedUtility = utility.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  const mapping: Record<string, string[]> = {
    // Southern California Edison
    'SCE': ['Southern California Edison', 'SCE', 'So Cal Edison', 'SoCal Edison'],
    'SOUTHERNCALIFORNIAEDISON': ['Southern California Edison', 'SCE'],
    'SOUTHERNCALIFORNIAEDISONSCE': ['Southern California Edison', 'SCE'],
    'SOCALEDISON': ['Southern California Edison', 'SCE'],
    
    // Pacific Gas & Electric - comprehensive coverage
    'PGE': ['Pacific Gas & Electric', 'Pacific Gas and Electric', 'PG&E', 'PGE', 'Pacific Gas Electric'],
    'PG&E': ['Pacific Gas & Electric', 'Pacific Gas and Electric', 'PG&E', 'PGE', 'Pacific Gas Electric'],
    'PACIFICGAS&ELECTRIC': ['Pacific Gas & Electric', 'Pacific Gas and Electric', 'PG&E', 'PGE'],
    'PACIFICGASANDELECTRIC': ['Pacific Gas & Electric', 'Pacific Gas and Electric', 'PG&E', 'PGE'],
    'PACIFICGASELECTRIC': ['Pacific Gas & Electric', 'Pacific Gas and Electric', 'PG&E', 'PGE'],
    
    // San Diego Gas & Electric - comprehensive coverage
    'SDGE': ['San Diego Gas & Electric', 'San Diego Gas and Electric', 'SDG&E', 'SDGE', 'San Diego Gas Electric'],
    'SDG&E': ['San Diego Gas & Electric', 'San Diego Gas and Electric', 'SDG&E', 'SDGE', 'San Diego Gas Electric'],
    'SANDIEGOGAS&ELECTRIC': ['San Diego Gas & Electric', 'San Diego Gas and Electric', 'SDG&E', 'SDGE'],
    'SANDIEGOGASANDELECTRIC': ['San Diego Gas & Electric', 'San Diego Gas and Electric', 'SDG&E', 'SDGE'],
    'SANDIEGOGASELECTRIC': ['San Diego Gas & Electric', 'San Diego Gas and Electric', 'SDG&E', 'SDGE'],
    
    // Los Angeles Department of Water & Power - comprehensive coverage
    'LADWP': ['Los Angeles Department of Water & Power', 'Los Angeles Department of Water and Power', 'LADWP', 'LA DWP', 'Los Angeles Water & Power', 'Los Angeles Water and Power'],
    'LOSANGELESDEPARTMENTOFWATER&POWER': ['Los Angeles Department of Water & Power', 'Los Angeles Department of Water and Power', 'LADWP'],
    'LOSANGELESDEPARTMENTOFWATERANDPOWER': ['Los Angeles Department of Water & Power', 'Los Angeles Department of Water and Power', 'LADWP'],
    'LOSANGELESWATER&POWER': ['Los Angeles Department of Water & Power', 'Los Angeles Department of Water and Power', 'LADWP'],
    'LOSANGELESWATERANDPOWER': ['Los Angeles Department of Water & Power', 'Los Angeles Department of Water and Power', 'LADWP'],
    
    // Sacramento Municipal Utility District
    'SMUD': ['Sacramento Municipal Utility District', 'SMUD', 'Sacramento MUD'],
    'SACRAMENTOMUNICIPALUTILITYDISTRICT': ['Sacramento Municipal Utility District', 'SMUD'],
    
    // Southern California Regional Energy Network
    'SOCALREN': ['Southern California Regional Energy Network', 'SoCalREN', 'SoCal REN'],
    'SOUTHERNCALIFORNIAREGIONALENERGYNETWORK': ['Southern California Regional Energy Network', 'SoCalREN'],
    
    // MCE Clean Energy
    'MCE': ['MCE Clean Energy', 'MCE', 'Marin Clean Energy'],
    'MCECLEANENERGY': ['MCE Clean Energy', 'MCE', 'Marin Clean Energy'],
    'MARINCLEANENERGY': ['MCE Clean Energy', 'MCE', 'Marin Clean Energy'],
  };
  
  return mapping[normalizedUtility] || [utility];
}

export interface IStorage {
  // Program management
  getPrograms(params: SearchProgramsParams): Promise<Program[]>;
  getProgramById(id: number): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  publishProgram(id: number): Promise<boolean>;
  
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  updateLeadStatus(id: number, status: string): Promise<boolean>;
  
  // Chatbot management
  processChatMessage(params: { sessionId: string; message: string; zipCode?: string; facilityType?: string; utility?: string; unrecognizedFacility?: string; measure?: string; searchMode?: string }): Promise<any>;
  getChatConversation(sessionId: string): Promise<any>;
  getUtilityByZipCode(zipCode: string): Promise<any>;
  getAllUtilitiesByZipCode(zipCode: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getPrograms(params: SearchProgramsParams): Promise<Program[]> {
    let query: any = db.select({
      id: programs.id,
      source: programs.source,
      sourceProcessId: programs.sourceProcessId,
      name: programs.name,
      owner: programs.owner,
      url: programs.url,
      description: programs.description,
      incentiveDescription: programs.incentiveDescription,
      sectorTags: programs.sectorTags,
      techTags: programs.techTags,
      incentiveType: programs.incentiveType,
      status: programs.status,
      startDate: programs.startDate,
      endDate: programs.endDate,
      updatedAt: programs.updatedAt,
      lastSeenAt: programs.lastSeenAt,
    }).from(programs);
    
    const conditions = [];
    let needsGeoJoin = false;
    let needsEligibilityJoin = false;
    
    // Text search
    if (params.q) {
      conditions.push(
        or(
          ilike(programs.name, `%${params.q}%`),
          ilike(programs.owner, `%${params.q}%`)
        )
      );
    }
    
    // Status filter
    if (params.status) {
      conditions.push(eq(programs.status, params.status));
    }
    // No default status filter - when status is not specified, show all programs
    
    // Location-based filtering (zip code or state)
    if (params.location) {
      needsGeoJoin = true;
      const location = params.location.trim();
      
      // Check if it's a zip code (5 digits) or state abbreviation
      if (/^\d{5}$/.test(location)) {
        // ZIP code search - use first 3 digits for broader matching
        const zipPrefix = location.substring(0, 3);
        conditions.push(
          or(
            ilike(programGeos.zipPrefix, `${zipPrefix}%`),
            eq(programGeos.state, "CA") // Default to CA for now
          )
        );
      } else if (/^[A-Z]{2}$/i.test(location)) {
        // State abbreviation
        conditions.push(eq(programGeos.state, location.toUpperCase()));
      } else {
        // City or county name - handle common California cities
        const cityMatch = location.toLowerCase();
        let cityConditions = [
          ilike(programGeos.county, `%${location}%`),
          ilike(programGeos.utilityServiceArea, `%${location}%`)
        ];
        
        // Map major California cities to their utilities
        if (cityMatch.includes('san francisco') || cityMatch.includes('sf')) {
          cityConditions.push(ilike(programs.owner, '%Pacific Gas & Electric%'));
        } else if (cityMatch.includes('los angeles') || cityMatch.includes('la')) {
          cityConditions.push(ilike(programs.owner, '%Los Angeles%'));
        } else if (cityMatch.includes('san diego')) {
          cityConditions.push(ilike(programs.owner, '%San Diego Gas & Electric%'));
        } else if (cityMatch.includes('california') || cityMatch.includes('ca')) {
          // If it contains California or CA, show all CA programs
          cityConditions.push(eq(programGeos.state, 'CA'));
        }
        
        conditions.push(or(...cityConditions));
      }
    }
    
    // Utility filtering - map abbreviations to full names
    if (params.utility) {
      const utilitySearchTerms = mapUtilityToSearchTerms(params.utility);
      const utilityConditions = utilitySearchTerms.map(term => 
        ilike(programs.owner, `%${term}%`)
      );
      conditions.push(or(...utilityConditions));
    }
    
    // Business type filtering - map friendly names to database sectors
    if (params.businessType) {
      needsEligibilityJoin = true;
      const sectors = mapFacilityTypeToSector(params.businessType);
      
      // Build conditions for each mapped sector
      const sectorConditions = sectors.flatMap(sector => [
        sql`${programs.sectorTags}::jsonb @> ${JSON.stringify([sector])}`,
        sql`${eligibilityRules.buildingTypes}::jsonb @> ${JSON.stringify([sector])}`
      ]);
      
      conditions.push(or(...sectorConditions));
    }
    
    // Incentive type filter
    if (params.incentiveType && params.incentiveType.length > 0) {
      conditions.push(inArray(programs.incentiveType, params.incentiveType));
    }
    
    // Program Owner filter
    if (params.programOwner && params.programOwner.length > 0) {
      conditions.push(inArray(programs.owner, params.programOwner));
    }
    
    // Measures filter - check if any of the selected measures are in techTags
    if (params.measures && params.measures.length > 0) {
      const measureConditions = params.measures.map(measure => 
        sql`${programs.techTags}::jsonb @> ${JSON.stringify([measure])}`
      );
      conditions.push(or(...measureConditions));
    }
    
    // Add joins as needed
    if (needsGeoJoin) {
      query = query.leftJoin(programGeos, eq(programs.id, programGeos.programId));
    }
    
    if (needsEligibilityJoin) {
      query = query.leftJoin(eligibilityRules, eq(programs.id, eligibilityRules.programId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Group by program ID to avoid duplicates from joins
    if (needsGeoJoin || needsEligibilityJoin) {
      query = query.groupBy(
        programs.id,
        programs.source,
        programs.sourceProcessId,
        programs.name,
        programs.owner,
        programs.url,
        programs.description,
        programs.incentiveDescription,
        programs.sectorTags,
        programs.techTags,
        programs.incentiveType,
        programs.status,
        programs.startDate,
        programs.endDate,
        programs.updatedAt,
        programs.lastSeenAt
      );
    }
    
    const result = await query
      .orderBy(desc(programs.updatedAt))
      .limit(params.limit)
      .offset(params.offset);
    
    return result;
  }

  async getProgramById(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db
      .insert(programs)
      .values(program as any)
      .returning();
    return newProgram;
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const [updatedProgram] = await db
      .update(programs)
      .set({
        ...program,
        updatedAt: new Date()
      } as any)
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async publishProgram(id: number): Promise<boolean> {
    const [updatedProgram] = await db
      .update(programs)
      .set({ status: 'open', updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    return !!updatedProgram;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();
    return newLead;
  }

  async getLeads(): Promise<Lead[]> {
    const result = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return result;
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async updateLeadStatus(id: number, status: string): Promise<boolean> {
    const result = await db
      .update(leads)
      .set({ status })
      .where(eq(leads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUtilityByZipCode(zipCode: string): Promise<UtilityZipCode | undefined> {
    const [result] = await db
      .select()
      .from(utilityZipCodes)
      .where(eq(utilityZipCodes.zipCode, zipCode));
    return result;
  }

  async getAllUtilitiesByZipCode(zipCode: string): Promise<UtilityZipCode[]> {
    const results = await db
      .select()
      .from(utilityZipCodes)
      .where(eq(utilityZipCodes.zipCode, zipCode));
    return results;
  }

  async getChatConversation(sessionId: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.sessionId, sessionId));
    return conversation;
  }

  async processChatMessage(params: { 
    sessionId: string; 
    message: string; 
    zipCode?: string; 
    facilityType?: string;
    utility?: string;
    unrecognizedFacility?: string;
    measure?: string;
    searchMode?: string;
  }): Promise<any> {
    const { sessionId, message, zipCode: frontendZip, facilityType: frontendFacility, utility: userSelectedUtility, unrecognizedFacility, measure: frontendMeasure, searchMode } = params;
    
    let conversation = await this.getChatConversation(sessionId);
    
    if (!conversation) {
      const [newConversation] = await db
        .insert(chatConversations)
        .values({
          sessionId,
          zipCode: frontendZip || null,
          facilityType: frontendFacility || null,
          messages: [],
          leadCaptured: false,
        })
        .returning();
      conversation = newConversation;
    }
    
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...(conversation.messages || []), userMessage];
    
    // RE-DETECT from message every time (not just from frontend params)
    let detectedZip = frontendZip || conversation.zipCode;
    const zipMatch = message.match(/\b\d{5}\b/);
    let isNewZip = false;
    if (zipMatch) {
      const newZip = zipMatch[0];
      if (newZip !== conversation.zipCode) {
        isNewZip = true;
      }
      detectedZip = newZip;
    }
    
    // RE-DETECT utility from message
    // If new ZIP detected, don't use old utility value or detect new ones
    let detectedUtility = isNewZip ? undefined : (userSelectedUtility || conversation.utility);
    
    if (!isNewZip) {
      const utilityPatterns = {
        'SCE': /\b(sce|southern california edison|so\.?\s*cal\.?\s*edison)\b/i,
        'PGE': /\b(pg&?e|pge|pacific gas & electric|pacific gas and electric|pacific gas)\b/i,
        'SDGE': /\b(sdg&?e|sdge|san diego gas & electric|san diego gas and electric|san diego gas)\b/i,
        'LADWP': /\b(ladwp|los angeles department of water & power|los angeles department of water and power|la\s*dept\.?\s*of\s*water|los angeles water|los angeles power)\b/i,
      };
      for (const [utilityKey, pattern] of Object.entries(utilityPatterns)) {
        if (pattern.test(message)) {
          detectedUtility = utilityKey;
          break;
        }
      }
    }
    
    // RE-DETECT facility type from message (expanded patterns)
    // If new ZIP detected, don't use old facility value or detect new ones
    let detectedFacility = isNewZip ? undefined : frontendFacility;
    
    if (!isNewZip) {
      const facilityPatterns = {
        'office': /\boffice\b/i,
        'retail': /\bretail\b|\bstore\b|\bshop\b/i,
        'restaurant': /\brestaurant\b|\bdining\b|\bcafe\b|\bbar\b/i,
        'industrial': /\bindustrial\b|\bmanufacturing\b|\bfactory\b/i,
        'warehouse': /\bwarehousing\b|\bwarehouse\b|\bdistribution\s*center\b|\bstorage\b/i,
        'hotel': /\bhotel\b|\blodging\b|\bmotel\b/i,
        'medical': /\bhealthcare\b|\bhospital\b|\bclinic\b|\bmedical\b|\bnursing\s*home\b|\bassisted\s*living\b|\bdental\b/i,
        'school': /\bschool\b|\beducation\b|\buniversity\b|\bcollege\b/i,
        'recreation': /\bgolf\s*course\b|\brecreation\b|\bgym\b|\bfitness\b|\bsports\b|\bathletic\b/i,
        'agriculture': /\bfarm\b|\bagriculture\b|\bvineyard\b|\bgreenhouse\b/i,
        'multifamily': /\bapartment\b|\bmultifamily\b|\bcondo\b/i,
        'foodprocessing': /\bfood\s*processing\b|\bprocessing\s*facility\b/i,
        'autodealer': /\bauto\s*dealer\b|\bcar\s*dealer\b/i,
        'grocery': /\bgrocery\b|\bsupermarket\b|\bconvenience\s*store\b/i,
      };
      for (const [type, pattern] of Object.entries(facilityPatterns)) {
        if (pattern.test(message)) {
          detectedFacility = type;
          break;
        }
      }
    }
    
    // RE-DETECT measure from message
    // If new ZIP detected, don't use old measure value or detect new ones
    let detectedMeasure = isNewZip ? undefined : frontendMeasure;
    
    if (!isNewZip) {
      const measurePatterns = {
        'Lighting': /\bled\b|\blighting\b|\blights\b|\blamp\b/i,
        'HVAC': /\bhvac\b|\bheating\b|\bcooling\b|\bair\s*conditioning\b|\bfurnace\b|\bboiler\b/i,
        'Heat Pump': /\bheat\s*pump\b|\bhp\s*water\s*heater\b|\bhpwh\b/i,
        'Solar': /\bsolar\b|\bpv\b|\bphotovoltaic\b/i,
        'Insulation': /\binsulation\b|\bweatherization\b/i,
        'Motors': /\bmotor\b|\bvfd\b|\bvariable\s*frequency\s*drive\b/i,
        'Refrigeration': /\brefrigeration\b|\bcooler\b|\bfreezer\b/i,
      };
      for (const [measureType, pattern] of Object.entries(measurePatterns)) {
        if (pattern.test(message)) {
          detectedMeasure = measureType;
          break;
        }
      }
    }
    
    // Get utilities for ZIP code
    let utility = null;
    let allUtilities: UtilityZipCode[] = [];
    // If new ZIP detected, don't use old utility
    let selectedUtility = isNewZip ? undefined : detectedUtility;
    
    if (detectedZip) {
      allUtilities = await this.getAllUtilitiesByZipCode(detectedZip);
      
      // Check if ZIP code is not in California (no utilities found)
      if (allUtilities.length === 0) {
        const notInCaliforniaMessage = {
          role: 'assistant',
          content: `I apologize, but ZIP code ${detectedZip} is not in California. Our incentive finder currently only covers California utility incentive programs. If you have a California location, please provide that ZIP code and I'll be happy to help you find available incentives!`,
          timestamp: new Date().toISOString(),
        };
        
        const finalMessages = [...updatedMessages, notInCaliforniaMessage];
        
        await db
          .update(chatConversations)
          .set({
            messages: finalMessages,
            zipCode: null, // Clear invalid ZIP
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.sessionId, sessionId));
        
        return {
          message: notInCaliforniaMessage.content,
          utility: undefined,
          programs: [],
          detectedZip: undefined,
          detectedFacility: undefined,
          detectedMeasure: undefined,
          showSearchModeSelector: false,
          showLeadCapture: false,
        };
      }
      
      // Only auto-select utility if not a new ZIP (new ZIP needs user to confirm utility)
      if (!isNewZip && detectedUtility) {
        utility = allUtilities.find(u => u.ownerUtility === detectedUtility);
        selectedUtility = detectedUtility;
      } else if (isNewZip) {
        // New ZIP: don't auto-select, especially if multiple utilities available
        utility = allUtilities[0];
        // If there are multiple utilities, selectedUtility must stay undefined so fallback asks user to choose
        selectedUtility = allUtilities.length > 1 ? undefined : allUtilities[0]?.ownerUtility;
      } else {
        utility = allUtilities[0];
        selectedUtility = utility?.ownerUtility;
      }
    }
    
    // Build program search params
    const programParams: any = {
      utility: selectedUtility || undefined,
      businessType: detectedFacility || undefined,
      limit: 5,
      offset: 0,
    };
    
    // Add measure filtering if detected
    if (detectedMeasure) {
      programParams.measures = [detectedMeasure];
    }
    
    const relevantPrograms = await this.getPrograms(programParams);
    
    const aiResponse = await processChatWithAI({
      messages: updatedMessages,
      zipCode: detectedZip || undefined,
      facilityType: detectedFacility || undefined,
      utility: selectedUtility || undefined,
      allUtilities: allUtilities.map(u => u.ownerUtility),
      programs: relevantPrograms,
      unrecognizedFacility,
      measure: detectedMeasure || undefined,
      searchMode: searchMode || undefined,
    });
    
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };
    
    const finalMessages = [...updatedMessages, assistantMessage];
    
    // Update conversation with newly detected values
    // If new ZIP detected, reset facility, measure, searchMode, and utility
    await db
      .update(chatConversations)
      .set({
        messages: finalMessages,
        zipCode: detectedZip || conversation.zipCode,
        facilityType: isNewZip ? null : (detectedFacility || conversation.facilityType),
        utility: isNewZip ? null : (selectedUtility || conversation.utility),
        searchMode: isNewZip ? null : (searchMode || conversation.searchMode),
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.sessionId, sessionId));
    
    // Determine if we should show search mode selector
    const shouldShowSearchModeSelector = detectedZip && selectedUtility && !searchMode && !detectedFacility && !detectedMeasure;
    
    // Determine if we should show lead capture
    // Only show when user responds affirmatively to a previous consultation question
    const previousAssistantMessage = updatedMessages
      .filter(m => m.role === 'assistant')
      .slice(-1)[0]?.content || '';
    
    const isAffirmativeResponse = /^(yes|yeah|sure|ok|okay|yep|yup|absolutely|definitely|sounds\s*good|i\s*would|that\s*would\s*be\s*great)$/i.test(message.trim());
    
    const previouslyAskedAboutConsultation = /\b(consultation|schedule|speak with|contact|free consultation|would you like)\b/i.test(previousAssistantMessage);
    
    const shouldShowLeadCapture = (
      // Never show lead capture when new ZIP is detected (restart flow)
      !isNewZip &&
      // User said yes to previous consultation question
      isAffirmativeResponse && previouslyAskedAboutConsultation && (detectedFacility || detectedMeasure)
    );
    
    return {
      message: aiResponse,
      utility: selectedUtility,
      programs: relevantPrograms,
      detectedZip,
      detectedFacility,
      detectedMeasure,
      showSearchModeSelector: shouldShowSearchModeSelector,
      showLeadCapture: shouldShowLeadCapture,
    };
  }
}

export const storage = new DatabaseStorage();

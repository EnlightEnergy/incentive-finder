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
  const mapping: Record<string, string[]> = {
    'SCE': ['Southern California Edison', 'SCE'],
    'PG&E': ['Pacific Gas & Electric', 'PG&E', 'PGE'],
    'SDGE': ['San Diego Gas & Electric', 'SDG&E', 'SDGE'],
    'LADWP': ['Los Angeles Department of Water & Power', 'LADWP'],
    'SMUD': ['Sacramento Municipal Utility District', 'SMUD'],
    'SoCalREN': ['Southern California Regional Energy Network', 'SoCalREN'],
    'MCE': ['MCE Clean Energy', 'MCE'],
  };
  
  return mapping[utility] || [utility];
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
  processChatMessage(params: { sessionId: string; message: string; zipCode?: string; facilityType?: string; utility?: string; unrecognizedFacility?: string }): Promise<any>;
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
  }): Promise<any> {
    const { sessionId, message, zipCode, facilityType, utility: userSelectedUtility, unrecognizedFacility } = params;
    
    let conversation = await this.getChatConversation(sessionId);
    
    if (!conversation) {
      const [newConversation] = await db
        .insert(chatConversations)
        .values({
          sessionId,
          zipCode: zipCode || null,
          facilityType: facilityType || null,
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
    
    let utility = null;
    let allUtilities: UtilityZipCode[] = [];
    let selectedUtility = userSelectedUtility || conversation.utility;
    
    const effectiveZipCode = zipCode || conversation.zipCode;
    
    if (effectiveZipCode) {
      allUtilities = await this.getAllUtilitiesByZipCode(effectiveZipCode);
      
      if (userSelectedUtility) {
        utility = allUtilities.find(u => u.ownerUtility === userSelectedUtility);
        selectedUtility = userSelectedUtility;
      } else if (conversation.utility) {
        utility = allUtilities.find(u => u.ownerUtility === conversation.utility);
        selectedUtility = conversation.utility;
      } else {
        utility = allUtilities[0];
        selectedUtility = utility?.ownerUtility;
      }
    }
    
    const relevantPrograms = await this.getPrograms({
      utility: selectedUtility || undefined,
      businessType: facilityType,
      limit: 5,
      offset: 0,
    });
    
    const aiResponse = await processChatWithAI({
      messages: updatedMessages,
      zipCode,
      facilityType,
      utility: selectedUtility || undefined,
      allUtilities: allUtilities.map(u => u.ownerUtility),
      programs: relevantPrograms,
      unrecognizedFacility,
    });
    
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };
    
    const finalMessages = [...updatedMessages, assistantMessage];
    
    await db
      .update(chatConversations)
      .set({
        messages: finalMessages,
        zipCode: zipCode || conversation.zipCode,
        facilityType: facilityType || conversation.facilityType,
        utility: selectedUtility || conversation.utility,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.sessionId, sessionId));
    
    return {
      message: aiResponse,
      utility: selectedUtility,
      programs: relevantPrograms,
    };
  }
}

export const storage = new DatabaseStorage();

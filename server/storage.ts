import { 
  programs, 
  programGeos, 
  eligibilityRules, 
  benefitStructures, 
  documentation,
  leads,
  ratesCache,
  type Program, 
  type InsertProgram,
  type Lead,
  type InsertLead,
  type SearchProgramsParams
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, inArray, sql, desc } from "drizzle-orm";

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
    } else {
      // Default to open programs only
      conditions.push(eq(programs.status, 'open'));
    }
    
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
        // City or county name
        conditions.push(
          or(
            ilike(programGeos.county, `%${location}%`),
            ilike(programGeos.utilityServiceArea, `%${location}%`)
          )
        );
      }
    }
    
    // Utility filtering
    if (params.utility) {
      // First try to match by program owner (which is the utility name)
      conditions.push(ilike(programs.owner, `%${params.utility}%`));
    }
    
    // Business type filtering
    if (params.businessType) {
      needsEligibilityJoin = true;
      conditions.push(
        or(
          sql`${programs.sectorTags}::jsonb @> ${JSON.stringify([params.businessType])}`,
          sql`${eligibilityRules.buildingTypes}::jsonb @> ${JSON.stringify([params.businessType])}`
        )
      );
    }
    
    // Incentive type filter
    if (params.incentiveType && params.incentiveType.length > 0) {
      conditions.push(inArray(programs.incentiveType, params.incentiveType));
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
}

export const storage = new DatabaseStorage();

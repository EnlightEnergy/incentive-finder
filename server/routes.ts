import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, searchProgramsSchema, insertProgramSchema } from "@shared/schema";
import { sendLeadNotification } from "./email";
import { basicAuth } from "./auth";
import { searchPrograms } from "./search";
import { searchSync } from "./sync";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Public API routes
  app.get("/api/programs", async (req, res) => {
    try {
      const params = searchProgramsSchema.parse({
        q: req.query.q,
        businessType: req.query.businessType,
        location: req.query.location,
        utility: req.query.utility,
        measures: req.query.measures ? (Array.isArray(req.query.measures) ? req.query.measures : [req.query.measures]) : undefined,
        sqft: req.query.sqft ? parseInt(req.query.sqft as string) : undefined,
        hours: req.query.hours ? parseInt(req.query.hours as string) : undefined,
        projectCost: req.query.projectCost ? parseInt(req.query.projectCost as string) : undefined,
        state: req.query.state,
        incentiveType: req.query.incentiveType ? (Array.isArray(req.query.incentiveType) ? req.query.incentiveType : [req.query.incentiveType]) : undefined,
        programOwner: req.query.programOwner ? (Array.isArray(req.query.programOwner) ? req.query.programOwner : [req.query.programOwner]) : undefined,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      });
      
      // Try Typesense search first if query text is present
      if (params.q && params.q.trim() !== '') {
        try {
          const typesenseParams = {
            q: params.q,
            owner: params.programOwner?.[0],
            utility: params.utility,
            state: params.state,
            programStatus: params.status,
            page: Math.floor(params.offset / params.limit) + 1,
            per_page: params.limit,
          };
          
          const searchResults = await searchPrograms(typesenseParams);
          
          // Transform Typesense results to match our API format
          const programs = searchResults.hits?.map((hit: any) => ({
            id: parseInt(hit.document.id),
            name: hit.document.name,
            owner: hit.document.owner,
            utility: hit.document.utility,
            state: hit.document.state,
            incentiveDescription: hit.document.incentiveDescription,
            description: hit.document.description,
            eligibilityRequirements: hit.document.eligibilityRequirements,
            geographicScope: hit.document.geographicScope,
            programStatus: hit.document.programStatus,
            sector: hit.document.sector
          })) || [];
          
          return res.json(programs);
        } catch (typesenseError) {
          console.warn('Typesense search failed, falling back to PostgreSQL:', typesenseError);
          // Fall through to PostgreSQL search
        }
      }
      
      // Use PostgreSQL search as fallback or when no text query
      const programs = await storage.getPrograms(params);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(400).json({ error: "Invalid search parameters" });
    }
  });

  app.get("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.getProgramById(id);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      res.json(program);
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      // Send email notification to sales team
      try {
        await sendLeadNotification({
          company: lead.company,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone || undefined,
          address: lead.address || undefined,
          utility: lead.utility || undefined,
          measure: lead.measure || undefined,
          sqft: lead.sqft || undefined,
          hours: lead.hours || undefined,
          baselineDesc: lead.baselineDesc || undefined,
        });
        console.log(`✅ Lead notification email sent for ${lead.company} - ${lead.contactName}`);
      } catch (emailError) {
        console.error("Error sending lead notification email:", emailError);
        // Don't fail the lead creation if email fails
      }
      
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chatbot API routes
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sessionId, message, zipCode, facilityType, utility, unrecognizedFacility } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ error: "Session ID and message are required" });
      }

      const response = await storage.processChatMessage({
        sessionId,
        message,
        zipCode,
        facilityType,
        utility,
        unrecognizedFacility,
      });

      res.json(response);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/chat/conversation/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getChatConversation(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.get("/api/utility/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      const utilities = await storage.getAllUtilitiesByZipCode(zipCode);
      
      if (utilities.length === 0) {
        return res.status(404).json({ error: "Utility not found for this ZIP code" });
      }
      
      res.json({ 
        zipCode, 
        utilities: utilities.map(u => u.ownerUtility),
        multipleUtilities: utilities.length > 1 
      });
    } catch (error) {
      console.error("Error fetching utility:", error);
      res.status(500).json({ error: "Failed to fetch utility information" });
    }
  });

  // Admin API routes (protected with basic authentication)
  app.get("/api/admin/programs", basicAuth, async (req, res) => {
    try {
      const params = searchProgramsSchema.parse({
        ...req.query,
        status: undefined, // Include all statuses for admin
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      });
      
      const programs = await storage.getPrograms(params);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching admin programs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/programs", basicAuth, async (req, res) => {
    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      
      // Sync to search index
      try {
        await searchSync.syncProgramByData(program);
      } catch (syncError) {
        console.warn('Failed to sync new program to search index:', syncError);
      }
      
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid program data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/programs/:id", basicAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const programData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(id, programData);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Sync to search index
      try {
        await searchSync.syncProgramByData(program);
      } catch (syncError) {
        console.warn('Failed to sync updated program to search index:', syncError);
      }
      
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid program data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/programs/:id/publish", basicAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.publishProgram(id);
      
      if (!success) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Sync to search index after publishing
      try {
        await searchSync.syncProgram(id);
      } catch (syncError) {
        console.warn('Failed to sync published program to search index:', syncError);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error publishing program:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/programs/:id", basicAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProgram(id);
      
      if (!success) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/leads", basicAuth, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/leads/:id/status", basicAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const success = await storage.updateLeadStatus(id, status);
      
      if (!success) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin endpoint to seed database
  app.post("/api/admin/seed-database", basicAuth, async (req, res) => {
    try {
      // Import and run the seeding logic
      const { seedDatabase } = await import("../scripts/seed-database.js");
      await seedDatabase();
      res.json({ message: "Database seeded successfully", status: "success" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ 
        error: "Failed to seed database", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, searchProgramsSchema, insertProgramSchema } from "@shared/schema";
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
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin API routes
  app.get("/api/admin/programs", async (req, res) => {
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

  app.post("/api/admin/programs", async (req, res) => {
    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid program data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const programData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(id, programData);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
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

  app.post("/api/admin/programs/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.publishProgram(id);
      
      if (!success) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error publishing program:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/programs/:id", async (req, res) => {
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

  app.get("/api/admin/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/leads/:id/status", async (req, res) => {
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

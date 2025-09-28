import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, json, jsonb, date, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Programs table - main incentive programs
export const programs = pgTable("programs", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  source: varchar("source", { length: 50 }).notNull(), // 'dsire', 'utility', 'state', 'federal', 'manual'
  sourceProcessId: varchar("source_program_id", { length: 120 }).notNull(),
  name: varchar("name", { length: 400 }).notNull(),
  owner: varchar("owner", { length: 200 }).notNull(),
  url: varchar("url", { length: 600 }),
  description: text("description"), // Enhanced detailed program description
  incentiveDescription: text("incentive_description"), // Detailed incentive value information
  sectorTags: jsonb("sector_tags").$type<string[]>().default([]),
  techTags: jsonb("tech_tags").$type<string[]>().default([]),
  incentiveType: varchar("incentive_type", { length: 60 }).notNull(), // 'Prescriptive', 'Custom', 'Tax Credit', 'Grant', 'On-Bill', 'Financing'
  status: varchar("status", { length: 30 }).default("open"), // 'open', 'paused', 'expired'
  startDate: date("start_date"),
  endDate: date("end_date"),
  // Data validation tracking fields
  urlStatus: varchar("url_status", { length: 20 }).default("unknown"), // 'valid', 'redirect', 'broken', 'unknown'
  urlLastChecked: timestamp("url_last_checked"),
  dataVerifiedAt: timestamp("data_verified_at"),
  supersededByProgramId: integer("superseded_by_program_id"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: timestamp("last_seen_at").default(sql`CURRENT_TIMESTAMP`),
});

// Program geographic coverage
export const programGeos = pgTable("program_geos", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  programId: integer("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  state: varchar("state", { length: 2 }),
  county: varchar("county", { length: 120 }),
  zipPrefix: varchar("zip_prefix", { length: 5 }),
  utilityServiceArea: varchar("utility_service_area", { length: 200 }),
});

// Program eligibility rules
export const eligibilityRules = pgTable("eligibility_rules", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  programId: integer("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  buildingTypes: jsonb("building_types").$type<string[]>().default([]),
  naicsIncludes: jsonb("naics_includes").$type<string[]>().default([]),
  minProjectCost: integer("min_project_cost"),
  preApprovalRequired: boolean("pre_approval_required").default(false),
  tradeAllyRequired: boolean("trade_ally_required").default(false),
  prevailingWageRequired: boolean("prevailing_wage_required").default(false),
});

// Program benefit structures
export const benefitStructures = pgTable("benefit_structures", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  programId: integer("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  unit: varchar("unit", { length: 40 }).notNull(), // '$/kWh_saved', '$/therm_saved', '$/fixture', '%_of_cost', '$/ton'
  tierJson: jsonb("tier_json").$type<Record<string, any>>().default({}),
  examplesText: text("examples_text"),
});

// Program documentation
export const documentation = pgTable("documentation", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  programId: integer("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  preAppLink: varchar("pre_app_link", { length: 600 }),
  finalAppLink: varchar("final_app_link", { length: 600 }),
  formsLinks: jsonb("forms_links").$type<string[]>().default([]),
  mAndVRequirements: text("m_and_v_requirements"),
  inspectionRequirements: text("inspection_requirements"),
  notes: text("notes"),
});

// Leads table for customer inquiries
export const leads = pgTable("leads", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  company: varchar("company", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 300 }),
  naics: varchar("naics", { length: 10 }),
  industryType: varchar("industry_type", { length: 100 }),
  utility: varchar("utility", { length: 200 }),
  measure: varchar("measure", { length: 120 }),
  sqft: integer("sqft"),
  hours: integer("hours"),
  baselineDesc: text("baseline_desc"),
  utmJson: jsonb("utm_json").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  status: varchar("status", { length: 30 }).default("new"), // 'new', 'contacted', 'qualified', 'converted'
});

// Utility rate cache
export const ratesCache = pgTable("rates_cache", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  utilityName: varchar("utility_name", { length: 200 }).notNull(),
  tariffName: varchar("tariff_name", { length: 200 }),
  commodity: varchar("commodity", { length: 20 }).notNull(), // 'electric', 'gas'
  demandPricing: boolean("demand_pricing").default(false),
  rateJson: jsonb("rate_json").$type<Record<string, any>>().default({}),
  lastRefreshed: timestamp("last_refreshed").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const programsRelations = relations(programs, ({ many }) => ({
  geos: many(programGeos),
  eligibility: many(eligibilityRules),
  benefits: many(benefitStructures),
  docs: many(documentation),
}));

export const programGeosRelations = relations(programGeos, ({ one }) => ({
  program: one(programs, {
    fields: [programGeos.programId],
    references: [programs.id],
  }),
}));

export const eligibilityRulesRelations = relations(eligibilityRules, ({ one }) => ({
  program: one(programs, {
    fields: [eligibilityRules.programId],
    references: [programs.id],
  }),
}));

export const benefitStructuresRelations = relations(benefitStructures, ({ one }) => ({
  program: one(programs, {
    fields: [benefitStructures.programId],
    references: [programs.id],
  }),
}));

export const documentationRelations = relations(documentation, ({ one }) => ({
  program: one(programs, {
    fields: [documentation.programId],
    references: [programs.id],
  }),
}));

// Schemas for validation
export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  updatedAt: true,
  lastSeenAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const searchProgramsSchema = z.object({
  q: z.string().optional(),
  businessType: z.string().optional(),
  location: z.string().optional(),
  utility: z.string().optional(),
  measures: z.array(z.string()).optional(),
  sqft: z.number().optional(),
  hours: z.number().optional(),
  projectCost: z.number().optional(),
  state: z.string().optional(),
  incentiveType: z.array(z.string()).optional(),
  programOwner: z.array(z.string()).optional(),
  status: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Export types
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type ProgramGeo = typeof programGeos.$inferSelect;
export type EligibilityRule = typeof eligibilityRules.$inferSelect;
export type BenefitStructure = typeof benefitStructures.$inferSelect;
export type Documentation = typeof documentation.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type SearchProgramsParams = z.infer<typeof searchProgramsSchema>;

import { apiRequest } from "./queryClient";
import type { Program, Lead, InsertLead, SearchProgramsParams } from "@shared/schema";

export const api = {
  // Public program search
  searchPrograms: async (params: Partial<SearchProgramsParams>): Promise<Program[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    
    const response = await apiRequest("GET", `/api/programs?${searchParams}`);
    return response.json();
  },

  // Get single program
  getProgram: async (id: number): Promise<Program> => {
    const response = await apiRequest("GET", `/api/programs/${id}`);
    return response.json();
  },

  // Create lead
  createLead: async (lead: InsertLead): Promise<Lead> => {
    const response = await apiRequest("POST", "/api/leads", lead);
    return response.json();
  },

  // Admin APIs
  admin: {
    getPrograms: async (): Promise<Program[]> => {
      const response = await apiRequest("GET", "/api/admin/programs");
      return response.json();
    },

    createProgram: async (program: any): Promise<Program> => {
      const response = await apiRequest("POST", "/api/admin/programs", program);
      return response.json();
    },

    updateProgram: async (id: number, program: any): Promise<Program> => {
      const response = await apiRequest("PUT", `/api/admin/programs/${id}`, program);
      return response.json();
    },

    publishProgram: async (id: number): Promise<void> => {
      await apiRequest("POST", `/api/admin/programs/${id}/publish`);
    },

    deleteProgram: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/admin/programs/${id}`);
    },

    getLeads: async (): Promise<Lead[]> => {
      const response = await apiRequest("GET", "/api/admin/leads");
      return response.json();
    },

    updateLeadStatus: async (id: number, status: string): Promise<void> => {
      await apiRequest("PUT", `/api/admin/leads/${id}/status`, { status });
    },
  },
};

// Typesense disabled - no server configured
let typesenseAvailable = false;
export const typesenseClient = null as any;
export const programSchema = { name: "programs", fields: [] };
export function isTypesenseAvailable() { return false; }
export async function initializeTypesense() {
  console.log("Typesense disabled - PostgreSQL only");
  return false;
}
export interface TypesenseSearchParams {
  q?: string; owner?: string; utility?: string; sector?: string;
  state?: string; programStatus?: string; page?: number; per_page?: number;
}
export async function searchPrograms(params: TypesenseSearchParams): Promise<any> {
  throw new Error("Typesense not available");
}
export async function indexProgram(program: any) { return false; }
export async function syncAllPrograms(programs: any[]) { return { successCount: 0, failureCount: 0 }; }

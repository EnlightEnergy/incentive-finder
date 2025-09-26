import { storage } from "./storage";
import { initializeTypesense, syncAllPrograms, indexProgram } from "./search";
import { log } from "./vite";

export class SearchSyncService {
  private static instance: SearchSyncService;

  private constructor() {}

  static getInstance(): SearchSyncService {
    if (!SearchSyncService.instance) {
      SearchSyncService.instance = new SearchSyncService();
    }
    return SearchSyncService.instance;
  }

  async initialize() {
    try {
      // Initialize Typesense collection (returns false if not available)
      const typesenseAvailable = await initializeTypesense();
      
      if (typesenseAvailable) {
        // Sync all existing programs to Typesense
        const syncResult = await this.syncAllPrograms();
        if (syncResult.failureCount > 0) {
          log(`⚠️  Search sync completed with ${syncResult.failureCount} failures - Typesense partially available`);
        } else {
          log('✅ Search sync service initialized successfully with Typesense');
        }
      } else {
        log('🔄 Search sync service initialized with PostgreSQL fallback only');
      }
    } catch (error) {
      log(`❌ Error initializing search sync service: ${error}`);
      // Don't throw error - continue with PostgreSQL fallback
    }
  }

  async syncAllPrograms() {
    try {
      // Get all programs from database
      const programs = await storage.getPrograms({ limit: 1000, offset: 0 });
      
      if (programs.length > 0) {
        const syncResult = await syncAllPrograms(programs);
        return syncResult;
      } else {
        log('📄 No programs found to sync');
        return { successCount: 0, failureCount: 0 };
      }
    } catch (error) {
      log(`❌ Error syncing programs: ${error}`);
      return { successCount: 0, failureCount: 1 };
    }
  }

  async syncProgram(programId: number) {
    try {
      const program = await storage.getProgramById(programId);
      if (program) {
        await indexProgram(program);
        log(`Synced program ${programId} to search index`);
      }
    } catch (error) {
      log(`Error syncing program ${programId}: ${error}`);
      throw error;
    }
  }

  async syncProgramByData(program: any) {
    try {
      await indexProgram(program);
      log(`Synced program ${program.id} to search index`);
    } catch (error) {
      log(`Error syncing program data: ${error}`);
      throw error;
    }
  }
}

export const searchSync = SearchSyncService.getInstance();
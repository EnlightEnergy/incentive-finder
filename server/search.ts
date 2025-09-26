import Typesense from 'typesense';

// Typesense configuration
const typesenseConfig = {
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http'
    }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 2
};

export const typesenseClient = new Typesense.Client(typesenseConfig);

// Program search schema
export const programSchema = {
  name: 'programs',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'owner', type: 'string' as const, facet: true },
    { name: 'state', type: 'string' as const, facet: true },
    { name: 'utility', type: 'string' as const, facet: true },
    { name: 'sector', type: 'string[]' as const, facet: true },
    { name: 'incentiveDescription', type: 'string' as const },
    { name: 'description', type: 'string' as const },
    { name: 'eligibilityRequirements', type: 'string' as const },
    { name: 'geographicScope', type: 'string[]' as const, facet: true },
    { name: 'programStatus', type: 'string' as const, facet: true },
    { name: 'searchText', type: 'string' as const }, // Combined searchable text
  ]
  // Removed default_sorting_field as it must be numeric
};

export async function initializeTypesense() {
  try {
    // Check if collection exists
    await typesenseClient.collections('programs').retrieve();
    console.log('✅ Typesense programs collection already exists');
    return true;
  } catch (error) {
    // Collection doesn't exist, create it
    try {
      await typesenseClient.collections().create(programSchema);
      console.log('✅ Created Typesense programs collection successfully');
      return true;
    } catch (createError) {
      console.warn('⚠️  Typesense initialization failed - falling back to PostgreSQL search');
      console.warn('Typesense error:', createError instanceof Error ? createError.message : createError);
      return false;
    }
  }
}

export interface TypesenseSearchParams {
  q?: string;
  owner?: string;
  utility?: string;
  sector?: string;
  state?: string;
  programStatus?: string;
  page?: number;
  per_page?: number;
}

export async function searchPrograms(params: TypesenseSearchParams) {
  const searchParams: any = {
    q: params.q || '*',
    query_by: 'name,owner,incentiveDescription,description,searchText',
    filter_by: [],
    per_page: params.per_page || 20,
    page: params.page || 1,
    facet_by: 'owner,utility,sector,state,programStatus',
    sort_by: '_text_match:desc'
  };

  // Add filters with proper quoting and escaping
  if (params.owner) {
    const escapedOwner = params.owner.replace(/"/g, '\\"');
    searchParams.filter_by.push(`owner:="${escapedOwner}"`);
  }
  if (params.utility) {
    const escapedUtility = params.utility.replace(/"/g, '\\"');
    searchParams.filter_by.push(`utility:="${escapedUtility}"`);
  }
  if (params.sector) {
    const escapedSector = params.sector.replace(/"/g, '\\"');
    searchParams.filter_by.push(`sector:="${escapedSector}"`);
  }
  if (params.state) {
    const escapedState = params.state.replace(/"/g, '\\"');
    searchParams.filter_by.push(`state:="${escapedState}"`);
  }
  if (params.programStatus) {
    const escapedStatus = params.programStatus.replace(/"/g, '\\"');
    searchParams.filter_by.push(`programStatus:="${escapedStatus}"`);
  }

  // Join filters with &&
  if (searchParams.filter_by.length > 0) {
    searchParams.filter_by = searchParams.filter_by.join(' && ');
  } else {
    delete searchParams.filter_by;
  }

  try {
    const results = await typesenseClient.collections('programs').documents().search(searchParams);
    return {
      hits: results.hits,
      found: results.found,
      facet_counts: results.facet_counts,
      page: results.page,
      search_time_ms: results.search_time_ms
    };
  } catch (error) {
    console.error('Typesense search error:', error);
    throw error;
  }
}

export async function indexProgram(program: any) {
  const document = {
    id: String(program.id), // Ensure string type
    name: program.name,
    owner: program.owner,
    state: program.state,
    utility: program.utility || program.owner, // Fallback for utility
    sector: Array.isArray(program.sector) ? program.sector : [program.sector].filter(Boolean),
    incentiveDescription: program.incentiveDescription || '',
    description: program.description || '',
    eligibilityRequirements: program.eligibilityRequirements || '',
    geographicScope: Array.isArray(program.geographicScope) ? program.geographicScope : [program.geographicScope].filter(Boolean),
    programStatus: program.programStatus || 'Active',
    searchText: `${program.name} ${program.owner} ${program.incentiveDescription || ''} ${program.description || ''} ${program.eligibilityRequirements || ''}`
  };

  try {
    await typesenseClient.collections('programs').documents().upsert(document);
    console.log(`✅ Indexed program ${program.id}: ${program.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Typesense indexing failed for program ${program.id}: ${program.name}`);
    console.warn('Indexing error:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function syncAllPrograms(programs: any[]) {
  console.log(`📄 Syncing ${programs.length} programs to Typesense...`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const program of programs) {
    const success = await indexProgram(program);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  if (failureCount === 0) {
    console.log(`✅ Successfully synced all ${successCount} programs to Typesense`);
  } else {
    console.warn(`⚠️  Sync completed: ${successCount} successful, ${failureCount} failed`);
  }
  
  return { successCount, failureCount };
}
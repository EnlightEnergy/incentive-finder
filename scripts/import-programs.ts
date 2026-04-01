/**
 * scripts/import-programs.ts
 *
 * Imports the 87+ programs from programs_complete.json into Railway PostgreSQL.
 * Strategy: DELETE all source='manual' programs, then bulk-insert fresh data.
 * Cascade deletes clean up programGeos, eligibilityRules, etc. automatically.
 *
 * Trigger via: POST /api/admin/import-programs  (Basic auth: admin / admin123)
 * Or directly: npx tsx scripts/import-programs.ts
 */

import { db } from '../server/db';
import {
  programs,
  programGeos,
  eligibilityRules,
  benefitStructures,
  documentation,
} from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RawProgram {
  name: string;
  category: string;
  administrator: string;
  utility: string[];
  measures: string[];
  facilityTypes: string[];
  incentiveStructure: string;
  deadline: string;
  minSqft: number;
  minKw: number;
  stackable: boolean;
  stackNotes: string;
  nextStep: string;
  active: boolean;
  sourceUrl: string;
  notes: string;
}

const UTILITY_SERVICE_AREA: Record<string, string> = {
  SCE:     'Southern California Edison',
  PGE:     'Pacific Gas and Electric',
  'PG&E':  'Pacific Gas and Electric',
  SDGE:    'San Diego Gas & Electric',
  'SDG&E': 'San Diego Gas & Electric',
  LADWP:   'Los Angeles Department of Water & Power',
  SMUD:    'Sacramento Municipal Utility District',
  MCE:     'Marin Clean Energy',
  SVCE:    'Silicon Valley Clean Energy',
  EBCE:    'East Bay Community Energy',
  ANAHEIM: 'Anaheim Public Utilities',
  VERNON:  'Vernon Public Utilities',
  ALL:     'Statewide California',
};

function normalizeIncentiveType(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('tax credit') || c.includes('federal')) return 'Tax Credit';
  if (c.includes('financing') || c.includes('on-bill') || c.includes('loan')) return 'Financing';
  if (c.includes('grant') || c.includes('state')) return 'Grant';
  if (c.includes('sgip') || c.includes('storage')) return 'Rebate';
  if (c.includes('demand response')) return 'Demand Response';
  if (c.includes('direct install') || c.includes('turnkey')) return 'Direct Install';
  if (c.includes('custom')) return 'Custom';
  return 'Prescriptive';
}

function facilityTypesToSectors(facilityTypes: string[]): string[] {
  const sectors = new Set<string>();
  for (const ft of facilityTypes) {
    const f = ft.toLowerCase();
    if (f.includes('all commercial') || f.includes('all')) {
      sectors.add('Commercial'); sectors.add('Industrial');
    } else if (f.includes('industrial') || f.includes('manufactur') || f.includes('warehouse')) {
      sectors.add('Industrial'); sectors.add('Commercial');
    } else if (f.includes('agricultural') || f.includes('farm')) {
      sectors.add('Agricultural');
    } else if (f.includes('multifamily') || f.includes('apartment') || f.includes('residential')) {
      sectors.add('Multifamily');
    } else if (f.includes('school') || f.includes('government') || f.includes('municipal')) {
      sectors.add('Government'); sectors.add('Commercial');
    } else {
      sectors.add('Commercial');
    }
  }
  if (sectors.size === 0) sectors.add('Commercial');
  return Array.from(sectors);
}

function parseDateOrNull(deadline: string): string | null {
  if (!deadline) return null;
  const yearMatch = deadline.match(/20\d\d/);
  if (!yearMatch) return null;
  const year = yearMatch[0];
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
  };
  const monthMatch = deadline.toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  const month = monthMatch ? months[monthMatch[1]] : '12';
  return `${year}-${month}-28`;
}

function makeSourceId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
}

export async function importPrograms(): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const jsonPath = join(__dirname, 'programs_complete.json');
  const rawPrograms: RawProgram[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  console.log(`[import] Loaded ${rawPrograms.length} programs from JSON`);

  await db.delete(programs).where(eq(programs.source, 'manual'));
  console.log('[import] Cleared old manual programs');

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of rawPrograms) {
    try {
      const techTags = raw.measures.length > 0 ? raw.measures : ['General'];
      const sectorTags = facilityTypesToSectors(raw.facilityTypes);
      const incentiveType = normalizeIncentiveType(raw.category);
      const endDate = parseDateOrNull(raw.deadline);
      const status = raw.active === false && raw.deadline?.toLowerCase().includes('expire') ? 'expired' : 'open';

      const [prog] = await db.insert(programs).values({
        source: 'manual',
        sourceProcessId: makeSourceId(raw.name),
        name: raw.name,
        owner: raw.administrator,
        url: raw.sourceUrl || null,
        description: raw.notes ? raw.notes.substring(0, 2000) : null,
        incentiveDescription: raw.incentiveStructure ? raw.incentiveStructure.substring(0, 2000) : null,
        sectorTags,
        techTags,
        incentiveType,
        status,
        endDate: endDate as any,
        urlStatus: 'unknown',
        dataVerifiedAt: new Date() as any,
      }).returning({ id: programs.id });

      const programId = prog.id;
      const utilities = raw.utility.length > 0 ? raw.utility : ['ALL'];

      await db.insert(programGeos).values(
        utilities.map(u => ({
          programId,
          state: 'CA',
          utilityServiceArea: UTILITY_SERVICE_AREA[u] || u,
        }))
      );

      await db.insert(eligibilityRules).values({
        programId,
        buildingTypes: raw.facilityTypes.length > 0 ? raw.facilityTypes : ['All Commercial'],
        naicsIncludes: [],
        minProjectCost: raw.minKw > 0 ? raw.minKw * 500 : (raw.minSqft > 0 ? 5000 : 1000),
        preApprovalRequired: incentiveType === 'Custom' || (raw.deadline?.toLowerCase().includes('pre-install') ?? false),
        tradeAllyRequired: false,
        prevailingWageRequired: false,
      });

      await db.insert(benefitStructures).values({
        programId,
        unit: incentiveType === 'Tax Credit' ? '%_of_cost' : incentiveType === 'Financing' ? '$/loan' : '$/project',
        tierJson: { stackable: raw.stackable, stackNotes: raw.stackNotes || '' },
        examplesText: (raw.incentiveStructure || 'Contact administrator for rates').substring(0, 500),
      });

      const noteParts = [
        raw.notes || '',
        raw.stackNotes ? `Stacking: ${raw.stackNotes}` : '',
        raw.nextStep ? `Next step: ${raw.nextStep}` : '',
      ].filter(Boolean);

      if (noteParts.length > 0) {
        await db.insert(documentation).values({
          programId,
          notes: noteParts.join('\n\n').substring(0, 2000),
        });
      }

      inserted++;
      if (inserted % 10 === 0) console.log(`[import] ${inserted} programs inserted...`);
    } catch (err: any) {
      const msg = `Error on "${raw.name}": ${err.message}`;
      console.error(msg);
      errors.push(msg);
      skipped++;
    }
  }

  console.log(`[import] Complete: ${inserted} inserted, ${skipped} skipped`);
  return { inserted, skipped, errors };
}

const isMain = process.argv[1] && (process.argv[1].endsWith('import-programs.ts') || process.argv[1].endsWith('import-programs.js'));
if (isMain) {
  importPrograms()
    .then(({ inserted, errors }) => {
      console.log(`\n✅ Done: ${inserted} programs imported. ${errors.length} errors.`);
      if (errors.length) { console.error('\nErrors:'); errors.forEach(e => console.error(' -', e)); }
      process.exit(errors.length > 0 ? 1 : 0);
    })
    .catch(e => { console.error('Fatal:', e); process.exit(1); });
}

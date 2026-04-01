/**
 * server/matcher.ts
 *
 * Matches a FacilityProfile against the programs DB and returns data
 * shaped for the PDF report template (report-builder/template.js).
 *
 * KEY FIX (v2): Post-filter competing utility programs.
 * The DB query uses broad OR conditions to fetch candidates, but then
 * we exclude any program whose owner belongs to a utility that is NOT
 * the customer's utility.  This prevents PG&E programs from appearing
 * for SCE customers and vice-versa.
 */

import { db } from './db';
import {
  programs,
  programGeos,
  eligibilityRules,
  benefitStructures,
  documentation,
} from '../shared/schema';
import { eq, and, or, ilike, sql } from 'drizzle-orm';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacilityProfile {
  zip: string;
  state?: string;
  utility: string;
  facilityType: string;
  measures: string[];
  sqFt?: number;
  contactName?: string;
  contactEmail?: string;
  facilityName?: string;
}

export interface ProgramEntry {
  name: string;
  category: string;
  administrator: string;
  eligibleMeasures: string;
  incentiveStructure: string;
  stacksWith: string;
  deadline: string;
  timeline: string;
  nextStep: string;
  preApprovalRequired: boolean;
  conflicts?: string;
  url?: string;
}

export interface MatchedProgram {
  measure: string;
  entries: ProgramEntry[];
}

export interface MatchResult {
  facility: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    facilityType: string;
    sqFt: string;
    utility: string;
    ownership: string;
    contactName: string;
    contactEmail: string;
    reportDate: string;
  };
  programs: MatchedProgram[];
  programCount: number;
  measures: string[];
  summary: string;
}

// ── Utility filtering ─────────────────────────────────────────────────────────
//
// Maps well-known utility codes/names to the substrings that identify
// programs administered by that utility.  When a customer is on utility X,
// any program whose owner matches a DIFFERENT utility in this map is excluded.

const UTILITY_OWNER_PATTERNS: Record<string, string[]> = {
  'PG&E':   ['pg&e', 'pacific gas', 'pge', 'pacific gas and electric'],
  'SCE':    ['sce', 'southern california edison', 'so. california edison'],
  'SDG&E':  ['sdg&e', 'san diego gas', 'sdge'],
  'LADWP':  ['ladwp', 'los angeles department of water', 'la dept of water'],
  'SMUD':   ['smud', 'sacramento municipal utility'],
  'MCE':    ['mce', 'marin clean energy'],
  'SVCE':   ['svce', 'silicon valley clean energy'],
  'EBCE':   ['ebce', 'east bay community energy'],
  'SVPA':   ['svpa', 'silicon valley power'],
  'BURBANK':['burbank water and power', 'burbank electric'],
  'GLENDALE':['glendale water and power'],
  'PASADENA':['pasadena water and power'],
};

function getCustomerUtilityPatterns(utility: string): string[] {
  const u = utility.toLowerCase().trim();
  for (const [code, patterns] of Object.entries(UTILITY_OWNER_PATTERNS)) {
    if (code.toLowerCase() === u) return patterns;
  }
  for (const [, patterns] of Object.entries(UTILITY_OWNER_PATTERNS)) {
    if (patterns.some(p => u.includes(p) || p.includes(u))) return patterns;
  }
  return [u];
}

function isCompetingUtilityProgram(ownerName: string, customerPatterns: string[]): boolean {
  const owner = ownerName.toLowerCase();
  const stateOrFederal = ['cpuc','cec','carb','california energy commission','california public utilities','sgip','self-generation','irs','doe','department of energy','federal','sce gogreen','caeatfa','pace','on-bill','enpower'];
  if (stateOrFederal.some(kw => owner.includes(kw))) return false;
  for (const [, patterns] of Object.entries(UTILITY_OWNER_PATTERNS)) {
    if (patterns.some(p => owner.includes(p))) {
      if (customerPatterns.some(p => owner.includes(p))) return false;
      return true;
    }
  }
  return false;
}
const MEASURE_TECH_MAP: Record<string, string[]> = {
  'LED Lighting':['Lighting','LED','lighting','lamp','fixture'],
  'HVAC':['HVAC','Cooling','Heating','Air Conditioning','chiller','rooftop'],
  'VFD / Motors':['VFD','Variable Frequency Drive','Motors','Pump','Fan'],
  'Refrigeration':['Refrigeration','Refrigerator','Walk-in','Case'],
  'Solar / PV':['Solar','Photovoltaic','PV','Net Metering'],
  'Battery Storage':['Battery','Energy Storage','Storage','BESS'],
  'EV Charging':['EV','Electric Vehicle','EVSE','Charging Station'],
  'Building Envelope':['Envelope','Insulation','Window','Roof','Cool Roof'],
  'Compressed Air':['Compressed Air','Compressor','Air Compressor'],
  'Boilers / Steam':['Boiler','Steam','Hot Water'],
  'Process Equipment':['Process','Industrial','Manufacturing'],
};

function measureToTechTags(measure: string): string[] {
  if (MEASURE_TECH_MAP[measure]) return MEASURE_TECH_MAP[measure];
  const m = measure.toLowerCase();
  for (const [key, tags] of Object.entries(MEASURE_TECH_MAP)) {
    if (key.toLowerCase().includes(m) || m.includes(key.toLowerCase().split(' ')[0])) return tags;
  }
  return [measure];
}

function facilityTypeToSectors(facilityType: string): string[] {
  const ft = facilityType.toLowerCase();
  if (ft.includes('industrial')||ft.includes('manufactur')||ft.includes('warehouse')||ft.includes('distribution')) return ['Industrial','Commercial'];
  if (ft.includes('office')||ft.includes('retail')||ft.includes('hotel')||ft.includes('hospitality')) return ['Commercial'];
  if (ft.includes('multifamily')||ft.includes('apartment')||ft.includes('condo')) return ['Multifamily'];
  if (ft.includes('agricultural')||ft.includes('farm')||ft.includes('dairy')) return ['Agricultural'];
  if (ft.includes('school')||ft.includes('education')||ft.includes('government')||ft.includes('municipal')) return ['Government','Commercial'];
  return ['Commercial','Industrial'];
}

function determineCategory(owner: string, incentiveType: string): string {
  const o = owner.toLowerCase(); const t = incentiveType.toLowerCase();
  if (o.includes('sce')||o.includes('pg&e')||o.includes('sdg&e')||o.includes('ladwp')||o.includes('smud')||o.includes('burbank')||o.includes('pasadena')||o.includes('glendale')||t==='prescriptive'||t==='custom') return 'Utility Rebate';
  if (t.includes('tax credit')||o.includes('irs')||o.includes('federal')||o.includes('doe')) return 'Federal Tax Credit';
  if (t==='grant'||o.includes('cpuc')||o.includes('cec')||o.includes('carb')||o.includes('california energy')||o.includes('state of california')||o.includes('sgip')) return 'State Grant';
  if (t==='financing'||t==='on-bill'||o.includes('caeatfa')||o.includes('pace')||o.includes('on-bill')) return 'Financing';
  if (o.includes('utility')||o.includes('electric')||o.includes('energy')) return 'Utility Rebate';
  return 'State Grant';
}

function rowToEntry(p: typeof programs.$inferSelect, benefit: typeof benefitStructures.$inferSelect|null, elig: typeof eligibilityRules.$inferSelect|null, doc: typeof documentation.$inferSelect|null, bestMeasure: string): ProgramEntry {
  const incentiveText = (benefit?.examplesText||p.incentiveDescription||(benefit?.unit?`Rate: ${benefit.unit}`:'')||p.description?.substring(0,200)||'See program details').substring(0,300);
  const deadlineText = p.endDate ? new Date(p.endDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : p.status==='paused' ? 'Currently paused' : 'Rolling enrollment';
  let nextStep = 'Contact program administrator to begin application';
  if (doc?.preAppLink) nextStep = `Submit pre-approval at: ${doc.preAppLink}`;
  else if (elig?.preApprovalRequired) nextStep = 'Submit pre-approval before ordering or installing equipment';
  else if (p.url) nextStep = `Apply via program website: ${p.url}`;
  const timeline = elig?.tradeAllyRequired ? '8–14 weeks (trade ally/contractor required)' : '6–10 weeks';
  return {name:p.name, category:determineCategory(p.owner,p.incentiveType), administrator:p.owner, eligibleMeasures:(p.techTags as string[])?.join(', ')||bestMeasure, incentiveStructure:incentiveText, stacksWith:'', deadline:deadlineText, timeline, nextStep, preApprovalRequired:elig?.preApprovalRequired??false, url:p.url??undefined};
}
export async function matchPrograms(facility: FacilityProfile): Promise<MatchResult> {
  const state = facility.state || 'CA';
  const zipPfx = facility.zip.substring(0, 3);
  const sectors = facilityTypeToSectors(facility.facilityType);

  const rows = await db
    .select({p:programs, geo:programGeos, elig:eligibilityRules, benefit:benefitStructures, doc:documentation})
    .from(programs)
    .leftJoin(programGeos, eq(programGeos.programId, programs.id))
    .leftJoin(eligibilityRules, eq(eligibilityRules.programId, programs.id))
    .leftJoin(benefitStructures, eq(benefitStructures.programId, programs.id))
    .leftJoin(documentation, eq(documentation.programId, programs.id))
    .where(and(
      eq(programs.status, 'open'),
      or(
        ilike(programGeos.utilityServiceArea, `%${facility.utility}%`),
        ilike(programs.owner, `%${facility.utility}%`),
        sql`${programGeos.zipPrefix} = ${zipPfx}`,
        eq(programGeos.state, state),
        sql`${programs.owner} ILIKE '%California%'`,
        sql`${programs.owner} ILIKE '%CPUC%'`,
        sql`${programs.owner} ILIKE '%CEC%'`,
        sql`${programs.owner} ILIKE '%CARB%'`,
        sql`${programs.owner} ILIKE '%Federal%'`,
        sql`${programs.owner} ILIKE '%DOE%'`,
        sql`${programs.owner} ILIKE '%IRS%'`,
      ),
    ))
    .limit(300);

  const seen = new Set<number>();
  const unique = rows.filter(r => { if (seen.has(r.p.id)) return false; seen.add(r.p.id); return true; });

  const customerPatterns = getCustomerUtilityPatterns(facility.utility);
  const grouped = new Map<string, ProgramEntry[]>();

  for (const { p, benefit, elig, doc } of unique) {
    if (isCompetingUtilityProgram(p.owner, customerPatterns)) continue;
    const techTags = (p.techTags as string[]) || [];
    const sectorTags = (p.sectorTags as string[]) || [];
    if (sectorTags.length > 0 && !sectorTags.some(s => sectors.includes(s))) continue;
    let bestMeasure = ''; let bestScore = 0;
    for (const measure of facility.measures) {
      const tags = measureToTechTags(measure);
      const score = tags.filter(t => techTags.some(pt => pt.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(pt.toLowerCase()))).length;
      if (score > bestScore) { bestScore = score; bestMeasure = measure; }
    }
    if (bestScore === 0 && techTags.length > 0) continue;
    if (!bestMeasure) bestMeasure = facility.measures[0] || 'General Programs';
    const entry = rowToEntry(p, benefit, elig, doc, bestMeasure);
    if (!grouped.has(bestMeasure)) grouped.set(bestMeasure, []);
    grouped.get(bestMeasure)!.push(entry);
  }

  const matchedPrograms: MatchedProgram[] = Array.from(grouped.entries()).map(([measure, entries]) => ({ measure, entries }));
  const totalCount = matchedPrograms.reduce((n, g) => n + g.entries.length, 0);
  const today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  const summary = totalCount > 0
    ? `Based on your facility profile, we identified ${totalCount} qualifying program${totalCount!==1?'s':''} across ${matchedPrograms.length} measure area${matchedPrograms.length!==1?'s':''}. Programs span utility rebates, state grants, and federal incentives that can be stacked for maximum savings.`
    : 'No open programs were found matching your exact profile. Our team can do a manual review — contact us at hello@enlightingenergy.com.';

  return {
    facility: {name:facility.facilityName||'Your Facility', address:'', city:'', state, zip:facility.zip, facilityType:facility.facilityType, sqFt:facility.sqFt?facility.sqFt.toLocaleString():'', utility:facility.utility, ownership:'', contactName:facility.contactName||'', contactEmail:facility.contactEmail||'', reportDate:today},
    programs: matchedPrograms,
    programCount: totalCount,
    measures: facility.measures,
    summary,
  };
}

import csv
import json

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return 'NULL'
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def parse_sector_tags(segment):
    """Extract sector tags from segment description"""
    tags = []
    if 'Commercial' in segment:
        tags.append('Commercial')
    if 'Industrial' in segment:
        tags.append('Industrial')
    if 'Agriculture' in segment or 'Agricultural' in segment:
        tags.append('Agricultural')
    if 'Residential' in segment:
        tags.append('Residential')
    if 'Public' in segment or 'Healthcare' in segment or 'Higher Ed' in segment:
        tags.append('Commercial')  # Treat as commercial
    return tags if tags else ['Commercial']

def parse_tech_tags(program_name, incentive_summary):
    """Extract technology tags from program info"""
    tags = []
    text = (program_name + ' ' + incentive_summary).lower()
    
    if any(word in text for word in ['hvac', 'cooling', 'heating', 'rooftop', 'air conditioning']):
        tags.append('HVAC')
    if any(word in text for word in ['lighting', 'led', 'lamp']):
        tags.append('Lighting')
    if any(word in text for word in ['refrigeration', 'freezer', 'cooler', 'case']):
        tags.append('Refrigeration')
    if any(word in text for word in ['motor', 'vsd', 'vfd', 'drive']):
        tags.append('Motors')
    if any(word in text for word in ['solar', 'pv', 'photovoltaic']):
        tags.append('Solar')
    if any(word in text for word in ['insulation', 'pipe', 'fitting']):
        tags.append('Insulation')
    if any(word in text for word in ['water heater', 'hpwh', 'heat pump water']):
        tags.append('Water Heating')
    if any(word in text for word in ['battery', 'storage', 'sgip']):
        tags.append('Energy Storage')
    if any(word in text for word in ['demand response', 'dr', 'load reduction', 'auto-dr']):
        tags.append('Demand Response')
    if 'sem' in text or 'strategic energy' in text:
        tags.append('Strategic Energy Management')
    
    return tags if tags else ['Energy Efficiency']

# SCE Programs
print("-- SCE Programs from CSV")
sce_programs = []
with open('attached_assets/SCE_commercial_industrial_programs_1759697825406.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        program = {
            'source': 'utility',
            'sourceProcessId': row['program_id'],
            'name': row['program_name'],
            'owner': 'Southern California Edison',
            'url': row.get('source_links', '').split('|')[0].strip() if row.get('source_links') else None,
            'description': f"{row['program_type']} program for {row['segment']}. {row['key_eligibility']}",
            'incentiveDescription': row['incentive_summary'],
            'sectorTags': parse_sector_tags(row['segment']),
            'techTags': parse_tech_tags(row['program_name'], row['incentive_summary']),
            'incentiveType': 'Prescriptive' if 'Prescriptive' in row['program_type'] else 'Custom' if 'Custom' in row['program_type'] else 'Performance-Based',
            'status': 'open'
        }
        sce_programs.append(program)
        
        sector_tags_json = json.dumps(program['sectorTags'])
        tech_tags_json = json.dumps(program['techTags'])
        
        print(f"""INSERT INTO programs (source, source_program_id, name, owner, url, description, incentive_description, sector_tags, tech_tags, incentive_type, status)
VALUES ('utility', {escape_sql_string(program['sourceProcessId'])}, {escape_sql_string(program['name'])}, 'Southern California Edison', {escape_sql_string(program['url'])}, {escape_sql_string(program['description'])}, {escape_sql_string(program['incentiveDescription'])}, '{sector_tags_json}', '{tech_tags_json}', {escape_sql_string(program['incentiveType'])}, 'open');""")

print("\n-- PG&E Programs (grouped by category)")
# Group PGE measures into programs
pge_programs = {
    'PGE_AG_FOOD_VSD_2025': {
        'name': 'PG&E Agriculture & Food Processing VSD Rebates',
        'description': 'Variable Speed Drive (VSD) rebates for dust collection fans in agriculture and food processing facilities. Covers motors from 10 HP to 150 HP with tiered rebates.',
        'incentiveDescription': 'Rebates range from $250 (10 HP) to $15,000 (150 HP) per motor for dust collection fan VSDs. Requirements: NAICS ranges 111000-112990, 211120-213115, 311000-339999; feedback control on static pressure/CFM/velocity; no prior/failed VSD; submit ≤60 days.',
        'sectorTags': ['Agricultural', 'Industrial'],
        'techTags': ['Motors', 'Agriculture'],
        'incentiveType': 'Prescriptive'
    },
    'PGE_HVAC_COMM_2025': {
        'name': 'PG&E Commercial HVAC Rebates',
        'description': 'HVAC rebates for commercial buildings including VFDs for ventilation fans and advanced rooftop controls. Supports energy-efficient climate control systems.',
        'incentiveDescription': 'VFD for HVAC Fan: $80/HP for existing fans. Advanced Rooftop HVAC Controls: $120-$194 per ton depending on package type and climate zone. Requirements: existing HVAC supply/return/exhaust fan; single-speed motor; remove throttling devices; submit ≤60 days.',
        'sectorTags': ['Commercial'],
        'techTags': ['HVAC'],
        'incentiveType': 'Prescriptive'
    },
    'PGE_REFRIGERATION_2025': {
        'name': 'PG&E Commercial Refrigeration Rebates',
        'description': 'Comprehensive refrigeration rebates for commercial applications including ultra-low temperature freezers, ASH controls, display case doors, and case replacements.',
        'incentiveDescription': 'Ultra-Low Temp Freezers: $300-$600/unit (ENERGY STAR, -80°C capable). ASH Controls: $25/linear ft for medium & low temp. High-Efficiency Display Case Doors: $75/LF (low temp). Open Multi-Deck Case Replacements: $75-$175/LF. Requirements vary by measure; submit ≤60 days.',
        'sectorTags': ['Commercial'],
        'techTags': ['Refrigeration'],
        'incentiveType': 'Prescriptive'
    },
    'PGE_BUILDING_SYSTEMS_2025': {
        'name': 'PG&E Building Systems Rebates',
        'description': 'Rebates for various building systems including pipe/fitting insulation, ozone laundry systems, commercial pool heaters, and backup generators.',
        'incentiveDescription': 'Pipe Insulation: $3/linear ft for various pipe sizes and applications. Ozone Laundry System: $39 per lb washer capacity. Commercial Pool & Spa Heater: $2 per MBtuh (≥84% TE). Generator Rebate: $300 per qualifying unit (HFRA Tier 2/3, ≥2 PSPS events). Submit ≤60 days.',
        'sectorTags': ['Commercial', 'Industrial'],
        'techTags': ['Insulation', 'Water Heating', 'Process Equipment'],
        'incentiveType': 'Prescriptive'
    }
}

for prog_id, prog in pge_programs.items():
    sector_tags_json = json.dumps(prog['sectorTags'])
    tech_tags_json = json.dumps(prog['techTags'])
    
    print(f"""INSERT INTO programs (source, source_program_id, name, owner, url, description, incentive_description, sector_tags, tech_tags, incentive_type, status)
VALUES ('utility', {escape_sql_string(prog_id)}, {escape_sql_string(prog['name'])}, 'Pacific Gas & Electric', 'https://www.pge.com/en/save-energy-and-money/energy-saving-programs/business-programs.html', {escape_sql_string(prog['description'])}, {escape_sql_string(prog['incentiveDescription'])}, '{sector_tags_json}', '{tech_tags_json}', 'Prescriptive', 'open');""")

print("\n-- SDG&E Programs")
sdge_programs = [
    {
        'sourceProcessId': 'SDGE_PRESCRIPTIVE_2025',
        'name': 'SDG&E Energy Efficiency Business Rebates - Prescriptive',
        'description': 'Fixed-amount equipment rebates for lighting improvements, refrigeration systems, natural gas technologies, food service equipment, and HVAC systems. Available to all business, industrial, and agricultural customers.',
        'incentiveDescription': 'Pre-set rebate amounts for qualifying equipment including: Lighting improvements, Refrigeration systems, Natural gas technologies, Food service equipment, HVAC systems. Contact Energy Savings Center for specific rebate amounts.',
        'sectorTags': ['Commercial', 'Industrial', 'Agricultural'],
        'techTags': ['Lighting', 'Refrigeration', 'HVAC', 'Process Equipment'],
        'incentiveType': 'Prescriptive'
    },
    {
        'sourceProcessId': 'SDGE_CUSTOM_2025',
        'name': 'SDG&E Energy Efficiency Business Rebates - Custom',
        'description': 'Performance-based incentives funding up to 50% of total project costs, calculated on direct energy (kWh or therms) saved. For projects that exceed government energy standards.',
        'incentiveDescription': 'Up to 50% of total project costs based on direct energy savings (kWh or therms). Minimum requirement: Monthly electrical demand of at least 4,166 therms for certain programs. Projects must exceed government energy standards.',
        'sectorTags': ['Commercial', 'Industrial'],
        'techTags': ['Energy Efficiency'],
        'incentiveType': 'Custom'
    },
    {
        'sourceProcessId': 'SDGE_HVAC_COOLING_2025',
        'name': 'SDG&E Premium Efficiency Cooling Program',
        'description': 'Low or no-cost HVAC tune-ups and incentives for new commercial HVAC equipment purchases to improve cooling efficiency.',
        'incentiveDescription': 'Low or no-cost HVAC tune-ups plus incentives for purchasing new commercial HVAC equipment. Contact SDG&E Energy Savings Center for specific amounts.',
        'sectorTags': ['Commercial'],
        'techTags': ['HVAC'],
        'incentiveType': 'Prescriptive'
    },
    {
        'sourceProcessId': 'SDGE_SMALL_BIZ_2025',
        'name': 'SDG&E Energy Advantage Program for Small Business',
        'description': 'No-cost services for qualifying small businesses including energy assessments, audits, and referrals to contractors.',
        'incentiveDescription': 'No-cost energy assessments, audits, and contractor referrals for qualifying small businesses. Free installation of eligible energy efficiency measures.',
        'sectorTags': ['Commercial'],
        'techTags': ['Energy Efficiency'],
        'incentiveType': 'Direct Install'
    },
    {
        'sourceProcessId': 'SDGE_TECH_INCENTIVE_2025',
        'name': 'SDG&E Technology Incentive Program',
        'description': 'Incentives for purchasing and installing automated equipment that syncs with SDG&E demand response measures to reduce usage during peak grid days.',
        'incentiveDescription': 'Incentives for automated equipment installation that enables demand response participation. Equipment must be capable of syncing with SDG&E systems to reduce usage during peak grid events.',
        'sectorTags': ['Commercial', 'Industrial'],
        'techTags': ['Demand Response', 'Energy Management'],
        'incentiveType': 'Technology'
    },
    {
        'sourceProcessId': 'SDGE_ENERGYLINK_2025',
        'name': 'SD EnergyLink (Federal & Tribal)',
        'description': 'Cash incentives for customers on federal properties (military bases, post offices, federal agencies), Native American lands (18 recognized tribes), and local government facilities.',
        'incentiveDescription': 'Cash incentives for energy efficiency improvements on federal and tribal lands. Apply online at sdenergylink.com. Available to federal properties, Native American tribal lands, and local government facilities.',
        'sectorTags': ['Commercial', 'Government'],
        'techTags': ['Energy Efficiency'],
        'incentiveType': 'Prescriptive'
    },
    {
        'sourceProcessId': 'SDGE_SGIP_2025',
        'name': 'SGIP - Self-Generation Incentive Program (SDG&E)',
        'description': 'Battery energy storage incentives for businesses to reduce peak demand charges, provide backup during outages and PSPS events, and increase energy independence when paired with solar.',
        'incentiveDescription': 'Incentives for battery energy storage systems. Reduces peak demand charges, provides backup power during outages and PSPS events. When paired with solar, increases energy independence. Visit sgipsd.org for current incentive rates.',
        'sectorTags': ['Commercial', 'Industrial'],
        'techTags': ['Energy Storage', 'Solar'],
        'incentiveType': 'Technology'
    },
    {
        'sourceProcessId': 'SDGE_DEMAND_RESPONSE_2025',
        'name': 'SDG&E Demand Response Programs',
        'description': 'Get paid for reducing energy use during peak grid days. Multiple rates and incentive options available for commercial and industrial customers.',
        'incentiveDescription': 'Payment for reducing energy consumption during peak grid events. Multiple program options with varying rates and requirements. Helps grid stability while reducing your energy costs.',
        'sectorTags': ['Commercial', 'Industrial'],
        'techTags': ['Demand Response'],
        'incentiveType': 'Performance-Based'
    }
]

for prog in sdge_programs:
    sector_tags_json = json.dumps(prog['sectorTags'])
    tech_tags_json = json.dumps(prog['techTags'])
    url = 'https://www.sdge.com/businesses/savings-center/rebates-incentives'
    
    print(f"""INSERT INTO programs (source, source_program_id, name, owner, url, description, incentive_description, sector_tags, tech_tags, incentive_type, status)
VALUES ('utility', {escape_sql_string(prog['sourceProcessId'])}, {escape_sql_string(prog['name'])}, 'San Diego Gas & Electric', {escape_sql_string(url)}, {escape_sql_string(prog['description'])}, {escape_sql_string(prog['incentiveDescription'])}, '{sector_tags_json}', '{tech_tags_json}', {escape_sql_string(prog['incentiveType'])}, 'open');""")

print("\n-- Geographic coverage (link all programs to their utilities)")
print("\n-- SCE programs")
print("INSERT INTO program_geos (program_id, state, utility_service_area) SELECT id, 'CA', 'Southern California Edison' FROM programs WHERE owner = 'Southern California Edison' AND source_program_id LIKE 'SCE_%';")

print("\n-- PG&E programs")
print("INSERT INTO program_geos (program_id, state, utility_service_area) SELECT id, 'CA', 'Pacific Gas & Electric' FROM programs WHERE owner = 'Pacific Gas & Electric' AND source_program_id LIKE 'PGE_%';")

print("\n-- SDG&E programs")
print("INSERT INTO program_geos (program_id, state, utility_service_area) SELECT id, 'CA', 'San Diego Gas & Electric' FROM programs WHERE owner = 'San Diego Gas & Electric' AND source_program_id LIKE 'SDGE_%';")

print("\n-- Program summary")
print("SELECT 'Total programs to be added:', COUNT(*) FROM (")
print("  SELECT 1 FROM programs WHERE source_program_id LIKE 'SCE_%' UNION ALL")
print("  SELECT 1 FROM programs WHERE source_program_id LIKE 'PGE_%' UNION ALL")
print("  SELECT 1 FROM programs WHERE source_program_id LIKE 'SDGE_%'")
print(") AS temp;")

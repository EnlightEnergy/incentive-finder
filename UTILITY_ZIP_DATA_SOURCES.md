# Utility ZIP Code Data Quality Issues & Solutions

## Current Problem
The `utility_zip_codes` table has conflicting/duplicate data causing incorrect program filtering:
- **ZIP 93030 (Oxnard)**: Listed as both SCE and SDGE (should be SCE only)
- **Many LA ZIPs (900xx)**: Have 3 utilities listed (LADWP + SCE + SDGE)
- **Total affected**: 20+ ZIP codes with 2-3 utilities each

This causes the search to show programs from wrong utilities (e.g., SDGE programs appearing for SCE territory).

## Root Cause
Current data sources are conflicting:
- "CPUC SCE ZIP list + TECH SCE ZIP list" 
- "SDG&E Utility Zip Codes by Climate Zones"
- These have overlapping/contradictory territory claims

## Official Data Sources (Found via Web Search)

### **PG&E (Pacific Gas & Electric)**
- **Electric Service Territory PDF**: https://www.pge.com/tariffs/assets/pdf/tariffbook/ELEC_MAPS_Service%20Area%20Map.pdf
- **Gas Service Territory PDF**: https://www.pge.com/tariffs/assets/pdf/tariffbook/GAS_MAPS_Service_Area_Map.pdf
- **Public Data Portal**: https://pge-energydatarequest.com/public_datasets
  - Quarterly CSV datasets by ZIP code
  - Historical data from October 2013
- **Interactive Map**: https://www.arcgis.com/apps/instant/minimalist/index.html?appid=03ef3d359a2842f0bd87359fb2ffebf8
- **Coverage**: Northern and Central California (5.2M households)

### **SDG&E (San Diego Gas & Electric)**  
- **ZIP Codes by Climate Zone PDF**: https://www.sdge.com/sites/default/files/documents/Utility%20Zip%20Codes%20by%20Climate%20Zones.pdf
- **Service Territory Page**: https://www.sdge.com/node/11796
- **Coverage**: San Diego County + southern Orange County

### **SCE (Southern California Edison)**
- **Service Territory Overview**: https://www.sce.com/about-us/who-we-are/leadership/our-service-territory
- **Coverage**: 50,000 sq mi across coastal, central, Southern California
- **Note**: SCE doesn't publish a comprehensive ZIP list publicly; may need to contact them

### **LADWP (Los Angeles Department of Water and Power)**
- **Website**: https://www.ladwp.com/
- **Coverage**: City of Los Angeles boundaries
- **Note**: Clear geographic boundaries within LA city limits

### **California Energy Commission**
- **Energy Maps Portal**: https://www.energy.ca.gov/data-reports/energy-maps-and-spatial-data
- **GIS Shapefiles**: Official utility territory boundaries for mapping
- **Best for**: Authoritative boundary data

## Recommended Solution

### Option 1: Parse Official PDFs (Fastest)
1. Download PG&E and SDG&E ZIP lists from PDFs above
2. For SCE/LADWP: Use process of elimination (California ZIPs not in PG&E/SDG&E)
3. Handle overlaps with priority rules:
   - LADWP > all (for LA city ZIPs)
   - Single utility = primary
   - Multi-utility zones = flag for manual review

### Option 2: Use CEC GIS Data (Most Accurate)
1. Download GIS shapefiles from CEC portal
2. Geocode ZIP centroids
3. Spatial join to determine primary utility
4. More complex but handles edge cases better

### Option 3: Contact Utilities Directly
- Request official ZIP territory lists
- May take time but gives authoritative data
- Best for long-term accuracy

## Immediate Fix for ZIP 93030
```sql
-- Remove incorrect SDGE entry for Oxnard ZIP 93030
DELETE FROM utility_zip_codes 
WHERE zip_code = '93030' AND owner_utility = 'SDGE';
```

## Data Quality Standards Going Forward
- **One primary utility per ZIP** (or clear overlap rules)
- **Source attribution**: Track where each mapping came from
- **Validation**: Cross-reference 2+ official sources
- **Update cadence**: Quarterly review against utility changes

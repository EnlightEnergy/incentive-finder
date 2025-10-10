# Data Cleanup & Search Fix Summary

## Problem Identified
ZIP code searches were showing programs from incorrect utilities. For example:
- **ZIP 95811 (SMUD - Sacramento)** was incorrectly showing SDG&E, SCE, and PG&E programs

## Root Causes

### 1. Search Logic Bug
- State-level programs (179D, SGIP, ITC) had empty string `utility_service_area` values instead of NULL
- Fixed by converting empty strings to NULL and updating search logic to properly filter:
  - Match programs where `utility_service_area` matches detected utility OR
  - Match programs where `state='CA'` AND `utility_service_area IS NULL`

### 2. Data Quality Issues
The SDG&E climate zone mapping file contained **1,525 incorrect ZIP code entries** outside SDG&E's actual service territory:
- 413 entries in 94xxx (SF Bay Area - should be PG&E)
- 633 entries in 95xxx (Sacramento - should be PG&E/SMUD)  
- 261 entries in 93xxx (Central CA - should be PG&E)
- 33 entries in 90xxx (LA area - should be SCE/LADWP)

**Action Taken**: Deleted all incorrect entries, keeping only 148 valid 92xxx (San Diego) entries

### 3. Duplicate ZIP Entries
- ZIP 95811 had duplicate entries (both SMUD and incorrect SDGE)
- **Action Taken**: Removed duplicate SDGE entry

## Current Database State

### ZIP Code Coverage (2,173 verified entries)
- **PG&E**: 1,119 ZIP codes (comprehensive Northern & Central CA coverage)
- **SCE**: 631 ZIP codes
- **SDG&E**: 148 ZIP codes (San Diego County only)
- **LADWP**: 132 ZIP codes
- **SMUD**: 42 ZIP codes
- **Municipal utilities**: 74 ZIP codes across 11 utilities

### Program Geographic Entries
- **State/Federal programs** (179D, SGIP, ITC): `state='CA'`, `utility_service_area=NULL`
- **Utility programs**: `utility_service_area='[Utility Name]'`

## Verification Results

### ✅ Fixed ZIP Codes
- **95811 (SMUD)**: Shows only SMUD + state/federal programs (4 total)
- **94102 (PG&E)**: Shows only PG&E + state/federal programs (8 total)  
- **92101 (SDG&E)**: Shows only SDG&E + state/federal programs (12 total)

### ⚠️ Known Gaps
ZIP codes without entries fall back to showing all CA programs:
- Many 93xxx, 94xxx, 95xxx, 96xxx ZIPs need PG&E coverage
- Some 90xxx, 91xxx ZIPs need SCE coverage

## Next Steps (Recommended)

1. **Import comprehensive utility service territory data**:
   - Use official utility service territory shapefiles or datasets
   - PG&E, SCE coverage files from California PUC

2. **Add validation layer**:
   - Cross-reference ZIP codes with known utility territories
   - Flag suspicious mappings (e.g., San Diego utility serving Sacramento)

3. **Implement data quality checks**:
   - Prevent future contamination from climate zone or other reference files
   - Validate that utility service areas match their actual territories

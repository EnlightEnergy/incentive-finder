import { db } from "../server/db";
import { programs, programGeos, eligibilityRules, benefitStructures, documentation } from "../shared/schema";

const samplePrograms = [
  {
    source: "utility",
    sourceProcessId: "sce-gogreen-2025",
    name: "SCE GoGreen Business Energy Financing",
    owner: "Southern California Edison",
    url: "https://www.sce.com/business/smart-energy-solar/energy-efficiency-programs",
    description: "State-administered financing program offering loans up to $5,000,000 for qualifying small businesses. Zero-interest On-Bill Financing available for eligible energy efficiency upgrades. Can be combined with other SCE rebates and incentives for maximum savings. No building ownership requirement and repayment through monthly utility bill installments.",
    incentiveDescription: "• Zero-interest On-Bill Financing with no fees\n• GoGreen loans up to $5,000,000 for qualifying businesses\n• Strategic Energy Management: Up to 6 years of free technical assistance\n• Demand Response Programs: Bill credits for peak-time reduction\n• Smart Thermostat Program: $75 bill credit for enrollment\n• Custom projects: $0.12/kWh saved (Tier 1 up to $100,000), $0.08/kWh saved (Tier 2)\n• Example savings: Marriott Hotels earned $495,000 in incentives; manufacturing companies saved $51,500+",
    sectorTags: ["Commercial", "Industrial", "Small Business"],
    techTags: ["Lighting", "HVAC", "Motors", "VFDs", "Refrigeration", "Building Envelope"],
    incentiveType: "Financing + Rebates",
    status: "open",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  },
  {
    source: "utility",
    sourceProcessId: "pge-business-2025",
    name: "PG&E Business Energy Efficiency Rebates & Financing",
    owner: "Pacific Gas & Electric",
    url: "https://www.pge.com/en/save-energy-and-money/rebates-and-incentives/business-energy-efficiency-rebates.html",
    description: "Comprehensive business energy efficiency program offering prescriptive rebates, custom solutions, and 0% interest financing. Features industry-specific programs for food service, healthcare, schools, and manufacturing. Includes instant rebates for commercial kitchen equipment and up to $5M in GoGreen financing for qualifying small businesses.",
    incentiveDescription: "• 0% Interest On-Bill Financing up to 10 years\n• GoGreen Business Energy Financing: Up to $5,000,000 loans\n• Prescriptive Equipment Rebates: HVAC, lighting, refrigeration, motors\n• California Foodservice Instant Rebates: Point-of-sale discounts on commercial kitchen equipment\n• Healthcare Energy Fitness Initiative: Free energy assessments and specialized rebates\n• Industrial System Optimization: No-cost energy evaluations\n• Processing time: 6-8 weeks typical\n• Can combine financing with rebates for maximum benefit",
    sectorTags: ["Commercial", "Small Business", "Industrial"],
    techTags: ["Lighting", "HVAC", "Heat Pump Water Heaters", "Refrigeration", "Motors", "Food Service Equipment"],
    incentiveType: "Prescriptive + Financing",
    status: "open",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  },
  {
    source: "state",
    sourceProcessId: "ca-sgip-2025",
    name: "California Self-Generation Incentive Program (SGIP)",
    owner: "California Public Utilities Commission",
    url: "https://www.selfgenca.com/",
    description: "California's premier energy storage incentive program providing rebates for battery storage systems. Features tier-based incentive structure with enhanced rates for equity and resiliency categories. Requires enrollment in utility demand response programs and achievement of minimum 52 full discharge cycles annually.",
    incentiveDescription: "• General Market Storage: $0.35-$0.40/kWh (declining steps, covers 15-25% of costs)\n• Equity Budget: $850/kWh (~85% cost coverage for low-income customers)\n• Equity Resiliency: $1,000/kWh (~100% cost coverage for low-income + high fire-risk areas)\n• Resiliency Adder: Additional $0.15/kWh for critical facilities in fire zones\n• New 2025: Residential Solar + Storage Equity Program with $280M budget\n• Advance payments: 50% upfront to reduce out-of-pocket costs\n• Must enroll in demand response programs\n• Available through PG&E, SCE, SDG&E service territories",
    sectorTags: ["Commercial", "Industrial", "Residential"],
    techTags: ["Energy Storage", "Solar", "Fuel Cells"],
    incentiveType: "Rebate",
    status: "open",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  },
  {
    source: "federal",
    sourceProcessId: "ira-itc-2025",
    name: "Federal Investment Tax Credit (ITC) & Clean Electricity Credits",
    owner: "Internal Revenue Service",
    url: "https://www.irs.gov/credits-and-deductions-under-the-inflation-reduction-act-of-2022",
    description: "Federal tax credit for clean energy installations including solar, wind, geothermal, energy storage, and fuel cells. 2025 is the final year for the current 30% rate structure. Starting January 1, 2025, new projects transition to the Clean Electricity Investment Tax Credit (CEITC) with tech-neutral approach requiring zero greenhouse gas emissions.",
    incentiveDescription: "• 30% Federal Tax Credit for projects starting construction before January 1, 2025\n• Projects >1MW: Base 6% rate, increased to 30% with prevailing wage & apprenticeship requirements\n• Clean Electricity Investment Tax Credit (CEITC): 30% for qualifying zero-emission projects starting 2025\n• Domestic Content Bonus: Additional 10% credit for US-made components (40% manufactured components, 100% steel/iron)\n• Energy Communities Bonus: Additional credits for qualifying areas\n• Tax-exempt entities eligible for direct payment option\n• Credit transferability allowed to unrelated parties\n• Can be combined with SGIP and utility rebates for maximum savings",
    sectorTags: ["Commercial", "Industrial"],
    techTags: ["Solar", "Energy Storage", "Wind", "Geothermal", "Fuel Cells"],
    incentiveType: "Tax Credit",
    status: "open",
    startDate: "2022-08-16",
    endDate: "2033-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  },
  {
    source: "utility",
    sourceProcessId: "ladwp-boss-2025",
    name: "LADWP Business Offerings for Sustainable Solutions (BOSS)",
    owner: "Los Angeles Department of Water & Power",
    url: "https://www.ladwp.com/commercial-services/programs-and-rebates-commercial/business-offerings-sustainable-solutions-boss",
    description: "LADWP's flagship commercial energy efficiency program offering incentives for energy savings through implementation of efficiency and electrification measures. Projects may receive incentives up to 100% of project cost. All projects require pre-installation verification and pre-approval on first-come, first-served basis.",
    incentiveDescription: "• Incentive rates: $0.08-$0.40 per kWh of annualized savings\n• Projects may receive up to 100% of project cost coverage\n• Commercial Lighting (CLIP): $0.08-$0.40/kWh, minimum 25% energy savings required\n• Commercial Direct Install (CDI): For businesses ≤250 kW average monthly demand\n• Commercial EV Charger Rebates: Up to $5,000 (Level 2), up to $125,000 (DC fast chargers)\n• Feed-in Tariff Plus (FiT+): 20-year solar + storage contracts, July 2025 application period\n• All equipment must meet/exceed California Energy Code efficiency requirements\n• Pre-approval required before installation\n• Available to LADWP non-residential customers in good standing",
    sectorTags: ["Commercial", "Industrial"],
    techTags: ["Lighting", "HVAC", "Building Envelope", "Process Equipment", "Energy Storage", "Electrification"],
    incentiveType: "Performance-Based",
    status: "open",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  },
  {
    source: "utility",
    sourceProcessId: "sdge-business-2025",
    name: "SDG&E Business Energy Efficiency Programs",
    owner: "San Diego Gas & Electric",
    url: "https://www.sdge.com/business/savings-center/rebates-incentives",
    description: "Comprehensive business energy efficiency programs featuring prescriptive rebates, custom solutions, and financing options. Includes specialized programs for different business sectors and demand response opportunities. Part of California's coordinated statewide energy efficiency initiative.",
    incentiveDescription: "• Prescriptive rebates for HVAC, lighting, refrigeration, and motors\n• Custom efficiency programs for unique applications\n• On-Bill Financing with 0% interest for qualified projects\n• Business Energy Checkup: Free energy assessments\n• Peak Time Rebates: Credits for reducing energy use during peak hours\n• SGIP participation for energy storage projects\n• Trade Professional Alliance: Streamlined processing for approved contractors\n• Agricultural programs for farming operations\n• Processing typically 6-8 weeks after project completion\n• Can be combined with federal tax credits and SGIP rebates",
    sectorTags: ["Commercial", "Industrial", "Agricultural"],
    techTags: ["HVAC", "Heat Pumps", "Lighting", "Refrigeration", "Motors", "Energy Storage"],
    incentiveType: "Prescriptive + Custom",
    status: "open",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    urlStatus: "valid",
    dataVerifiedAt: new Date("2025-09-25")
  }
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await db.delete(programs);
    console.log("✅ Cleared existing programs");

    // Insert sample programs
    const insertedPrograms = await db.insert(programs).values(samplePrograms).returning();
    console.log(`✅ Inserted ${insertedPrograms.length} programs`);

    // Add geographic coverage for each program
    const geoData = [];
    for (const program of insertedPrograms) {
      if (program.owner.includes("Southern California Edison")) {
        geoData.push({
          programId: program.id,
          state: "CA",
          utilityServiceArea: "Southern California Edison Territory"
        });
      } else if (program.owner.includes("Pacific Gas")) {
        geoData.push({
          programId: program.id,
          state: "CA",
          utilityServiceArea: "Pacific Gas & Electric Territory"
        });
      } else if (program.owner.includes("Los Angeles")) {
        geoData.push({
          programId: program.id,
          state: "CA",
          county: "Los Angeles",
          utilityServiceArea: "LADWP Territory"
        });
      } else if (program.owner.includes("San Diego")) {
        geoData.push({
          programId: program.id,
          state: "CA",
          county: "San Diego",
          utilityServiceArea: "SDG&E Territory"
        });
      } else {
        geoData.push({
          programId: program.id,
          state: "CA"
        });
      }
    }

    if (geoData.length > 0) {
      await db.insert(programGeos).values(geoData);
      console.log(`✅ Added geographic coverage for ${geoData.length} programs`);
    }

    // Add eligibility rules
    const eligibilityData = [];
    for (const program of insertedPrograms) {
      eligibilityData.push({
        programId: program.id,
        buildingTypes: ["Office", "Retail", "Warehouse", "Manufacturing"],
        naicsIncludes: [],
        minProjectCost: program.incentiveType === "Custom" ? 50000 : 1000,
        preApprovalRequired: program.incentiveType === "Custom",
        tradeAllyRequired: false,
        prevailingWageRequired: false
      });
    }

    await db.insert(eligibilityRules).values(eligibilityData);
    console.log(`✅ Added eligibility rules for ${eligibilityData.length} programs`);

    // Add benefit structures
    const benefitData = [];
    for (const program of insertedPrograms) {
      if (program.incentiveType === "Financing + Rebates") {
        benefitData.push({
          programId: program.id,
          unit: "mixed",
          tierJson: {
            "financing": { "rate": 0, "max": 5000000 },
            "custom_rebates": { "amount": 0.12, "max": 100000 },
            "smart_thermostat": { "amount": 75, "max": 75 }
          },
          examplesText: "0% interest financing up to $5M, Custom rebates $0.12/kWh saved, Smart thermostat $75 credit"
        });
      } else if (program.incentiveType === "Prescriptive + Financing") {
        benefitData.push({
          programId: program.id,
          unit: "mixed",
          tierJson: {
            "financing": { "rate": 0, "max": 5000000 },
            "rebates": { "varies": true }
          },
          examplesText: "0% interest On-Bill Financing up to 10 years + equipment-specific rebates, GoGreen loans up to $5M"
        });
      } else if (program.incentiveType === "Rebate") {
        benefitData.push({
          programId: program.id,
          unit: "$/kWh_capacity",
          tierJson: {
            "general_market": { "amount": 0.35, "max": null },
            "equity": { "amount": 850, "max": null },
            "equity_resiliency": { "amount": 1000, "max": null }
          },
          examplesText: "General: $0.35-$0.40/kWh, Equity: $850/kWh (~85% coverage), Equity Resiliency: $1,000/kWh (~100% coverage)"
        });
      } else if (program.incentiveType === "Tax Credit") {
        benefitData.push({
          programId: program.id,
          unit: "%_of_cost",
          tierJson: {
            "base_credit": { "amount": 30, "max": null },
            "domestic_bonus": { "amount": 10, "max": null },
            "ceitc_2025": { "amount": 30, "max": null }
          },
          examplesText: "30% federal tax credit (last year at this rate), +10% domestic content bonus, transferable credits available"
        });
      } else if (program.incentiveType === "Performance-Based") {
        benefitData.push({
          programId: program.id,
          unit: "$/kWh_saved",
          tierJson: {
            "tier_low": { "amount": 0.08, "max": null },
            "tier_high": { "amount": 0.40, "max": null },
            "ev_charger_l2": { "amount": 5000, "max": 5000 },
            "ev_charger_dc": { "amount": 125000, "max": 125000 }
          },
          examplesText: "$0.08-$0.40/kWh saved, up to 100% project cost coverage, EV chargers up to $125,000"
        });
      } else if (program.incentiveType === "Prescriptive + Custom") {
        benefitData.push({
          programId: program.id,
          unit: "mixed",
          tierJson: {
            "prescriptive": { "varies": true },
            "custom": { "varies": true },
            "financing": { "rate": 0, "max": null }
          },
          examplesText: "Equipment-specific prescriptive rebates + custom efficiency solutions + 0% financing options"
        });
      }
    }

    if (benefitData.length > 0) {
      await db.insert(benefitStructures).values(benefitData);
      console.log(`✅ Added benefit structures for ${benefitData.length} programs`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log(`📊 Total programs: ${insertedPrograms.length}`);
    console.log("🔍 You can now test the search functionality");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };
import { db } from "../server/db";
import { programs, programGeos, eligibilityRules, benefitStructures, documentation } from "../shared/schema";

const samplePrograms = [
  {
    source: "utility",
    sourceProcessId: "sce-custom-001",
    name: "SCE Custom Efficiency Program",
    owner: "Southern California Edison",
    url: "https://www.sce.com/business/savings-incentives/business-energy-efficiency-rebates/custom-efficiency",
    sectorTags: ["Commercial", "Industrial"],
    techTags: ["Lighting", "HVAC", "Motors", "VFDs"],
    incentiveType: "Custom",
    status: "open",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  },
  {
    source: "utility",
    sourceProcessId: "pge-prescriptive-001",
    name: "PG&E Business Energy Efficiency Rebates",
    owner: "Pacific Gas & Electric",
    url: "https://www.pge.com/en_US/small-medium-business/save-energy-money/business-rebates/business-rebates.page",
    sectorTags: ["Commercial", "Small Business"],
    techTags: ["Lighting", "HVAC", "Heat Pump Water Heaters"],
    incentiveType: "Prescriptive",
    status: "open",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  },
  {
    source: "state",
    sourceProcessId: "ca-sgip-001",
    name: "California Self-Generation Incentive Program (SGIP)",
    owner: "California Public Utilities Commission",
    url: "https://www.selfgenca.com/",
    sectorTags: ["Commercial", "Industrial", "Residential"],
    techTags: ["Energy Storage", "Solar", "Fuel Cells"],
    incentiveType: "Grant",
    status: "open",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31")
  },
  {
    source: "federal",
    sourceProcessId: "ira-itc-001",
    name: "Investment Tax Credit (ITC) - Commercial Solar",
    owner: "Internal Revenue Service",
    url: "https://www.irs.gov/businesses/investment-tax-credit",
    sectorTags: ["Commercial", "Industrial"],
    techTags: ["Solar", "Energy Storage"],
    incentiveType: "Tax Credit",
    status: "open",
    startDate: new Date("2022-08-16"),
    endDate: new Date("2032-12-31")
  },
  {
    source: "utility",
    sourceProcessId: "ladwp-lighting-001",
    name: "LADWP Commercial Lighting Rebate Program",
    owner: "Los Angeles Department of Water & Power",
    url: "https://www.ladwp.com/rebates",
    sectorTags: ["Commercial"],
    techTags: ["Lighting"],
    incentiveType: "Prescriptive",
    status: "open",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  },
  {
    source: "utility",
    sourceProcessId: "sdge-hvac-001",
    name: "SDG&E HVAC Business Rebate Program",
    owner: "San Diego Gas & Electric",
    url: "https://www.sdge.com/business/savings-center/rebates-incentives",
    sectorTags: ["Commercial", "Industrial"],
    techTags: ["HVAC", "Heat Pumps"],
    incentiveType: "Prescriptive",
    status: "open",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
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
      if (program.incentiveType === "Prescriptive") {
        benefitData.push({
          programId: program.id,
          unit: "$/fixture",
          tierJson: {
            "LED_T8_Replacement": { "amount": 25, "max": 5000 },
            "LED_High_Bay": { "amount": 75, "max": 15000 }
          },
          examplesText: "LED T8 replacement: $25/fixture, LED High Bay: $75/fixture"
        });
      } else if (program.incentiveType === "Custom") {
        benefitData.push({
          programId: program.id,
          unit: "$/kWh_saved",
          tierJson: {
            "tier1": { "amount": 0.12, "max": 100000 },
            "tier2": { "amount": 0.08, "max": 500000 }
          },
          examplesText: "Tier 1: $0.12/kWh saved (up to 833,333 kWh), Tier 2: $0.08/kWh saved"
        });
      } else if (program.incentiveType === "Tax Credit") {
        benefitData.push({
          programId: program.id,
          unit: "%_of_cost",
          tierJson: {
            "credit": { "amount": 30, "max": null }
          },
          examplesText: "30% of qualified project costs"
        });
      } else if (program.incentiveType === "Grant") {
        benefitData.push({
          programId: program.id,
          unit: "$/kWh_capacity",
          tierJson: {
            "storage": { "amount": 200, "max": 50000 }
          },
          examplesText: "$200/kWh of energy storage capacity"
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
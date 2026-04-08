/**
 * ai-conversation.ts
 *
 * Claude-powered conversation handler for Incentive Finder 2.0.
 * Conducts a focused, natural-language intake conversation to collect
 * a complete FacilityProfile, then calls matchPrograms() to return results.
 */

import Anthropic from "@anthropic-ai/sdk";
import { matchPrograms, type FacilityProfile } from "./matcher";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  phase: "conversation" | "email_gate" | "complete";
  programCount?: number;
  programCountTeaser?: string;
  matchResult?: any;
}

const SYSTEM_PROMPT = `You are a California commercial energy incentive specialist working for Enlighting Energy — a Santa Barbara-based firm that helps commercial facilities maximize their utility rebates, state grants, and federal tax credits.

Your job in this conversation is to collect a complete facility profile so you can match the user to every incentive program they qualify for. You are NOT a general energy advisor — you stay focused on collecting the data you need.

TONE: Warm, confident, and efficient. Like a knowledgeable colleague who has done this hundreds of times — not a government intake form. Use plain English. One question at a time, always.

DATA YOU NEED TO COLLECT (in rough order of priority):
1. Location: ZIP code (required — determines utility territory)
2. Utility: auto-infer from ZIP if possible (SCE = SoCal, PG&E = NorCal, SDG&E = San Diego, LADWP = LA proper, SMUD = Sacramento)
3. Facility type: warehouse, office, retail, hotel, cold storage, manufacturing, school, agricultural, multifamily, government
4. Number of units — ONLY if multifamily (ask immediately after confirming facility type is multifamily; required for multifamily programs)
5. Measures (upgrades being considered): lighting, HVAC, refrigeration, solar/PV, battery storage, EV charging, VFDs/motors, building envelope, compressed air, boilers/steam, water heaters (both heat pump water heaters AND tankless gas-to-gas are eligible under SoCalREN and similar programs), process equipment
6. Square footage (ask before the facility name question — useful for program sizing)
7. Company / facility name (ask last, e.g. "And lastly, what's the name of the property or business?")

INTELLIGENCE RULES:
- If the user says "warehouse in Fresno," infer ZIP area (93700s) and utility (PG&E). Confirm: "That sounds like PG&E territory — is that right?"
- If the user mentions "food processing" or "cold storage," immediately note refrigeration programs will be relevant.
- If the user mentions "water heaters," ask whether they're considering heat pump water heaters (HPWH) or tankless gas-to-gas replacements — both qualify for programs (notably SoCalREN covers tankless gas-to-gas). Include both as measures if applicable.
- If they mention "leased space" or "don't pay utilities," note this limits available programs and adjust.
- Vague answers are OK. "Old HVAC" -> ask "Roughly pre-2010 or newer?" not "What is the exact model year?"
- "We might do lighting" counts as a measure.
- If they're on LADWP, note that LADWP programs run on different schedules than IOU programs.

QUESTION STRATEGY:
- Extract everything you can from the user's first message before asking any follow-up.
- Ask only what you still need, one thing at a time.
- After collecting location + utility + facility type + at least one measure, call the submit_facility_profile tool.
- Square footage is nice-to-have but does not block submission. Facility name MUST be collected before calling submit_facility_profile — always ask "And lastly, what's the name of the property or business?" before submitting.
- Never show all questions at once. Never use numbered lists of questions.

WHAT NOT TO DO:
- Don't speculate about specific programs or incentive amounts before calling submit_facility_profile.
- Don't ask for contact information — the email is collected separately.
- Don't explain the process at length — just ask the next question.
- Don't apologize or over-explain.

When you have enough data (location, utility, facility type, at least one measure), call the submit_facility_profile tool immediately.`;

const SUBMIT_PROFILE_TOOL: Anthropic.Tool = {
  name: "submit_facility_profile",
  description: "Call this tool when you have collected enough information to run the incentive matching engine. Required: zip, utility, facilityType, and at least one measure.",
  input_schema: {
    type: "object",
    properties: {
      zip: { type: "string", description: "5-digit ZIP code of the facility" },
      utility: { type: "string", description: "Utility provider: SCE, PG&E, SDG&E, LADWP, SMUD, MCE, etc." },
      facilityType: { type: "string", description: "Type of facility: Warehouse/Distribution, Office, Retail, Cold Storage, Industrial/Manufacturing, Hotel/Hospitality, Multifamily, School/Education, Government/Municipal, Agricultural" },
      measures: { type: "array", items: { type: "string" }, description: "List of energy upgrade measures being considered: LED Lighting, HVAC, Refrigeration, Solar/PV, Battery Storage, EV Charging, VFD/Motors, Building Envelope, Compressed Air, Boilers/Steam, Process Equipment" },
      sqFt: { type: "number", description: "Square footage of the facility (optional)" },
      facilityName: { type: "string", description: "Name of the facility or property (optional)" },
      units: { type: "number", description: "Number of units — for multifamily properties only (optional)" },
    },
    required: ["zip", "utility", "facilityType", "measures"],
  },
};

export async function processConversation(messages: ConversationMessage[]): Promise<ChatResponse> {
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [SUBMIT_PROFILE_TOOL],
    messages: anthropicMessages,
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");

  if (toolUse && toolUse.type === "tool_use" && toolUse.name === "submit_facility_profile") {
    const profile = toolUse.input as FacilityProfile;
    let matchResult;
    try {
      matchResult = await matchPrograms(profile);
    } catch (err) {
      console.error("matchPrograms failed:", err);
      return {
        message: "I've collected your facility details but ran into a technical issue matching programs. Please try again in a moment.",
        phase: "conversation",
      };
    }

    const count = matchResult.programCount;
    const measures = matchResult.measures;
    const teaser = measures.length > 1
      ? `across ${measures.join(", ")}`
      : measures[0] ? `for ${measures[0]}` : "for your facility";

    return {
      message: `I found ${count} program${count !== 1 ? "s" : ""} ${teaser}.`,
      phase: "email_gate",
      programCount: count,
      programCountTeaser: `${count} qualifying program${count !== 1 ? "s" : ""} ${teaser}`,
      matchResult,
    };
  }

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text"
    ? textBlock.text
    : "I didn't quite catch that. Could you tell me more about your facility?";

  return { message: text, phase: "conversation" };
}

export async function submitLead(messages: ConversationMessage[], email: string): Promise<{ matchResult: any }> {
  const anthropicMessages: Anthropic.MessageParam[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT + "\n\nThe conversation is complete. Call submit_facility_profile with all the information you have gathered.",
    tools: [SUBMIT_PROFILE_TOOL],
    tool_choice: { type: "any" },
    messages: anthropicMessages,
  });

  const toolUse = response.content.find((b) => b.type === "tool_use" && b.name === "submit_facility_profile");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Could not extract facility profile from conversation");
  }

  const profile = toolUse.input as FacilityProfile;
  profile.contactEmail = email;
  const matchResult = await matchPrograms(profile);
  return { matchResult };
}

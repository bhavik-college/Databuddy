import { models } from "../config";
import { buildTriageInstructions } from "../prompts";
import { analyticsAgent } from "./analytics";
import { createAgent } from "./factory";

/**
 * Triage agent that routes user requests to the appropriate specialist.
 * This is the main entry point for all agent interactions.
 */
export const triageAgent = createAgent({
	name: "triage",
	model: models.triage,
	temperature: 0.1,
	modelSettings: {
		toolChoice: {
			type: "tool",
			toolName: "handoff_to_agent",
		},
	},
	instructions: buildTriageInstructions,
	handoffs: [analyticsAgent],
	maxTurns: 1,
});

/**
 * @deprecated Use `triageAgent` instead. Kept for backwards compatibility.
 */
export const mainAgent = triageAgent;

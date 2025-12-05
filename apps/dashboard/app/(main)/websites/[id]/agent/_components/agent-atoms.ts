import { atom } from "jotai";

// Types for UI state (not message state - that comes from SDK)
export type AgentStatus =
	| "idle"
	| "routing"
	| "thinking"
	| "analyzing"
	| "searching"
	| "generating"
	| "visualizing"
	| "complete"
	| "error";
export type ArtifactType = "chart" | "table" | "report" | "insight";
export type ArtifactStage =
	| "preparing"
	| "analyzing"
	| "generating"
	| "rendering"
	| "complete";

export interface AgentArtifact {
	id: string;
	type: ArtifactType;
	title: string;
	data: unknown;
}

export interface AgentCommand {
	id: string;
	command: string;
	title: string;
	description: string;
	toolName: string;
	toolParams?: Record<string, unknown>;
	keywords: string[];
}

// UI state atoms (not message state)
export const agentTitleAtom = atom<string | null>(null);
export const agentInputAtom = atom("");
export const agentSuggestionsAtom = atom<string[]>([]);

// Canvas/artifact atoms
export const agentCanvasOpenAtom = atom(false);
export const currentArtifactAtom = atom<AgentArtifact | null>(null);

// Command menu atoms
export const showCommandsAtom = atom(false);
export const commandQueryAtom = atom("");
export const selectedCommandIndexAtom = atom(0);

// Reset action for UI state
export const resetAgentUIAtom = atom(null, (_get, set) => {
	set(agentTitleAtom, null);
	set(agentInputAtom, "");
	set(agentCanvasOpenAtom, false);
	set(currentArtifactAtom, null);
	set(agentSuggestionsAtom, []);
	set(showCommandsAtom, false);
	set(commandQueryAtom, "");
	set(selectedCommandIndexAtom, 0);
});

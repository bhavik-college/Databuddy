export function generateSessionName(sessionId: string): string {
	if (!sessionId) return "Unknown Session";

	const shortId = sessionId.substring(0, 6);

	const adjectives = [
		"Mystic",
		"Cosmic",
		"Quantum",
		"Astral",
		"Cyber",
		"Neon",
		"Stellar",
		"Prism",
		"Void",
		"Nova",
		"Lunar",
		"Solar",
		"Nebula",
		"Plasma",
		"Crystal",
	];

	const creatures = [
		"Dragon",
		"Phoenix",
		"Leviathan",
		"Griffin",
		"Hydra",
		"Kraken",
		"Chimera",
		"Basilisk",
		"Manticore",
		"Sphinx",
		"Pegasus",
		"Unicorn",
		"Wyrm",
		"Behemoth",
		"Titan",
	];

	const hashValue = sessionId.split("").reduce((hash, char) => {
		return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
	}, 0);

	const adjective = adjectives[Math.abs(hashValue) % adjectives.length];
	const creature = creatures[Math.abs(hashValue >> 8) % creatures.length];

	return `${adjective}${creature}-${shortId}`;
}

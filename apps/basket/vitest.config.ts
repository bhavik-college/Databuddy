import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			reportsDirectory: "./coverage",
			all: true,
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts", "src/types.ts", "**/*.test.ts"],
		},
	},
});

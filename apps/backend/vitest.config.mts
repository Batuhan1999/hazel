import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		environment: "edge-runtime",
		server: { deps: { inline: ["convex-test", "@convex-dev/r2"] } },
		coverage: {
			reporter: ["text", "json-summary", "json"],
			reportOnFailure: true,
		},
	},
})

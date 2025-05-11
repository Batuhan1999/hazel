import { defineConfig } from "drizzle-kit"

export default defineConfig({
	out: "./drizzle",
	schema: "./src/drizzle/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: "postgresql://postgres:mkwqhcfdnqdelwn1@142.132.228.194:6992/zero",
	},
})

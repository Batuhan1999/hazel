import { schema } from "@maki-chat/drizzle"
import { drizzle } from "drizzle-orm/postgres-js"

export const getDb = (databaseUrl: string) => {
	return drizzle(databaseUrl, {
		schema: schema,
	})
}

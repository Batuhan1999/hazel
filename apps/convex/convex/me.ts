import { query } from "./_generated/server"
import { accountQuery } from "./middleware/withAccount"

export const get = accountQuery({
	args: {},
	handler: async (ctx) => {
		return ctx.account.doc
	},
})

import type { CustomMutatorDefs } from "@rocicorp/zero"
import type { schema } from "./schema"

export function createMutators() {
	return {} as const satisfies CustomMutatorDefs<typeof schema>
}

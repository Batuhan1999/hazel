import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform"
import { Context as C, Schema as S } from "effect"
import { UnauthorizedError } from "./errors"
import { UserId } from "./schema"

export class Schema extends S.Class<Schema>("CurrentUserSchema")({
	id: UserId,
	role: S.Literal("admin", "member"),
}) {}

export class Context extends C.Tag("CurrentUser")<Context, Schema>() {}

export class Authorization extends HttpApiMiddleware.Tag<Authorization>()("Authorization", {
	failure: UnauthorizedError,
	provides: Context,
	security: {
		bearer: HttpApiSecurity.bearer,
	},
}) {}

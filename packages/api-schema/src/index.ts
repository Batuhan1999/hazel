import { HttpApi } from "@effect/platform"
import { RootApiGroup } from "./api/root.api"
import { ZeroApiGroup } from "./api/zero.api"

export const MakiApi = HttpApi.make("MakiApi").add(RootApiGroup).add(ZeroApiGroup.prefix("/zero"))

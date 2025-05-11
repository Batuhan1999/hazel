import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"

import { MakiApi } from "@maki-chat/api-schema"
import { MainApiLive } from "./api/main.api"
import { ZeroApiLive } from "./api/zero.api"

export const HttpLive = HttpApiBuilder.api(MakiApi).pipe(Layer.provide(MainApiLive), Layer.provide(ZeroApiLive))

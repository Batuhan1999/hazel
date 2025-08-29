import { HttpApiBuilder } from "@effect/platform"
import { Layer } from "effect"
import { HazelApp } from "./api"
import { HttpMessageLive } from "./routes/messages.http"
import { HttpRootLive } from "./routes/root.http"

export const HttpApiRoutes = Layer.provide(HttpApiBuilder.api(HazelApp), [HttpMessageLive, HttpRootLive])

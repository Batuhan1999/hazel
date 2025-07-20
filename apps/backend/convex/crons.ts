import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval("cleanupOldTypingIndicators", { hours: 1 }, internal.typingIndicator.cleanupOld)

crons.interval("syncWorkosData", { minutes: 5 }, internal.workos.syncWorkosData)

export default crons

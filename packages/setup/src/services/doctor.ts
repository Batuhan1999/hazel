import { Effect } from "effect"

export interface CheckResult {
	name: string
	status: "ok" | "warn" | "fail"
	message: string
}

export class Doctor extends Effect.Service<Doctor>()("Doctor", {
	accessors: true,
	effect: Effect.succeed({
		checkBun: (): Effect.Effect<CheckResult> =>
			Effect.tryPromise({
				try: async () => {
					const proc = Bun.spawn(["bun", "--version"])
					const text = await new Response(proc.stdout).text()
					await proc.exited
					return { name: "Bun", status: "ok" as const, message: `v${text.trim()}` }
				},
				catch: () => new Error("Bun not found"),
			}).pipe(
				Effect.catchAll(() =>
					Effect.succeed({
						name: "Bun",
						status: "fail" as const,
						message: "Not found. Install from https://bun.sh",
					})
				)
			),

		checkDocker: (): Effect.Effect<CheckResult> =>
			Effect.tryPromise({
				try: async () => {
					const proc = Bun.spawn(["docker", "info"], { stdout: "ignore", stderr: "ignore" })
					const code = await proc.exited
					if (code !== 0) throw new Error("Docker not running")
					return { name: "Docker", status: "ok" as const, message: "Running" }
				},
				catch: () => new Error("Docker not running"),
			}).pipe(
				Effect.catchAll(() =>
					Effect.succeed({
						name: "Docker",
						status: "fail" as const,
						message: "Not running. Start Docker Desktop or run `docker` daemon",
					})
				)
			),

		checkDockerCompose: (): Effect.Effect<CheckResult> =>
			Effect.tryPromise({
				try: async () => {
					const proc = Bun.spawn(["docker", "compose", "ps", "--format", "json"])
					const text = await new Response(proc.stdout).text()
					await proc.exited
					const containers = text.trim().split("\n").filter(Boolean)
					if (containers.length === 0) {
						return {
							name: "Docker Compose",
							status: "warn" as const,
							message: "No containers running. Run `docker compose up -d`",
						}
					}
					return {
						name: "Docker Compose",
						status: "ok" as const,
						message: `${containers.length} container(s) running`,
					}
				},
				catch: () => new Error("Could not check containers"),
			}).pipe(
				Effect.catchAll(() =>
					Effect.succeed({
						name: "Docker Compose",
						status: "warn" as const,
						message: "Could not check containers",
					})
				)
			),

		checkDatabase: (): Effect.Effect<CheckResult> =>
			Effect.tryPromise({
				try: async () => {
					// Check database via docker exec (doesn't require psql locally)
					const proc = Bun.spawn(
						[
							"docker",
							"exec",
							"app-postgres-1",
							"psql",
							"-U",
							"user",
							"-d",
							"app",
							"-c",
							"SELECT 1",
						],
						{ stdout: "ignore", stderr: "ignore" }
					)
					const code = await proc.exited
					if (code !== 0) throw new Error("Database not reachable")
					return { name: "Database", status: "ok" as const, message: "Connected" }
				},
				catch: () => new Error("Database not reachable"),
			}).pipe(
				Effect.catchAll(() =>
					Effect.succeed({
						name: "Database",
						status: "fail" as const,
						message: "Not reachable. Run `docker compose up -d`",
					})
				)
			),

		runAllChecks: (): Effect.Effect<CheckResult[], never, Doctor> =>
			Effect.gen(function* () {
				const doctor = yield* Doctor
				const results = yield* Effect.all([
					doctor.checkBun(),
					doctor.checkDocker(),
					doctor.checkDockerCompose(),
					doctor.checkDatabase(),
				])
				return results
			}),
	}),
}) {}

import { useMemo, useState } from "react"
import { clearRequests, useRpcRequests, useRpcStats } from "../store"
import { RequestDetail } from "./RequestDetail"
import { RequestList } from "./RequestList"

export function RpcDevtoolsPanel() {
	const requests = useRpcRequests()
	const stats = useRpcStats()
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [filter, setFilter] = useState("")

	const filteredRequests = useMemo(() => {
		if (!filter) return requests
		const lowerFilter = filter.toLowerCase()
		return requests.filter((req) => req.method.toLowerCase().includes(lowerFilter))
	}, [requests, filter])

	const selectedRequest = useMemo(() => {
		if (!selectedId) return null
		return requests.find((r) => r.captureId === selectedId) ?? null
	}, [requests, selectedId])

	return (
		<div className="flex h-full flex-col bg-gray-900 font-sans text-white">
			{/* Header */}
			<div className="flex items-center justify-between border-gray-700 border-b bg-gray-800 px-3 py-2">
				<div className="flex items-center gap-4">
					<h2 className="font-semibold text-sm">Effect RPC</h2>
					<div className="flex items-center gap-3 text-gray-400 text-xs">
						<span>
							<span className="text-gray-200">{stats.total}</span> total
						</span>
						{stats.pending > 0 && (
							<span>
								<span className="text-yellow-400">{stats.pending}</span> pending
							</span>
						)}
						<span>
							<span className="text-green-400">{stats.success}</span> success
						</span>
						{stats.error > 0 && (
							<span>
								<span className="text-red-400">{stats.error}</span> errors
							</span>
						)}
						{stats.avgDuration > 0 && (
							<span>
								<span className="text-gray-200">{stats.avgDuration}ms</span> avg
							</span>
						)}
					</div>
				</div>
				<button
					type="button"
					onClick={clearRequests}
					className="rounded bg-red-600 px-2 py-1 font-medium text-xs transition-colors hover:bg-red-700"
				>
					Clear
				</button>
			</div>

			{/* Filter */}
			<div className="border-gray-700 border-b px-3 py-2">
				<input
					type="text"
					placeholder="Filter by method name..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
				/>
			</div>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				<RequestList requests={filteredRequests} selectedId={selectedId} onSelect={setSelectedId} />
				{selectedRequest && <RequestDetail request={selectedRequest} />}
			</div>
		</div>
	)
}

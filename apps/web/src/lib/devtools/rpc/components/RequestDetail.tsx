import { useState } from "react"
import type { CapturedRequest } from "../types"

interface RequestDetailProps {
	request: CapturedRequest
}

type Tab = "request" | "response" | "headers" | "timing"

export function RequestDetail({ request }: RequestDetailProps) {
	const [activeTab, setActiveTab] = useState<Tab>("request")

	return (
		<div className="flex w-[400px] flex-col border-gray-700 border-l bg-gray-850">
			{/* Tabs */}
			<div className="flex border-gray-700 border-b">
				{(["request", "response", "headers", "timing"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${activeTab === tab ? "-mb-px border-blue-400 border-b-2 text-blue-400" : "text-gray-400 hover:text-gray-200"}`}
					>
						{tab}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-3">
				{activeTab === "request" && <RequestTab request={request} />}
				{activeTab === "response" && <ResponseTab request={request} />}
				{activeTab === "headers" && <HeadersTab request={request} />}
				{activeTab === "timing" && <TimingTab request={request} />}
			</div>
		</div>
	)
}

function RequestTab({ request }: { request: CapturedRequest }) {
	return (
		<div className="space-y-3">
			<div>
				<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Method</h4>
				<code className="text-blue-400">{request.method}</code>
			</div>
			<div>
				<div className="mb-1 flex items-center justify-between">
					<h4 className="font-medium text-gray-400 text-xs uppercase">Payload</h4>
					<CopyButton text={JSON.stringify(request.payload, null, 2)} />
				</div>
				<JsonViewer data={request.payload} />
			</div>
		</div>
	)
}

function ResponseTab({ request }: { request: CapturedRequest }) {
	if (!request.response) {
		return <div className="text-gray-500 text-sm">Response pending...</div>
	}

	const isError = request.response.status === "error"

	return (
		<div className="space-y-3">
			<div>
				<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Status</h4>
				<span className={isError ? "text-red-400" : "text-green-400"}>{request.response.status}</span>
			</div>
			<div>
				<div className="mb-1 flex items-center justify-between">
					<h4 className="font-medium text-gray-400 text-xs uppercase">
						{isError ? "Error" : "Data"}
					</h4>
					<CopyButton text={JSON.stringify(request.response.data, null, 2)} />
				</div>
				<JsonViewer data={request.response.data} isError={isError} />
			</div>
		</div>
	)
}

function HeadersTab({ request }: { request: CapturedRequest }) {
	if (request.headers.length === 0) {
		return <div className="text-gray-500 text-sm">No headers</div>
	}

	return (
		<div className="space-y-2">
			{request.headers.map(([key, value], index) => (
				<div key={index} className="text-sm">
					<span className="text-gray-400">{key}:</span>{" "}
					<span className="text-gray-200">{value}</span>
				</div>
			))}
		</div>
	)
}

function TimingTab({ request }: { request: CapturedRequest }) {
	const startTime = new Date(request.startTime)

	return (
		<div className="space-y-3">
			<div>
				<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Request ID</h4>
				<code className="text-gray-300 text-xs">{request.id}</code>
			</div>
			<div>
				<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Started At</h4>
				<div className="text-gray-200">{startTime.toLocaleTimeString()}</div>
			</div>
			{request.response && (
				<>
					<div>
						<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Duration</h4>
						<div className="text-gray-200">{request.response.duration}ms</div>
					</div>
					<div>
						<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Completed At</h4>
						<div className="text-gray-200">
							{new Date(request.response.timestamp).toLocaleTimeString()}
						</div>
					</div>
				</>
			)}
			{!request.response && (
				<div>
					<h4 className="mb-1 font-medium text-gray-400 text-xs uppercase">Status</h4>
					<div className="text-yellow-400">Pending...</div>
				</div>
			)}
		</div>
	)
}

function JsonViewer({ data, isError = false }: { data: unknown; isError?: boolean }) {
	const jsonString = JSON.stringify(data, null, 2)

	return (
		<pre
			className={`max-h-[300px] overflow-auto rounded bg-gray-900 p-2 text-xs ${isError ? "text-red-300" : "text-gray-300"}`}
		>
			{jsonString}
		</pre>
	)
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="text-gray-400 text-xs transition-colors hover:text-gray-200"
			title="Copy to clipboard"
		>
			{copied ? "Copied!" : "Copy"}
		</button>
	)
}

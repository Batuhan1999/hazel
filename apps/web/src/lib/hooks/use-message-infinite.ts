import { useInfiniteQuery } from "@tanstack/solid-query"

interface Message {
	id: string
	content: string
	timestamp: string
	userId: string
}

interface MessageCursorResult {
	data: Message[]
	pagination: {
		hasNext: boolean
		hasPrevious: boolean
		nextCursor?: string
		previousCursor?: string
	}
}

interface GetMessagesParams {
	cursor?: string
	limit?: number
}

const fetchMessages = async ({ cursor, limit = 20 }: GetMessagesParams): Promise<MessageCursorResult> => {
	const params = new URLSearchParams()
	if (cursor) params.append("cursor", cursor)
	params.append("limit", limit.toString())

	const response = await fetch(`http://localhost:8787/messages?${params}`)
	if (!response.ok) {
		throw new Error("Failed to fetch messages")
	}
	return response.json()
}

export const createInfiniteMessages = (limit = 20) => {
	return useInfiniteQuery(() => ({
		queryKey: ["messages", limit],
		queryFn: ({ pageParam }) => fetchMessages({ cursor: pageParam, limit }),
		getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined),
		getPreviousPageParam: (firstPage) =>
			firstPage.pagination.hasPrevious ? firstPage.pagination.previousCursor : undefined,
		initialPageParam: undefined as string | undefined,
	}))
}

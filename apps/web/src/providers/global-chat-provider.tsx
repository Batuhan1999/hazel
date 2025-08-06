import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import type { Doc, Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { FunctionReturnType } from "convex/server"
import { useNextPrevPaginatedQuery } from "convex-use-next-prev-paginated-query"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

type MessagesResponse = FunctionReturnType<typeof api.messages.getMessages>
type Message = MessagesResponse["page"][0]
type Channel = FunctionReturnType<typeof api.channels.getChannel>
type PinnedMessage = FunctionReturnType<typeof api.pinnedMessages.getPinnedMessages>[0]
type TypingUser = FunctionReturnType<typeof api.typingIndicator.list>[0]
type TypingUsers = TypingUser[]

interface ChatContextValue {
	channelId: Id<"channels"> | null
	channel: Channel | undefined
	messages: Message[]
	pinnedMessages: PinnedMessage[] | undefined
	loadNext: (() => void) | undefined
	loadPrev: (() => void) | undefined
	isLoadingMessages: boolean
	isLoadingNext: boolean
	isLoadingPrev: boolean
	sendMessage: (props: { content: string; attachments?: string[]; jsonContent: any }) => void
	editMessage: (messageId: Id<"messages">, content: string, jsonContent: any) => Promise<void>
	deleteMessage: (messageId: Id<"messages">) => void
	addReaction: (messageId: Id<"messages">, emoji: string) => void
	removeReaction: (messageId: Id<"messages">, emoji: string) => void
	pinMessage: (messageId: Id<"messages">) => void
	unpinMessage: (messageId: Id<"messages">) => void
	startTyping: () => void
	stopTyping: () => void
	typingUsers: TypingUsers
	createThread: (messageId: Id<"messages">) => void
	replyToMessageId: Id<"messages"> | null
	setReplyToMessageId: (messageId: Id<"messages"> | null) => void
	setChannelId: (channelId: Id<"channels"> | null) => void
	prefetchChannel: (channelId: Id<"channels">) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function useChat() {
	const context = useContext(ChatContext)
	if (!context) {
		throw new Error("useChat must be used within a GlobalChatProvider")
	}
	return context
}

interface GlobalChatProviderProps {
	children: ReactNode
}

// Cache for messages per channel
const messageCache = new Map<Id<"channels">, {
	messages: Message[]
	timestamp: number
	loadNext?: () => void
	loadPrev?: () => void
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function GlobalChatProvider({ children }: GlobalChatProviderProps) {
	const queryClient = useQueryClient()
	
	// Get current channel ID from route params
	const params = useParams({ from: "/app/chat/$id", strict: false })
	const routeChannelId = params?.id as Id<"channels"> | undefined
	
	// Track current channel
	const [channelId, setChannelIdState] = useState<Id<"channels"> | null>(routeChannelId || null)
	
	// Sync with route changes
	useEffect(() => {
		if (routeChannelId && routeChannelId !== channelId) {
			setChannelIdState(routeChannelId)
		}
	}, [routeChannelId, channelId])

	// Get current organization
	const organizationQuery = useQuery(convexQuery(api.me.getOrganization, {}))
	const organizationId =
		organizationQuery.data?.directive === "success" ? organizationQuery.data.data._id : undefined

	// Reply state
	const [replyToMessageId, setReplyToMessageId] = useState<Id<"messages"> | null>(null)

	// Keep track of previous messages and pagination
	const previousMessagesRef = useRef<Message[]>([])
	const previousChannelIdRef = useRef<Id<"channels"> | null>(null)
	const loadNextRef = useRef<(() => void) | undefined>(undefined)
	const loadPrevRef = useRef<(() => void) | undefined>(undefined)

	// Clear state when channel changes
	useEffect(() => {
		if (previousChannelIdRef.current && previousChannelIdRef.current !== channelId) {
			// Check cache first
			const cached = channelId ? messageCache.get(channelId) : null
			if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
				// Use cached messages
				previousMessagesRef.current = cached.messages
				loadNextRef.current = cached.loadNext
				loadPrevRef.current = cached.loadPrev
			} else {
				// Clear if no cache or expired
				previousMessagesRef.current = []
				loadNextRef.current = undefined
				loadPrevRef.current = undefined
			}
			setReplyToMessageId(null)
		}
		previousChannelIdRef.current = channelId
	}, [channelId])

	const channelQuery = useQuery(
		convexQuery(api.channels.getChannel, 
			organizationId && channelId ? { channelId, organizationId } : "skip"),
	)

	const messagesResult = useNextPrevPaginatedQuery(
		api.messages.getMessages,
		organizationId && channelId
			? {
					channelId,
					organizationId,
				}
			: "skip",
		{ initialNumItems: 50 },
	)

	// Fetch pinned messages
	const pinnedMessagesQuery = useQuery(
		convexQuery(
			api.pinnedMessages.getPinnedMessages,
			organizationId && channelId ? { channelId, organizationId } : "skip",
		),
	)

	// Fetch typing users
	const typingUsersQuery = useQuery(
		convexQuery(api.typingIndicator.list, 
			organizationId && channelId ? { channelId, organizationId } : "skip"),
	)
	const typingUsers: TypingUsers = typingUsersQuery.data || []

	// Mutations
	const sendMessageMutation = useConvexMutation(api.messages.createMessage)
	const editMessageMutation = useConvexMutation(api.messages.updateMessage)
	const deleteMessageMutation = useConvexMutation(api.messages.deleteMessage)
	const addReactionMutation = useConvexMutation(api.messages.createReaction)
	const removeReactionMutation = useConvexMutation(api.messages.deleteReaction)
	const pinMessageMutation = useConvexMutation(api.pinnedMessages.createPinnedMessage)
	const unpinMessageMutation = useConvexMutation(api.pinnedMessages.deletePinnedMessage)
	const updateTypingMutation = useConvexMutation(api.typingIndicator.update)
	const stopTypingMutation = useConvexMutation(api.typingIndicator.stop)

	// Extract messages and pagination
	const currentMessages = messagesResult._tag === "Loaded" ? messagesResult.page : []

	// Update cache and refs when we have new data
	useEffect(() => {
		if (currentMessages.length > 0 && channelId) {
			previousMessagesRef.current = currentMessages
			
			// Update cache
			messageCache.set(channelId, {
				messages: currentMessages,
				timestamp: Date.now(),
				loadNext: messagesResult._tag === "Loaded" ? messagesResult.loadNext ?? undefined : undefined,
				loadPrev: messagesResult._tag === "Loaded" ? messagesResult.loadPrev ?? undefined : undefined,
			})
		}
	}, [currentMessages, channelId, messagesResult])

	// Update pagination function refs
	if (messagesResult._tag === "Loaded") {
		loadNextRef.current = messagesResult.loadNext ?? undefined
		loadPrevRef.current = messagesResult.loadPrev ?? undefined
	}

	// Use cached or current messages
	const messages = currentMessages.length > 0 ? currentMessages : previousMessagesRef.current

	const loadNext = loadNextRef.current
	const loadPrev = loadPrevRef.current
	const isLoadingMessages = messagesResult._tag === "LoadingInitialResults"
	const isLoadingNext = messagesResult._tag === "LoadingNextResults"
	const isLoadingPrev = messagesResult._tag === "LoadingPrevResults"

	// Message operations
	const sendMessage = useCallback(({
		content,
		attachments,
		jsonContent,
	}: {
		content: string
		attachments?: string[]
		jsonContent: any
	}) => {
		if (!organizationId || !channelId) return
		sendMessageMutation({
			channelId,
			organizationId,
			content,
			jsonContent,
			attachedFiles: attachments || [],
			replyToMessageId: replyToMessageId || undefined,
		})
		setReplyToMessageId(null)
	}, [organizationId, channelId, replyToMessageId, sendMessageMutation])

	const editMessage = useCallback(async (messageId: Id<"messages">, content: string, jsonContent: any) => {
		if (!organizationId) return
		await editMessageMutation({
			organizationId,
			id: messageId,
			content,
			jsonContent,
		})
	}, [organizationId, editMessageMutation])

	const deleteMessage = useCallback((messageId: Id<"messages">) => {
		if (!organizationId) return
		deleteMessageMutation({
			organizationId,
			id: messageId,
		})
	}, [organizationId, deleteMessageMutation])

	const addReaction = useCallback((messageId: Id<"messages">, emoji: string) => {
		if (!organizationId) return
		addReactionMutation({
			organizationId,
			messageId,
			emoji,
		})
	}, [organizationId, addReactionMutation])

	const removeReaction = useCallback((messageId: Id<"messages">, emoji: string) => {
		if (!organizationId) return
		removeReactionMutation({
			organizationId,
			id: messageId,
			emoji,
		})
	}, [organizationId, removeReactionMutation])

	const pinMessage = useCallback((messageId: Id<"messages">) => {
		if (!organizationId || !channelId) return
		pinMessageMutation({
			organizationId,
			messageId,
			channelId,
		})
	}, [organizationId, channelId, pinMessageMutation])

	const unpinMessage = useCallback((messageId: Id<"messages">) => {
		if (!organizationId || !channelId) return
		unpinMessageMutation({
			organizationId,
			messageId,
			channelId,
		})
	}, [organizationId, channelId, unpinMessageMutation])

	const startTyping = useCallback(() => {
		if (!organizationId || !channelId) return
		updateTypingMutation({
			organizationId,
			channelId,
		})
	}, [organizationId, channelId, updateTypingMutation])

	const stopTyping = useCallback(() => {
		if (!organizationId || !channelId) return
		stopTypingMutation({
			organizationId,
			channelId,
		})
	}, [organizationId, channelId, stopTypingMutation])

	const createThread = useCallback((messageId: Id<"messages">) => {
		console.log("Creating thread for message:", messageId)
	}, [])

	const setChannelId = useCallback((newChannelId: Id<"channels"> | null) => {
		setChannelIdState(newChannelId)
	}, [])

	// Prefetch channel data
	const prefetchChannel = useCallback((prefetchChannelId: Id<"channels">) => {
		if (!organizationId) return
		
		// Check if already cached and still fresh
		const cached = messageCache.get(prefetchChannelId)
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return // Already cached and fresh
		}
		
		// Prefetch channel info
		queryClient.prefetchQuery(
			convexQuery(api.channels.getChannel, { channelId: prefetchChannelId, organizationId })
		)
		
		// Note: We can't directly prefetch paginated messages with useNextPrevPaginatedQuery
		// but the cache will be populated when the user navigates to the channel
	}, [organizationId, queryClient])

	const contextValue = useMemo<ChatContextValue>(
		() => ({
			channelId,
			channel: channelQuery.data,
			messages,
			pinnedMessages: pinnedMessagesQuery.data,
			loadNext,
			loadPrev,
			isLoadingMessages,
			isLoadingNext,
			isLoadingPrev,
			sendMessage,
			editMessage,
			deleteMessage,
			addReaction,
			removeReaction,
			pinMessage,
			unpinMessage,
			startTyping,
			stopTyping,
			typingUsers,
			createThread,
			replyToMessageId,
			setReplyToMessageId,
			setChannelId,
			prefetchChannel,
		}),
		[
			channelId,
			channelQuery.data,
			messages,
			pinnedMessagesQuery.data,
			loadNext,
			loadPrev,
			isLoadingMessages,
			isLoadingNext,
			isLoadingPrev,
			sendMessage,
			editMessage,
			deleteMessage,
			addReaction,
			removeReaction,
			pinMessage,
			unpinMessage,
			startTyping,
			stopTyping,
			typingUsers,
			createThread,
			replyToMessageId,
			setChannelId,
			prefetchChannel,
		],
	)

	return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}
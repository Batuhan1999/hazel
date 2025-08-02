import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "hazel-emoji-usage"
const DEFAULT_EMOJIS = ["👍", "❤️", "😂"]

interface EmojiUsage {
	[emoji: string]: number
}

export function useEmojiStats() {
	const [emojiUsage, setEmojiUsage] = useState<EmojiUsage>({})

	// Load emoji usage from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as EmojiUsage
				setEmojiUsage(parsed)
			} catch (error) {
				console.error("Failed to parse emoji usage data:", error)
			}
		}
	}, [])

	// Save emoji usage to localStorage whenever it changes
	useEffect(() => {
		if (Object.keys(emojiUsage).length > 0) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(emojiUsage))
		}
	}, [emojiUsage])

	// Get top 3 most used emojis
	const getTopEmojis = useCallback((): string[] => {
		const entries = Object.entries(emojiUsage)
		
		if (entries.length === 0) {
			return DEFAULT_EMOJIS
		}

		// Sort by usage count descending
		const sorted = entries.sort((a, b) => b[1] - a[1])
		
		// Get top 3 emojis
		const topEmojis = sorted.slice(0, 3).map(([emoji]) => emoji)
		
		// If we have less than 3, fill with defaults
		if (topEmojis.length < 3) {
			const remainingDefaults = DEFAULT_EMOJIS.filter(emoji => !topEmojis.includes(emoji))
			return [...topEmojis, ...remainingDefaults].slice(0, 3)
		}
		
		return topEmojis
	}, [emojiUsage])

	// Track emoji usage
	const trackEmojiUsage = useCallback((emoji: string) => {
		setEmojiUsage(prev => ({
			...prev,
			[emoji]: (prev[emoji] || 0) + 1
		}))
	}, [])

	// Reset emoji statistics
	const resetStats = useCallback(() => {
		setEmojiUsage({})
		localStorage.removeItem(STORAGE_KEY)
	}, [])

	return {
		topEmojis: getTopEmojis(),
		trackEmojiUsage,
		resetStats,
		emojiUsage
	}
}
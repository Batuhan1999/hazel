import { BrowserKeyValueStore } from "@effect/platform-browser"
import { Atom, useAtomMount, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { Schema } from "effect"
import { useCallback, useRef } from "react"

interface NotificationSoundSettings {
	enabled: boolean
	volume: number
	soundFile: "notification01" | "notification02"
	cooldownMs: number
}

// Schema for notification settings validation
const NotificationSoundSettingsSchema = Schema.Struct({
	enabled: Schema.Boolean,
	volume: Schema.Number,
	soundFile: Schema.Literal("notification01", "notification02"),
	cooldownMs: Schema.Number,
})

// localStorage runtime for settings persistence
const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage)

// Notification settings atom with automatic localStorage persistence
const notificationSettingsAtom = Atom.kvs({
	runtime: localStorageRuntime,
	key: "notification-sound-settings",
	schema: Schema.NullOr(NotificationSoundSettingsSchema),
	defaultValue: () => ({
		enabled: true,
		volume: 0.5,
		soundFile: "notification01" as const,
		cooldownMs: 2000,
	}),
})

// Atom that manages the audio element lifecycle
// Creates/updates audio element and applies volume when settings change
const audioElementAtom = Atom.make<HTMLAudioElement | null>((get) => {
	const settings = get(notificationSettingsAtom)
	if (typeof window === "undefined") return null

	const soundFile = settings?.soundFile || "notification01"
	const volume = settings?.volume ?? 0.5

	// Create audio element
	const audio = new Audio(`/sounds/${soundFile}.mp3`)
	audio.volume = volume

	// Cleanup on atom disposal or when dependencies change
	get.addFinalizer(() => {
		audio.pause()
		audio.src = ""
	})

	return audio
}).pipe(Atom.keepAlive)

export function useNotificationSound() {
	const settings = useAtomValue(notificationSettingsAtom) || {
		enabled: true,
		volume: 0.5,
		soundFile: "notification01" as const,
		cooldownMs: 2000,
	}
	const setSettings = useAtomSet(notificationSettingsAtom)

	// Mount the audio element atom to activate it
	useAtomMount(audioElementAtom)

	// Get the audio element from the atom
	const audioElement = useAtomValue(audioElementAtom)

	const lastPlayedRef = useRef<number>(0)
	const isPlayingRef = useRef<boolean>(false)

	const playSound = useCallback(async () => {
		if (!settings.enabled || !audioElement) return

		// Check cooldown
		const now = Date.now()
		if (now - lastPlayedRef.current < settings.cooldownMs) {
			return
		}

		// Prevent overlapping sounds
		if (isPlayingRef.current) return

		try {
			isPlayingRef.current = true
			lastPlayedRef.current = now

			// Reset and play
			audioElement.currentTime = 0
			await audioElement.play()
		} catch (error) {
			// Handle autoplay policy restrictions
			console.warn("Failed to play notification sound:", error)
		} finally {
			isPlayingRef.current = false
		}
	}, [settings.enabled, settings.cooldownMs, audioElement])

	const updateSettings = useCallback(
		(updates: Partial<NotificationSoundSettings>) => {
			setSettings((prev) => ({
				...(prev || {
					enabled: true,
					volume: 0.5,
					soundFile: "notification01" as const,
					cooldownMs: 2000,
				}),
				...updates,
			}))
		},
		[setSettings],
	)

	const testSound = useCallback(async () => {
		if (!audioElement) return

		try {
			audioElement.currentTime = 0
			await audioElement.play()
		} catch (error) {
			console.warn("Failed to play test sound:", error)
		}
	}, [audioElement])

	return {
		settings,
		updateSettings,
		playSound,
		testSound,
	}
}

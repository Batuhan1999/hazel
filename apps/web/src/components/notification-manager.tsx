import { convexQuery } from "@convex-dev/react-query"
import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { useNotificationSound } from "~/hooks/use-notification-sound"

export function NotificationManager() {
	const params = useParams({ from: "/_app/$orgId" })
	const organizationId = params?.orgId as Id<"organizations">
	const { playSound } = useNotificationSound()

	// Track previous notification counts per channel
	const prevNotificationCounts = useRef<Map<string, number>>(new Map())
	const isFirstRender = useRef(true)

	// Subscribe to channels to monitor notification counts
	const channelsQuery = useQuery(
		convexQuery(
			api.channels.getChannelsForOrganization,
			organizationId
				? {
						organizationId,
						favoriteFilter: {
							favorite: false,
						},
					}
				: "skip",
		),
	)

	useEffect(() => {
		if (!channelsQuery.data) return

		const allChannels = [
			...(channelsQuery.data.organizationChannels || []),
			...(channelsQuery.data.dmChannels || []),
		]

		// Check each channel for notification count changes
		for (const channel of allChannels) {
			const channelId = channel._id
			const currentCount = channel.currentUser?.notificationCount || 0
			const prevCount = prevNotificationCounts.current.get(channelId) || 0

			// Play sound if count increased (and not on first render)
			if (!isFirstRender.current && currentCount > prevCount && !channel.isMuted) {
				playSound()
			}

			// Update the stored count
			prevNotificationCounts.current.set(channelId, currentCount)
		}

		// After first render, allow sounds
		if (isFirstRender.current) {
			isFirstRender.current = false
		}
	}, [channelsQuery.data, playSound])

	// This component doesn't render anything
	return null
}

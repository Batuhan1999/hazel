import { createFileRoute } from "@tanstack/react-router"
import { Bell01, Laptop01, Moon01, VolumeMax, VolumeX } from "@untitledui/icons"
import { useState } from "react"
import { RadioGroup } from "react-aria-components"
import { toast } from "sonner"
import { SectionFooter } from "~/components/application/section-footers/section-footer"
import { SectionHeader } from "~/components/application/section-headers/section-headers"
import { Button } from "~/components/base/buttons/button"
import { Form } from "~/components/base/form/form"
import { Toggle } from "~/components/base/toggle/toggle"
import IconNotificationBellOn from "~/components/icons/IconNotificationBellOn"
import IconVolumeMute1 from "~/components/icons/IconVolumeMute1"
import IconVolumeOne1 from "~/components/icons/IconVolumeOne1"
import { useNotificationSound } from "~/hooks/use-notification-sound"
import { cx } from "~/utils/cx"

export const Route = createFileRoute("/_app/$orgId/settings/notifications")({
	component: NotificationsSettings,
})

function NotificationsSettings() {
	const { settings, updateSettings, testSound } = useNotificationSound()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [desktopNotifications, setDesktopNotifications] = useState(true)
	const [messagePreference, setMessagePreference] = useState<"all" | "mentions" | "none">("all")
	const [doNotDisturb, setDoNotDisturb] = useState(false)
	const [quietHoursStart, setQuietHoursStart] = useState("22:00")
	const [quietHoursEnd, setQuietHoursEnd] = useState("08:00")

	const handleSave = async () => {
		setIsSubmitting(true)
		try {
			// Save settings (in real app, this would be an API call)
			await new Promise((resolve) => setTimeout(resolve, 500))
			toast.success("Notification settings saved")
		} catch (error) {
			toast.error("Failed to save settings")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Form
			className="flex flex-col gap-6 px-4 lg:px-8"
			onSubmit={(e) => {
				e.preventDefault()
				handleSave()
			}}
		>
			<SectionHeader.Root>
				<SectionHeader.Group>
					<div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
						<SectionHeader.Heading>Notifications</SectionHeader.Heading>
						<SectionHeader.Subheading>
							Manage how you receive notifications for messages and mentions.
						</SectionHeader.Subheading>
					</div>
				</SectionHeader.Group>
			</SectionHeader.Root>

			<div className="flex flex-col gap-6">
				{/* Desktop Notifications */}
				<div className="rounded-xl border border-border bg-primary p-6 shadow-xs">
					<div className="mb-6 flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-brand-subtle">
							<Laptop01 className="size-5 text-brand-solid" />
						</div>
						<div>
							<h3 className="font-semibold text-primary">Desktop Notifications</h3>
							<p className="text-sm text-tertiary">Get notified even when the app isn't open</p>
						</div>
					</div>
					<Toggle
						size="md"
						label="Enable desktop notifications"
						hint="Show system notifications for new messages"
						isSelected={desktopNotifications}
						onChange={setDesktopNotifications}
					/>
				</div>

				{/* Sound Settings */}
				<div className="rounded-xl border border-border bg-primary p-6 shadow-xs">
					<div className="mb-6 flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-brand-subtle">
							<VolumeMax className="size-5 text-brand-solid" />
						</div>
						<div>
							<h3 className="font-semibold text-primary">Sound Notifications</h3>
							<p className="text-sm text-tertiary">Audio alerts for new messages</p>
						</div>
					</div>

					<div className="space-y-6">
						<Toggle
							size="md"
							label="Enable notification sounds"
							hint="Play a sound when you receive new messages"
							isSelected={settings.enabled}
							onChange={(checked) => updateSettings({ enabled: checked })}
						/>

						{/* Sound Selection Cards */}
						<div className="space-y-3">
							<p className="font-medium text-sm text-secondary">Choose notification sound</p>
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									className={cx(
										"relative flex items-center gap-3 rounded-lg border p-4 transition-all",
										settings.soundFile === "notification01"
											? "border-brand-solid bg-brand-subtle"
											: "border-border bg-secondary hover:bg-tertiary",
										!settings.enabled && "cursor-not-allowed opacity-50",
									)}
									onClick={() => settings.enabled && updateSettings({ soundFile: "notification01" })}
									disabled={!settings.enabled}
								>
									<Bell01 className="size-5 text-tertiary" />
									<div className="text-left">
										<p className="font-medium text-sm text-primary">Classic Bell</p>
										<p className="text-xs text-tertiary">Traditional notification sound</p>
									</div>
								</button>

								<button
									type="button"
									className={cx(
										"relative flex items-center gap-3 rounded-lg border p-4 transition-all",
										settings.soundFile === "notification02"
											? "border-brand-solid bg-brand-subtle"
											: "border-border bg-secondary hover:bg-tertiary",
										!settings.enabled && "cursor-not-allowed opacity-50",
									)}
									onClick={() => settings.enabled && updateSettings({ soundFile: "notification02" })}
									disabled={!settings.enabled}
								>
									<IconNotificationBellOn className="size-5 text-tertiary" />
									<div className="text-left">
										<p className="font-medium text-sm text-primary">Modern Chime</p>
										<p className="text-xs text-tertiary">Subtle modern notification</p>
									</div>
								</button>
							</div>

							<Button
								type="button"
								size="sm"
								color="secondary"
								onClick={testSound}
								isDisabled={!settings.enabled}
								iconLeading={VolumeMax}
							>
								Test Sound
							</Button>
						</div>

						{/* Volume Slider */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="font-medium text-sm text-secondary">Volume</p>
								<span className="text-sm text-tertiary">{Math.round(settings.volume * 100)}%</span>
							</div>
							<div className="flex items-center gap-3">
								{settings.volume === 0 ? (
									<VolumeX className="size-4 text-tertiary" />
								) : settings.volume < 0.5 ? (
									<IconVolumeMute1 className="size-4 text-tertiary" />
								) : (
									<IconVolumeOne1 className="size-4 text-tertiary" />
								)}
								<input
									type="range"
									min="0"
									max="100"
									value={settings.volume * 100}
									onChange={(e) => updateSettings({ volume: Number(e.target.value) / 100 })}
									disabled={!settings.enabled}
									className="flex-1 accent-brand-solid disabled:opacity-50"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Message Preferences */}
				<div className="rounded-xl border border-border bg-primary p-6 shadow-xs">
					<div className="mb-6 flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-brand-subtle">
							<Bell01 className="size-5 text-brand-solid" />
						</div>
						<div>
							<h3 className="font-semibold text-primary">Message Notifications</h3>
							<p className="text-sm text-tertiary">Choose which messages trigger notifications</p>
						</div>
					</div>

					<RadioGroup
						value={messagePreference}
						onChange={(value) => setMessagePreference(value as "all" | "mentions" | "none")}
						className="space-y-3"
					>
						<label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-secondary">
							<input
								type="radio"
								value="all"
								checked={messagePreference === "all"}
								onChange={(e) => setMessagePreference(e.target.value as "all")}
								className="mt-1 accent-brand-solid"
							/>
							<div className="flex-1">
								<p className="font-medium text-sm text-primary">All messages</p>
								<p className="text-sm text-tertiary">Get notified for every new message</p>
							</div>
						</label>

						<label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-secondary">
							<input
								type="radio"
								value="mentions"
								checked={messagePreference === "mentions"}
								onChange={(e) => setMessagePreference(e.target.value as "mentions")}
								className="mt-1 accent-brand-solid"
							/>
							<div className="flex-1">
								<p className="font-medium text-sm text-primary">Direct messages & mentions</p>
								<p className="text-sm text-tertiary">Only when someone mentions you or sends a DM</p>
							</div>
						</label>

						<label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-secondary">
							<input
								type="radio"
								value="none"
								checked={messagePreference === "none"}
								onChange={(e) => setMessagePreference(e.target.value as "none")}
								className="mt-1 accent-brand-solid"
							/>
							<div className="flex-1">
								<p className="font-medium text-sm text-primary">Nothing</p>
								<p className="text-sm text-tertiary">Turn off all message notifications</p>
							</div>
						</label>
				</RadioGroup>
				</div>

				{/* Quiet Hours */}
				<div className="rounded-xl border border-border bg-primary p-6 shadow-xs">
					<div className="mb-6 flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-brand-subtle">
							<Moon01 className="size-5 text-brand-solid" />
						</div>
						<div>
							<h3 className="font-semibold text-primary">Quiet Hours</h3>
							<p className="text-sm text-tertiary">Automatically mute notifications during set hours</p>
						</div>
					</div>

					<div className="space-y-4">
						<Toggle
							size="md"
							label="Enable quiet hours"
							hint="Mute all notifications during specified times"
							isSelected={doNotDisturb}
							onChange={setDoNotDisturb}
						/>

						{doNotDisturb && (
							<div className="ml-12 grid grid-cols-2 gap-4">
								<div>
									<label className="mb-2 block text-sm font-medium text-secondary">Start time</label>
									<input
										type="time"
										value={quietHoursStart}
										onChange={(e) => setQuietHoursStart(e.target.value)}
										className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium text-secondary">End time</label>
									<input
										type="time"
										value={quietHoursEnd}
										onChange={(e) => setQuietHoursEnd(e.target.value)}
										className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Save Button */}
				<SectionFooter.Root>
					<SectionFooter.Actions>
						<Button type="submit" color="primary" size="md" isDisabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</SectionFooter.Actions>
				</SectionFooter.Root>
			</div>
		</Form>
	)
}

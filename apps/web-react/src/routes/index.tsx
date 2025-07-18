import { createFileRoute } from "@tanstack/react-router"
import { Attachment01, FaceSmile, Recording02 } from "@untitledui/icons"
import type { FormEvent } from "react"
import { type Message, MessageItem } from "@/components/application/messaging/messaging"
import { Button } from "@/components/base/buttons/button"
import { ButtonUtility } from "@/components/base/buttons/button-utility"
import { TextAreaBase } from "@/components/base/textarea/textarea"
import { cx } from "@/utils/cx"
import { CommandMenuActions } from "./-components/base-menu"

const messages: Message[] = [
	{
		id: "message-001",
		sentAt: "Thursday 11:40am",
		text: "Hey team, I've finished with the requirements doc!",
		user: {
			name: "Lana Steiner",
			avatarUrl: "https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80",
			status: "online",
		},
	},
	{
		id: "message-002",
		sentAt: "Thursday 11:40am",
		user: {
			name: "Lana Steiner",
			avatarUrl: "https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80",
			status: "online",
		},
		attachment: {
			type: "pdf",
			name: "Tech requirements.pdf",
			size: "1.2 MB",
		},
	},
	{
		id: "message-003",
		status: "read",
		sentAt: "Thursday 11:41am",
		text: "Awesome! Thanks.",
		user: {
			name: "You",
			me: true,
		},
	},
	{
		id: "message-004",
		sentAt: "Thursday 11:44am",
		text: "Good timing—was just looking at this.",
		user: {
			name: "Demi Wilkinson",
			avatarUrl: "https://www.untitledui.com/images/avatars/demi-wilkinson?fm=webp&q=80",
			status: "online",
		},
	},
	{
		id: "message-005",
		sentAt: "Friday 2:20pm",
		text: "Hey Olivia, can you please review the latest design when you can?",
		user: {
			name: "Phoenix Baker",
			avatarUrl: "https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80",
			status: "online",
		},
	},
	{
		id: "message-006",
		status: "read",
		sentAt: "Friday 2:20pm",
		text: "Sure thing, I'll have a look today.",
		user: {
			name: "You",
			me: true,
		},
	},
]

export const Route = createFileRoute("/")({
	component: App,
})

function App() {
	return (
		<div className="text-center">
			<CommandMenuActions />
			<ol className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6 md:px-6 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary [&::-webkit-scrollbar]:w-2">
				{messages.slice(0, 4).map((msg) => (
					<MessageItem key={msg.id} msg={msg} />
				))}

				{messages.slice(4, 6).map((msg) => (
					<MessageItem key={msg.id} msg={msg} />
				))}
			</ol>
			<MessageActionTextarea />
		</div>
	)
}

const MessageActionTextarea = ({ onSubmit, className, textAreaClassName, ...props }: any) => {
	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const message = formData.get("message") as string
		onSubmit?.(message)
	}

	return (
		<form
			className={cx("relative flex h-max items-center gap-3", className)}
			onSubmit={handleSubmit}
			{...props}
		>
			<TextAreaBase
				aria-label="Message"
				placeholder="Message"
				name="message"
				className={cx("h-32 w-full resize-none", textAreaClassName)}
			/>

			<ButtonUtility icon={Recording02} size="xs" color="tertiary" className="absolute top-2 right-2" />

			<div className="absolute right-3.5 bottom-2 flex items-center gap-2">
				<div className="flex items-center gap-0.5">
					<ButtonUtility icon={Attachment01} size="xs" color="tertiary" />
					<ButtonUtility icon={FaceSmile} size="xs" color="tertiary" />
				</div>

				<Button size="sm" color="link-color">
					Send
				</Button>
			</div>
		</form>
	)
}

import { createFileRoute } from "@tanstack/solid-router"
import { IconPhone } from "~/components/icons/phone"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Dialog } from "~/components/ui/dialog"
import { Tooltip } from "~/components/ui/tooltip"

export const Route = createFileRoute("/internal")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div class="container mx-auto flex flex-col gap-6 py-16">
			<div class="flex flex-row flex-wrap gap-3">
				<Button intent="default">Default</Button>
				<Button intent="secondary">Secondary</Button>
				<Button intent="outline">Outline</Button>
				<Button intent="ghost">Ghost</Button>
				<Button intent="link">Link</Button>
			</div>
			<div class="flex flex-row flex-wrap gap-3">
				<Button intent="default" size="small">
					Small
				</Button>
				<Button intent="default" size="default">
					Default
				</Button>
				<Button intent="default" size="large">
					Large
				</Button>
				<Button intent="default" size="icon">
					<IconPhone />
				</Button>
			</div>
			<div class="flex flex-row flex-wrap gap-3">
				<Avatar class="size-10">
					<Avatar.Image src="https://avatars.githubusercontent.com/u/101927?v=4" />
					<Avatar.Fallback>UI</Avatar.Fallback>
				</Avatar>
				<Avatar shape="circle" class="size-10">
					<Avatar.Image src="https://avatars.githubusercontent.com/u/101927?v=4" />
					<Avatar.Fallback>UI</Avatar.Fallback>
				</Avatar>
				<Avatar class="size-10">
					<Avatar.Fallback>FB</Avatar.Fallback>
				</Avatar>
				<Avatar shape="circle" class="size-10">
					<Avatar.Fallback>FB</Avatar.Fallback>
				</Avatar>
			</div>
			<div class="flex gap-3">
				<Card>
					<Card.Header>
						<Card.Title>Card Title</Card.Title>
						<Card.Description>Card Description</Card.Description>
					</Card.Header>
					<Card.Content>
						<p>Card Content</p>
					</Card.Content>
					<Card.Footer>
						<Button>Button</Button>
					</Card.Footer>
				</Card>
			</div>
			<div class="flex gap-3">
				<div class="flex flex-col gap-3">
					<h1 class="text-3xl">Dialog</h1>
					<Dialog>
						<Dialog.Trigger
							asChild={(props) => (
								<Button intent="outline" {...props()}>
									Edit Profile
								</Button>
							)}
						/>
						<Dialog.Content class="sm:max-w-[425px]">
							<Dialog.Header>
								<Dialog.Title>Edit profile</Dialog.Title>
								<Dialog.Description>
									Make changes to your profile here. Click save when you're done.
								</Dialog.Description>
							</Dialog.Header>
							<div class="grid gap-4 py-4">WOW</div>
							<Dialog.Footer>
								<Button type="submit">Save changes</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog>
				</div>
			</div>
			<div class="flex flex-col gap-3">
				<Tooltip>
					<Tooltip.Trigger
						asChild={(props) => (
							<Button class="w-18" intent="outline" {...props()}>
								Hover
							</Button>
						)}
					/>
					<Tooltip.Content>
						<p>Add to library</p>
					</Tooltip.Content>
				</Tooltip>
			</div>
		</div>
	)
}

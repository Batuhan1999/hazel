import { SignOutButton } from "@/components/SignOutButton"
import { NotificationHandler } from "@/components/notification-handler"
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo"
import { Link } from "expo-router"
import { Button, Text, View } from "react-native"

import * as Sentry from "@sentry/react-native"

export default function Page() {
	const { user } = useUser()

	return (
		<View>
			<SignedIn>
				<Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
				<SignOutButton />
				<NotificationHandler userId={user?.id!} />
				<Button
					title="Try!"
					onPress={() => {
						console.log("Trying to throw an error")
						Sentry.captureException(new Error("First error"))
					}}
				/>
			</SignedIn>
			<SignedOut>
				<Link href="/(auth)/sign-in">
					<Text>Sign in</Text>
				</Link>
				<Link href="/(auth)/sign-up">
					<Text>Sign up</Text>
				</Link>
			</SignedOut>
		</View>
	)
}

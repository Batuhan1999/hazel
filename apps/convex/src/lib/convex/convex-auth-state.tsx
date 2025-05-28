import {
	type Accessor,
	type Context,
	type JSX,
	createContext,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	useContext,
} from "solid-js"
import { ConvexProvider, type ConvexSolidClient } from "./client"

export type ConvexAuthState = {
	isLoading: Accessor<boolean>
	isAuthenticated: Accessor<boolean>
}

const ConvexAuthContext: Context<Accessor<ConvexAuthState> | undefined> = createContext<
	Accessor<ConvexAuthState> | undefined
>()

export function useConvexAuth(): ConvexAuthState {
	const authContext = useContext(ConvexAuthContext)
	if (authContext === undefined) {
		throw new Error(
			"Could not find `ConvexProviderWithAuth` as an ancestor component. " +
				"This component may be missing, or you might have two instances of " +
				"the `convex/solid` module loaded in your project.",
		)
	}
	return authContext()
}

export function ConvexProviderWithAuth(props: {
	children?: JSX.Element
	client: ConvexSolidClient
	useAuth: () => {
		isLoading: Accessor<boolean>
		isAuthenticated: Accessor<boolean>
		fetchAccessToken: (args: {
			forceRefreshToken: boolean
		}) => Promise<string | null>
	}
}) {
	const [isConvexAuthenticated, setIsConvexAuthenticated] = createSignal<boolean | null>(null)

	const authState = () => props.useAuth()

	createEffect(() => {
		const auth = authState()
		if (auth.isLoading() && isConvexAuthenticated() !== null) {
			setIsConvexAuthenticated(null)
		}
	})

	createEffect(() => {
		const auth = authState()
		if (!auth.isLoading() && !auth.isAuthenticated() && isConvexAuthenticated() !== false) {
			setIsConvexAuthenticated(false)
		}
	})

	createEffect(() => {
		const auth = authState()
		let isThisEffectRelevant = true

		if (auth.isAuthenticated()) {
			props.client.setAuth(auth.fetchAccessToken, (backendReportsIsAuthenticated) => {
				if (isThisEffectRelevant) {
					setIsConvexAuthenticated(backendReportsIsAuthenticated)
				}
			})

			onCleanup(() => {
				isThisEffectRelevant = false
				setIsConvexAuthenticated((prev) => (prev ? false : null))
			})
		}
	})

	createEffect(() => {
		const auth = authState()

		if (auth.isAuthenticated()) {
			onCleanup(() => {
				props.client.clearAuth()
				setIsConvexAuthenticated(null)
			})
		}
	})

	const isLoading = createMemo(() => isConvexAuthenticated() === null)
	const isAuthenticated = createMemo(() => authState().isAuthenticated() && (isConvexAuthenticated() ?? false))

	const authContextValue = createMemo(() => ({
		isLoading: isLoading,
		isAuthenticated: isAuthenticated,
	}))

	return (
		<ConvexAuthContext.Provider value={authContextValue}>
			<ConvexProvider client={props.client}>{props.children}</ConvexProvider>
		</ConvexAuthContext.Provider>
	)
}

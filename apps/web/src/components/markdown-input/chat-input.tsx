import hljs from "highlight.js"
import { type Accessor, type JSX, onMount, splitProps } from "solid-js"
import { MarkdownInput } from "./markdown-input"
import "highlight.js/styles/github-dark.css"

export interface ChatInputProps extends JSX.HTMLAttributes<HTMLDivElement> {
	value: Accessor<string>
	onValueChange: (value: string) => void
}

export const ChatInput = (props: ChatInputProps) => {
	const [baseProps, divProps] = splitProps(props, ["class", "value", "onValueChange"])
	return (
		<MarkdownInput
			class="w-full py-3 outline-none"
			value={baseProps.value}
			onValueChange={baseProps.onValueChange}
			renderers={{
				header1: (token) => <h1 class="font-bold text-xl">{token.content}</h1>,
				bold: (token) => <strong class="font-bold">{token.content}</strong>,
				italic: (token) => <em class="italic">{token.content}</em>,
				codeblock: (token) => {
					let codeRef: HTMLPreElement | undefined
					// onMount(() => {
					// 	if (codeRef) {
					// 		hljs.highlightElement(codeRef.querySelector("code") as HTMLElement)
					// 	}
					// })
					return (
						<pre ref={codeRef} class="overflow-x-auto rounded bg-muted p-2">
							<code>{token.content}</code>
						</pre>
					)
				},
				default: (token) => <span>{token.content}</span>,
			}}
			{...divProps}
		/>
	)
}

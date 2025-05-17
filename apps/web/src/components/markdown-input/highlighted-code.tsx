import hljs from "highlight.js"
import { createEffect } from "solid-js"

// You need to import a highlight.js theme.
// Either here, in App.tsx, or your main CSS/JS entry point.
// Example: import 'highlight.js/styles/github-dark.css';

interface HighlightedCodeProps {
	code: string
	language?: string
	class?: string // Optional class for the <pre> element
}

export function HighlightedCode(props: HighlightedCodeProps) {
	let codeElementRef: HTMLElement | undefined

	createEffect(() => {
		if (codeElementRef) {
			let highlightedHTML: string
			if (props.code) {
				if (props.language && hljs.getLanguage(props.language)) {
					highlightedHTML = hljs.highlight(props.code, {
						language: props.language,
						ignoreIllegals: true,
					}).value
				} else {
					// Auto-detect language if not specified or not supported
					highlightedHTML = hljs.highlightAuto(props.code).value
				}
				codeElementRef.innerHTML = highlightedHTML
			} else {
				codeElementRef.innerHTML = "" // Clear if no code
			}
		}
	})

	return (
		<pre class={`hljs block ${props.class || ""}`}>
			<code ref={codeElementRef} />
		</pre>
	)
}

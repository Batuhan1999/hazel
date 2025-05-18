import { type Accessor, createEffect, on, createSignal, onCleanup } from "solid-js"
import { MentionSuggestions } from "./mention-suggestions"

interface MarkdownInputProps {
	value: Accessor<string>
	onValueChange: (value: string) => void
	placeholder?: string
	class?: string
	inputClass?: string
}

// Example static user list for mentions
const USERNAMES = ["alice", "bob", "charlie", "dave", "eve"]

export function MarkdownInput(props: MarkdownInputProps) {
	let editorRef: HTMLDivElement | undefined
	let isInternallyUpdating = false

	const [mentionActive, setMentionActive] = createSignal(false)
	const [mentionQuery, setMentionQuery] = createSignal("")
	const [mentionIndex, setMentionIndex] = createSignal(0)
	const [mentionPosition, setMentionPosition] = createSignal<{left: number, top: number} | null>(null)
	const [filteredSuggestions, setFilteredSuggestions] = createSignal<string[]>([])

	function closeMention() {
		setMentionActive(false)
		setMentionQuery("")
		setFilteredSuggestions([])
	}

	function openMention(pos: {left: number, top: number}) {
		setMentionActive(true)
		setMentionQuery("")
		setMentionIndex(0)
		setMentionPosition(pos)
		setFilteredSuggestions(USERNAMES)
	}

	createEffect(
		on(
			() => props.value(),
			(propVal) => {
				if (editorRef && editorRef.textContent !== propVal) {
					isInternallyUpdating = true // Set flag before changing DOM
					editorRef.textContent = propVal
					queueMicrotask(() => {
						isInternallyUpdating = false
					})
				}
			},
		),
	)

	const handleInput = (event: InputEvent) => {
		if (isInternallyUpdating) {
			return
		}

		const target = event.currentTarget as HTMLDivElement
		const newText = target.textContent || ""
		props.onValueChange(newText)

		// Detect if @ was typed
		const selection = window.getSelection()
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0)
			const precedingText = range.startContainer.textContent?.slice(0, range.startOffset) || ""
			const match = precedingText.match(/(^|\s)@(\w*)$/)
			if (match) {
				const query = match[2] || ""
				const rect = range.getBoundingClientRect()
				const editorRect = editorRef?.getBoundingClientRect()
				const pos = editorRect && rect
					? { left: rect.left - editorRect.left, top: rect.bottom - editorRect.top }
					: { left: 0, top: 20 }
				setMentionQuery(query)
				setFilteredSuggestions(USERNAMES.filter(u => u.startsWith(query)))
				setMentionActive(true)
				setMentionPosition(pos)
				setMentionIndex(0)
			} else {
				closeMention()
			}
		}
	}

	createEffect(() => {
		if (editorRef && editorRef.textContent !== props.value()) {
			isInternallyUpdating = true
			editorRef.textContent = props.value()
			queueMicrotask(() => {
				isInternallyUpdating = false
			})
		}
	})

	// Keyboard navigation for mention suggestions
	function handleKeyDown(e: KeyboardEvent) {
		if (mentionActive()) {
			if (e.key === "ArrowDown") {
				e.preventDefault()
				setMentionIndex((i) => Math.min(i + 1, filteredSuggestions().length - 1))
			} else if (e.key === "ArrowUp") {
				e.preventDefault()
				setMentionIndex((i) => Math.max(i - 1, 0))
			} else if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault()
				const username = filteredSuggestions()[mentionIndex()]
				if (username) {
					insertMention(username)
				}
				closeMention()
			} else if (e.key === "Escape") {
				closeMention()
			}
		}
	}

	function insertMention(username: string) {
		const selection = window.getSelection()
		if (!selection || !selection.rangeCount) return
		const range = selection.getRangeAt(0)
		const node = range.startContainer
		const text = node.textContent || ""
		const offset = range.startOffset
		const before = text.slice(0, offset)
		const after = text.slice(offset)
		const match = before.match(/(^|\s)@(\w*)$/)
		if (match) {
			const start = match.index! + match[1].length
			const newText = before.slice(0, start) + "@" + username + " " + after
			node.textContent = newText
			// Move caret to after the inserted mention
			const newOffset = start + username.length + 2
			const newRange = document.createRange()
			newRange.setStart(node, newOffset)
			newRange.collapse(true)
			selection.removeAllRanges()
			selection.addRange(newRange)
			props.onValueChange(editorRef?.textContent || "")
		}
	}

	createEffect(() => {
		if (mentionActive() && filteredSuggestions().length === 0) {
			closeMention()
		}
	})

	createEffect(() => {
		function cleanupListener() {
			document.removeEventListener("keydown", handleKeyDown)
		}
		if (mentionActive()) {
			document.addEventListener("keydown", handleKeyDown)
			onCleanup(cleanupListener)
		}
	})

	return (
		<div class="relative">
			<div
				ref={editorRef}
				contentEditable={true}
				onInput={handleInput}
				class={`min-h-[40px] w-full whitespace-pre-wrap rounded-md border border-border p-2 focus:border-transparent focus:outline-none focus:ring-0 ${props.inputClass || ""}`}
				data-placeholder={props.placeholder}
				aria-multiline="true"
				spellcheck={false}
			/>
			{mentionActive() && mentionPosition() && (
				<div style={{ position: "absolute", left: `${mentionPosition()!.left}px`, top: `${mentionPosition()!.top}px` }}>
					<MentionSuggestions
						suggestions={filteredSuggestions()}
						onSelect={username => {
						insertMention(username)
						closeMention()
					}}
						activeIndex={mentionIndex()}
					/>
				</div>
			)}
		</div>
	)
}


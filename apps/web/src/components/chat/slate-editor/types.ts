import type { BaseEditor, BaseElement, BaseText, Descendant } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"

// Custom Element Types
export interface CodeBlockElement extends BaseElement {
	type: "code-block"
	language?: string
	children: Descendant[]
}

export interface MentionElement extends BaseElement {
	type: "mention"
	userId: string
	displayName: string
	children: [{ text: "" }]
}

export interface ParagraphElement extends BaseElement {
	type: "paragraph"
	children: Descendant[]
}

export interface BlockquoteElement extends BaseElement {
	type: "blockquote"
	children: Descendant[]
}

export interface SubtextElement extends BaseElement {
	type: "subtext"
	children: Descendant[]
}

export interface ListItemElement extends BaseElement {
	type: "list-item"
	children: Descendant[]
}

export interface OrderedListElement extends BaseElement {
	type: "ordered-list"
	children: Descendant[]
}

export interface UnorderedListElement extends BaseElement {
	type: "unordered-list"
	children: Descendant[]
}

export interface HeadingElement extends BaseElement {
	type: "heading"
	level: number
	children: Descendant[]
}

export type CustomElement =
	| CodeBlockElement
	| MentionElement
	| ParagraphElement
	| BlockquoteElement
	| SubtextElement
	| ListItemElement
	| OrderedListElement
	| UnorderedListElement
	| HeadingElement

// Custom Text/Leaf Types (for markdown decorations)
export type MarkdownLeaf = BaseText & {
	type?: "bold" | "italic" | "code" | "strikethrough" | "link"
	isMarker?: boolean
	url?: string
	linkText?: string
}

// Extend Slate's types
declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & ReactEditor & HistoryEditor
		Element: CustomElement
		Text: MarkdownLeaf
	}
}

// Type guards
export function isCodeBlockElement(element: BaseElement): element is CodeBlockElement {
	return (element as CustomElement).type === "code-block"
}

export function isMentionElement(element: BaseElement): element is MentionElement {
	return (element as CustomElement).type === "mention"
}

export function isParagraphElement(element: BaseElement): element is ParagraphElement {
	return (element as CustomElement).type === "paragraph"
}

import type { Editor } from "@tiptap/react"
import { Attachment01, FaceSmile } from "@untitledui/icons"
import { Button } from "../base/buttons/button"
import { ButtonUtility } from "../base/buttons/button-utility"
import { useEditorContext } from "../base/text-editor/text-editor"

export const MessageComposerActions = ({ onSubmit }: { onSubmit?: (editor: Editor) => Promise<void> }) => {
	const editor = useEditorContext()

	return (
		<div className="absolute right-3.5 bottom-2 flex items-center gap-2">
			<div className="flex items-center gap-0.5">
				<ButtonUtility icon={Attachment01} size="xs" color="tertiary" />
				<ButtonUtility icon={FaceSmile} size="xs" color="tertiary" />
			</div>

			<Button
				size="sm"
				color="link-color"
				onClick={async () => {
					await onSubmit?.(editor.editor)
				}}
			>
				Send
			</Button>
		</div>
	)
}

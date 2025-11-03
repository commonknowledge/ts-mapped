"use client";

import Link from "@tiptap/extension-link";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, ItalicIcon, PilcrowIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import type { Editor } from "@tiptap/react";

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange?: (html: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit, Link], // define your extension array
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return <></>;
  }

  console.log(editor);

  return (
    <div className="flex flex-col gap-4">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="border rounded-lg p-2 text-sm [&_p]:mb-3"
      />
    </div>
  );
};

export default RichTextEditor;

function MenuBar({ editor }: { editor: Editor }) {
  // Read the current editor's state, and re-render the component when it changes
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive("bold") ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive("italic") ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isParagraph: ctx.editor.isActive("paragraph") ?? false,
      };
    },
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        type="button"
        disabled={!editorState.canBold}
        variant={editorState.isBold ? "default" : "secondary"}
      >
        <BoldIcon />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        type="button"
        disabled={!editorState.canItalic}
        variant={editorState.isItalic ? "default" : "secondary"}
      >
        <ItalicIcon />
      </Button>
      <Button
        onClick={() => editor.chain().focus().setParagraph().run()}
        type="button"
        variant={editorState.isParagraph ? "default" : "secondary"}
      >
        <PilcrowIcon />
      </Button>
    </div>
  );
}

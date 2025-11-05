"use client";

import Link from "@tiptap/extension-link";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  ItalicIcon,
  Link2Icon,
  Link2OffIcon,
  PilcrowIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import type { Editor } from "@tiptap/react";

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange?: (html: string) => void;
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyleKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "font-normal underline cursor-pointer",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  if (!editor) {
    return <></>;
  }

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
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive("bold") ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive("italic") ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isParagraph: ctx.editor.isActive("paragraph") ?? false,
        isLink: ctx.editor.isActive("link") ?? false,
      };
    },
  });

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setShowLinkInput(true);
  };

  const handleConfirmLink = () => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="flex flex-col gap-2">
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
        <Button
          onClick={handleSetLink}
          type="button"
          variant={editorState.isLink ? "default" : "secondary"}
        >
          <Link2Icon />
        </Button>
        {editorState.isLink && (
          <Button onClick={handleRemoveLink} type="button" variant="secondary">
            <Link2OffIcon />
          </Button>
        )}
      </div>

      {showLinkInput && (
        <div className="flex gap-2 items-center">
          <Input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirmLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <Button onClick={handleConfirmLink} type="button" size="sm">
            Save
          </Button>
          <Button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            type="button"
            variant="secondary"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

export default function PublicMapDescriptionDialog({
  contactLink,
  description,
}: {
  contactLink?: string;
  description?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: description,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-block text-left text-sm hover:text-primary underline cursor-pointer">
          About the project
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[50ch] gap-0">
        <DialogHeader>
          <DialogTitle>About the project</DialogTitle>

          {/* leave empty to avoid a11y warnings */}
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="prose text-base">
          <EditorContent editor={editor} />
          {Boolean(contactLink) && (
            <p>
              Contact:&nbsp;
              <a
                href={`mailto:${contactLink}`}
                className="font-normal underline"
                target="_blank"
              >
                {contactLink}
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

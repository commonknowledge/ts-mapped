"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useInfoPopupEditing } from "../hooks/useInfoPopup";

interface MapInfoPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: string;
  infoContent: string | null | undefined;
}

export default function MapInfoPopup({
  open,
  onOpenChange,
  mapId,
  infoContent,
}: MapInfoPopupProps) {
  const [editing, setEditing] = useInfoPopupEditing();
  const [draft, setDraft] = useState(infoContent || "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updateMap, isPending } = useMutation(
    trpc.map.update.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
          if (!old) return old;
          return {
            ...old,
            infoContent: variables.infoContent ?? old.infoContent,
          };
        });
        setEditing(false);
      },
      onError: () => {
        toast.error("Failed to save map info");
      },
    }),
  );

  const handleCancel = useCallback(() => {
    setDraft(infoContent || "");
    setEditing(false);
  }, [infoContent, setEditing]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setEditing(false);
        setDraft(infoContent || "");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, infoContent, setEditing],
  );

  const htmlHasText = useCallback((html: string | null | undefined) => {
    if (!html) return false;
    const div = document.createElement("div");
    div.innerHTML = html;
    return Boolean(div.textContent?.trim());
  }, []);

  const hasContent = useMemo(
    () => htmlHasText(infoContent),
    [htmlHasText, infoContent],
  );

  const handleSave = useCallback(() => {
    const valueToSave = htmlHasText(draft) ? draft : null;
    updateMap({ mapId, infoContent: valueToSave });
  }, [updateMap, mapId, draft, htmlHasText]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>About this map</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {editing ? (
          <>
            <RichTextEditor value={draft} onChange={setDraft} />
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </>
        ) : hasContent ? (
          <ReadOnlyContent content={infoContent || ""} />
        ) : (
          <p className="text-sm text-neutral-500 italic">
            No map introduction yet. Add a description to explain the data on
            this map.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyContent({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="prose text-base">
      <EditorContent editor={editor} />
    </div>
  );
}

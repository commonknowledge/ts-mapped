"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { NOTES_COLUMN } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { useInspectorState } from "../../hooks/useInspectorState";

/**
 * Free-text notes for the focused record, written back to the source
 * system (e.g. Airtable) in the NOTES_COLUMN. The whole field is edited
 * and saved, not an append-only log.
 */
export default function InspectorNotesTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { focusedRecord } = useInspectorState();
  const { invalidateAll: invalidateDataSources } = useDataSourceListCache();

  const dataSourceId = focusedRecord?.dataSourceId ?? "";
  const dataRecordId = focusedRecord?.id ?? "";

  const { data: dataRecord, isFetching } = useQuery(
    trpc.dataRecord.byId.queryOptions(
      { dataSourceId, id: dataRecordId },
      { enabled: Boolean(dataSourceId && dataRecordId) },
    ),
  );

  const savedNote = String(dataRecord?.json[NOTES_COLUMN] ?? "");

  // null = untouched (show the saved note)
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => {
    setDraft(null);
  }, [dataRecordId]);

  const { mutate: saveNote, isPending: saving } = useMutation(
    trpc.dataRecord.saveNote.mutationOptions({
      onSuccess: () => {
        toast.success("Note saved");
        setDraft(null);
        void queryClient.invalidateQueries(
          trpc.dataRecord.byId.queryFilter({
            dataSourceId,
            id: dataRecordId,
          }),
        );
        void queryClient.invalidateQueries(trpc.dataRecord.list.queryFilter());
        // The first note adds the notes column to the data source
        void invalidateDataSources();
      },
      onError: () => {
        toast.error("Failed to save note");
      },
    }),
  );

  if (!focusedRecord || !dataSourceId) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a record to add notes.
      </p>
    );
  }

  const note = draft ?? savedNote;
  const unchanged = note === savedNote;

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={note}
        disabled={isFetching && !dataRecord}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a note for this record…"
        rows={6}
      />
      <p className="text-xs text-muted-foreground">
        Saved to the &quot;{NOTES_COLUMN}&quot; column in the data source.
      </p>
      <Button
        size="sm"
        disabled={unchanged || saving}
        onClick={() => saveNote({ dataSourceId, dataRecordId, note })}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save note
      </Button>
    </div>
  );
}

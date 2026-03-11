import { Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataSourceTypeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { TAG_MAX_LENGTH, TAG_PREFIX, buildTagName } from "@/utils/tagName";
import type { ColumnDef } from "@/server/models/DataSource";
import type { DataSourceType } from "@/server/models/DataSource";

const PREVIEW_ROW_COUNT = 10;
const PREVIEW_COLUMN_COUNT = 10;

interface SyncToCrmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tagName: string) => void;
  dataSourceType: DataSourceType;
  columns: ColumnDef[];
  mapName: string;
  viewName: string;
  records: { json: Record<string, unknown> }[];
}

export default function SyncToCrmModal({
  open,
  onOpenChange,
  onConfirm,
  dataSourceType,
  columns,
  mapName,
  viewName,
  records,
}: SyncToCrmModalProps) {
  const defaultTagName = useMemo(() => {
    return open ? buildTagName(mapName, viewName) : "";
  }, [mapName, viewName, open]);

  const [tagSuffix, setTagSuffix] = useState("");

  useEffect(() => {
    if (open) {
      setTagSuffix(defaultTagName.slice(TAG_PREFIX.length));
    }
  }, [open, defaultTagName]);

  const tagName = `${TAG_PREFIX}${tagSuffix}`;
  const suffixTrimmed = tagSuffix.trim();
  const isValid = suffixTrimmed.length > 0 && tagName.length <= TAG_MAX_LENGTH;

  const previewColumns =
    columns.length > 0
      ? [
          columns[0],
          { name: tagName, isTagColumn: true as const },
          ...columns.slice(1, PREVIEW_COLUMN_COUNT),
        ]
      : [{ name: tagName, isTagColumn: true as const }];
  const previewRecords = records.slice(0, PREVIEW_ROW_COUNT);

  const handleConfirm = () => {
    onConfirm(tagName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tag visible records in {DataSourceTypeLabels[dataSourceType]}
          </DialogTitle>
          <DialogDescription>
            This will add a new column to your data source with a boolean value
            indicating whether each record matches the current view filter.
            Records will be tagged in the background and your data will be
            automatically re-imported once complete. You will receive an email
            when the process finishes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto min-h-0">
          <div>
            <Label htmlFor="tag-name" className="text-sm font-medium mb-1">
              New column name
            </Label>
            <div className="flex items-center gap-0">
              <span className="text-sm bg-muted border border-r-0 rounded-l-md px-2 py-1.5 text-muted-foreground select-none whitespace-nowrap">
                {TAG_PREFIX}
              </span>
              <Input
                id="tag-name"
                className="rounded-l-none text-sm h-auto py-1.5"
                value={tagSuffix}
                onChange={(e) => setTagSuffix(e.target.value)}
                maxLength={TAG_MAX_LENGTH - TAG_PREFIX.length}
                placeholder="Enter a tag name"
              />
            </div>
            {tagSuffix.length > 0 && !isValid && (
              <p className="text-xs text-destructive mt-1">
                Tag name must not exceed {TAG_MAX_LENGTH} characters.
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader className="bg-neutral-100">
                  <TableRow>
                    {previewColumns.map((col) => (
                      <TableHead
                        key={col.name}
                        className={`text-xs min-w-[200px] max-w-[250px] ${
                          "isTagColumn" in col ? "bg-blue-50 font-semibold" : ""
                        }`}
                      >
                        <span className="text-wrap">{col.name}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRecords.length > 0 ? (
                    previewRecords.map((record, i) => (
                      <TableRow key={i}>
                        {previewColumns.map((col) => (
                          <TableCell
                            key={col.name}
                            className={`text-xs truncate max-w-[150px] ${
                              "isTagColumn" in col
                                ? "bg-blue-50 font-medium"
                                : ""
                            }`}
                          >
                            {"isTagColumn" in col
                              ? "true"
                              : renderPreviewCell(record.json[col.name])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={previewColumns.length}
                        className="text-xs text-center text-muted-foreground py-4"
                      >
                        No records to preview.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {records.length > PREVIEW_ROW_COUNT && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {PREVIEW_ROW_COUNT} of {records.length} records on this
                page.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Tag records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderPreviewCell(value: unknown): string {
  if (value == null) return "-";
  if (Array.isArray(value)) return value.map(renderPreviewCell).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

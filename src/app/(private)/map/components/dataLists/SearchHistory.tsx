import { SearchResult } from "@/types";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/shadcn/components/ui/input";
import { Button } from "@/shadcn/components/ui/button";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/components/ui/context-menu";

interface SearchHistoryProps {
  history: SearchResult[];
  onSelect: (coordinates: [number, number]) => void;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  showLocations: boolean;
}

export default function SearchHistory({
  history,
  onSelect,
  onEdit,
  onDelete,
  showLocations,
}: SearchHistoryProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <ul className={`${showLocations ? "opacity-100" : "opacity-50"}`}>
          {history.map((result, index) => (
            <li
              key={index}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              onContextMenu={() => setContextMenuIndex(index)}
            >
              {editingIndex === index ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onEdit(index, editText);
                    setEditingIndex(null);
                  }}
                  className="w-full flex items-center p-0"
                >
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <Button className="" type="submit" variant="link">
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                </form>
              ) : (
                <>
                  <span
                    className="flex-grow cursor-pointer text-sm"
                    onClick={() => onSelect(result.coordinates)}
                  >
                    {result.text}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuIndex !== null && (
          <>
            <ContextMenuItem
              onClick={() => {
                setEditText(history[contextMenuIndex].text);
                setEditingIndex(contextMenuIndex);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDelete(contextMenuIndex)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

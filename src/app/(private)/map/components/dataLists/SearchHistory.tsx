import { SearchResult } from "@/types";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/shadcn/ui/input";
import { Button } from "@/shadcn/ui/button";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shadcn/ui/accordion";
interface SearchHistoryProps {
  history: SearchResult[];
  onSelect: (coordinates: [number, number]) => void;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  showLocations: boolean;
  activeDataSources: string[];
}

export default function SearchHistory({
  history,
  onSelect,
  onEdit,
  onDelete,
  showLocations,
  activeDataSources,
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
          {activeDataSources.map((dataSource) => (
            <Accordion
              type="single"
              collapsible
              className="pl-2"
              key={dataSource}
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-normal pb-0">
                  Datasource {dataSource}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="">
                    <li className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                      <span className="flex-grow cursor-pointer text-sm">
                        Oliver Goldsmith Primary School
                      </span>
                    </li>
                    <li className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                      <span className="flex-grow cursor-pointer text-sm">
                        St. Mary's Catholic Primary School
                      </span>
                    </li>
                    <li className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                      <span className="flex-grow cursor-pointer text-sm">
                        John Dunne Primary School
                      </span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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

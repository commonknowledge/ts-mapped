import { Check, Database, Pencil, Trash2 } from "lucide-react";
import { useContext, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";

export default function MarkerList({
  activeDataSources,
}: {
  activeDataSources: string[];
}) {
  const { viewConfig, mapRef, searchHistory, setSearchHistory } =
    useContext(MapContext);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <ul
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"}`}
        >
          {searchHistory.map((result, index) => (
            <li
              key={index}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              onContextMenu={() => setContextMenuIndex(index)}
            >
              {editingIndex === index ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearchHistory((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, text: editText } : item,
                      ),
                    );
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
                    onClick={() => {
                      const map = mapRef?.current;
                      if (map) {
                        map.flyTo({
                          center: result.coordinates,
                          zoom: 12,
                        });
                      }
                    }}
                  >
                    {result.text}
                  </span>
                </>
              )}
            </li>
          ))}
          {activeDataSources.length > 0 && (
            <div className=" gap-2 p-2 mt-3 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Data sources
                </p>
              </div>

              {activeDataSources.map((dataSource) => (
                <Accordion type="single" collapsible key={dataSource}>
                  <AccordionItem value="item-1">
                    <AccordionTrigger
                      className="font-normal pb-0 gap-1"
                      chevronPosition="start"
                    >
                      {dataSource}
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <ul className="">
                        <li className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                          <span className="flex-grow cursor-pointer text-sm">
                            Oliver Goldsmith Primary School
                          </span>
                        </li>
                        <li className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                          <span className="flex-grow cursor-pointer text-sm">
                            {"St. Mary's Catholic Primary School"}
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
            </div>
          )}
        </ul>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuIndex !== null && (
          <>
            <ContextMenuItem
              onClick={() => {
                setEditText(searchHistory[contextMenuIndex].text);
                setEditingIndex(contextMenuIndex);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setSearchHistory((prev) =>
                  prev.filter((_, i) => i !== contextMenuIndex),
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

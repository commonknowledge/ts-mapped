import { Check, Edit3, X } from "lucide-react";
import { Fragment, useContext, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { LayerType } from "@/types";

export default function PropertiesList({
  properties,
}: {
  properties: Record<string, unknown> | null | undefined;
}) {
  const { inspectorContent, setInspectorContent } =
    useContext(InspectorContext);
  const { updatePlacedMarker, updateTurf, placedMarkers, turfs } =
    useContext(MarkerAndTurfContext);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  if (!properties || !Object.keys(properties as object)?.length) {
    return <></>;
  }

  const handleStartEditNotes = () => {
    const currentNotes = (properties?.notes as string) || "";
    setNotesText(currentNotes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    if (!inspectorContent) return;

    // Find the item to update based on the inspector content
    if (inspectorContent.type === LayerType.Marker) {
      const marker = placedMarkers?.find(
        (m) => m.label === inspectorContent.name,
      );
      if (marker) {
        updatePlacedMarker({ ...marker, notes: notesText });
        // Update the inspector content to reflect the new notes
        setInspectorContent({
          ...inspectorContent,
          properties: {
            ...inspectorContent.properties,
            notes: notesText,
          },
        });
      }
    } else if (inspectorContent.type === LayerType.Turf) {
      const turf = turfs?.find(
        (t) =>
          (t.label || `Area ${turfs.indexOf(t) + 1}`) === inspectorContent.name,
      );
      if (turf) {
        updateTurf({ ...turf, notes: notesText });
        // Update the inspector content to reflect the new notes
        setInspectorContent({
          ...inspectorContent,
          properties: {
            ...inspectorContent.properties,
            notes: notesText,
          },
        });
      }
    }

    setIsEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setIsEditingNotes(false);
    setNotesText("");
  };

  return (
    <dl className="flex flex-col gap-3">
      {Object.keys(properties as object)
        .filter((label) => {
          const value = `${properties?.[label]}`;
          if (!value) return false;

          const isFolderField = label.toLowerCase() === "folder";
          const isAddressField = label.toLowerCase() === "address";

          // Hide folder field if it shows "No folder"
          if (isFolderField && value === "No folder") {
            return false;
          }

          // Hide address field if it's empty or null
          if (
            isAddressField &&
            (!value || value === "null" || value === "undefined")
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // Always put notes at the end
          if (a.toLowerCase() === "notes") return 1;
          if (b.toLowerCase() === "notes") return -1;
          return 0;
        })
        .map((label) => {
          const value = `${properties?.[label]}`;
          const isNotesField = label.toLowerCase() === "notes";

          return (
            <div key={label}>
              <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono">
                {label}
              </dt>
              <dd className="font-medium">
                {isNotesField ? (
                  <div className="space-y-2">
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add your notes here..."
                          className="min-h-[80px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveNotes}
                            className="h-7 px-2"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditNotes}
                            className="h-7 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex-1">{value}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditNotes}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  value
                )}
              </dd>
            </div>
          );
        })}
    </dl>
  );
}

"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { cn } from "@/shadcn/utils";
import {
  usePublicMapValue,
  useReorderDataSourceConfigs,
} from "../../hooks/usePublicMap";

/**
 * The data source pill strip in the public map editor's Data tab.
 * Pills can be dragged to change the order data sources appear in on
 * the public map (the order of `publicMap.dataSourceConfigs`).
 */
export default function SortableDataSourceTabsList({
  dataSourceIds,
}: {
  dataSourceIds: string[];
}) {
  const publicMap = usePublicMapValue();
  const reorderDataSourceConfigs = useReorderDataSourceConfigs();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!publicMap || !over || active.id === over.id) {
      return;
    }
    // Indexes are into the full config list, which may contain data sources
    // that aren't currently visible (e.g. removed from the private map).
    const configs = publicMap.dataSourceConfigs;
    const fromIndex = configs.findIndex((c) => c.dataSourceId === active.id);
    const toIndex = configs.findIndex((c) => c.dataSourceId === over.id);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    reorderDataSourceConfigs({ fromIndex, toIndex });
  };

  if (!publicMap) {
    return null;
  }

  const sortable = dataSourceIds.length > 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={dataSourceIds}
        strategy={horizontalListSortingStrategy}
      >
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${dataSourceIds.length}, 1fr)`,
          }}
        >
          {dataSourceIds.map((id) => {
            const dsc = publicMap.dataSourceConfigs.find(
              (c) => c.dataSourceId === id,
            );
            return (
              <SortableTabsTrigger
                key={id}
                id={id}
                label={dsc?.dataSourceLabel ?? id}
                sortable={sortable}
              />
            );
          })}
        </TabsList>
      </SortableContext>
    </DndContext>
  );
}

function SortableTabsTrigger({
  id,
  label,
  sortable,
}: {
  id: string;
  label: string;
  sortable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !sortable });

  return (
    <TabsTrigger
      ref={setNodeRef}
      value={id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("min-w-0", isDragging && "z-10 opacity-70")}
    >
      {sortable && (
        // A span rather than a button, as a button can't be nested in the
        // TabsTrigger button. dnd-kit's `attributes` make it a focusable
        // role="button" so the keyboard sensor (space, then arrows) works.
        <span
          ref={setActivatorNodeRef}
          aria-label={`Drag to reorder ${label}`}
          className="cursor-grab touch-none text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </span>
      )}
      <span className="truncate">{label}</span>
    </TabsTrigger>
  );
}

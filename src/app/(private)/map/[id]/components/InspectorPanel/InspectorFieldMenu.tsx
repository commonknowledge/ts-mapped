"use client";

import {
  ChartNoAxesColumnDecreasingIcon,
  EllipsisIcon,
  Grid2x2Icon,
  MapIcon,
} from "lucide-react";
import { useState } from "react";
import { DUMMY_COUNT_COLUMN, MAX_COLUMN_KEY } from "@/constants";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import AreaRankingDialog from "./AreaRankingDialog";
import { useInspectorVariant } from "./InspectorVariantContext";
import type { ReactNode } from "react";

/**
 * Makes an inspector field (a row, a key figure, a chart's bar or period)
 * something you can act on in the light inspector: it highlights on hover,
 * and right-clicking it, or its ⋯ button, colours the map by it. The column
 * joins the data visualisation list (or its entry is reused) and is shown.
 * In the classic inspector the children render as they are.
 */
export default function InspectorFieldMenu({
  dataSourceId,
  column,
  label,
  showButton = true,
  className,
  children,
}: {
  dataSourceId: string | undefined;
  column: string;
  /** Names the field in the menu, e.g. a chart's "Sep 2026" */
  label?: string;
  /** The ⋯ button shown on hover; off where it would cover the value */
  showButton?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { variant } = useInspectorVariant();
  const { viewConfig } = useMapViews();
  const [isComparing, setIsComparing] = useState(false);

  if (variant !== "light" || !dataSourceId) {
    return <div className={className}>{children}</div>;
  }

  const isOnMap =
    viewConfig.areaDataSourceId === dataSourceId &&
    viewConfig.areaDataColumn === column;
  const action = {
    dataSourceId,
    column,
    label,
    isOnMap,
    onCompare: () => setIsComparing(true),
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            // Pointed at by the guided tour
            data-tour-field={column}
            className={cn(
              "group/field relative cursor-default rounded-md transition-colors hover:bg-neutral-100 data-[state=open]:bg-neutral-100",
              className,
            )}
          >
            {children}
            {showButton && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  title="Options"
                  aria-label="Field options"
                  className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded bg-inherit text-neutral-500 opacity-0 group-hover/field:opacity-100 group-data-[state=open]/field:opacity-100 hover:bg-neutral-200 hover:text-neutral-900 focus-visible:opacity-100 data-[state=open]:opacity-100"
                >
                  <EllipsisIcon className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <FieldAction {...action} kind="dropdown" />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-56">
          {/* Mounted only while open, so fields don't each read the list */}
          <FieldAction {...action} kind="context" />
        </ContextMenuContent>
      </ContextMenu>
      <AreaRankingDialog
        open={isComparing}
        onOpenChange={setIsComparing}
        dataSourceId={dataSourceId}
        column={column}
      />
    </>
  );
}

function FieldAction({
  dataSourceId,
  column,
  label,
  isOnMap,
  onCompare,
  kind,
}: {
  dataSourceId: string;
  column: string;
  label?: string;
  isOnMap: boolean;
  onCompare: () => void;
  kind: "context" | "dropdown";
}) {
  const { items, showOrCreate } = useSavedVisualisations();
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  const isListed = items.some(
    (item) =>
      item.areaDataSourceId === dataSourceId &&
      item.areaDataColumn === column &&
      !item.areaDataSecondaryColumn,
  );
  const name = label ? `“${label}”` : "column";

  // A bivariate map needs two number columns of the same source, so this
  // field can be paired with the map's column when both are numbers
  const mapColumn =
    viewConfig.areaDataSourceId === dataSourceId
      ? viewConfig.areaDataColumn
      : undefined;
  const isNumber = (name: string) =>
    dataSource?.columnDefs.find((c) => c.name === name)?.type ===
    ColumnType.Number;
  const canPair =
    Boolean(mapColumn) &&
    mapColumn !== column &&
    mapColumn !== DUMMY_COUNT_COLUMN &&
    mapColumn !== MAX_COLUMN_KEY &&
    isNumber(mapColumn ?? "") &&
    isNumber(column);
  const mapColumnLabel =
    dataSource?.columnMetadata.find((m) => m.name === mapColumn)?.displayName ||
    mapColumn;
  const isPaired = canPair && viewConfig.areaDataSecondaryColumn === column;

  const actions = [
    {
      key: "show",
      icon: <MapIcon />,
      text: isOnMap
        ? "On the map now"
        : isListed
          ? `Show ${name} on the map`
          : `Add ${name} to data visualisation`,
      disabled: isOnMap,
      onSelect: () => showOrCreate({ dataSourceId, column }),
    },
    ...(canPair && mapColumn
      ? [
          {
            key: "pair",
            icon: <Grid2x2Icon />,
            text: isPaired
              ? `Compared with “${mapColumnLabel}” on the map`
              : `Compare with “${mapColumnLabel}” (bivariate)`,
            disabled: isPaired,
            onSelect: () =>
              showOrCreate({
                dataSourceId,
                column: mapColumn,
                secondaryColumn: column,
              }),
          },
        ]
      : []),
    {
      key: "rank",
      icon: <ChartNoAxesColumnDecreasingIcon />,
      text: "Compare across areas",
      disabled: false,
      onSelect: onCompare,
    },
  ];

  const Item = kind === "context" ? ContextMenuItem : DropdownMenuItem;
  return (
    <>
      {actions.map((action) => (
        <Item
          key={action.key}
          disabled={action.disabled}
          onSelect={action.onSelect}
          // Pointed at by the guided tour
          data-tour-action={action.key}
          className="text-xs"
        >
          {action.icon}
          {action.text}
        </Item>
      ))}
    </>
  );
}

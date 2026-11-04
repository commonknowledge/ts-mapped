import { useQueryClient } from "@tanstack/react-query";
import { ListPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { BIVARIATE_COLORS } from "../colors";
import { BIVARIATE_LEVELS } from "../constants";
import { useAreaStats } from "../data";
import { useAreaLists } from "../hooks/useAreaLists";
import { useChoropleth } from "../hooks/useChoropleth";
import { useMapViews } from "../hooks/useMapViews";
import { getAreaCodesInBivariateBucket } from "../utils/bivariate";
import { useInspectorVariant } from "./InspectorPanel/InspectorVariantContext";

export default function BivariateLegend() {
  const { viewConfig } = useMapViews();
  const { selectedBivariateBucket, setSelectedBivariateBucket } =
    useChoropleth();
  const { getDataSourceById } = useDataSources();
  const { variant } = useInspectorVariant();
  const { data: areaStats } = useAreaStats();
  const { createList } = useAreaLists();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const dataSource = getDataSourceById(viewConfig.areaDataSourceId);
  const displayName = (column: string | undefined) =>
    dataSource?.columnMetadata.find((m) => m.name === column)?.displayName ||
    column ||
    "";
  const primaryLabel = displayName(viewConfig.areaDataColumn);
  const secondaryLabel = displayName(viewConfig.areaDataSecondaryColumn);

  // Right-clicking a square makes a list of its areas
  const listBucket = async ({
    bucket,
    name,
  }: {
    bucket: string;
    name: string;
  }) => {
    if (!areaStats) return;
    const codes = getAreaCodesInBivariateBucket(areaStats, bucket);
    if (!codes.length) return;
    try {
      const areas = await queryClient.fetchQuery(
        trpc.area.namesByCodes.queryOptions({
          areaSetCode: areaStats.areaSetCode,
          codes,
        }),
      );
      const list = createList({
        name,
        areaSetCode: areaStats.areaSetCode,
        areas: areas.sort((a, b) => a.name.localeCompare(b.name)),
        // The two columns of the key
        ...(viewConfig.areaDataColumn && viewConfig.areaDataSecondaryColumn
          ? {
              origin: {
                dataSourceId: viewConfig.areaDataSourceId,
                calculationType: viewConfig.calculationType,
                columns: [
                  { name: viewConfig.areaDataColumn, label: primaryLabel },
                  {
                    name: viewConfig.areaDataSecondaryColumn,
                    label: secondaryLabel,
                  },
                ],
              },
            }
          : {}),
      });
      toast.success(`Made ${list.name}: ${areas.length} areas, under Areas`);
    } catch {
      toast.error("Couldn't make the list");
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <span
        className="text-xs"
        style={{
          height: 104,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        {primaryLabel}
      </span>
      <div className="grid grid-cols-3 gap-1 mr-auto">
        {[...BIVARIATE_COLORS].reverse().map((row, i) =>
          row.map((color, j) => {
            const primaryIndex = BIVARIATE_COLORS.length - i - 1;
            const coords = `${primaryIndex},${j}`;
            const description = `${BIVARIATE_LEVELS[primaryIndex]} ${primaryLabel} · ${BIVARIATE_LEVELS[j]} ${secondaryLabel}`;
            const count =
              variant === "light" && areaStats
                ? getAreaCodesInBivariateBucket(areaStats, coords).length
                : null;
            const square = (
              <button
                key={`${i}-${j}`}
                className="w-8 h-8 border border-gray-200 cursor-pointer"
                style={
                  selectedBivariateBucket && selectedBivariateBucket !== coords
                    ? { backgroundColor: color, opacity: 0.5 }
                    : { backgroundColor: color }
                }
                title={`${primaryLabel}: ${BIVARIATE_LEVELS[primaryIndex]}, ${secondaryLabel}: ${BIVARIATE_LEVELS[j]}${count !== null ? ` (${count} areas)` : ""}`}
                type="button"
                onClick={() => {
                  if (selectedBivariateBucket === coords) {
                    setSelectedBivariateBucket(null);
                  } else {
                    setSelectedBivariateBucket(coords);
                  }
                }}
              />
            );
            if (variant !== "light") return square;
            return (
              <ContextMenu key={`${i}-${j}`}>
                <ContextMenuTrigger asChild>{square}</ContextMenuTrigger>
                <ContextMenuContent className="min-w-56">
                  <ContextMenuLabel className="text-[11px] font-normal text-neutral-500">
                    {description}
                  </ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-xs"
                    disabled={!count}
                    onSelect={() =>
                      listBucket({ bucket: coords, name: description })
                    }
                  >
                    <ListPlusIcon />
                    {count
                      ? `Make a list of these ${count} areas`
                      : "No areas in this square"}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          }),
        )}
      </div>
      <div />
      <span className="text-xs" style={{ width: 104 }}>
        {secondaryLabel}
      </span>
    </div>
  );
}

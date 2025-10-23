// hooks/useBoundariesControl.ts
import { useCallback, useMemo } from "react";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/server/models/MapView";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export function useBoundariesControl() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const membersDataSource = useMembersDataSource();
  const { data: allDataSources } = useDataSources();

  const hnhVoteShareDataSource = useMemo(
    () => allDataSources?.find((ds) => ds.name === "HNH Voteshare"),
    [allDataSources],
  );

  const isChoroplethVisible = useMemo(
    () => viewConfig.visualisationType !== VisualisationType.BoundaryOnly,
    [viewConfig.visualisationType],
  );

  const toggleChoropleth = useCallback(() => {
    if (viewConfig.visualisationType === VisualisationType.BoundaryOnly) {
      updateViewConfig({ visualisationType: VisualisationType.Choropleth });
    } else {
      updateViewConfig({ visualisationType: VisualisationType.BoundaryOnly });
    }
  }, [viewConfig.visualisationType, updateViewConfig]);

  const fillLabel = useMemo(() => {
    if (!viewConfig.areaDataSourceId || viewConfig.areaDataSourceId === "") {
      return "No Fill";
    }

    if (viewConfig.calculationType === CalculationType.Count) {
      return "Member Count";
    }

    if (
      hnhVoteShareDataSource &&
      viewConfig.areaDataSourceId === hnhVoteShareDataSource.id &&
      viewConfig.areaDataColumn
    ) {
      return viewConfig.areaDataColumn;
    }

    return "Data Visualization";
  }, [viewConfig, hnhVoteShareDataSource]);

  const shapeOptions = useMemo(() => {
    const allAreaSetGroupCodes = Object.keys(
      AreaSetGroupCodeLabels,
    ) as AreaSetGroupCode[];

    return [
      {
        label: "None",
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: null });
        },
      },
      ...allAreaSetGroupCodes.map((code) => ({
        label: AreaSetGroupCodeLabels[code],
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: code });
        },
      })),
    ];
  }, [updateViewConfig]);

  const fillOptions = useMemo(() => {
    const baseOptions = [
      {
        label: "No Fill",
        onClick: () => {
          updateViewConfig({
            areaDataSourceId: "",
            areaDataColumn: "",
            calculationType: undefined,
          });
        },
      },
    ];

    const memberCountOption = membersDataSource
      ? [
          {
            label: "Member Count",
            onClick: () => {
              updateViewConfig({
                visualisationType: VisualisationType.Choropleth,
                areaDataSourceId: membersDataSource.id,
                areaDataColumn: MAX_COLUMN_KEY,
                calculationType: CalculationType.Count,
              });
            },
          },
        ]
      : [];

    const voteShareOptions = hnhVoteShareDataSource
      ? hnhVoteShareDataSource.columnDefs.map((column) => ({
          label: column.name,
          onClick: () => {
            updateViewConfig({
              visualisationType: VisualisationType.Choropleth,
              areaDataSourceId: hnhVoteShareDataSource.id,
              areaDataColumn: column.name,
              calculationType: CalculationType.Value,
            });
          },
        }))
      : [];

    return {
      baseOptions: [...baseOptions, ...memberCountOption],
      voteShareOptions,
    };
  }, [updateViewConfig, membersDataSource, hnhVoteShareDataSource]);

  const colorSchemeOptions = [
    {
      label: "Sequential",
      value: ColorScheme.Sequential,
      color: "bg-gradient-to-r from-blue-100 to-blue-600",
    },
    {
      label: "Red-Blue",
      value: ColorScheme.RedBlue,
      color: "bg-gradient-to-r from-red-500 to-blue-500",
    },
    {
      label: "Green-Yellow-Red",
      value: ColorScheme.GreenYellowRed,
      color: "bg-gradient-to-r from-green-500 via-yellow-500 to-red-500",
    },
    {
      label: "Viridis",
      value: ColorScheme.Viridis,
      color: "bg-gradient-to-r from-purple-600 via-blue-500 to-green-500",
    },
    {
      label: "Plasma",
      value: ColorScheme.Plasma,
      color: "bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500",
    },
    {
      label: "Diverging",
      value: ColorScheme.Diverging,
      color: "bg-gradient-to-r from-brown-500 via-yellow-500 to-teal-500",
    },
  ];

  const hasShape = Boolean(viewConfig.areaSetGroupCode);
  const hasDataSource =
    Boolean(viewConfig.areaDataSourceId) && viewConfig.areaDataSourceId !== "";

  return {
    isChoroplethVisible,
    toggleChoropleth,
    fillLabel,
    shapeOptions,
    fillOptions,
    colorSchemeOptions,
    hasShape,
    hasDataSource,
  };
}

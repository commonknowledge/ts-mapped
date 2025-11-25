import { useMemo } from "react";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { CalculationType, ColorScheme, MapType } from "@/server/models/MapView";

export function useBoundariesControl() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const membersDataSource = useMembersDataSource();
  const { data: allDataSources } = useDataSources();

  const voteShareDataSource = useMemo(
    () => allDataSources?.find((ds) => ds.name === "2024 GE Results"),
    [allDataSources],
  );

  const fillLabel = useMemo(() => {
    if (!viewConfig.areaDataSourceId || viewConfig.areaDataSourceId === "") {
      return "No Fill";
    }

    if (viewConfig.calculationType === CalculationType.Count) {
      return "Member Count";
    }

    if (
      voteShareDataSource &&
      viewConfig.areaDataSourceId === voteShareDataSource.id &&
      viewConfig.areaDataColumn
    ) {
      return viewConfig.areaDataColumn;
    }

    return "Data Visualization";
  }, [viewConfig, voteShareDataSource]);

  const shapeOptions = useMemo(() => {
    const allAreaSetGroupCodes = Object.keys(
      AreaSetGroupCodeLabels,
    ) as AreaSetGroupCode[];

    if (viewConfig.mapType === MapType.Hex) {
      return [
        {
          label: AreaSetGroupCodeLabels[AreaSetGroupCode.WMC24],
          onClick: () => {
            updateViewConfig({ areaSetGroupCode: AreaSetGroupCode.WMC24 });
          },
        },
      ];
    }

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
  }, [updateViewConfig, viewConfig.mapType]);

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
                areaDataSourceId: membersDataSource.id,
                areaDataColumn: MAX_COLUMN_KEY,
                calculationType: CalculationType.Count,
              });
            },
          },
        ]
      : [];

    const voteShareOptions = voteShareDataSource
      ? voteShareDataSource.columnDefs.map((column) => ({
          label: column.name,
          onClick: () => {
            updateViewConfig({
              areaDataSourceId: voteShareDataSource.id,
              areaDataColumn: column.name,
              calculationType: CalculationType.Avg,
            });
          },
        }))
      : [];

    return {
      baseOptions: [...baseOptions, ...memberCountOption],
      voteShareOptions,
    };
  }, [updateViewConfig, membersDataSource, voteShareDataSource]);

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
    Boolean(viewConfig.areaDataSourceId) &&
    Boolean(viewConfig.areaDataSourceId);

  return {
    fillLabel,
    shapeOptions,
    fillOptions,
    colorSchemeOptions,
    hasShape,
    hasDataSource,
  };
}

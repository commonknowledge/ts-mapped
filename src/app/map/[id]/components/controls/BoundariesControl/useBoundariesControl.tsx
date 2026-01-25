import { useMemo } from "react";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import {
  CalculationType,
  DEFAULT_CALCULATION_TYPE,
  MapType,
} from "@/server/models/MapView";

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
      return "No fill";
    }

    if (viewConfig.calculationType === CalculationType.Count) {
      return "Record count";
    }

    if (
      voteShareDataSource &&
      viewConfig.areaDataSourceId === voteShareDataSource.id &&
      viewConfig.areaDataColumn
    ) {
      return viewConfig.areaDataColumn;
    }

    return "Data visualisation";
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
        label: "No fill",
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
            label: "Member count",
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
              calculationType: DEFAULT_CALCULATION_TYPE,
            });
          },
        }))
      : [];

    return {
      baseOptions: [...baseOptions, ...memberCountOption],
      voteShareOptions,
    };
  }, [updateViewConfig, membersDataSource, voteShareDataSource]);

  const hasShape = Boolean(viewConfig.areaSetGroupCode);
  const hasDataSource = Boolean(viewConfig.areaDataSourceId);

  return {
    fillLabel,
    shapeOptions,
    fillOptions,
    hasShape,
    hasDataSource,
  };
}

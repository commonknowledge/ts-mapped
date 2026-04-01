import { useMemo } from "react";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { DUMMY_COUNT_COLUMN, GE_DATA_SOURCE_NAME } from "@/constants";
import { useDataSources, useMembersDataSource } from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/models/AreaSet";
import { MapType } from "@/models/MapView";
import { DEFAULT_CALCULATION_TYPE } from "@/models/shared";

export function useBoundariesControl() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const membersDataSource = useMembersDataSource();
  const { data: allDataSources } = useDataSources();

  const voteShareDataSource = useMemo(
    () => allDataSources?.find((ds) => ds.name === GE_DATA_SOURCE_NAME),
    [allDataSources],
  );

  const fillLabel = useMemo(() => {
    if (!viewConfig.areaDataSourceId || viewConfig.areaDataSourceId === "") {
      return "No fill";
    }

    if (viewConfig.areaDataColumn === DUMMY_COUNT_COLUMN) {
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
                areaDataColumn: DUMMY_COUNT_COLUMN,
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

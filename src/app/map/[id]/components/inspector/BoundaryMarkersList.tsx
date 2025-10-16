import { useQueries } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useContext, useMemo } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import DataSourceIcon from "@/components/DataSourceIcon";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { LayerType, type RecordData, type RecordsResponse } from "@/types";
import {
  checkIfAnyRecords,
  mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import { InspectorContentFactory } from "./inspectorContentFactory";
import TurfMarkerButton from "./TurfMarkerButton";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export default function BoundaryMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { folders, placedMarkers } = useContext(MarkerAndTurfContext);
  const { inspectorContent } = useContext(InspectorContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const trpc = useTRPC();
  const choroplethDataSource = useChoroplethDataSource();

  // Use the same data source as the boundary list for consistency
  const dataSourceIds = choroplethDataSource?.id
    ? [choroplethDataSource.id]
    : [];

  // Get boundary feature from the inspector content
  const boundaryFeature = useMemo(() => {


    if (!inspectorContent || inspectorContent.type !== LayerType.Boundary) {
      console.log("BoundaryMarkersList - No inspector content or wrong type");
      return null;
    }

    const feature = inspectorContent.boundaryFeature as unknown as Feature<
      Polygon | MultiPolygon
    > | null;
    if (!feature) {
      console.log(
        "BoundaryMarkersList - No boundaryFeature in inspectorContent",
      );
      return null;
    }

    // Convert vector tile feature to proper GeoJSON if needed
    if ((feature as unknown as Record<string, unknown>)._vectorTileFeature) {
      return {
        type: "Feature",
        geometry: feature.geometry,
        properties: feature.properties,
      } as Feature<Polygon | MultiPolygon>;
    }

    return feature;
  }, [inspectorContent]);

  // Fetch all data source records (we'll filter them spatially)
  const { data, isFetching } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          filter: {
            type: FilterType.GEO,
            // Note: We can't use turf filter for boundaries like we do for areas
            // because boundaries are vector tiles, not individual features
          },
          page: 0,
        },
        { refetchOnMount: "always" },
      ),
    ),
    combine: (results) => ({
      data: results.map((result, i) => ({
        dataSource: getDataSourceById(dataSourceIds[i]),
        records: (result.data as RecordsResponse) ?? {
          count: { matched: 0 },
          records: [],
        },
      })),
      isFetching: results.some((r) => r.isFetching),
    }),
  });

  // Filter records that are within the boundary
  const filteredData = useMemo(() => {
    if (!boundaryFeature) {
      return [];
    }

    const boundaryCode = boundaryFeature.properties?.gss_code;
    const areaSetCode = choroplethLayerConfig.areaSetCode;

    return data.map(({ dataSource, records }) => {
      const filteredRecords = records.records.filter((record) => {


        if (!boundaryFeature) {
          return false;
        }

        // Additional safety check for boundaryFeature structure
        if (!boundaryFeature.geometry) {
          return false;
        }

        const point = turf.point([
          record.geocodePoint.lng,
          record.geocodePoint.lat,
        ]);
        const isInside = turf.booleanPointInPolygon(point, boundaryFeature);

        return isInside;
      });

      console.log(
        `${dataSource?.name} - Total: ${records.records.length}, Filtered: ${filteredRecords.length}`,
      );

      return {
        dataSource,
        records: {
          count: { matched: filteredRecords.length },
          records: filteredRecords,
        },
      };
    });
  }, [data, boundaryFeature, inspectorContent, choroplethLayerConfig]);

  const members = useMemo(
    () =>
      filteredData.find(
        (item) =>
          item?.dataSource?.recordType === DataSourceRecordType.Members ||
          item?.dataSource?.id === mapConfig.membersDataSourceId,
      ),
    [filteredData, mapConfig.membersDataSourceId],
  );

  const markers = useMemo(
    () =>
      filteredData.filter(
        (item) =>
          item?.dataSource?.recordType !== DataSourceRecordType.Members &&
          item?.dataSource?.id !== mapConfig.membersDataSourceId,
      ),
    [filteredData, mapConfig.membersDataSourceId],
  );

  // Filter placed markers that are within the boundary
  const markersInBoundary = useMemo(() => {
    if (!boundaryFeature) {
      console.log(
        "BoundaryMarkersList - No boundaryFeature for markers filtering",
      );
      return [];
    }

    const filtered = (placedMarkers || []).filter((marker) => {
      if (!boundaryFeature.geometry) {
        return false;
      }

      const point = turf.point([marker.point.lng, marker.point.lat]);
      const isInside = turf.booleanPointInPolygon(point, boundaryFeature);

      return isInside;
    });

    return filtered;
  }, [boundaryFeature, placedMarkers]);

  const mappedPlacedMarkers = useMemo(() => {
    return mapPlacedMarkersToRecordsResponse(markersInBoundary, folders);
  }, [folders, markersInBoundary]);

  // Get boundary information from the inspector content
  // const boundaryInfo = useMemo(() => {
  //     if (!inspectorContent || inspectorContent.type !== LayerType.Boundary) {
  //         return null;
  //     }
  //
  //     // No longer using __boundaryFeature
  //
  //     // Get dataset name based on area set code
  //     const getDatasetName = (areaSetCode: string) => {
  //         switch (areaSetCode) {
  //             case 'WMC24':
  //                 return 'Westminster Constituencies';
  //             case 'OA21':
  //                 return 'Output Areas';
  //             case 'MSOA21':
  //                 return 'Middle Layer Super Output Areas';
  //             case 'PC':
  //                 return 'Postal Codes';
  //             default:
  //                 return 'Boundary Data';
  //         }
  //     };
  //
  //     return {
  //         areaCode: inspectorContent.properties?.areaCode || 'N/A',
  //         areaName: inspectorContent.properties?.areaName || inspectorContent.name || 'N/A',
  //         dataset: getDatasetName(choroplethLayerConfig.areaSetCode)
  //     };
  // }, [inspectorContent, choroplethLayerConfig]);

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          records={members.records}
        />
      )}

      {(markers?.length > 0 || mappedPlacedMarkers.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono uppercase text-muted-foreground">
            Markers in this boundary
          </h2>

          {!checkIfAnyRecords([...mappedPlacedMarkers, ...markers]) && (
            <p>No markers in this boundary</p>
          )}

          {mappedPlacedMarkers.length > 0 &&
            mappedPlacedMarkers.map((markersGroup, index) => (
              <PlacedMarkersList
                key={`placed-markers-${markersGroup.folder?.id || "no-folder"}-${index}`}
                folder={markersGroup.folder}
                records={markersGroup.records}
              />
            ))}

          {markers?.length > 0 &&
            markers.map((markersGroup, index) => (
              <MarkersList
                key={`markers-${markersGroup.dataSource?.id || "no-datasource"}-${index}`}
                dataSource={markersGroup.dataSource}
                records={markersGroup.records}
              />
            ))}
        </div>
      )}
    </div>
  );
}

const MembersList = ({
  records,
  dataSource,
}: {
  records: RecordsResponse;
  dataSource: DataSource | null;
}) => {
  const { setInspectorContent, inspectorContent } =
    useContext(InspectorContext);

  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const memberRecords = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    const parent = {
      type: LayerType.Boundary,
      name: inspectorContent?.name || "Boundary",
      id: inspectorContent?.id || "boundary",
    };
    setInspectorContent(
      InspectorContentFactory.createMemberInspectorContent(
        record,
        dataSource,
        parent,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this boundary {total > 0 && <>({total})</>}
      </h2>

      {!dataSource ? (
        <p>No members data source found.</p>
      ) : memberRecords.length > 0 ? (
        <ul>
          {memberRecords.map((record, index) => {
            const displayName = nameColumn
              ? String(record.json[nameColumn] ?? "")
              : `Id: ${record.id}`;
            return (
              <li key={`member-${record.id}-${index}`}>
                <TurfMarkerButton
                  label={displayName}
                  type={LayerType.Member}
                  onClick={() => onRecordClick(record)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No members in this boundary.</p>
      )}
    </div>
  );
};

const MarkersList = ({
  records,
  dataSource,
}: {
  records: RecordsResponse;
  dataSource: DataSource | null;
}) => {
  const { setInspectorContent, inspectorContent } =
    useContext(InspectorContext);

  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    const parent = {
      type: LayerType.Boundary,
      name: inspectorContent?.name || "Boundary",
      id: inspectorContent?.id || "boundary",
    };
    setInspectorContent(
      InspectorContentFactory.createDataSourceMarkerInspectorContent(
        record,
        dataSource,
        parent,
      ),
    );
  };

  if (recordsList.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <div className="shrink-0">
          <DataSourceIcon type={dataSource?.config.type}></DataSourceIcon>
        </div>
        {dataSource?.name} {total > 0 && <>({total})</>}
      </h3>

      <ul>
        {recordsList.map((record, index) => {
          const displayName = nameColumn
            ? String(record.json[nameColumn] ?? "")
            : `Id: ${record.id}`;
          return (
            <li key={`marker-${record.id}-${index}`}>
              <TurfMarkerButton
                label={displayName}
                type={LayerType.Marker}
                onClick={() => onRecordClick(record)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const PlacedMarkersList = ({
  folder,
  records,
}: {
  folder: Folder | null;
  records: RecordsResponse;
}) => {
  const { setInspectorContent, inspectorContent } =
    useContext(InspectorContext);
  const { placedMarkers, folders } = useContext(MarkerAndTurfContext);

  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;
  const name = folder?.name || "No folder";

  const onRecordClick = (record: RecordData) => {
    // Find the actual placed marker to get complete data
    const placedMarker = placedMarkers?.find((pm) => pm.id === record.id);
    if (placedMarker) {
      const parent = {
        type: LayerType.Boundary,
        name: inspectorContent?.name || "Boundary",
        id: inspectorContent?.id || "boundary",
      };
      setInspectorContent(
        InspectorContentFactory.createPlacedMarkerInspectorContent(
          placedMarker,
          folders,
          parent,
        ),
      );
    } else {
      // Fallback for cases where placed marker is not found
      setInspectorContent({
        type: LayerType.Marker,
        name: String(record.json?.name || `Id: ${record.id}`),
        properties: {
          __name: record.json?.name || "",
        },
        dataSource: null,
        id: record.id,
        recordId: record.id,
      });
    }
  };

  if (recordsList.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {name} ({total})
      </h3>

      <ul>
        {recordsList.map((record, index) => {
          return (
            <li key={`area-${record.id}-${index}`}>
              <TurfMarkerButton
                label={record.json?.name as string}
                type={LayerType.Marker}
                onClick={() => onRecordClick(record)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

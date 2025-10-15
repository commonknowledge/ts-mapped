import { useQueries } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { getDataSourceIds } from "@/app/map/[id]/utils";
import DataSourceIcon from "@/components/DataSourceIcon";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { LayerType, type RecordData, type RecordsResponse } from "@/types";
import {
    checkIfAnyRecords,
    mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import TurfMarkerButton from "./TurfMarkerButton";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";

export default function BoundaryMarkersList() {
    const { getDataSourceById } = useDataSources();
    const { mapConfig } = useMapConfig();
    const { folders, placedMarkers } = useContext(MarkerAndTurfContext);
    const { inspectorContent } = useContext(InspectorContext);
    const { mapRef } = useContext(MapContext);
    const { choroplethLayerConfig } = useContext(ChoroplethContext);
    const trpc = useTRPC();

    const dataSourceIds = getDataSourceIds(mapConfig);

    // Get boundary feature from the inspector content
    const boundaryFeature = useMemo(() => {
        if (!inspectorContent || inspectorContent.type !== LayerType.Boundary) {
            return null;
        }

        const feature = inspectorContent.properties?.boundaryFeature as Feature<Polygon | MultiPolygon> | null;
        if (!feature) return null;

        // Convert vector tile feature to proper GeoJSON if needed
        if ((feature as any)._vectorTileFeature) {
            return {
                type: 'Feature',
                geometry: feature.geometry,
                properties: feature.properties
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
            console.log("No boundary feature found");
            return [];
        }

        console.log("All data records:", data);

        return data.map(({ dataSource, records }) => {
            const filteredRecords = records.records.filter(record => {
                if (!record.geocodePoint) {
                    return false;
                }

                const point = turf.point([record.geocodePoint.lng, record.geocodePoint.lat]);
                const isInside = turf.booleanPointInPolygon(point, boundaryFeature);

                console.log(`Record ${record.id} at (${record.geocodePoint.lng}, ${record.geocodePoint.lat}) is inside:`, isInside);

                return isInside;
            });

            console.log(`Data source ${dataSource?.name}: ${filteredRecords.length} records inside boundary`);

            return {
                dataSource,
                records: {
                    count: { matched: filteredRecords.length },
                    records: filteredRecords,
                },
            };
        });
    }, [data, boundaryFeature]);

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
            console.log("No boundary feature for placed markers");
            return [];
        }

        console.log("Placed markers:", placedMarkers);

        const filtered = (placedMarkers || []).filter(marker => {
            const point = turf.point([marker.point.lng, marker.point.lat]);
            const isInside = turf.booleanPointInPolygon(point, boundaryFeature);

            console.log(`Placed marker ${marker.label} at (${marker.point.lng}, ${marker.point.lat}) is inside:`, isInside);

            return isInside;
        });

        console.log(`Found ${filtered.length} placed markers inside boundary`);

        return filtered;
    }, [boundaryFeature, placedMarkers]);

    const mappedPlacedMarkers = useMemo(() => {
        return mapPlacedMarkersToRecordsResponse(markersInBoundary, folders);
    }, [folders, markersInBoundary]);

    // Get boundary information from the inspector content
    const boundaryInfo = useMemo(() => {
        if (!inspectorContent || inspectorContent.type !== LayerType.Boundary) {
            return null;
        }

        // No longer using __boundaryFeature

        // Get dataset name based on area set code
        const getDatasetName = (areaSetCode: string) => {
            switch (areaSetCode) {
                case 'WMC24':
                    return 'Westminster Constituencies';
                case 'OA21':
                    return 'Output Areas';
                case 'MSOA21':
                    return 'Middle Layer Super Output Areas';
                case 'PC':
                    return 'Postal Codes';
                default:
                    return 'Boundary Data';
            }
        };

        return {
            areaCode: inspectorContent.properties?.areaCode || 'N/A',
            areaName: inspectorContent.properties?.areaName || inspectorContent.name || 'N/A',
            dataset: getDatasetName(choroplethLayerConfig.areaSetCode)
        };
    }, [inspectorContent, choroplethLayerConfig]);

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
                                key={index}
                                folder={markersGroup.folder}
                                records={markersGroup.records}
                            />
                        ))}

                    {markers?.length > 0 &&
                        markers.map((markersGroup, index) => (
                            <MarkersList
                                key={index}
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
    const { setSelectedRecord } = useContext(InspectorContext);

    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const memberRecords = records.records ?? [];
    const total = records.count.matched ?? 0;

    const onRecordClick = (record: RecordData) => {
        setSelectedRecord({
            id: record.id,
            dataSourceId: dataSource?.id as string,
            point: record.geocodePoint,
            properties: {
                ...record.json,
                __name: nameColumn ? record.json[nameColumn] : "",
            },
        });
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
                    {memberRecords.map((record) => {
                        const displayName = nameColumn
                            ? String(record.json[nameColumn] ?? "")
                            : `Id: ${record.id}`;
                        return (
                            <li key={record.id}>
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
    const { setSelectedRecord } = useContext(InspectorContext);

    const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
    const recordsList = records.records ?? [];
    const total = records.count.matched ?? 0;

    const onRecordClick = (record: RecordData) => {
        setSelectedRecord({
            id: record.id,
            dataSourceId: dataSource?.id as string,
            point: record.geocodePoint,
            properties: {
                ...record.json,
                __name: nameColumn ? record.json[nameColumn] : "",
            },
        });
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
                {recordsList.map((record) => {
                    const displayName = nameColumn
                        ? String(record.json[nameColumn] ?? "")
                        : `Id: ${record.id}`;
                    return (
                        <li key={record.id}>
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
    const { setSelectedRecord, setInspectorContent } = useContext(InspectorContext);
    const { placedMarkers } = useContext(MarkerAndTurfContext);

    const recordsList = records.records ?? [];
    const total = records.count.matched ?? 0;
    const name = folder?.name || "No folder";

    const onRecordClick = (record: RecordData) => {
        setSelectedRecord({
            id: record.id,
            dataSourceId: "",
            point: record.geocodePoint,
            properties: {
                __name: record.json?.name || "",
            },
        });

        // Find the placed marker data and set inspector content
        const placedMarker = placedMarkers?.find(m => m.id === record.id);
        if (placedMarker) {
            // Get folder name if marker is in a folder
            const folderName = placedMarker.folderId
                ? folder?.name || "Unknown folder"
                : null;

            setInspectorContent({
                type: LayerType.Marker,
                name: placedMarker.label,
                properties: {
                    coordinates: `${placedMarker.point.lat.toFixed(4)}, ${placedMarker.point.lng.toFixed(4)}`,
                    folder: folderName || "No folder",
                    notes: placedMarker.notes || "No notes",
                    ...(placedMarker.address && { address: placedMarker.address }),
                },
                dataSource: null,
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
                {recordsList.map((record) => {
                    return (
                        <li key={record.id}>
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

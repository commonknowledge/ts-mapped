"use client";

import { QueryResult, gql, useQuery } from "@apollo/client";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  PublicMap,
  PublicMapColumn,
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublicMapDataSourceConfig,
  PublishedPublicMapQuery,
} from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { Point } from "@/types";
import { PublicMapContext } from "./PublicMapContext";

export default function PublicMapProvider({
  publicMap: initialPublicMap,
  editable = false,
  children,
}: {
  publicMap: NonNullable<PublishedPublicMapQuery["publishedPublicMap"]>;
  editable?: boolean;
  children: ReactNode;
}) {
  const [publicMap, setPublicMap] =
    useState<PublishedPublicMapQuery["publishedPublicMap"]>(initialPublicMap);
  const [searchLocation, setSearchLocation] = useState<Point | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activePublishTab, setActivePublishTab] = useState<string>("settings");
  const [recordSidebarVisible, setRecordSidebarVisible] =
    useState<boolean>(false);
  const [colourScheme, setColourScheme] = useState<string>("red");
  const [dataRecordsQueries, setDataRecordsQueries] = useState<
    Record<
      string,
      QueryResult<PublicMapDataRecordsQuery, PublicMapDataRecordsQueryVariables>
    >
  >({});

  const onLoadDataRecords = useCallback(
    (
      dataSourceId: string,
      q: QueryResult<
        PublicMapDataRecordsQuery,
        PublicMapDataRecordsQueryVariables
      >,
    ) => {
      setDataRecordsQueries((prev) => ({ ...prev, [dataSourceId]: q }));
    },
    [],
  );

  const updatePublicMap = (updates: Partial<PublicMap>) => {
    if (publicMap) {
      setPublicMap({ ...publicMap, ...updates });
    }
  };

  const updateDataSourceConfig = (
    dataSourceId: string,
    updates: Partial<PublicMapDataSourceConfig>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return { ...dsc, ...updates };
          }
          return dsc;
        }),
      });
    }
  };

  const updateAdditionalColumn = (
    dataSourceId: string,
    columnIndex: number,
    updates: Partial<PublicMapColumn>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return {
              ...dsc,
              additionalColumns: dsc.additionalColumns.map((c, i) => {
                if (i === columnIndex) {
                  return { ...c, ...updates };
                }
                return c;
              }),
            };
          }
          return dsc;
        }),
      });
    }
  };

  return (
    <PublicMapContext
      value={{
        publicMap,
        editable,
        dataRecordsQueries,
        searchLocation,
        setSearchLocation,
        updatePublicMap,
        updateDataSourceConfig,
        updateAdditionalColumn,
        activeTabId,
        setActiveTabId,
        activePublishTab,
        setActivePublishTab,
        recordSidebarVisible,
        setRecordSidebarVisible,
        colourScheme,
        setColourScheme,
        selectedRecordId: null,
        setSelectedRecordId: () => null,
      }}
    >
      {publicMap?.dataSourceConfigs.map((dsc) => (
        <DataRecordsQueryComponent
          key={dsc.dataSourceId}
          dataSourceId={dsc.dataSourceId}
          location={searchLocation}
          onLoadDataRecords={onLoadDataRecords}
        />
      ))}
      {children}
    </PublicMapContext>
  );
}

// Use a component for each query, as can't put hooks in a loop
function DataRecordsQueryComponent({
  dataSourceId,
  location,
  onLoadDataRecords,
}: {
  dataSourceId: string;
  location: Point | null;
  onLoadDataRecords: (
    dataSourceId: string,
    q: QueryResult<
      PublicMapDataRecordsQuery,
      PublicMapDataRecordsQueryVariables
    >,
  ) => void;
}) {
  const { view } = useContext(MapContext);

  const filter = view?.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSourceId,
  )?.filter;

  const sort = location
    ? [{ name: SORT_BY_LOCATION, location, desc: false }]
    : [{ name: SORT_BY_NAME_COLUMNS, desc: false }];

  const dataRecordsQuery = useQuery<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >(
    gql`
      query PublicMapDataRecords(
        $dataSourceId: String!
        $filter: RecordFilterInput
        $sort: [SortInput!]
      ) {
        dataSource(id: $dataSourceId) {
          id
          name
          columnRoles {
            nameColumns
          }
          records(filter: $filter, sort: $sort, all: true) {
            id
            externalId
            geocodePoint {
              lat
              lng
            }
            json
          }
          recordCount(filter: $filter) {
            count
            matched
          }
        }
      }
    `,
    {
      variables: {
        dataSourceId,
        filter,
        sort,
      },
    },
  );

  useEffect(() => {
    onLoadDataRecords(dataSourceId, dataRecordsQuery);
  }, [dataRecordsQuery, dataSourceId, onLoadDataRecords]);

  return null;
}

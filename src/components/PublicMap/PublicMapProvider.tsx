"use client";

import { QueryResult, gql, useQuery } from "@apollo/client";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublishedPublicMapQuery,
} from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { Point } from "@/types";
import { PublicMapContext } from "./PublicMapContext";

export default function PublicMapProvider({
  publicMap,
  children,
}: {
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
  children: ReactNode;
}) {
  const { mapConfig } = useContext(MapContext);
  const [searchLocation, setSearchLocation] = useState<Point | null>(null);
  const [dataRecordsQueries, setDataRecordsQueries] = useState<
    Record<
      string,
      QueryResult<PublicMapDataRecordsQuery, PublicMapDataRecordsQueryVariables>
    >
  >({});

  const onLoad = useCallback(
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

  return (
    <PublicMapContext
      value={{
        publicMap,
        dataRecordsQueries,
        searchLocation,
        setSearchLocation,
      }}
    >
      {mapConfig.getDataSourceIds().map((id) => (
        <DataRecordsQueryComponent
          key={id}
          dataSourceId={id}
          location={searchLocation}
          onLoad={onLoad}
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
  onLoad,
}: {
  dataSourceId: string;
  location: Point | null;
  onLoad: (
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
    console.log("onload", dataSourceId);
    onLoad(dataSourceId, dataRecordsQuery);
  }, [dataRecordsQuery, dataSourceId, onLoad]);

  return null;
}

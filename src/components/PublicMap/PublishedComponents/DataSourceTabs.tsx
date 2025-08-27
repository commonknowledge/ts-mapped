"use client";

import { QueryResult } from "@apollo/client";
import { useContext } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { cn } from "@/shadcn/utils";
import DataRecordsList from "./DataRecordsList";
import DataSourcesSelect from "./DataSourcesSelect";

interface DataSourceTabsProps {
  colourScheme: { primary: string; muted: string };
  editable: boolean;
  dataRecordsQueries: Record<
    string,
    QueryResult<PublicMapDataRecordsQuery, PublicMapDataRecordsQueryVariables>
  >;
}

export default function DataSourceTabs({
  colourScheme,
  editable,
  dataRecordsQueries,
}: DataSourceTabsProps) {
  const { publicMap, activeTabId, setActiveTabId } =
    useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);

  if (!publicMap || publicMap.dataSourceConfigs.length === 0) {
    return null;
  }

  // Single data source - no tabs needed
  if (publicMap.dataSourceConfigs.length === 1) {
    const dsc = publicMap.dataSourceConfigs[0];
    const dataRecordsQuery = dataRecordsQueries[dsc.dataSourceId];

    return (
      dataRecordsQuery && (
        <>
          {editable && <DataSourcesSelect />}

          <SingleDataSourceContent
            dsc={dsc}
            dataRecordsQuery={dataRecordsQuery}
            editable={editable}
            colourScheme={colourScheme}
            onSelect={setSelectedDataRecord}
          />
        </>
      )
    );
  }

  // Multiple data sources - use tabs
  const defaultTabId =
    activeTabId || publicMap.dataSourceConfigs[0]?.dataSourceId;

  return (
    <Tabs value={defaultTabId} onValueChange={setActiveTabId}>
      <div className="flex items-center gap-2 px-4">
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${
              publicMap.dataSourceConfigs.length
            }, 1fr)`,
          }}
        >
          {publicMap.dataSourceConfigs.map((dsc) => (
            <TabsTrigger value={dsc.dataSourceId} key={dsc.dataSourceId}>
              {dsc.dataSourceLabel}
            </TabsTrigger>
          ))}
        </TabsList>
        {editable && <DataSourcesSelect />}
      </div>

      {publicMap.dataSourceConfigs.map((dsc) => {
        const dataRecordsQuery = dataRecordsQueries[dsc.dataSourceId];
        return (
          dataRecordsQuery && (
            <TabsContent value={dsc.dataSourceId} key={dsc.dataSourceId}>
              <SingleDataSourceContent
                dsc={dsc}
                dataRecordsQuery={dataRecordsQuery}
                editable={editable}
                colourScheme={colourScheme}
                onSelect={setSelectedDataRecord}
              />
            </TabsContent>
          )
        );
      })}
    </Tabs>
  );
}

interface SingleDataSourceContentProps {
  dsc: { dataSourceId: string; dataSourceLabel: string };
  dataRecordsQuery: QueryResult<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >;
  editable: boolean;
  colourScheme: { primary: string; muted: string };
  onSelect: (r: { id: string; dataSourceId: string }) => void;
}

function SingleDataSourceContent({
  dsc,
  dataRecordsQuery,
  editable,
  colourScheme,
  onSelect,
}: SingleDataSourceContentProps) {
  return (
    <div
      className={cn(
        "",
        editable && "border border-neutral-200 border-dashed m-1 rounded-md"
      )}
    >
      {editable && (
        <p className="text-sm font-semibold text-muted-foreground p-2">
          {dsc.dataSourceLabel}
        </p>
      )}
      <span className="text-sm px-4">
        {dataRecordsQuery.data?.dataSource?.records?.length || 0} Listings
      </span>
      <DataRecordsList
        dataRecordsQuery={dataRecordsQuery}
        onSelect={onSelect}
        colourScheme={colourScheme}
      />
    </div>
  );
}

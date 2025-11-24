"use client";

import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { Button } from "@/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { cn } from "@/shadcn/utils";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import DataRecordsList from "./DataRecordsList";
import DataSourcesSelect from "./DataSourcesSelect";
import Filters from "./Filters";
import { getActiveFilters } from "./filtersHelpers";
import FiltersList from "./FiltersList";
import type { PublicMapColorScheme } from "@/app/map/[id]/styles";
import type { RouterOutputs } from "@/services/trpc/react";

interface DataSourceTabsProps {
  colorScheme: PublicMapColorScheme;
  editable: boolean;
  dataRecordsQueries: Record<
    string,
    {
      data: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
      isPending: boolean;
    }
  >;
}

export default function DataSourceTabs({
  colorScheme,
  editable,
  dataRecordsQueries,
}: DataSourceTabsProps) {
  const { publicMap, activeTabId, setActiveTabId } =
    useContext(PublicMapContext);
  const { setSelectedRecord } = useContext(InspectorContext);
  const { publicFilters, setPublicFilters } = useContext(PublicFiltersContext);

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
            dataRecordsQuery={dataRecordsQuery}
            editable={editable}
            colorScheme={colorScheme}
            onSelect={setSelectedRecord}
          />
        </>
      )
    );
  }

  // Multiple data sources - use tabs
  const defaultTabId =
    activeTabId || publicMap.dataSourceConfigs[0]?.dataSourceId;

  const onTabChange = (id: string) => {
    setActiveTabId(id);
    if (!publicFilters[id]) {
      setPublicFilters({ ...publicFilters, [id]: [] });
    }
  };

  return (
    <Tabs value={defaultTabId} onValueChange={onTabChange} className="min-h-0">
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
            <TabsContent
              value={dsc.dataSourceId}
              key={dsc.dataSourceId}
              className="flex flex-col min-h-0"
            >
              <SingleDataSourceContent
                dataRecordsQuery={dataRecordsQuery}
                editable={editable}
                colorScheme={colorScheme}
                onSelect={setSelectedRecord}
              />
            </TabsContent>
          )
        );
      })}
    </Tabs>
  );
}

interface SingleDataSourceContentProps {
  dataRecordsQuery: {
    data: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
    isPending: boolean;
  };
  editable: boolean;
  colorScheme: PublicMapColorScheme;
  onSelect: (r: { id: string; dataSourceId: string }) => void;
}

function SingleDataSourceContent({
  dataRecordsQuery,
  editable,
  colorScheme,
  onSelect,
}: SingleDataSourceContentProps) {
  const { publicFilters, setPublicFilters, records } =
    useContext(PublicFiltersContext);
  const { publicMap } = useContext(PublicMapContext);

  const dataSourceId = dataRecordsQuery.data?.id;
  const activeFilters = getActiveFilters(
    dataSourceId ? publicFilters[dataSourceId] : [],
  );

  const config =
    publicMap?.dataSourceConfigs?.length === 1
      ? publicMap?.dataSourceConfigs[0]
      : publicMap?.dataSourceConfigs.find(
          (c) => c.dataSourceId === dataSourceId,
        );

  const getListingsLabel = () => {
    if (!records?.length) {
      return "No matching listings";
    }

    return `${records.length} ${records.length === 1 ? "listing" : "listings"}`;
  };

  const resetFilters = () => {
    if (dataSourceId) {
      setPublicFilters({
        ...publicFilters,
        [dataSourceId]: [],
      });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col text-sm overflow-auto",
        editable && "border border-neutral-200 border-dashed m-1 rounded-md",
      )}
    >
      <div className="md:sticky top-0 py-2 border-b bg-white">
        <div className="flex justify-between items-center gap-4 px-2">
          <Filters />

          {activeFilters?.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => resetFilters()}
            >
              Reset
            </Button>
          )}
        </div>

        <FiltersList />
        <h2 className="px-4 mt-2 text-xs">{getListingsLabel()}</h2>
      </div>

      <DataRecordsList
        dataRecordsQuery={dataRecordsQuery}
        onSelect={onSelect}
        colorScheme={colorScheme}
      />

      {!editable && config && config.formUrl && config.allowUserSubmit && (
        <div className="sticky bottom-0 left-0 p-4 / bg-white">
          <Button asChild={true} className="w-full">
            <a href={config.formUrl} target="_blank">
              Add a listing
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

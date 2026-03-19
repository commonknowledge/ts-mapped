"use client";

import { Database, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { useInspectorState } from "@/app/map/[id]/hooks/useInspectorState";
import {
  VerticalTabs,
  VerticalTabsContent,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "@/components/VerticalTabs";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { useAutoSaveDraftEffect } from "../../hooks/useAutoSaveDraft";
import { usePublicDataRecordsQueries } from "../../hooks/usePublicDataRecordsQueries";
import {
  useActiveDataSourceId,
  useActivePublishTab,
  usePublicMapValue,
  useSetActivePublishTab,
} from "../../hooks/usePublicMap";
import { buildPublicMapName } from "../../utils";
import EditorDataSettings from "./EditorDataSettings";
import EditorInfoSettings from "./EditorInfoSettings";
import EditorPublishSettings from "./EditorPublishSettings";

export default function PublishPublicMapSidebar() {
  const publicMap = usePublicMapValue();
  const activeDataSourceId = useActiveDataSourceId();
  const activePublishTab = useActivePublishTab();
  const setActivePublishTab = useSetActivePublishTab();
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const { setSelectedRecords } = useInspectorState();
  const [hideSidebar] = useState(false);

  // Auto-save draft whenever the atom changes
  useAutoSaveDraftEffect();

  // Auto-select first record when data source tab changes and data panel is open
  useEffect(() => {
    if (activePublishTab === "data" && activeDataSourceId) {
      const dataRecordsQuery = dataRecordsQueries[activeDataSourceId];
      const records = dataRecordsQuery?.data?.records;
      if (records && records.length > 0) {
        const firstRecord = records[0];
        const dataSourceConfig = publicMap?.dataSourceConfigs.find(
          (config) => config.dataSourceId === activeDataSourceId,
        );
        setSelectedRecords([
          {
            id: firstRecord.id,
            dataSourceId: activeDataSourceId,
            name: buildPublicMapName(dataSourceConfig, firstRecord),
            geocodePoint: firstRecord.geocodePoint,
          },
        ]);
      }
    }
  }, [
    activeDataSourceId,
    activePublishTab,
    dataRecordsQueries,
    setSelectedRecords,
    publicMap?.dataSourceConfigs,
  ]);

  // Should never happen
  if (!publicMap) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-0 right-0 z-10 bg-white flex border-l border-neutral-200",
        hideSidebar ? "h-auto" : "h-full",
      )}
    >
      <div className="flex flex-col h-full w-[380px]">
        {!hideSidebar && (
          <VerticalTabs
            className="overflow-y-hidden flex-1 flex flex-col"
            value={activePublishTab}
            onValueChange={(value) => {
              setActivePublishTab(value);
              if (value !== "data") {
                // Clear selected records when leaving Data tab to hide DataRecordSidebar
                setSelectedRecords([]);
                return;
              }
              if (value === "data" && activeDataSourceId) {
                // Select the first record from the active data source
                const dataSourceConfig = publicMap?.dataSourceConfigs.find(
                  (dsc) => dsc.dataSourceId === activeDataSourceId,
                );
                if (dataSourceConfig) {
                  const firstRecord =
                    dataRecordsQueries[dataSourceConfig.dataSourceId]?.data
                      ?.records?.[0];
                  if (firstRecord) {
                    setSelectedRecords([
                      {
                        id: firstRecord.id,
                        dataSourceId: dataSourceConfig.dataSourceId,
                        name: buildPublicMapName(dataSourceConfig, firstRecord),
                        geocodePoint: firstRecord.geocodePoint,
                      },
                    ]);
                  }
                }
              }
            }}
          >
            <VerticalTabsList className="flex flex-row w-full">
              <VerticalTabsTrigger
                value="settings"
                icon={Settings}
                label="Settings"
              />
              <VerticalTabsTrigger value="data" icon={Database} label="Data" />
            </VerticalTabsList>

            <VerticalTabsContent value="settings">
              <EditorPublishSettings />
              <Separator className="my-4" />
              <EditorInfoSettings />
            </VerticalTabsContent>

            <VerticalTabsContent value="data">
              <EditorDataSettings />
            </VerticalTabsContent>
          </VerticalTabs>
        )}
      </div>
    </div>
  );
}

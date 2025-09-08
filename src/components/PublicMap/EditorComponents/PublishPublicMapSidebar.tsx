"use client";

import { gql, useMutation } from "@apollo/client";
import { Database, Globe, Settings } from "lucide-react";
import { FormEvent, useContext, useEffect, useState } from "react";
import {
  UpsertPublicMapMutation,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import {
  VerticalTabs,
  VerticalTabsContent,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "@/components/VerticalTabs";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import EditorDataSettings from "./EditorDataSettings";
import EditorInfoSettings from "./EditorInfoSettings";
import EditorPublishSettings from "./EditorPublishSettings";

export default function PublishPublicMapSidebar() {
  const {
    publicMap,
    dataRecordsQueries,
    activeTabId,
    activePublishTab,
    setActivePublishTab,
    recordSidebarVisible,
    setRecordSidebarVisible,
  } = useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [hideSidebar] = useState(false);
  const [, setError] = useState("");
  const [publishedHost, setPublishedHost] = useState(
    publicMap?.published ? publicMap.host : "",
  );

  const [upsertPublicMap, { loading }] = useMutation<
    UpsertPublicMapMutation,
    UpsertPublicMapMutationVariables
  >(gql`
    mutation UpsertPublicMap(
      $viewId: String!
      $host: String!
      $name: String!
      $description: String!
      $descriptionLink: String!
      $published: Boolean!
      $dataSourceConfigs: [PublicMapDataSourceConfigInput!]!
    ) {
      upsertPublicMap(
        viewId: $viewId
        host: $host
        name: $name
        description: $description
        descriptionLink: $descriptionLink
        published: $published
        dataSourceConfigs: $dataSourceConfigs
      ) {
        code
        result {
          host
          published
        }
      }
    }
  `);

  // Auto-select first record when data source tab changes and data panel is open
  useEffect(() => {
    if (activePublishTab === "data" && recordSidebarVisible && activeTabId) {
      const dataRecordsQuery = dataRecordsQueries[activeTabId];
      const records = dataRecordsQuery?.data?.dataSource?.records;
      if (records && records.length > 0) {
        const firstRecord = records[0];
        setSelectedDataRecord({
          id: firstRecord.id,
          dataSourceId: activeTabId,
        });
      }
    }
  }, [
    activeTabId,
    activePublishTab,
    recordSidebarVisible,
    dataRecordsQueries,
    setSelectedDataRecord,
  ]);

  // Should never happen
  if (!publicMap) {
    return null;
  }

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: publicMap,
      });
      if (result.data?.upsertPublicMap?.result) {
        setPublishedHost(
          result.data.upsertPublicMap.result.published
            ? result.data.upsertPublicMap.result.host
            : "",
        );
      }
      if (result.data?.upsertPublicMap?.code === 409) {
        setError("A public map already exists for this subdomain.");
      }
    } catch (e) {
      console.error("Failed to upsert public map", e);
      setError("Unknown error.");
    }
  };

  return (
    <div
      className={cn(
        "absolute top-0 pt-[var(--navbar-height)] right-0 z-10 bg-white flex border-l border-neutral-200",
        hideSidebar ? "h-auto" : "h-full",
      )}
    >
      <div className="flex flex-col h-full w-[380px]">
        {!hideSidebar && (
          <form onSubmit={onSubmitForm} className="flex flex-col h-full">
            <VerticalTabs
              className="overflow-y-auto flex-1 flex flex-col"
              value={activePublishTab}
              onValueChange={(value) => {
                setActivePublishTab(value);
                if (value === "data") {
                  if (!recordSidebarVisible) {
                    setRecordSidebarVisible(true);
                  }

                  // Select the first record from the active data source
                  const currentDataSourceId =
                    activeTabId ||
                    publicMap?.dataSourceConfigs[0]?.dataSourceId;
                  if (
                    currentDataSourceId &&
                    dataRecordsQueries[currentDataSourceId]
                  ) {
                    const firstRecord =
                      dataRecordsQueries[currentDataSourceId]?.data?.dataSource
                        ?.records?.[0];
                    if (firstRecord) {
                      setSelectedDataRecord({
                        id: firstRecord.id,
                        dataSourceId: currentDataSourceId,
                      });
                    }
                  }
                }
              }}
            >
              <VerticalTabsList className="flex flex-row border-b border-neutral-200 w-full">
                <VerticalTabsTrigger
                  value="settings"
                  icon={Settings}
                  label="Settings"
                />
                <VerticalTabsTrigger
                  value="data"
                  icon={Database}
                  label="Data"
                />
              </VerticalTabsList>

              <VerticalTabsContent value="settings">
                <EditorPublishSettings publishedHost={publishedHost} />
                <Separator className="my-4" />
                <EditorInfoSettings />
              </VerticalTabsContent>

              <VerticalTabsContent value="data">
                <EditorDataSettings />
              </VerticalTabsContent>
            </VerticalTabs>
            <PublishActionsSection loading={loading} />
          </form>
        )}
      </div>
    </div>
  );
}

export function PublishActionsSection({ loading }: { loading: boolean }) {
  return (
    <div className="flex items-center border-t border-neutral-200 h-16">
      <Button
        disabled={loading}
        size="lg"
        className="flex-1 rounded-none h-full"
      >
        <Globe className="w-4 h-4" /> Publish Map
      </Button>
    </div>
  );
}

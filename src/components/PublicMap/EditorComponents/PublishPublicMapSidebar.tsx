"use client";

import { gql, useMutation } from "@apollo/client";
import {
  Database,
  ExternalLink,
  Globe,
  Info,
  Palette,
  Settings,
} from "lucide-react";
import Link from "next/link";
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
import { cn } from "@/shadcn/utils";
import EditorDataSettings from "./EditorDataSettings";
import EditorInfoSettings from "./EditorInfoSettings";
import EditorPublishSettings from "./EditorPublishSettings";
import EditorStyleSettings from "./EditorStyleSettings";

export default function PublishPublicMapSidebar() {
  const {
    publicMap,
    dataRecordsQueries,
    activeTabId,
    activePublishTab,
    setActivePublishTab,
    recordSidebarVisible,
    setRecordSidebarVisible,
    setAboutPanelVisible,
  } = useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [hideSidebar] = useState(false);
  const [, setError] = useState("");
  const [publishedHost, setPublishedHost] = useState(
    publicMap?.published ? publicMap.host : ""
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
            : ""
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
        "absolute top-0 right-0 z-10 bg-white flex border-l border-neutral-200",
        hideSidebar ? "h-auto" : "h-full"
      )}
    >
      <div className="flex flex-col h-full w-[380px]">
        {!hideSidebar && (
          <div className="flex flex-col  h-full">
            <VerticalTabs
              className="overflow-y-auto flex-1"
              value={activePublishTab}
              onValueChange={(value) => {
                setActivePublishTab(value);
                if (value === "data") {
                  if (!recordSidebarVisible) {
                    setAboutPanelVisible(false);
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
              <VerticalTabsList>
                <VerticalTabsTrigger value="publish settings" icon={Settings} />
                <VerticalTabsTrigger value="info" icon={Info} />
                <VerticalTabsTrigger value="data" icon={Database} />
                <VerticalTabsTrigger value="style" icon={Palette} />
              </VerticalTabsList>

              <VerticalTabsContent value="publish settings">
                <EditorPublishSettings />
              </VerticalTabsContent>
              <VerticalTabsContent value="info">
                <EditorInfoSettings />
              </VerticalTabsContent>
              <VerticalTabsContent value="data">
                <EditorDataSettings />
              </VerticalTabsContent>
              <VerticalTabsContent value="style">
                <EditorStyleSettings />
              </VerticalTabsContent>
            </VerticalTabs>
            <PublishActionsSection
              publishedHost={publishedHost}
              loading={loading}
              onSubmitForm={onSubmitForm}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const getBaseUrl = () =>
  new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

const getPublicMapUrl = (host: string) => {
  const proto = getBaseUrl().protocol;
  return `${proto}//${host}`;
};

export function PublishActionsSection({
  publishedHost,
  loading,
  onSubmitForm,
}: {
  publishedHost: string;
  loading: boolean;
  onSubmitForm: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex items-center border-t border-neutral-200 h-16">
      <Button
        disabled={loading}
        size="lg"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onSubmitForm(e as unknown as FormEvent<HTMLFormElement>);
        }}
        className="flex-1 rounded-none h-full"
      >
        <Globe className="w-4 h-4" /> Publish Map
      </Button>
      {publishedHost && (
        <Link
          href={getPublicMapUrl(publishedHost)}
          target="_blank"
          className="shrink"
        >
          <Button
            disabled={loading}
            size="lg"
            type="submit"
            variant="secondary"
            className="rounded-none h-16"
          >
            <ExternalLink className="w-4 h-4" /> View
          </Button>
        </Link>
      )}
    </div>
  );
}

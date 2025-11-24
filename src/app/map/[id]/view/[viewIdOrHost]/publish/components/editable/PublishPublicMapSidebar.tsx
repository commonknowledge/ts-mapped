"use client";

import { useMutation } from "@tanstack/react-query";
import { Database, Settings } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import {
  VerticalTabs,
  VerticalTabsContent,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "@/components/VerticalTabs";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../../context/PublicMapContext";
import { usePublicDataRecordsQueries } from "../../hooks/usePublicDataRecordsQueries";
import EditorDataSettings from "./EditorDataSettings";
import EditorInfoSettings from "./EditorInfoSettings";
import EditorPublishSettings from "./EditorPublishSettings";
import type { FormEvent } from "react";

export default function PublishPublicMapSidebar() {
  const { publicMap, activeTabId, activePublishTab, setActivePublishTab } =
    useContext(PublicMapContext);
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const { setSelectedRecord } = useContext(InspectorContext);
  const [hideSidebar] = useState(false);
  const [, setError] = useState("");
  const [publishedHost, setPublishedHost] = useState(
    publicMap?.published ? publicMap.host : "",
  );

  const trpc = useTRPC();
  const { mutate: upsertPublicMap, isPending: loading } = useMutation(
    trpc.publicMap.upsert.mutationOptions({
      onSuccess: (res) => {
        setPublishedHost(res.host);
        toast.success("Your changes were saved!");
      },
      onError: (e) => {
        console.error("Failed to upsert public map", e);
        setError(e.message);
        toast.error("Failed to save changes.");
      },
    }),
  );

  // Auto-select first record when data source tab changes and data panel is open
  useEffect(() => {
    if (activePublishTab === "data" && activeTabId) {
      const dataRecordsQuery = dataRecordsQueries[activeTabId];
      const records = dataRecordsQuery?.data?.records;
      if (records && records.length > 0) {
        const firstRecord = records[0];
        setSelectedRecord({
          id: firstRecord.id,
          dataSourceId: activeTabId,
        });
      }
    }
  }, [activeTabId, activePublishTab, dataRecordsQueries, setSelectedRecord]);

  // Should never happen
  if (!publicMap) {
    return null;
  }

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    upsertPublicMap(publicMap);
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
              className="overflow-y-hidden flex-1 flex flex-col"
              value={activePublishTab}
              onValueChange={(value) => {
                setActivePublishTab(value);
                if (value === "data") {
                  // Select the first record from the active data source
                  const currentDataSourceId =
                    activeTabId ||
                    publicMap?.dataSourceConfigs[0]?.dataSourceId;
                  if (
                    currentDataSourceId &&
                    dataRecordsQueries[currentDataSourceId]
                  ) {
                    const firstRecord =
                      dataRecordsQueries[currentDataSourceId]?.data
                        ?.records?.[0];
                    if (firstRecord) {
                      setSelectedRecord({
                        id: firstRecord.id,
                        dataSourceId: currentDataSourceId,
                      });
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
        Save changes
      </Button>
    </div>
  );
}

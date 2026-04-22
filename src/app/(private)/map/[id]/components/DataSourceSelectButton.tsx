import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import { useDataSources } from "@/hooks/useDataSources";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { cn } from "@/shadcn/utils";
import { useMapViews } from "../hooks/useMapViews";
import type { DataSourceWithImportInfo } from "@/components/DataSourceItem";

export default function DataSourceSelectButton({
  className,
  dataSource,
  onSelect,
  selectButtonText,
  modalTitle,
}: {
  className?: string | null | undefined;
  dataSource?: DataSourceWithImportInfo | null | undefined;
  onSelect: (dataSourceId: string) => void;
  selectButtonText?: string | null | undefined;
  modalTitle?: string | null | undefined;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DataSourceSelectButtonModalTrigger
        className={className}
        dataSource={dataSource}
        setIsModalOpen={setIsModalOpen}
        selectButtonText={selectButtonText}
      />
      <DataSourceSelectModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        onSelect={onSelect}
        title={modalTitle}
      />
    </>
  );
}

function DataSourceSelectButtonModalTrigger({
  className,
  dataSource,
  setIsModalOpen,
  selectButtonText,
}: {
  className?: string | null | undefined;
  dataSource?: DataSourceWithImportInfo | null | undefined;
  setIsModalOpen: (o: boolean) => void;
  selectButtonText?: string | null | undefined;
}) {
  if (!dataSource) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setIsModalOpen(true)}
      >
        <span>{selectButtonText || "Select a data source"}</span>
        <PlusIcon className="w-4 h-4 ml-2 flex-shrink-0" />
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setIsModalOpen(true);
      }}
      className={cn(
        "group-hover:bg-neutral-100 transition-colors cursor-pointer rounded-lg",
        className,
      )}
    >
      <DataSourceItem
        className="shadow-xs"
        density="compact"
        showColumnPreview={true}
        columnPreviewVariant="pills"
        singleLineColumnPreview={true}
        maxColumnPills={6}
        dataSource={dataSource}
      />
    </button>
  );
}

export function DataSourceSelectModal({
  isModalOpen,
  setIsModalOpen,
  onSelect,
  title,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
  onSelect: (dataSourceId: string) => void;
  title?: string | null | undefined;
}) {
  const [activeTab, setActiveTab] = useState<
    "movement" | "user" | "other-public"
  >("user");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: dataSources,
    isPending: dataSourcesPending,
    isError: dataSourcesIsError,
    error: dataSourcesError,
  } = useDataSources();
  const { viewConfig } = useMapViews();
  const prevIsModalOpenRef = useRef(isModalOpen);

  useEffect(() => {
    const wasOpen = prevIsModalOpenRef.current;
    prevIsModalOpenRef.current = isModalOpen;
    if (wasOpen || !isModalOpen) return;

    const activeId = viewConfig.areaDataSourceId;
    if (!activeId) return;

    const active = dataSources?.find((ds) => ds.id === activeId);
    if (!active) return;

    if (active.public && active.adminApproved) setActiveTab("movement");
    else if (active.public) setActiveTab("other-public");
    else setActiveTab("user");
  }, [dataSources, isModalOpen, viewConfig.areaDataSourceId]);

  // Update the filtering logic to include search
  const filteredAndSearchedDataSources = useMemo(() => {
    let sources = dataSources || [];

    if (searchQuery) {
      sources = sources.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ds.columnDefs.some((col) =>
            col.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (activeTab === "movement")
      sources = sources.filter((ds) => ds.public && ds.adminApproved);
    else if (activeTab === "other-public")
      sources = sources.filter((ds) => ds.public && !ds.adminApproved);
    else sources = sources.filter((ds) => !ds.public);

    return sources;
  }, [activeTab, dataSources, searchQuery]);

  const fetchedCount = dataSources?.length ?? 0;
  const filteredCount = filteredAndSearchedDataSources.length;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl h-[80vh] overflow-hidden !flex !flex-col">
        <DialogHeader>
          <DialogTitle>
            {title?.trim()
              ? title.trim()
              : "Select data source for visualisation"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Search and Filter Bar */}
          <div className="flex gap-2 mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="user" className="text-xs">
                  User data
                </TabsTrigger>
                <TabsTrigger value="movement" className="text-xs">
                  Movement data library
                </TabsTrigger>
                <TabsTrigger value="other-public" className="text-xs">
                  Other public data
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder="Search data sources..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Data Source Grid */}
          <div className="flex-1 overflow-auto min-h-0">
            {dataSourcesPending ? (
              <div className="text-sm text-muted-foreground py-6">
                Loading data sources…
              </div>
            ) : dataSourcesIsError ? (
              <div className="text-sm text-destructive py-6">
                Failed to load data sources
                {dataSourcesError instanceof Error
                  ? `: ${dataSourcesError.message}`
                  : "."}
              </div>
            ) : fetchedCount === 0 ? (
              <div className="text-sm text-muted-foreground py-6">
                No data sources available.
              </div>
            ) : filteredCount === 0 ? (
              <div className="text-sm text-muted-foreground py-6">
                No matches ({fetchedCount} fetched, 0 shown for{" "}
                {activeTab === "user"
                  ? "User data"
                  : activeTab === "movement"
                    ? "Movement data library"
                    : "Other public data"}
                ).
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredAndSearchedDataSources.map((ds) => (
                  <button
                    type="button"
                    className="text-left"
                    key={ds.id}
                    onClick={() => {
                      setIsModalOpen(false);
                      onSelect(ds.id);
                    }}
                  >
                    <DataSourceItem
                      className={
                        viewConfig.areaDataSourceId === ds.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-blue-300"
                      }
                      density={
                        activeTab === "movement" ? "compactPreview" : "compact"
                      }
                      showColumnPreview={true}
                      columnPreviewVariant={"pills"}
                      singleLineColumnPreview={activeTab !== "movement"}
                      maxColumnPills={activeTab === "movement" ? 8 : 6}
                      hideTypeLabel={activeTab === "movement"}
                      hidePublishedBadge={activeTab === "movement"}
                      dataSource={ds}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

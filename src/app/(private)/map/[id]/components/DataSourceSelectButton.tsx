import { PlusIcon, RotateCwIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
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
import { useDataSources } from "../hooks/useDataSources";
import { useMapViews } from "../hooks/useMapViews";
import type { DataSourceWithImportInfo } from "@/components/DataSourceItem";

export default function DataSourceSelectButton({
  className,
  dataSource,
  onClickRemove,
  onSelect,
  selectButtonText,
}: {
  className?: string | null | undefined;
  dataSource?: DataSourceWithImportInfo | null | undefined;
  onClickRemove?: () => void;
  onSelect: (dataSourceId: string) => void;
  selectButtonText?: string | null | undefined;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DataSourceSelectButtonModalTrigger
        className={className}
        dataSource={dataSource}
        setIsModalOpen={setIsModalOpen}
        onClickRemove={onClickRemove}
        selectButtonText={selectButtonText}
      />
      <DataSourceSelectModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        onSelect={onSelect}
      />
    </>
  );
}

function DataSourceSelectButtonModalTrigger({
  className,
  dataSource,
  setIsModalOpen,
  onClickRemove,
  selectButtonText,
}: {
  className?: string | null | undefined;
  dataSource?: DataSourceWithImportInfo | null | undefined;
  setIsModalOpen: (o: boolean) => void;
  onClickRemove?: () => void;
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
    <div>
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
        <DataSourceItem className="shadow-xs" dataSource={dataSource} />
      </button>
      <div className="flex justify-between gap-2 mt-1">
        <Button
          variant="ghost"
          className="text-xs font-normal text-muted-foreground hover:text-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <span>Change data source</span>
          <RotateCwIcon className="w-2 h-2" />
        </Button>
        {onClickRemove && (
          <Button
            variant="ghost"
            className="text-xs font-normal text-muted-foreground hover:text-destructive"
            onClick={onClickRemove}
          >
            <span>Remove</span>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DataSourceSelectModal({
  isModalOpen,
  setIsModalOpen,
  onSelect,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
  onSelect: (dataSourceId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"movement" | "user">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: dataSources,
    isPending: dataSourcesPending,
    isError: dataSourcesIsError,
    error: dataSourcesError,
  } = useDataSources();
  const { viewConfig } = useMapViews();
  const prevIsModalOpenRef = useRef(isModalOpen);
  const [movementMetaById, setMovementMetaById] = useState<
    Record<
      string,
      {
        defaultColumn?: string;
        title?: string;
        icon?: string;
        description?: string;
      }
        | undefined
    >
  >({});

  useEffect(() => {
    const wasOpen = prevIsModalOpenRef.current;
    prevIsModalOpenRef.current = isModalOpen;
    if (wasOpen || !isModalOpen) return;

    const activeId = viewConfig.areaDataSourceId;
    if (!activeId) return;

    const active = dataSources?.find((ds) => ds.id === activeId);
    if (!active) return;

    setActiveTab(active.public ? "movement" : "user");
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

    sources =
      activeTab === "movement"
        ? sources.filter((ds) => ds.public)
        : sources.filter((ds) => !ds.public);

    return sources;
  }, [activeTab, dataSources, searchQuery]);

  const fetchedCount = dataSources?.length ?? 0;
  const filteredCount = filteredAndSearchedDataSources.length;

  useEffect(() => {
    if (activeTab !== "movement") return;
    const ids = filteredAndSearchedDataSources.map((ds) => ds.id);
    const missing = ids.filter((id) => movementMetaById[id] === undefined);
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetch(`/api/data-source-previews/${id}/meta`);
            if (!res.ok)
              return [
                id,
                {
                  defaultColumn: undefined,
                  title: undefined,
                  icon: undefined,
                  description: undefined,
                },
              ] as const;
            const json = (await res.json()) as {
              title?: string;
              description?: string;
              icon?: string;
              defaultVisualisation?: { defaultColumn?: string };
            };
            return [
              id,
              {
                defaultColumn: json.defaultVisualisation?.defaultColumn,
                title: json.title,
                icon: json.icon,
                description: json.description,
              },
            ] as const;
          } catch {
            return [
              id,
              {
                defaultColumn: undefined,
                title: undefined,
                icon: undefined,
                description: undefined,
              },
            ] as const;
          }
        }),
      );
      if (cancelled) return;
      setMovementMetaById((prev) => {
        const next = { ...prev };
        for (const [id, meta] of entries) next[id] = meta;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, filteredAndSearchedDataSources, movementMetaById]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl h-[80vh] overflow-hidden !flex !flex-col">
        <DialogHeader>
          <DialogTitle>Select data source for visualisation</DialogTitle>
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
          <div className="flex-1 overflow-auto min-h-[28rem]">
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
                {activeTab === "user" ? "User data" : "Movement data library"}).
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
                        activeTab === "user" ? "compact" : "compactPreview"
                      }
                      previewImageUrl={
                        activeTab === "movement"
                          ? `/data-source-previews/${ds.id}.jpg`
                          : undefined
                      }
                      showColumnPreview={true}
                      columnPreviewVariant={
                        "pills"
                      }
                      singleLineColumnPreview={activeTab === "user"}
                      maxColumnPills={activeTab === "user" ? 6 : 8}
                      defaultColumnName={
                        activeTab === "movement"
                          ? movementMetaById[ds.id]?.defaultColumn
                          : undefined
                      }
                      overrideTitle={
                        activeTab === "movement"
                          ? movementMetaById[ds.id]?.title
                          : undefined
                      }
                      overrideIconName={
                        activeTab === "movement"
                          ? movementMetaById[ds.id]?.icon
                          : undefined
                      }
                      hideTypeLabel={activeTab === "movement"}
                      dataSource={{
                        ...ds,
                        ...(activeTab === "movement" && {
                          movementLibraryDescription:
                            movementMetaById[ds.id]?.description,
                        }),
                      } as DataSourceWithImportInfo & {
                        movementLibraryDescription?: string;
                      }}
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

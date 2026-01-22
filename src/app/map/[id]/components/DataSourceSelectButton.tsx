import { PlusIcon, RotateCwIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DataSourceItem } from "@/components/DataSourceItem";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { useDataSources } from "../hooks/useDataSources";
import { useMapViews } from "../hooks/useMapViews";
import type { DataSourceWithImportInfo } from "@/components/DataSourceItem";
import type { AreaSetCode } from "@/server/models/AreaSet";

export default function DataSourceSelectButton({
  areaSetCode,
  className,
  dataSource,
  onClickRemove,
  onSelect,
  selectButtonText,
}: {
  areaSetCode?: AreaSetCode | null | undefined;
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
        areaSetCode={areaSetCode}
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

function DataSourceSelectModal({
  areaSetCode,
  isModalOpen,
  setIsModalOpen,
  onSelect,
}: {
  areaSetCode?: AreaSetCode | null | undefined;
  isModalOpen: boolean;
  setIsModalOpen: (o: boolean) => void;
  onSelect: (dataSourceId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "public" | "user">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: dataSources } = useDataSources();
  const { viewConfig } = useMapViews();

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

    if (activeTab === "public") {
      // Include only public data sources
      sources = sources.filter((ds) => ds.public);
    } else if (activeTab === "user") {
      // Include only user data sources
      sources = sources.filter((ds) => !ds.public);
    }

    if (areaSetCode) {
      sources = sources.filter((ds) => {
        if (!("areaSetCode" in ds.geocodingConfig)) {
          return false;
        }
        return ds.geocodingConfig.areaSetCode === areaSetCode;
      });
    }

    return sources;
  }, [activeTab, areaSetCode, dataSources, searchQuery]);
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select data source for visualisation</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Search and Filter Bar */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search data sources..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "all" | "public" | "user")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="public">Public library</SelectItem>
                <SelectItem value="user">My data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Source Grid */}
          <div className="flex-1">
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
                    dataSource={{
                      ...ds,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

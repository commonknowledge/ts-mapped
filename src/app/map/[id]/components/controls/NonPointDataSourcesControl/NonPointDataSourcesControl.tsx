import { Database, LoaderPinwheel, PlusIcon } from "lucide-react";
import { useState } from "react";

import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { LayerType } from "@/types";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import NonPointDataSourcesList from "./NonPointDataSourcesList";
import NonPointDataSourceSelectionModal from "./NonPointDataSourceSelectionModal";

export default function NonPointDataSourcesControl() {
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();
  const [expanded, setExpanded] = useState(true);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);

  const handleSelectNonPointDataSource = (
    dataSourceId: string,
    isSelected: boolean
  ) => {
    const currentIds = mapConfig.nonPointDataSourceIds || [];
    updateMapConfig({
      nonPointDataSourceIds: isSelected
        ? currentIds.filter((id) => id !== dataSourceId)
        : [...currentIds, dataSourceId],
    });
  };

  const getDropdownItems = () => [
    {
      type: "item" as const,
      label: "Add data source",
      icon: <Database className="w-4 h-4 text-neutral-600" />,
      onClick: () => setIsDataSourceModalOpen(true),
    },
  ];

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Geo Data"
        type={LayerType.DataLayer}
        expanded={expanded}
        setExpanded={setExpanded}
      >
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Add data source"
          dropdownLabel="Data source options"
          dropdownItems={getDropdownItems()}
        >
          <PlusIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>
      {expanded && (
        <div className="px-4 pb-3">
          <NonPointDataSourcesList />
        </div>
      )}

      <NonPointDataSourceSelectionModal
        open={isDataSourceModalOpen}
        onOpenChange={setIsDataSourceModalOpen}
        dataSources={dataSources || []}
        selectedNonPointDataSourceIds={mapConfig.nonPointDataSourceIds || []}
        onSelectNonPointDataSource={handleSelectNonPointDataSource}
      />
    </LayerControlWrapper>
  );
}

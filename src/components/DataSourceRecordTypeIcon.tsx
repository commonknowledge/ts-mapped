import { Boxes, CalendarDays, Database, MapPin, Users } from "lucide-react";
import { DataSourceRecordType } from "@/__generated__/types";

const dataSourceRecordTypeIcons: Record<DataSourceRecordType, React.ReactNode> =
  {
    [DataSourceRecordType.Members]: <Users className="w-4 h-4" />,
    [DataSourceRecordType.Data]: <Database className="w-4 h-4" />,
    [DataSourceRecordType.Events]: <CalendarDays className="w-4 h-4" />,
    [DataSourceRecordType.Locations]: <MapPin className="w-4 h-4" />,
    [DataSourceRecordType.People]: <Users className="w-4 h-4" />,
    [DataSourceRecordType.Other]: <Boxes className="w-4 h-4" />,
  };

const dataSourceRecordTypeColors: Record<DataSourceRecordType, string> = {
  [DataSourceRecordType.Members]: " var(--brandBlue)",
  [DataSourceRecordType.Data]: "var(--brandGreen)",
  [DataSourceRecordType.Events]: "var(--brandPurple)",
  [DataSourceRecordType.Locations]: "var(--brandRed)",
  [DataSourceRecordType.People]: "var(--brandRoyalBlue)",
  [DataSourceRecordType.Other]: "var(--brandGray)",
};

const dataSourceRecordTypeLabels: Record<DataSourceRecordType, string> = {
  [DataSourceRecordType.Members]: "Members",
  [DataSourceRecordType.Data]: "Reference Data",
  [DataSourceRecordType.Events]: "Events",
  [DataSourceRecordType.Locations]: "Locations",
  [DataSourceRecordType.People]: "People",
  [DataSourceRecordType.Other]: "Other",
};

interface DataSourceRecordTypeIconProps {
  type: DataSourceRecordType;
  showLabel?: boolean;
  className?: string;
}

export const DataSourceRecordTypeIcon = ({
  type,
  showLabel = false,
  className = "",
}: DataSourceRecordTypeIconProps) => {
  const icon = dataSourceRecordTypeIcons[type];
  const color = dataSourceRecordTypeColors[type];
  const label = dataSourceRecordTypeLabels[type];

  if (showLabel) {
    return (
      <span className={`flex items-center gap-1 ${className}`}>
        <span style={{ color }}>{icon}</span>
        <span className="text-sm">{label}</span>
      </span>
    );
  }

  return (
    <span style={{ color }} className={`${className}`}>
      {icon}
    </span>
  );
};

export {
  dataSourceRecordTypeIcons,
  dataSourceRecordTypeColors,
  dataSourceRecordTypeLabels,
};

import {
  Boxes,
  CalendarDays,
  Database,
  MapPin,
  UserCheck,
  Users,
} from "lucide-react";
import { DataSourceRecordType } from "@/server/models/DataSource";

export const dataSourceRecordTypeColors: Record<DataSourceRecordType, string> =
  {
    [DataSourceRecordType.Members]: " var(--brandBlue)",
    [DataSourceRecordType.Data]: "var(--brandGreen)",
    [DataSourceRecordType.Events]: "var(--brandPurple)",
    [DataSourceRecordType.Locations]: "var(--brandRed)",
    [DataSourceRecordType.People]: "var(--brandRoyalBlue)",
    [DataSourceRecordType.Other]: "var(--brandGray)",
  };

export const dataSourceRecordTypeLabels: Record<DataSourceRecordType, string> =
  {
    [DataSourceRecordType.Members]: "Members",
    [DataSourceRecordType.Data]: "Reference data",
    [DataSourceRecordType.Events]: "Events",
    [DataSourceRecordType.Locations]: "Locations",
    [DataSourceRecordType.People]: "People",
    [DataSourceRecordType.Other]: "Other",
  };

interface DataSourceRecordTypeIconProps {
  type: DataSourceRecordType;
  className?: string;
  showLabel?: boolean;
  size?: number;
  withBackground?: boolean;
}

export const DataSourceRecordTypeIcon = ({
  type,
  showLabel = false,
  size = 20,
  withBackground = false,
  className = "",
}: DataSourceRecordTypeIconProps) => {
  const dataSourceRecordTypeIcons: Record<
    DataSourceRecordType,
    React.ReactNode
  > = {
    [DataSourceRecordType.Members]: <UserCheck size={size} />,
    [DataSourceRecordType.Data]: <Database size={size} />,
    [DataSourceRecordType.Events]: <CalendarDays size={size} />,
    [DataSourceRecordType.Locations]: <MapPin size={size} />,
    [DataSourceRecordType.People]: <Users size={size} />,
    [DataSourceRecordType.Other]: <Boxes size={size} />,
  };

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

  if (withBackground) {
    return (
      <div
        className={`shrink-0 aspect-square rounded flex items-center justify-center text-white ${className}`}
        style={{
          background: color || "var(--brandGray)",
        }}
      >
        <span>{icon}</span>
      </div>
    );
  }

  return (
    <span style={{ color }} className={`${className}`}>
      {icon}
    </span>
  );
};

export default DataSourceRecordTypeIcon;

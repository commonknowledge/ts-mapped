"use client";

import {
  Activity,
  Anchor,
  BarChart2,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Flag,
  Globe,
  Heart,
  Home,
  Info,
  Layers,
  Map,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

// ============================================================================
// PANEL ICON OPTIONS
// ============================================================================

export interface InspectorIconOption {
  value: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

export const INSPECTOR_ICON_OPTIONS: InspectorIconOption[] = [
  { value: "", label: "Default (data source icon)", Icon: Database },
  { value: "database", label: "Database", Icon: Database },
  { value: "map-pin", label: "Map pin", Icon: MapPin },
  { value: "map", label: "Map", Icon: Map },
  { value: "users", label: "People", Icon: Users },
  { value: "bar-chart-2", label: "Chart", Icon: BarChart2 },
  { value: "activity", label: "Activity", Icon: Activity },
  { value: "building", label: "Building", Icon: Building },
  { value: "home", label: "Home", Icon: Home },
  { value: "calendar", label: "Calendar", Icon: Calendar },
  { value: "clock", label: "Clock", Icon: Clock },
  { value: "flag", label: "Flag", Icon: Flag },
  { value: "globe", label: "Globe", Icon: Globe },
  { value: "star", label: "Star", Icon: Star },
  { value: "heart", label: "Heart", Icon: Heart },
  { value: "check-circle", label: "Check", Icon: CheckCircle },
  { value: "book-open", label: "Book", Icon: BookOpen },
  { value: "briefcase", label: "Briefcase", Icon: Briefcase },
  { value: "layers", label: "Layers", Icon: Layers },
  { value: "anchor", label: "Anchor", Icon: Anchor },
  { value: "info", label: "Info", Icon: Info },
];

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> =
  Object.fromEntries(INSPECTOR_ICON_OPTIONS.map((o) => [o.value, o.Icon]));

export function InspectorPanelIcon({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const Icon = ICON_MAP[iconName] ?? Database;
  return <Icon className={className} />;
}

// ============================================================================
// PANEL COLOR OPTIONS
// ============================================================================

export interface InspectorColorOption {
  value: string;
  label: string;
  className: string;
}

export const INSPECTOR_COLOR_OPTIONS: InspectorColorOption[] = [
  { value: "", label: "Default", className: "" },
  { value: "blue", label: "Blue", className: "bg-blue-50" },
  { value: "green", label: "Green", className: "bg-green-50" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-50" },
  { value: "red", label: "Red", className: "bg-red-50" },
  { value: "purple", label: "Purple", className: "bg-purple-50" },
  { value: "pink", label: "Pink", className: "bg-pink-50" },
  { value: "orange", label: "Orange", className: "bg-orange-50" },
  { value: "teal", label: "Teal", className: "bg-teal-50" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-50" },
  { value: "gray", label: "Gray", className: "bg-gray-50" },
];

const COLOR_CLASS_MAP: Record<string, string> = Object.fromEntries(
  INSPECTOR_COLOR_OPTIONS.map((o) => [o.value, o.className]),
);

export function getInspectorColorClass(color?: string | null): string {
  if (!color) return "";
  return COLOR_CLASS_MAP[color] ?? "";
}

// ============================================================================
// BAR COLOR OPTIONS
// ============================================================================

export const DEFAULT_BAR_COLOR_VALUE = "__default__";
export const SMART_MATCH_BAR_COLOR_VALUE = "__smart__";

interface BarColorOption {
  value: string;
  label: string;
  hex: string;
}

export const INSPECTOR_BAR_COLOR_OPTIONS: BarColorOption[] = [
  { value: DEFAULT_BAR_COLOR_VALUE, label: "Default (primary)", hex: "" },
  { value: SMART_MATCH_BAR_COLOR_VALUE, label: "Smart match", hex: "" },
  { value: "#3b82f6", label: "Blue", hex: "#3b82f6" },
  { value: "#22c55e", label: "Green", hex: "#22c55e" },
  { value: "#f59e0b", label: "Amber", hex: "#f59e0b" },
  { value: "#ef4444", label: "Red", hex: "#ef4444" },
  { value: "#8b5cf6", label: "Purple", hex: "#8b5cf6" },
  { value: "#ec4899", label: "Pink", hex: "#ec4899" },
  { value: "#f97316", label: "Orange", hex: "#f97316" },
  { value: "#14b8a6", label: "Teal", hex: "#14b8a6" },
  { value: "#6366f1", label: "Indigo", hex: "#6366f1" },
  { value: "#6b7280", label: "Gray", hex: "#6b7280" },
];

// Colour heuristics keyed on words in column names
const SMART_COLOR_RULES: { keywords: string[]; color: string; label: string }[] =
  [
    { keywords: ["labour", "labor"], color: "#ef4444", label: "Labour red" },
    { keywords: ["conservative", "tory"], color: "#3b82f6", label: "Conservative blue" },
    { keywords: ["liberal", "lib dem", "libdem"], color: "#f59e0b", label: "Lib Dem amber" },
    { keywords: ["green"], color: "#22c55e", label: "Green" },
    { keywords: ["snp", "plaid"], color: "#f59e0b", label: "SNP/Plaid amber" },
    { keywords: ["reform"], color: "#14b8a6", label: "Reform teal" },
  ];

export function getSmartMatchInfo(
  displayName: string,
  columnName: string,
): { color: string; matchLabel: string } {
  const combined = `${displayName} ${columnName}`.toLowerCase();
  for (const rule of SMART_COLOR_RULES) {
    if (rule.keywords.some((k) => combined.includes(k))) {
      return { color: rule.color, matchLabel: rule.label };
    }
  }
  return { color: "hsl(var(--primary))", matchLabel: "default" };
}

export function getBarColorForLabel(
  displayName: string,
  columnName: string,
  _index: number,
  barColor?: string | null,
): string {
  if (barColor === DEFAULT_BAR_COLOR_VALUE || !barColor) {
    return "hsl(var(--primary))";
  }
  if (barColor === SMART_MATCH_BAR_COLOR_VALUE) {
    return getSmartMatchInfo(displayName, columnName).color;
  }
  return barColor;
}

"use client";

import {
  Car,
  CircleDollarSign,
  Database,
  Heart,
  Home,
  Leaf,
  MapPin,
  Scale,
  Table2,
  Users,
  UtensilsCrossed,
  Vote,
  Wifi,
} from "lucide-react";
import React from "react";
import { COLOR_PALETTE_DATA } from "@/components/ColorPalette";

/** Sentinel for default bar colour (primary only, no smart match). */
export const DEFAULT_BAR_COLOR_VALUE = "__default__";

/** Sentinel for smart match (party/palette by column name). */
export const SMART_MATCH_BAR_COLOR_VALUE = "__smart__";

/** Bar colour options (percentage/scale bars and chart). Default = primary, Smart match = party/palette. */
export const INSPECTOR_BAR_COLOR_OPTIONS: { value: string; label: string; hex: string }[] = [
  { value: DEFAULT_BAR_COLOR_VALUE, label: "Default", hex: "hsl(var(--primary))" },
  { value: SMART_MATCH_BAR_COLOR_VALUE, label: "Smart match", hex: "transparent" },
  ...COLOR_PALETTE_DATA.map((c) => ({ value: c.hex, label: c.name, hex: c.hex })),
];

/**
 * UK (and NI/IRL) political party colours. Patterns are matched as substrings (case-insensitive)
 * against column name and display name. Order matters: more specific patterns first.
 * partyName is used for "Smart match (Party name)" in the UI.
 */
const POLITICAL_PARTY_COLORS: { patterns: string[]; color: string; partyName: string }[] = [
  { patterns: ["conservative", "con ", " con", "con %", "con%"], color: "#0087DC", partyName: "Conservative" },
  { patterns: ["labour", "lab ", " lab", "lab %", "lab%"], color: "#E4003B", partyName: "Labour" },
  { patterns: ["liberal democrat", "lib dem", "ld ", " ld", "ld %", "ld%"], color: "#FAA61A", partyName: "Liberal Democrat" },
  { patterns: ["scottish national", "snp "], color: "#FDF38E", partyName: "Scottish National Party" },
  { patterns: ["green ", " green", "green %", "green%"], color: "#6AB023", partyName: "Green party" },
  { patterns: ["reform uk", "reform ", " reform", "reform %", "ruk ", " ruk", "ruk %", "ruk%"], color: "#00AEEF", partyName: "Reform UK" },
  { patterns: ["ukip", "uk indep"], color: "#70147A", partyName: "UKIP" },
  { patterns: ["plaid cymru", "plaid", "pc ", " pc", "pc %", "pc%"], color: "#008142", partyName: "Plaid Cymru" },
  { patterns: ["sinn féin", "sinn fein", "sf ", " sf", "sf %", "sf%"], color: "#326760", partyName: "Sinn Féin" },
  { patterns: ["democratic unionist", "dup "], color: "#D46A4C", partyName: "DUP" },
  { patterns: ["ulster unionist", "ulster union", "uup ", " uup", "uup %", "uup%"], color: "#80BD41", partyName: "UUP" },
  { patterns: ["social democratic", "sdlp"], color: "#2AA82C", partyName: "SDLP" },
  { patterns: ["alliance ", " alliance", "alliance %"], color: "#F6CB2F", partyName: "Alliance" },
  { patterns: ["traditional unionist", "tuv "], color: "#000080", partyName: "TUV" },
  { patterns: ["other win", "other ", " other", "other %", "other%"], color: "#6B7280", partyName: "Other" },
];

/** Fallback palette when no party match; looped by index. */
const BAR_COLOR_FALLBACK_PALETTE = [
  "#0087DC",
  "#E4003B",
  "#FAA61A",
  "#6AB023",
  "#00AEEF",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#3498DB",
  "#2ECC71",
];

function normaliseForMatching(s: string): string {
  return `${s.toLowerCase().replace(/%/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** Simple hash so the same label+column gets the same fallback colour in list and chart. */
function hashForFallback(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

const PRIMARY_HEX = "hsl(var(--primary))";

/**
 * Returns the smart-matched colour and display label (e.g. "Green party", "Palette") for the dropdown.
 */
export function getSmartMatchInfo(
  label: string,
  columnName: string,
): { color: string; matchLabel: string } {
  const combined = normaliseForMatching(label) + normaliseForMatching(columnName);
  for (const { patterns, color, partyName } of POLITICAL_PARTY_COLORS) {
    for (const p of patterns) {
      const plain = p.trim().toLowerCase();
      if (plain.length >= 2 && combined.includes(plain)) {
        return { color, matchLabel: partyName };
      }
    }
  }
  const fallbackIndex = hashForFallback(combined + columnName) % BAR_COLOR_FALLBACK_PALETTE.length;
  return {
    color: BAR_COLOR_FALLBACK_PALETTE[fallbackIndex],
    matchLabel: "Palette",
  };
}

/**
 * Resolve bar colour: __default__ = primary; __smart__ / empty / undefined = smart match; else explicit hex.
 * Same label+column always gets the same colour so list and chart stay in sync.
 */
export function getBarColorForLabel(
  label: string,
  columnName: string,
  _index: number,
  explicitBarColor?: string | null,
): string {
  const trimmed = explicitBarColor?.trim();
  if (trimmed === DEFAULT_BAR_COLOR_VALUE) return PRIMARY_HEX;
  if (trimmed && trimmed !== SMART_MATCH_BAR_COLOR_VALUE) return trimmed;

  const { color } = getSmartMatchInfo(label, columnName);
  return color;
}

import type { LucideIcon } from "lucide-react";

/** General/sector icon options for inspector data source panels */
export const INSPECTOR_ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "", label: "Default", Icon: Database },
  { value: "Users", label: "People / community", Icon: Users },
  { value: "UtensilsCrossed", label: "Food / access", Icon: UtensilsCrossed },
  { value: "Scale", label: "Deprivation / need", Icon: Scale },
  { value: "Vote", label: "Polling / democracy", Icon: Vote },
  { value: "Wifi", label: "Connectivity", Icon: Wifi },
  { value: "Heart", label: "Health", Icon: Heart },
  { value: "Home", label: "Housing", Icon: Home },
  { value: "Leaf", label: "Environment", Icon: Leaf },
  { value: "Car", label: "Transport", Icon: Car },
  { value: "CircleDollarSign", label: "Economy", Icon: CircleDollarSign },
  { value: "MapPin", label: "Place / location", Icon: MapPin },
  { value: "Table2", label: "Data / table", Icon: Table2 },
];

const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  INSPECTOR_ICON_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.Icon]),
);

export function getInspectorIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null;
  return iconMap[iconName] ?? null;
}

/** Renders the chosen inspector panel icon (use this to avoid creating component during render) */
export function InspectorPanelIcon({
  iconName,
  className,
}: {
  iconName: string | null | undefined;
  className?: string;
}) {
  const Icon = getInspectorIcon(iconName);
  return Icon ? React.createElement(Icon, { className }) : null;
}

/** Map layer-panel colour names to Tailwind bg classes (same order as ColorPalette) */
const LAYER_COLOR_NAME_TO_BG: Record<string, string> = {
  Red: "bg-red-50",
  Blue: "bg-blue-50",
  Green: "bg-green-50",
  Orange: "bg-orange-50",
  Purple: "bg-violet-50",
  Turquoise: "bg-teal-50",
  Carrot: "bg-amber-50",
  "Dark Blue Grey": "bg-slate-100",
  "Dark Red": "bg-rose-50",
  "Light Blue": "bg-sky-50",
  Emerald: "bg-emerald-50",
  "Dark Purple": "bg-purple-100",
};

/** Same colours as layer panel (ColorPalette), for inspector panel background */
export const INSPECTOR_COLOR_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: "", label: "Default", className: "bg-neutral-100" },
  ...COLOR_PALETTE_DATA.map((c) => ({
    value: c.name,
    label: c.name,
    className: LAYER_COLOR_NAME_TO_BG[c.name] ?? "bg-neutral-100",
  })),
];

export function getInspectorColorClass(color: string | null | undefined): string {
  if (!color) return "bg-neutral-100";
  const option = INSPECTOR_COLOR_OPTIONS.find((o) => o.value === color);
  return option ? option.className : "bg-neutral-100";
}

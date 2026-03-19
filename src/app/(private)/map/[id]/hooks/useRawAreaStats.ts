import { useMemo } from "react";
import { useAreaStats } from "../data";
import type { AreaSetCode } from "@/models/AreaSet";

export interface RawAreaStat {
  primary: unknown | null | undefined;
  secondary: unknown | null | undefined;
  primaryColumn: string | null | undefined;
  secondaryColumn: string | null | undefined;
}

export const useRawAreaStat = <
  T extends { code: string; name: string; areaSetCode: AreaSetCode },
>(
  area: T | null | undefined,
): RawAreaStat | null => {
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  return useMemo(() => {
    if (!areaStats) {
      return null;
    }
    const areaStat = areaStats.stats.find(
      (s) =>
        s.areaCode === area?.code &&
        areaStats.areaSetCode === area?.areaSetCode,
    );
    if (!areaStat) {
      return null;
    }
    return {
      primary: areaStat.primary,
      secondary: areaStat.secondary,
      primaryColumn: areaStats.primary?.column,
      secondaryColumn: areaStats.secondary?.column,
    };
  }, [area, areaStats]);
};

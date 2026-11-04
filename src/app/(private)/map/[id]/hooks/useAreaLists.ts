"use client";

import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { AREA_LIST_MAX_AREAS } from "@/models/Map";
import {
  hiddenAreaListIdsAtom,
  inspectedAreaListIdAtom,
} from "../atoms/areaListAtoms";
import { AREA_LIST_COLORS } from "../constants";
import { useMapConfig } from "./useMapConfig";
import type { AreaSetCode } from "@/models/AreaSet";
import type { AreaList } from "@/models/Map";

type ListedArea = AreaList["areas"][number];

/**
 * The map's lists of key areas (e.g. target seats): kept in the map's
 * settings, so every view shares them
 */
export function useAreaLists() {
  const { mapConfig, updateMapConfig } = useMapConfig();
  const lists = useMemo(() => mapConfig.areaLists ?? [], [mapConfig.areaLists]);
  const save = useCallback(
    (next: AreaList[]) => updateMapConfig({ areaLists: next }),
    [updateMapConfig],
  );

  const createList = useCallback(
    ({
      name,
      areaSetCode,
      areas = [],
      origin,
    }: {
      name: string;
      areaSetCode: AreaSetCode;
      areas?: ListedArea[];
      origin?: AreaList["origin"];
    }): AreaList => {
      const list: AreaList = {
        id: uuidv4(),
        name: name.trim() || `List ${lists.length + 1}`,
        color: AREA_LIST_COLORS[lists.length % AREA_LIST_COLORS.length],
        areaSetCode,
        areas: areas.slice(0, AREA_LIST_MAX_AREAS),
        ...(origin ? { origin } : {}),
      };
      save([...lists, list]);
      return list;
    },
    [lists, save],
  );

  const updateList = useCallback(
    (id: string, patch: Partial<Pick<AreaList, "name" | "color">>) =>
      save(
        lists.map((list) => (list.id === id ? { ...list, ...patch } : list)),
      ),
    [lists, save],
  );

  const removeList = useCallback(
    (id: string) => {
      const index = lists.findIndex((list) => list.id === id);
      const removed = lists[index];
      if (!removed) return;
      save(lists.filter((list) => list.id !== id));
      toast.success(`Deleted ${removed.name}`, {
        action: {
          label: "Undo",
          onClick: () =>
            save([
              ...lists.slice(0, index),
              removed,
              ...lists.slice(index).filter((list) => list.id !== id),
            ]),
        },
      });
    },
    [lists, save],
  );

  const setInList = useCallback(
    ({
      listId,
      area,
      isIn,
    }: {
      listId: string;
      area: ListedArea;
      isIn: boolean;
    }) =>
      save(
        lists.map((list) => {
          if (list.id !== listId) return list;
          const without = list.areas.filter((a) => a.code !== area.code);
          return {
            ...list,
            areas: isIn
              ? [...without, area].slice(0, AREA_LIST_MAX_AREAS)
              : without,
          };
        }),
      ),
    [lists, save],
  );

  /** The lists an area is in */
  const listsContaining = useCallback(
    ({ code, areaSetCode }: { code: string; areaSetCode: AreaSetCode }) =>
      lists.filter(
        (list) =>
          list.areaSetCode === areaSetCode &&
          list.areas.some((area) => area.code === code),
      ),
    [lists],
  );

  return {
    lists,
    createList,
    updateList,
    removeList,
    setInList,
    listsContaining,
  };
}

/** Which lists are outlined on the map; all are, until hidden */
export function useAreaListVisibility() {
  const [hidden, setHidden] = useAtom(hiddenAreaListIdsAtom);
  const isVisible = useCallback((id: string) => !hidden[id], [hidden]);
  const setVisible = useCallback(
    (id: string, visible: boolean) =>
      setHidden((prev) => ({ ...prev, [id]: !visible })),
    [setHidden],
  );
  return { isVisible, setVisible };
}

/** The list open in the inspector's place (null when none, or deleted) */
export function useInspectedAreaList() {
  const { lists } = useAreaLists();
  const [id, setId] = useAtom(inspectedAreaListIdAtom);
  const list = lists.find((candidate) => candidate.id === id) ?? null;
  return { list, inspect: setId };
}

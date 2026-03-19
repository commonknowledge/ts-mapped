import { atom } from "jotai";
import type { Point } from "@/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";

export type PublicMapData = RouterOutputs["publicMap"]["get"];

// Pure-UI atoms (not backed by server state)
export const searchLocationAtom = atom<Point | null>(null);
export const activeDataSourceIdAtom = atom<string | null>(null);
export const activePublishTabAtom = atom<string>("settings");

// Host availability state: null = not checked, true = available, false = taken
export const hostAvailableAtom = atom<boolean | null>(null);

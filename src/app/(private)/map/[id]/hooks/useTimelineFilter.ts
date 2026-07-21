"use client";

import { useAtom } from "jotai";
import { timelinePlaybackRangeAtom } from "../atoms/markerAtoms";
import { useMapViews } from "./useMapViews";

export interface TimelineRange {
  start: number;
  end: number;
}

/**
 * The timeline filter is part of the view config, so each view keeps its
 * own range (like table filters), saved with the view. During playback a
 * transient range overrides it, committed to the view only when playback
 * stops — manual changes outside playback save as normal.
 */
export function useTimelineFilter(): {
  /** Inclusive month-key range to filter markers to, or null when the
   *  view shows all time. Reflects playback while it is running. */
  activeRange: TimelineRange | null;
  /** Set (or clear) the saved filter on the view. */
  setTimelineFilter: (range: TimelineRange | null) => void;
  playbackRange: TimelineRange | null;
  setPlaybackRange: (range: TimelineRange | null) => void;
} {
  const { viewConfig, updateViewConfig } = useMapViews();
  const [playbackRange, setPlaybackRange] = useAtom(timelinePlaybackRangeAtom);
  return {
    activeRange: playbackRange ?? viewConfig.timelineFilter ?? null,
    setTimelineFilter: (range) =>
      updateViewConfig({ timelineFilter: range ?? undefined }),
    playbackRange,
    setPlaybackRange,
  };
}

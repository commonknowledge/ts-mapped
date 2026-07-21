"use client";

import { format } from "date-fns";
import {
  ChartBarIcon,
  ChevronUpIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarkerQueries } from "@/app/(private)/map/[id]/hooks/useMarkerQueries";
import { cn } from "@/shadcn/utils";
import { useTimelineFilter } from "../hooks/useTimelineFilter";

// Bars aggregate whole months into calendar-aligned buckets so the
// histogram stays readable however long the data spans
const TARGET_MAX_BARS = 100;
const BUCKET_SIZES_MONTHS = [1, 3, 6, 12];

const HISTOGRAM_WIDTH = 560;
const HISTOGRAM_HEIGHT = 48;

// Play steps the selected window one bucket to the right at this pace
const PLAY_INTERVAL_MS = 600;

function monthKeyLabel(key: number): string {
  return format(new Date(Math.floor(key / 12), key % 12, 1), "MMM yyyy");
}

/**
 * Month-granularity timeline for markers: a histogram of incident counts
 * with a draggable range (either handle), click-a-bar to jump to that
 * period, and a reset back to all time. Shows when at least one loaded
 * marker source provides record months (a dateColumn role on the data
 * source).
 */
export default function TimelineControl() {
  const markerQueries = useMarkerQueries();
  const { activeRange, setTimelineFilter, playbackRange, setPlaybackRange } =
    useTimelineFilter();
  const filterActive = Boolean(activeRange);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<"start" | "end" | null>(null);
  // Dragging the selected window itself (between the handles)
  const dragWindowRef = useRef<{
    pointerIndex: number;
    startIndex: number;
    width: number;
    moved: boolean;
  } | null>(null);

  const [playing, setPlaying] = useState(false);
  const [minimized, setMinimized] = useState(false);
  // The interval callback reads the latest selection through this ref,
  // synced after every render
  const playStateRef = useRef<{
    startIndex: number;
    endIndex: number;
    bucketCount: number;
    setRange: (start: number, end: number) => void;
    stop: () => void;
  } | null>(null);

  useEffect(() => {
    if (!playing) {
      return;
    }
    const interval = window.setInterval(() => {
      const playState = playStateRef.current;
      if (!playState) {
        return;
      }
      const { startIndex, endIndex, bucketCount, setRange, stop } = playState;
      if (endIndex >= bucketCount - 1) {
        stop();
        return;
      }
      setRange(startIndex + 1, endIndex + 1);
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [playing]);

  // Never leave a stale playback override behind
  useEffect(() => () => setPlaybackRange(null), [setPlaybackRange]);

  // Counts per month across sources with record months
  const { domain, countsByMonth } = useMemo(() => {
    const countsByMonth = new Map<number, number>();
    let min: number | null = null;
    let max: number | null = null;
    for (const dataSourceMarkers of markerQueries?.data ?? []) {
      for (const feature of dataSourceMarkers.markers) {
        const month = feature.properties.month;
        if (typeof month !== "number") {
          continue;
        }
        countsByMonth.set(month, (countsByMonth.get(month) ?? 0) + 1);
        if (min === null || month < min) {
          min = month;
        }
        if (max === null || month > max) {
          max = month;
        }
      }
    }
    return {
      domain: min !== null && max !== null ? { min, max } : null,
      countsByMonth,
    };
  }, [markerQueries]);

  const buckets = useMemo(() => {
    if (!domain) {
      return [];
    }
    const span = domain.max - domain.min + 1;
    const bucketSize =
      BUCKET_SIZES_MONTHS.find((size) => span / size <= TARGET_MAX_BARS) ??
      // Beyond yearly buckets, use as many whole years per bucket as needed
      Math.ceil(span / TARGET_MAX_BARS / 12) * 12;
    const firstBucket = Math.floor(domain.min / bucketSize);
    const lastBucket = Math.floor(domain.max / bucketSize);
    const result: { start: number; end: number; count: number }[] = [];
    for (let bucket = firstBucket; bucket <= lastBucket; bucket++) {
      const start = bucket * bucketSize;
      const end = start + bucketSize - 1;
      let count = 0;
      for (let month = start; month <= end; month++) {
        count += countsByMonth.get(month) ?? 0;
      }
      result.push({ start, end, count });
    }
    return result;
  }, [domain, countsByMonth]);

  // The selected range in bucket indices (full range when disabled)
  const clampMonth = (month: number) =>
    domain ? Math.min(domain.max, Math.max(domain.min, month)) : month;
  const selStart = domain
    ? activeRange
      ? clampMonth(activeRange.start)
      : domain.min
    : 0;
  const selEnd = domain
    ? activeRange
      ? clampMonth(activeRange.end)
      : domain.max
    : 0;
  const startBucketIndex = Math.max(
    0,
    buckets.findIndex((b) => selStart <= b.end),
  );
  const endBucketIndex = Math.max(
    0,
    buckets.findLastIndex((b) => selEnd >= b.start),
  );

  const toMonthRange = (startIndex: number, endIndex: number) => {
    const from = Math.max(0, Math.min(startIndex, endIndex));
    const to = Math.min(buckets.length - 1, Math.max(startIndex, endIndex));
    return {
      start: Math.max(domain?.min ?? 0, buckets[from].start),
      end: Math.min(domain?.max ?? 0, buckets[to].end),
    };
  };

  // While playing, range changes stay in the transient playback override so
  // the view is not saved on every step; manual changes save as normal
  const setRange = (startIndex: number, endIndex: number) => {
    if (!domain || buckets.length === 0) {
      return;
    }
    const range = toMonthRange(startIndex, endIndex);
    if (playing) {
      setPlaybackRange(range);
    } else {
      setTimelineFilter(range);
    }
  };

  // Stop playback, committing its final position to the view
  const stopPlaying = () => {
    setPlaying(false);
    if (playbackRange) {
      setTimelineFilter(playbackRange);
    }
    setPlaybackRange(null);
  };

  // Sync the ref the play interval reads (no deps: values change per render)
  useEffect(() => {
    playStateRef.current = {
      startIndex: startBucketIndex,
      endIndex: endBucketIndex,
      bucketCount: buckets.length,
      setRange,
      stop: stopPlaying,
    };
  });

  if (!domain || buckets.length < 2) {
    return null;
  }

  const rangeLabel = filterActive
    ? `${monthKeyLabel(Math.max(selStart, buckets[startBucketIndex].start))} – ${monthKeyLabel(
        Math.min(selEnd, buckets[endBucketIndex].end),
      )}`
    : "All time";

  if (minimized) {
    // The filter (and playback) stays active while minimised
    return (
      <button
        type="button"
        className="bg-white rounded shadow-md px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-auto cursor-pointer text-xs font-medium hover:bg-neutral-50"
        aria-label="Expand timeline"
        onClick={() => setMinimized(false)}
      >
        <ChartBarIcon size={14} />
        {filterActive && <span>{rangeLabel}</span>}
        <ChevronUpIcon size={14} className="text-muted-foreground" />
      </button>
    );
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  const reset = () => {
    setPlaying(false);
    setPlaybackRange(null);
    setTimelineFilter(null);
  };

  const handlePlayClick = () => {
    if (playing) {
      stopPlaying();
      return;
    }
    // The starting window goes straight into the playback override so the
    // view is only saved once playback stops
    if (!activeRange) {
      // Nothing selected: play the whole span from the first bucket
      setPlaybackRange(toMonthRange(0, 0));
    } else if (endBucketIndex >= buckets.length - 1) {
      // Already at the right edge: restart from the left, same window width
      setPlaybackRange(toMonthRange(0, endBucketIndex - startBucketIndex));
    }
    setPlaying(true);
  };

  const bucketIndexAtPointer = (clientX: number): number => {
    const rect = barsRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      return 0;
    }
    const fraction = (clientX - rect.left) / rect.width;
    return Math.max(
      0,
      Math.min(buckets.length - 1, Math.floor(fraction * buckets.length)),
    );
  };

  const handlePointerDown =
    (side: "start" | "end") => (e: React.PointerEvent<HTMLButtonElement>) => {
      draggingRef.current = side;
      e.currentTarget.setPointerCapture(e.pointerId);
    };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const side = draggingRef.current;
    if (!side) {
      return;
    }
    const index = bucketIndexAtPointer(e.clientX);
    if (side === "start") {
      setRange(Math.min(index, endBucketIndex), endBucketIndex);
    } else {
      setRange(startBucketIndex, Math.max(index, startBucketIndex));
    }
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const handleWindowPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragWindowRef.current = {
      pointerIndex: bucketIndexAtPointer(e.clientX),
      startIndex: startBucketIndex,
      width: endBucketIndex - startBucketIndex,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleWindowPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragWindowRef.current;
    if (!drag) {
      return;
    }
    const offset = bucketIndexAtPointer(e.clientX) - drag.pointerIndex;
    if (offset !== 0) {
      drag.moved = true;
    }
    const start = Math.max(
      0,
      Math.min(drag.startIndex + offset, buckets.length - 1 - drag.width),
    );
    setRange(start, start + drag.width);
  };

  const handleWindowPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragWindowRef.current;
    dragWindowRef.current = null;
    // A click without movement inside the window jumps to that bucket,
    // matching clicks on bars outside it
    if (drag && !drag.moved) {
      const index = bucketIndexAtPointer(e.clientX);
      setRange(index, index);
    }
  };

  // A few evenly spaced axis labels under the bars
  const labelCount = Math.min(5, buckets.length);
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    Math.round((i * (buckets.length - 1)) / Math.max(1, labelCount - 1)),
  );

  const handle = (side: "start" | "end", positionPct: number) => (
    <button
      type="button"
      aria-label={side === "start" ? "Range start" : "Range end"}
      className="absolute top-0 h-full w-2.5 -translate-x-1/2 cursor-ew-resize touch-none flex items-center justify-center"
      style={{ left: `${positionPct}%` }}
      onPointerDown={handlePointerDown(side)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <span className="h-full w-1 rounded-full bg-neutral-800" />
    </button>
  );

  return (
    <div className="bg-white rounded shadow-md px-3 py-2 flex flex-col gap-1 pointer-events-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-0.5 rounded cursor-pointer text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            aria-label={playing ? "Pause" : "Play through time"}
            onClick={handlePlayClick}
          >
            {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
          </button>
          <span className="text-xs font-medium">{rangeLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {filterActive && (
            <button
              type="button"
              className="p-0.5 rounded cursor-pointer text-muted-foreground hover:text-foreground hover:bg-neutral-100"
              aria-label="Clear timeline filter"
              onClick={reset}
            >
              <XIcon size={14} />
            </button>
          )}
          <button
            type="button"
            className="p-0.5 rounded cursor-pointer text-muted-foreground hover:text-foreground hover:bg-neutral-100"
            aria-label="Minimise timeline"
            onClick={() => setMinimized(true)}
          >
            <MinusIcon size={14} />
          </button>
        </div>
      </div>
      <div
        className="relative"
        style={{ width: HISTOGRAM_WIDTH, height: HISTOGRAM_HEIGHT }}
      >
        <div ref={barsRef} className="flex items-end gap-px h-full">
          {buckets.map((bucket, index) => {
            const inRange =
              index >= startBucketIndex && index <= endBucketIndex;
            return (
              <button
                key={bucket.start}
                type="button"
                aria-label={`${monthKeyLabel(bucket.start)}: ${bucket.count}`}
                title={`${monthKeyLabel(bucket.start)}: ${bucket.count}`}
                className="flex-1 h-full flex items-end cursor-pointer group"
                onClick={() => setRange(index, index)}
              >
                <span
                  className={cn(
                    "w-full rounded-t-[1px] group-hover:bg-neutral-500",
                    inRange && filterActive
                      ? "bg-neutral-800"
                      : filterActive
                        ? "bg-neutral-300"
                        : "bg-neutral-400",
                  )}
                  style={{
                    height: `${Math.max(4, (bucket.count / maxCount) * 100)}%`,
                  }}
                />
              </button>
            );
          })}
        </div>
        {filterActive && (
          <div
            aria-label="Drag to move the selected range"
            className="absolute top-0 h-full cursor-grab active:cursor-grabbing touch-none"
            style={{
              left: `${(startBucketIndex / buckets.length) * 100}%`,
              width: `${((endBucketIndex - startBucketIndex + 1) / buckets.length) * 100}%`,
            }}
            onPointerDown={handleWindowPointerDown}
            onPointerMove={handleWindowPointerMove}
            onPointerUp={handleWindowPointerUp}
          />
        )}
        {handle("start", (startBucketIndex / buckets.length) * 100)}
        {handle("end", ((endBucketIndex + 1) / buckets.length) * 100)}
      </div>
      <div className="relative h-3.5" style={{ width: HISTOGRAM_WIDTH }}>
        {labelIndices.map((index, i) => (
          <span
            key={index}
            className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
            style={{
              left: `${((index + 0.5) / buckets.length) * 100}%`,
              transform:
                i === 0
                  ? "translateX(0)"
                  : i === labelIndices.length - 1
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            {monthKeyLabel(buckets[index].start)}
          </span>
        ))}
      </div>
    </div>
  );
}

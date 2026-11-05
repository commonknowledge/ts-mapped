"use client";

import {
  CheckIcon,
  ExternalLinkIcon,
  MousePointerClickIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { useMapConfig } from "../../hooks/useMapConfig";
import {
  TOUR_CARD_WIDTH as CARD_WIDTH,
  TOUR_DONE_PAUSE_MS as DONE_PAUSE_MS,
  TOUR_EDGE as EDGE,
  TOUR_NAVBAR_HEIGHT as NAVBAR_HEIGHT,
  TOUR_STEPS,
} from "../constants";
import { useTour, useTourSnapshot, useTourStepStart } from "../hooks/useTour";
import { isTourStepDone } from "../utils/tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A guided tour of the light editor: a ring around the part being shown,
 * and a card beside it that waits for you to try it, then moves on
 */
export default function LightTour() {
  const { stepIndex, next, back, end } = useTour();
  if (stepIndex === null) return null;
  const step = TOUR_STEPS[stepIndex];
  if (!step) return null;
  return (
    <TourStep
      // A fresh start for each step, so it compares against how things were
      key={step.id}
      step={step}
      index={stepIndex}
      onNext={next}
      onBack={back}
      onEnd={end}
    />
  );
}

function TourStep({
  step,
  index,
  onNext,
  onBack,
  onEnd,
}: {
  step: (typeof TOUR_STEPS)[number];
  index: number;
  onNext: () => void;
  onBack: () => void;
  onEnd: () => void;
}) {
  useTourStepStart(step);
  const now = useTourSnapshot();
  const [start] = useState(now);
  const { mapConfig } = useMapConfig();
  // What to outline can depend on how far through the step you are
  const target =
    typeof step.target === "function"
      ? step.target({ now, start, tutorial: mapConfig.tutorial ?? null })
      : step.target;
  // The most layers hidden so far, for "hide it, then show it again"
  const [peakHidden, setPeakHidden] = useState(now.hiddenLayerCount);
  if (now.hiddenLayerCount > peakHidden) setPeakHidden(now.hiddenLayerCount);
  // The most marker records open so far, for "open one, then come back"
  const [peakSelectedRecords, setPeakSelectedRecords] = useState(
    now.selectedRecordCount,
  );
  if (now.selectedRecordCount > peakSelectedRecords) {
    setPeakSelectedRecords(now.selectedRecordCount);
  }

  // Once done it stays done, even if undone during the pause, and the
  // outline stays where it was rather than jumping to what's next
  const [isDone, setIsDone] = useState(false);
  if (
    !isDone &&
    step.action &&
    isTourStepDone({
      stepId: step.id,
      start,
      now,
      peakHidden,
      peakSelectedRecords,
    })
  ) {
    setIsDone(true);
  }
  const { rect, panelRect, flyoutRight } = useTargetRect({
    target,
    isFrozen: isDone,
  });
  useEffect(() => {
    if (!isDone) return;
    const timeout = window.setTimeout(onNext, DONE_PAUSE_MS);
    return () => window.clearTimeout(timeout);
  }, [isDone, onNext]);

  const isLast = index === TOUR_STEPS.length - 1;
  const progress = ((index + 1) / TOUR_STEPS.length) * 100;

  // On the page itself, so it sits over dialogs and menus (portalled
  // there too) as well as the editor
  return createPortal(
    <>
      {/* A soft wash behind the opening and closing cards; the map still
          works through it */}
      {!step.target && !step.action && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[105] bg-neutral-900/10"
        />
      )}
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[110] rounded-xl ring-2 ring-[#15213b] ring-offset-2 transition-all duration-200 ease-out motion-reduce:transition-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}
      <div
        role="dialog"
        aria-label={`Tour: ${step.title}`}
        // Clickable even while a dialog has switched off the page around it
        className="pointer-events-auto fixed z-[120] flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white font-sans text-sm shadow-[0_8px_30px_rgba(21,33,59,0.16)]"
        style={{
          width: CARD_WIDTH,
          ...cardPosition({
            rect,
            panelRect,
            flyoutRight,
            isCentred: !step.target && !step.action,
          }),
        }}
      >
        <div className="h-0.5 bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
              {index + 1} of {TOUR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={onEnd}
              aria-label="End the tour"
              title="End the tour"
              className="-mr-1 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
          <h2 className="font-semibold text-neutral-900">{step.title}</h2>
          <p className="text-xs leading-relaxed text-neutral-600">
            {step.body}
          </p>
          {step.link && (
            <a
              href={step.link.href}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1 text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-500"
            >
              {step.link.label}
              <ExternalLinkIcon className="size-3" />
            </a>
          )}
          {step.action && (
            <p
              className={cn(
                "flex gap-2 rounded-md px-2.5 py-2 text-xs leading-snug transition-colors",
                isDone
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-neutral-50 text-neutral-800",
              )}
            >
              {isDone ? (
                <CheckIcon className="mt-px size-3.5 shrink-0" />
              ) : (
                <MousePointerClickIcon className="mt-px size-3.5 shrink-0 text-neutral-500" />
              )}
              <span>{isDone ? "Done" : step.action}</span>
            </p>
          )}
          <div className="mt-1 flex items-center justify-between gap-2">
            {index > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onBack}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step.action ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-neutral-500"
                onClick={onNext}
                disabled={isDone}
              >
                Skip
              </Button>
            ) : (
              <Button size="sm" className="h-7 px-3 text-xs" onClick={onNext}>
                {index === 0 ? "Start" : isLast ? "Finish" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// Beside the part being shown, on the side with more room, and clear of
// any flyout open beside the Layers panel. The opening and closing cards
// sit in the middle; one asking you to click the map sits at the bottom.
function cardPosition({
  rect,
  panelRect,
  flyoutRight,
  isCentred,
}: {
  rect: Rect | null;
  /** The inspector or a dialog, when what's shown is inside one: the card
   *  sits beside the whole panel rather than over it */
  panelRect: Rect | null;
  flyoutRight: number;
  isCentred: boolean;
}): React.CSSProperties {
  if (isCentred) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  if (!rect) {
    return { bottom: 24, left: "50%", transform: "translateX(-50%)" };
  }
  const isOnLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
  const left = isOnLeft
    ? Math.min(
        Math.max(
          (panelRect ?? rect).left + (panelRect ?? rect).width,
          flyoutRight,
        ) + EDGE,
        window.innerWidth - CARD_WIDTH - EDGE,
      )
    : Math.max(EDGE, (panelRect ?? rect).left - CARD_WIDTH - EDGE);
  return {
    left,
    top: Math.min(Math.max(rect.top, NAVBAR_HEIGHT), window.innerHeight - 320),
  };
}

// Follows the part being shown (the first of its selectors on screen) as
// panels open, move and resize, and how far right any open flyout reaches.
// Frozen, it stays put (e.g. while a done step shows its tick).
function useTargetRect({
  target,
  isFrozen,
}: {
  target: string[] | undefined;
  isFrozen: boolean;
}) {
  const [layout, setLayout] = useState<{
    rect: Rect | null;
    panelRect: Rect | null;
    flyoutRight: number;
  }>({ rect: null, panelRect: null, flyoutRight: 0 });
  const selectorsKey = (target ?? []).join("\n");

  useEffect(() => {
    if (isFrozen) return;
    const list = selectorsKey ? selectorsKey.split("\n") : [];
    let frame = 0;
    let last = "";
    const measure = () => {
      const element = list
        .map((selector) => document.querySelector(selector))
        .find((found) => {
          const box = found?.getBoundingClientRect();
          return Boolean(box?.width && box.height);
        });
      const toRect = (found: Element | null | undefined): Rect | null => {
        const box = found?.getBoundingClientRect();
        return box
          ? {
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
            }
          : null;
      };
      const rect = toRect(element);
      // The inspector or a dialog, when what's shown is inside one
      const panelRect = toRect(
        element?.closest(
          '#inspector-panel, [role="dialog"]:not([aria-label^="Tour"])',
        ),
      );
      const flyoutRight = Math.max(
        0,
        ...Array.from(
          document.querySelectorAll<HTMLElement>("[data-tour-flyout]"),
        ).map((flyout) => flyout.getBoundingClientRect().right),
      );
      const key = JSON.stringify([rect, panelRect, flyoutRight]);
      if (key !== last) {
        last = key;
        setLayout({ rect, panelRect, flyoutRight });
      }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [isFrozen, selectorsKey]);

  return layout;
}

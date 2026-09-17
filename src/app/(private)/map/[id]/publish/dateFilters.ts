import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";

export type DateFilterKey =
  "today" | "tomorrow" | "thisWeek" | "nextWeek" | "thisWeekend" | "past";

export const PAST_EVENTS_FILTER_KEY: DateFilterKey = "past";

export const DATE_FILTER_OPTIONS: { key: DateFilterKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "thisWeek", label: "This week" },
  { key: "nextWeek", label: "Next week" },
  { key: "thisWeekend", label: "This weekend" },
];

// Only offered when the data source hides past events, as the way back to
// the hidden records.
export const PAST_EVENTS_FILTER_OPTION: { key: DateFilterKey; label: string } =
  { key: PAST_EVENTS_FILTER_KEY, label: "Past events" };

// Weeks start on Monday (UK convention).
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

/**
 * Inclusive date range for a quick filter, evaluated relative to now.
 */
export function getDateFilterRange(
  key: DateFilterKey,
  now: Date = new Date(),
): {
  start: Date;
  end: Date;
} {
  switch (key) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "tomorrow": {
      const tomorrow = addDays(now, 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    }
    case "thisWeek":
      return {
        start: startOfWeek(now, WEEK_OPTIONS),
        end: endOfWeek(now, WEEK_OPTIONS),
      };
    case "nextWeek": {
      const nextWeek = addWeeks(now, 1);
      return {
        start: startOfWeek(nextWeek, WEEK_OPTIONS),
        end: endOfWeek(nextWeek, WEEK_OPTIONS),
      };
    }
    case "thisWeekend": {
      const monday = startOfWeek(now, WEEK_OPTIONS);
      return {
        start: startOfDay(addDays(monday, 5)), // Saturday
        end: endOfDay(addDays(monday, 6)), // Sunday
      };
    }
    case "past":
      // Everything before today; see getPastEventsCutoff
      return { start: new Date(0), end: endOfDay(subDays(now, 1)) };
  }
}

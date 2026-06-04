import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";

export type DateFilterKey =
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "nextWeek"
  | "thisWeekend";

export const DATE_FILTER_OPTIONS: { key: DateFilterKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "thisWeek", label: "This week" },
  { key: "nextWeek", label: "Next week" },
  { key: "thisWeekend", label: "This weekend" },
];

// Weeks start on Monday (UK convention).
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

/**
 * Inclusive date range for a quick filter, evaluated relative to now.
 */
export function getDateFilterRange(key: DateFilterKey): {
  start: Date;
  end: Date;
} {
  const now = new Date();
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
  }
}

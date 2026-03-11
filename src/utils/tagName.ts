const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTagDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mon = MONTH_ABBR[date.getMonth()];
  const yy = String(date.getFullYear()).slice(-2);
  const hours = date.getHours();
  const mm = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  return `${dd} ${mon} ${yy} - ${h12}:${mm}${period}`;
}

export const TAG_PREFIX = "Mapped: ";
export const TAG_MAX_LENGTH = 32;

export function buildTagName(
  mapName: string,
  viewName: string,
  date = new Date(),
): string {
  return `${TAG_PREFIX}${mapName}/${viewName} (${formatTagDate(date)})`;
}

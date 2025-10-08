export const buildName = (
  nameColumns: string[],
  json: Record<string, unknown>,
) => {
  return nameColumns
    .map((c) => String(json[c] || "").trim())
    .filter(Boolean)
    .join(" ");
};

export const toBoolean = (val: unknown): boolean => {
  if (!val) {
    return false;
  }
  if (["false", "0", "no"].includes(String(val).toLowerCase())) {
    return false;
  }
  return Boolean(val);
};

export function jsonToAirtablePrefill(data: Record<string, unknown>): string {
  const queryParams = Object.entries(data)
    .map(
      ([key, value]) =>
        `prefill_${encodeURIComponent(key)}=${encodeURIComponent(String(value || ""))}`,
    )
    .join("&");

  return `?${queryParams}`;
}

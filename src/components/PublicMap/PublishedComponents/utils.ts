export const buildName = (
  nameColumns: string[],
  json: Record<string, unknown>,
) => {
  return nameColumns
    .map((c) => String(json[c] || "").trim())
    .filter(Boolean)
    .join(" ");
};

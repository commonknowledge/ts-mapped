export const trimLeadingSlashes = (str: string) => str.replace(/^\/+/g, "");
export const trimTrailingSlashes = (str: string) => str.replace(/\/+$/g, "");

export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "";
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Display a shortened version of the number according
 * to its size, to 3 significant figures.
 *
 * If v > 1 trillion, print e.g. 1.23t
 * If v > 1 billion, print e.g. 1.23b
 * If v > 1 million, print e.g. 1.23m
 * If v > 1 thousand, print e.g. 1.23k
 * Otherwise print to 3 s.f.
 */
export const formatNumber = (v: number): string => {
  if (!isFinite(v)) return String(v);

  const sign = v < 0 ? "-" : "";
  const av = Math.abs(v);

  const to3sf = (n: number) => {
    // Use toPrecision to get 3 significant figures then clean up
    const s = n.toPrecision(3);
    // Convert exponential form to a plain number string when possible
    if (s.includes("e")) {
      return Number(s).toString();
    }
    // Strip trailing zeros from decimals (e.g. 12.00 -> 12)
    if (s.includes(".")) {
      return s.replace(/0+$/, "").replace(/\.$/, "");
    }

    return s;
  };

  if (av >= 1e12) return sign + to3sf(av / 1e12) + "t";
  if (av >= 1e9) return sign + to3sf(av / 1e9) + "b";
  if (av >= 1e6) return sign + to3sf(av / 1e6) + "m";
  if (av >= 1e3) return sign + to3sf(av / 1e3) + "k";

  return sign + to3sf(av);
};

import { NO_DATA_COLOR, PARTY_COLORS, type Visualisation } from "./constants";
import type { AreaResult } from "./types";
import type { ExpressionSpecification } from "mapbox-gl";

// Matches the inspector's `w-[min(260px,45%)]` plus its 8px inset
export const getFitPadding = (mapWidth: number) => ({
  top: 16,
  bottom: 16,
  left: 16,
  right: Math.min(260, mapWidth * 0.45) + 24,
});

export const getPartyColor = (party: string) =>
  PARTY_COLORS[party] ?? PARTY_COLORS.Other;

// Mix a hex colour towards black, `amount` from 0 to 1
export const darken = ({ color, amount }: { color: string; amount: number }) =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.round(parseInt(color.slice(i, i + 2), 16) * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

// Light grey → party colour → darker party colour, so mid-range shares stay legible
export const getShareStops = (party: string) => [
  "#f4f4f5",
  getPartyColor(party),
  darken({ color: getPartyColor(party), amount: 0.5 }),
];

export const getMaxShare = ({
  results,
  party,
}: {
  results: AreaResult[];
  party: string;
}) => Math.max(...results.map((r) => r.shares[party] ?? 0));

export const buildFillColor = ({
  results,
  visualisation,
  featureCodeProperty,
}: {
  results: AreaResult[];
  visualisation: Visualisation;
  featureCodeProperty: string;
}): ExpressionSpecification => {
  const featureCode: ExpressionSpecification = ["get", featureCodeProperty];
  if (visualisation === "winner") {
    return [
      "match",
      featureCode,
      ...results.flatMap((r) => [r.code, getPartyColor(r.first)]),
      NO_DATA_COLOR,
    ];
  }

  const share: ExpressionSpecification = [
    "match",
    featureCode,
    ...results.flatMap((r) => [r.code, r.shares[visualisation] ?? 0]),
    0,
  ];
  const max = getMaxShare({ results, party: visualisation });
  const [low, mid, high] = getShareStops(visualisation);
  return ["interpolate", ["linear"], share, 0, low, max / 2, mid, max, high];
};

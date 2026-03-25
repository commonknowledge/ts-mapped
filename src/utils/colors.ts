import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { PARTY_COLORS } from "@/constants/colors";

/** Returns a function that maps a category value to its default display colour,
 *  checking PARTY_COLORS first then falling back to a D3 ordinal scale. */
export const getCategoryColorScale = (values: string[]) => {
  const ordinalScale = scaleOrdinal(schemeCategory10).domain(values);
  return (value: string) =>
    PARTY_COLORS[value.toLowerCase()] ?? ordinalScale(value);
};

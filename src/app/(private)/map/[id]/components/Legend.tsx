import { scaleLinear } from "d3-scale";
import { AreaStats, ColumnType } from "@/__generated__/types";
import { useColorScheme } from "../colors";

export default function Legend({
  areaStats,
}: {
  areaStats: AreaStats | null | undefined;
}) {
  const colorScheme = useColorScheme(areaStats);
  if (!colorScheme) {
    return null;
  }

  let bars = [];
  if (colorScheme.columnType === ColumnType.Number) {
    const numSteps = 6;
    const stepScale = scaleLinear()
      .domain([0, numSteps - 1])
      .range([colorScheme.minValue, colorScheme.maxValue]);

    bars = new Array(numSteps).fill(null).map((_, i) => {
      const step = stepScale(i);
      const color = colorScheme.colorScale(step);
      return (
        <div
          className="p-1 w-full items-center justify-center flex text-xs"
          key={i}
          style={{ backgroundColor: color, color: color }}
        >
          <p className="mix-blend-exclusion text-white">
            {Math.round(step * 100) / 100}
          </p>
        </div>
      );
    });
  } else {
    bars = Object.keys(colorScheme.colorMap).map((key) => (
      <div
        className=""
        key={key}
        style={{ backgroundColor: colorScheme.colorMap[key] }}
      >
        {key}
      </div>
    ));
  }

  return (
    <div className="flex rounded-sm overflow-hidden absolute top-16 right-6 w-2xs">
      {bars}
    </div>
  );
}

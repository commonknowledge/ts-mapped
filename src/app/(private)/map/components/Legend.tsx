import { scaleLinear } from "d3-scale";
import { AreaStats, ColumnType } from "@/__generated__/types";
import { useColorScheme } from "../colors";
import styles from "./Legend.module.css";

export default function Legend({
  areaStats,
}: {
  areaStats: AreaStats | undefined;
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
        <div key={i} style={{ backgroundColor: color }}>
          {Math.round(step * 100) / 100}
        </div>
      );
    });
  } else {
    bars = Object.keys(colorScheme.colorMap).map((key) => (
      <div key={key} style={{ backgroundColor: colorScheme.colorMap[key] }}>
        {key}
      </div>
    ));
  }

  return <div className={styles.legend}>{bars}</div>;
}

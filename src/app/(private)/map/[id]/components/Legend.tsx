import { scaleLinear } from "d3-scale";
import { DotIcon } from "lucide-react";
import { useContext } from "react";
import { AreaStats, ColumnType } from "@/__generated__/types";
import { useColorScheme } from "../colors";
import { MapContext } from "../context/MapContext";

export default function Legend({
  areaStats,
}: {
  areaStats: AreaStats | null | undefined;
}) {
  const { viewConfig, dataSourcesQuery } = useContext(MapContext);

  const dataSources = dataSourcesQuery?.data?.dataSources || [];
  const dataSource = dataSources.find(
    (ds) => ds.id === viewConfig.areaDataSourceId,
  );

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
          <p
            className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]
 text-white"
          >
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
    <div className="flex flex-col  rounded-sm overflow-hidden absolute bottom-10 left-2 w-2xs bg-white border border-neutral-200">
      <p className="text-xs flex items-center gap-0.5 font-medium px-2 py-1">
        {dataSource?.name} <DotIcon className="w-4 h-4 text-muted-foreground" />{" "}
        {viewConfig.areaDataColumn}
      </p>
      <div className="flex">{bars}</div>
    </div>
  );
}

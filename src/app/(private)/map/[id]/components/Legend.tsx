import { scaleLinear } from "d3-scale";
import { Database, DotIcon } from "lucide-react";
import { useContext } from "react";
import { AreaStats, ColumnType } from "@/__generated__/types";
import { useColorScheme } from "../colors";
import { DataSourcesContext } from "../context/DataSourcesContext";
import { MapContext } from "../context/MapContext";
import { ChoroplethContext } from "../context/ChoroplethContext";

export default function Legend() {
  const { viewConfig } = useContext(MapContext);
  const { getChoroplethDataSource } = useContext(DataSourcesContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);

  const areaStats = areaStatsQuery?.data?.areaStats;

  const dataSource = getChoroplethDataSource();

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
    bars = Object.keys(colorScheme.colorMap)
      .toSorted()
      .map((key) => (
        <div
          className="p-1 w-full items-center justify-center flex text-xs"
          key={key}
          style={{ backgroundColor: colorScheme.colorMap[key] }}
        >
          {key}
        </div>
      ));
  }

  return (
    <div className="flex flex-col rounded-sm overflow-scroll bg-white border border-neutral-200">
      <p className=" flex  gap-2  items-center text-xs font-mono p-2"><Database className="w-4 h-4 text-muted-foreground" /> Locality Data Legend</p>
      <p className="flex items-center gap-0.5 font-medium px-2 py-1">
        {dataSource?.name}
      </p>
      <p className="text-sm flex items-center gap-0.5 font-medium px-2 py-1">
        Column: {viewConfig.areaDataColumn}
      </p>
      <div className="flex">{bars}</div>
    </div>
  );
}

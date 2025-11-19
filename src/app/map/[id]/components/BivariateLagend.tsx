import { useContext } from "react";
import { BIVARIATE_COLORS } from "../colors";
import { ChoroplethContext } from "../context/ChoroplethContext";
import { useMapViews } from "../hooks/useMapViews";

export default function BivariateLegend() {
  const { viewConfig } = useMapViews();
  const { selectedBivariateBucket, setSelectedBivariateBucket } =
    useContext(ChoroplethContext);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <span
        className="text-xs"
        style={{
          height: 104,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        {viewConfig.areaDataColumn}
      </span>
      <div className="grid grid-cols-3 gap-1 mr-auto">
        {[...BIVARIATE_COLORS].reverse().map((row, i) =>
          row.map((color, j) => {
            const coords = `${BIVARIATE_COLORS.length - i - 1},${j}`;
            return (
              <button
                key={`${i}-${j}`}
                className="w-8 h-8 border border-gray-200 cursor-pointer"
                style={
                  selectedBivariateBucket && selectedBivariateBucket !== coords
                    ? { backgroundColor: color, opacity: 0.5 }
                    : { backgroundColor: color }
                }
                title={`${viewConfig.areaDataColumn}: ${i === 0 ? "Low" : i === 1 ? "Med" : "High"}, ${viewConfig.areaDataSecondaryColumn}: ${j === 0 ? "Low" : j === 1 ? "Med" : "High"}`}
                type="button"
                onClick={() => {
                  if (selectedBivariateBucket === coords) {
                    setSelectedBivariateBucket(null);
                  } else {
                    setSelectedBivariateBucket(coords);
                  }
                }}
              />
            );
          }),
        )}
      </div>
      <div />
      <span className="text-xs" style={{ width: 104 }}>
        {viewConfig.areaDataSecondaryColumn}
      </span>
    </div>
  );
}

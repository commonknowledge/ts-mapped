import { DrawnPolygon } from "@/types";

interface TurfHistoryProps {
  polygons: DrawnPolygon[];
}

export default function TurfHistory({ polygons }: TurfHistoryProps) {
  console.log(polygons);
  return (
    <div className="space-y-2">
      {polygons.map((polygon) => (
        <div
          key={polygon.id}
          className="flex justify-between items-center p-2 bg-white/5 rounded"
        >
          <div>
            <div>Area: {polygon.area} m²</div>
            <div className="text-sm text-gray-400">
              {new Date(polygon.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

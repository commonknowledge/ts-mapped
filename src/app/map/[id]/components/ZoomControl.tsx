import { MinusIcon, PlusIcon } from "lucide-react";
import { useMapRef } from "../hooks/useMapState";

export default function ZoomControl() {
  const mapRef = useMapRef();
  const map = mapRef?.current;

  const zoomIn = () => map?.zoomIn({ duration: 500 });
  const zoomOut = () => map?.zoomOut({ duration: 500 });

  if (!map) {
    return <></>;
  }

  return (
    <div className="relative z-10 flex gap-1 p-1 group">
      {/* bg element - to avoid animating shadow (bad performance) and bg and animate opacity instead */}
      <div className="absolute left-0 right-0 bottom-0 top-0 -z-10 rounded-xl  shadow-sm bg-white transition-opacity opacity-0 group-hover:opacity-100"></div>

      <button
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
        onClick={zoomOut}
      >
        <MinusIcon size={20} />
      </button>
      <button
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
        onClick={zoomIn}
      >
        <PlusIcon size={20} />
      </button>
    </div>
  );
}

export default function MapWrapper({
  currentMode,
  children,
}: {
  currentMode: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className={"absolute top-0 left-0 w-full h-full"}>
      {children}

      {currentMode === "draw_polygon" && (
        <>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-2 rounded shadow-md bg-white text-xs">
            You are in draw mode. Click to add points. Double click to finish
            drawing.
          </div>

          <div className="absolute top-0 left-0 w-full h-1 bg-[#91e17e]"></div>
        </>
      )}
    </div>
  );
}

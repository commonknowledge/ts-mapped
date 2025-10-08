import { XIcon } from "lucide-react";
import { Fragment, useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";

export default function InspectorPanel() {
  const { inspectorContent, resetInspector } = useContext(InspectorContext);

  if (!Boolean(inspectorContent?.properties)) {
    return <></>;
  }

  const data = inspectorContent?.properties;

  return (
    <div className="fixed top-32 right-4 / flex flex-col gap-6 p-4 w-60 rounded shadow-lg bg-white / text-sm font-sans">
      <div className="flex justify-between gap-4">
        <h2 className="grow / text-sm font-semibold">
          {inspectorContent?.name as string}
        </h2>
        <button
          className="cursor-pointer"
          aria-label="Close inspector panel"
          onClick={() => resetInspector()}
        >
          <XIcon size={16} />
        </button>
      </div>
      {}
      <dl className="flex flex-col gap-2">
        {Object.keys(data as object).map((label) => {
          const value = data?.[label] as string;

          if (!value) return <Fragment key={label}></Fragment>;

          return (
            <div key={label}>
              <dt className="mb-1 / text-muted-foreground text-xs uppercase font-mono">
                {label}
              </dt>
              <dd className="font-medium">{value}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

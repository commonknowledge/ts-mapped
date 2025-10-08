import { XIcon } from "lucide-react";
import { Fragment, useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { mapColors } from "../../styles";

export default function InspectorPanel() {
  const { inspectorContent, resetInspector } = useContext(InspectorContext);

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};

  return (
    <div className="absolute top-0 bottom-0 right-4 z-10 / flex flex-col gap-6 w-60 pt-20 pb-5">
      <div className="w-full max-h-full p-4 overflow-auto / flex flex-col gap-2 / rounded shadow-lg bg-white / text-sm font-sans">
        <div className="flex justify-between items-start gap-4">
          <h2 className="grow flex gap-2 / text-sm font-semibold">
            <div
              className="shrink-0 mt-1 w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  type === "member"
                    ? mapColors.member.color
                    : mapColors.markers.color,
              }}
            ></div>
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

        {Boolean(dataSource) && (
          <div className="bg-muted py-1 px-2 rounded">
            <h3 className="mb-1 / text-muted-foreground text-xs uppercase font-mono">
              Data source
            </h3>
            <div className="flex items-center gap-2">
              <DataSourceIcon type={dataSource?.config?.type as string} />
              <p className="truncate">{dataSource?.name}</p>
            </div>
          </div>
        )}

        {Boolean(Object.keys(properties as object)?.length) && (
          <dl className="flex flex-col gap-2">
            {Object.keys(properties as object).map((label) => {
              const value = properties?.[label] as string;

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
        )}
      </div>
    </div>
  );
}

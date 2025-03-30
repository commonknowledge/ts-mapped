import { DataSourceConfigQuery } from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { AreaSetCodeLabels, GeocodingTypeLabels } from "@/labels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AreaSetCode, GeocodingType } from "@/types";
import { DataSourceGeocodingConfig, GeocodingOnAreaSetType } from "@/zod";

/**
 * This is a little complicated as it includes a front-end only
 * "postcode" option for the "Geocoding type" dropdown.
 *
 * There is code to detect when this should be selected, and
 * to convert into a valid geocoding config.
 */
export default function GeocodingConfigFields({
  dataSource,
  geocodingConfig,
  onChange,
}: {
  dataSource: DataSourceConfigQuery["dataSource"];
  geocodingConfig: DataSourceGeocodingConfig;
  onChange: (config: Partial<DataSourceGeocodingConfig>) => void;
}) {
  const column = "column" in geocodingConfig ? geocodingConfig.column : "";
  const areaSetCode =
    "areaSetCode" in geocodingConfig ? geocodingConfig.areaSetCode : "";

  // Convert "postcode" type to a valid geocoding config
  const onTypeChange = (type: GeocodingType | "postcode") => {
    if (type === "postcode") {
      onChange({ type: GeocodingType.code, areaSetCode: AreaSetCode.PC });
    } else if (areaSetCode === AreaSetCode.PC) {
      // Reset the areaSetCode if changing from postcode to other type
      onChange({ type, areaSetCode: dataSource?.geocodingConfig.areaSetCode });
    } else {
      onChange({ type });
    }
  };

  let typeSelectValue: GeocodingType | "postcode" | "" = geocodingConfig.type;
  if (typeSelectValue === GeocodingType.none) {
    typeSelectValue = ""; // The select value needs to be "" to show the placeholder
  } else if (areaSetCode === AreaSetCode.PC) {
    typeSelectValue = "postcode"; // Detect "postcode" config
  }

  return (
    <>
      <DataListRow label="Location column">
        <Select value={column} onValueChange={(column) => onChange({ column })}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="Select a column to geocode on" />
          </SelectTrigger>
          <SelectContent>
            {dataSource?.columnDefs.map((cd) => (
              <SelectItem key={cd.name} value={cd.name}>
                {cd.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataListRow>

      <DataListRow label="Location type">
        <Select value={typeSelectValue} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="What kind of data is this?" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(GeocodingTypeLabels)
              .filter((type) => type !== GeocodingType.none)
              .map((type) => (
                <SelectItem key={type} value={type}>
                  {GeocodingTypeLabels[type as GeocodingType]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </DataListRow>

      {typeSelectValue in GeocodingOnAreaSetType && (
        <DataListRow label="Area type">
          <Select
            value={areaSetCode}
            onValueChange={(areaSetCode) =>
              onChange({ areaSetCode } as { areaSetCode: AreaSetCode })
            }
          >
            <SelectTrigger className="w-[360px]">
              <SelectValue placeholder="What kind of area is this?" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(AreaSetCodeLabels)
                .filter((type) => type !== AreaSetCode.PC)
                .map((type) => (
                  <SelectItem key={type} value={type}>
                    {AreaSetCodeLabels[type as AreaSetCode]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </DataListRow>
      )}
    </>
  );
}

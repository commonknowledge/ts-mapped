import {
  AreaSetCode,
  DataSourceConfigQuery,
  GeocodingType,
  LooseGeocodingConfig,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { AreaSetCodeLabels, GeocodingTypeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AreaGeocodingType } from "@/zod";

/**
 * This is a little complicated as it includes a front-end only
 * "Postcode" option for the "Geocoding type" dropdown.
 *
 * There is code to detect when this should be selected, and
 * to convert into a valid geocoding config.
 */
type FriendlyGeocodingType = GeocodingType | "Postcode";

export default function GeocodingConfigFields({
  dataSource,
  geocodingConfig,
  onChange,
}: {
  dataSource: DataSourceConfigQuery["dataSource"];
  geocodingConfig: LooseGeocodingConfig;
  onChange: (config: Partial<LooseGeocodingConfig>) => void;
}) {
  const column = geocodingConfig.column || "";
  const columns = geocodingConfig.columns || [];
  const areaSetCode = geocodingConfig.areaSetCode || "";

  // Convert "Postcode" type to a valid geocoding config
  const onTypeChange = (type: FriendlyGeocodingType) => {
    if (type === "Postcode") {
      onChange({ type: GeocodingType.Code, areaSetCode: AreaSetCode.PC });
    } else if (areaSetCode === AreaSetCode.PC) {
      // Reset the areaSetCode if changing from postcode to other type
      onChange({ type, areaSetCode: dataSource?.geocodingConfig.areaSetCode });
    } else {
      onChange({ type });
    }
  };

  let typeSelectValue: FriendlyGeocodingType | "" = geocodingConfig.type;
  if (typeSelectValue === GeocodingType.None) {
    typeSelectValue = ""; // The select value needs to be "" to show the placeholder
  } else if (areaSetCode === AreaSetCode.PC) {
    typeSelectValue = "Postcode"; // Detect "Postcode" config
  }

  return (
    <>
      <DataListRow label="Location type">
        <Select value={typeSelectValue} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="What kind of data is this?" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(GeocodingTypeLabels)
              .filter((type) => type !== GeocodingType.None)
              .map((type) => (
                <SelectItem key={type} value={type}>
                  {GeocodingTypeLabels[type as GeocodingType]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </DataListRow>

      {typeSelectValue === GeocodingType.Address && (
        <DataListRow label="Location columns">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {columns.length ? columns.join(", ") : "Select"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {dataSource?.columnDefs.map((cd) => (
                <DropdownMenuCheckboxItem
                  key={cd.name}
                  checked={columns.includes(cd.name)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange({ columns: columns.concat([cd.name]) });
                    } else {
                      onChange({
                        columns: columns.filter((c) => c !== cd.name),
                      });
                    }
                  }}
                >
                  {cd.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </DataListRow>
      )}

      {typeSelectValue === "Postcode" && (
        <DataListRow label="Location column">
          <Select
            value={column}
            onValueChange={(column) => onChange({ column })}
          >
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
      )}

      {typeSelectValue in AreaGeocodingType && (
        <>
          <DataListRow label="Location column">
            <Select
              value={column}
              onValueChange={(column) => onChange({ column })}
            >
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
        </>
      )}
    </>
  );
}

import {
  AreaSetCode,
  DataSourceQuery,
  GeocodingType,
  LooseGeocodingConfig,
} from "@/__generated__/types";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import CustomSelect from "@/components/forms/CustomSelect";
import { AreaSetCodeLabels, GeocodingTypeLabels } from "@/labels";
import { AreaGeocodingType } from "@/server/models/DataSource";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "@/shadcn/ui/dropdown-menu";

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
  dataSource: DataSourceQuery["dataSource"];
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

  const locationTypeOptions =
    Object.keys(GeocodingTypeLabels)
      .filter((type) => type !== GeocodingType.None)
      .map((type) => ({
        label: GeocodingTypeLabels[type as GeocodingType],
        value: type,
      })) || [];

  const locationColumnOptions =
    dataSource?.columnDefs.map((cd) => ({
      label: cd.name,
      value: cd.name,
    })) || [];

  const areaTypeOptions =
    Object.keys(AreaSetCodeLabels)
      .filter((type) => type !== AreaSetCode.PC)
      .map((type) => ({
        label: AreaSetCodeLabels[type as AreaSetCode],
        value: type,
      })) || [];

  return (
    <>
      <CustomSelect
        id="config-location-type"
        label="Location type"
        placeholder="What kind of data is this?"
        value={typeSelectValue}
        options={locationTypeOptions}
        onValueChange={onTypeChange}
      />

      {typeSelectValue === GeocodingType.Address && (
        <CustomMultiSelect
          id="config-location-columns-multi"
          label="Location columns"
          selectedOptions={columns}
        >
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
        </CustomMultiSelect>
      )}

      {typeSelectValue === "Postcode" && (
        <CustomSelect
          id="config-location-column-postcode"
          label="Location column"
          placeholder="Select a column to geocode on"
          value={column}
          options={locationColumnOptions}
          onValueChange={(column) => onChange({ column })}
        />
      )}

      {typeSelectValue in AreaGeocodingType && (
        <>
          <CustomSelect
            id="config-location-column-area-code"
            label="Location column"
            placeholder="Select a column to geocode on"
            value={column}
            options={locationColumnOptions}
            onValueChange={(column) => onChange({ column })}
          />
          <CustomSelect
            id="config-area-type"
            label="Area type"
            placeholder="What kind of area is this?"
            value={areaSetCode}
            options={areaTypeOptions}
            onValueChange={(areaSetCode) =>
              onChange({ areaSetCode } as { areaSetCode: AreaSetCode })
            }
          />
        </>
      )}
    </>
  );
}

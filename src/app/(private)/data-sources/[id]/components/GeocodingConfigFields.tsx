import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import CustomSelect from "@/components/forms/CustomSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import {
  AreaSetCodeLabels,
  AreaSetCodeYears,
  GeocodingTypeLabels,
} from "@/labels";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  AreaGeocodingType,
  type GeocodingConfig,
  GeocodingType,
} from "@/server/models/DataSource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import type { RouterOutputs } from "@/services/trpc/react";

/**
 * This is a little complicated as it includes a front-end only
 * "Postcode" option for the "Geocoding type" dropdown.
 *
 * There is code to detect when this should be selected, and
 * to convert into a valid geocoding config.
 */
type FriendlyGeocodingType = GeocodingType | "Postcode";

export function GeocodingConfigFields({
  dataSource,
  geocodingConfig,
  onChange,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  geocodingConfig: GeocodingConfig;
  onChange: (config: Partial<GeocodingConfig>) => void;
}) {
  const column = "column" in geocodingConfig ? geocodingConfig.column : "";
  const columns = "columns" in geocodingConfig ? geocodingConfig.columns : [];
  const areaSetCode =
    "areaSetCode" in geocodingConfig ? geocodingConfig.areaSetCode : "";
  const latitudeColumn =
    "latitudeColumn" in geocodingConfig ? geocodingConfig.latitudeColumn : "";
  const longitudeColumn =
    "longitudeColumn" in geocodingConfig ? geocodingConfig.longitudeColumn : "";

  // Convert "Postcode" type to a valid geocoding config
  const onTypeChange = (type: FriendlyGeocodingType) => {
    if (type === "Postcode") {
      onChange({ type: GeocodingType.Code, areaSetCode: AreaSetCode.PC });
    } else if (
      "areaSetCode" in geocodingConfig &&
      geocodingConfig.areaSetCode === AreaSetCode.PC
    ) {
      // Reset the areaSetCode if changing from postcode to other type
      const prevCode =
        "areaSetCode" in dataSource.geocodingConfig
          ? dataSource.geocodingConfig.areaSetCode
          : undefined;
      onChange({
        type,
        ...(prevCode && prevCode !== AreaSetCode.PC
          ? { areaSetCode: prevCode }
          : { areaSetCode: undefined }),
      });
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
    (Object.keys(AreaSetCodeLabels) as AreaSetCode[])
      .filter((type) => type !== AreaSetCode.PC)
      .map((type) => ({
        label: AreaSetCodeLabels[type],
        years: AreaSetCodeYears[type],
        value: type,
      })) || [];

  const onDropdownChange = (currentValue: string) => {
    if (columns.some((c) => c === currentValue)) {
      onChange({
        columns: columns.filter((c) => c !== currentValue),
      });
    } else {
      onChange({ columns: columns.concat([currentValue]) });
    }
  };

  // Include previous options that are no longer in the data source column defs, so they can be removed
  const allOptions = Array.from(
    new Set(locationColumnOptions.map((c) => c.label).concat(columns)),
  );

  return (
    <>
      <CustomSelect
        id="config-location-type"
        label="Location type"
        hint="Select how location data is formatted in your data source."
        value={typeSelectValue}
        options={locationTypeOptions}
        onValueChange={onTypeChange}
      />

      {typeSelectValue === GeocodingType.Address && (
        <CustomMultiSelect
          id="config-location-columns-multi"
          label="Location columns"
          allOptions={allOptions}
          selectedOptions={columns}
          onChange={onDropdownChange}
        />
      )}

      {typeSelectValue === "Postcode" && (
        <CustomSelect
          id="config-location-column-postcode"
          label="Location column"
          hint="Select which column to use as location data."
          value={column}
          options={locationColumnOptions}
          onValueChange={(column) => onChange({ column })}
        />
      )}

      {typeSelectValue === GeocodingType.Coordinates && (
        <>
          <CustomSelect
            id="config-location-column-latitude"
            label="Latitude column"
            hint="Select which column contains latitude values."
            value={latitudeColumn}
            options={locationColumnOptions}
            onValueChange={(latitudeColumn) =>
              onChange({ latitudeColumn } as { latitudeColumn: string })
            }
          />
          <CustomSelect
            id="config-location-column-longitude"
            label="Longitude column"
            hint="Select which column contains longitude values."
            value={longitudeColumn}
            options={locationColumnOptions}
            onValueChange={(longitudeColumn) =>
              onChange({ longitudeColumn } as { longitudeColumn: string })
            }
          />
        </>
      )}

      {typeSelectValue in AreaGeocodingType.Values && (
        <>
          <CustomSelect
            id="config-location-column-area-code"
            label="Location column"
            hint="Select which column to use as location data."
            value={column}
            options={locationColumnOptions}
            onValueChange={(column) => onChange({ column })}
          />
          <FormFieldWrapper id="config-area-type" label="Boundary type">
            <Select
              value={areaSetCode}
              onValueChange={(areaSetCode) =>
                onChange({ areaSetCode } as { areaSetCode: AreaSetCode })
              }
            >
              <SelectTrigger className="w-full" id="config-area-type">
                <SelectValue placeholder="Select a boundary type">
                  {areaSetCode
                    ? AreaSetCodeLabels[areaSetCode]
                    : "Select a boundary type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full">
                {areaTypeOptions.map(({ label, years, value }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col">
                      <span className="">{label}</span>
                      <span
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: years,
                        }}
                      />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>
        </>
      )}
    </>
  );
}

import { useCallback, useMemo } from "react";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  usePublicFilters,
  useSetPublicFilters,
} from "../hooks/usePublicFilters";
import { useActiveTabId } from "../hooks/usePublicMap";
import { toBoolean } from "../utils";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export default function FiltersForm({ fields }: { fields: FilterField[] }) {
  const publicFilters = usePublicFilters();
  const setPublicFilters = useSetPublicFilters();
  const activeTabId = useActiveTabId();
  const { setSelectedRecords } = useInspector();

  const defaultValues = useMemo(
    () =>
      fields.map((field) => {
        if (field.type === PublicMapColumnType.CommaSeparatedList) {
          return {
            name: field.name,
            type: field.type,
            selectedOptions: [] as string[],
          };
        }
        return { name: field.name, type: field.type, value: "" };
      }),
    [fields],
  );

  const values = useMemo(() => {
    if (activeTabId && publicFilters[activeTabId]?.length) {
      return publicFilters[activeTabId];
    }
    return defaultValues;
  }, [activeTabId, publicFilters, defaultValues]);

  const updateValues = useCallback(
    (updater: (prev: PublicFiltersFormValue[]) => PublicFiltersFormValue[]) => {
      if (!activeTabId) return;
      setPublicFilters((prev) => {
        const current = prev[activeTabId]?.length
          ? prev[activeTabId]
          : defaultValues;
        return { ...prev, [activeTabId]: updater(current) };
      });
      setSelectedRecords([]);
    },
    [activeTabId, setPublicFilters, setSelectedRecords, defaultValues],
  );

  const handleChange = (name: string, value: string) => {
    updateValues((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v)),
    );
  };

  const handleOptionCheck = (
    fieldName: string,
    option: string,
    checked: boolean,
  ) => {
    updateValues((prev) =>
      prev.map((v) => {
        if (v.name !== fieldName) return v;

        let updatedOptions = [...(v.selectedOptions || [])];

        if (checked) {
          if (!updatedOptions.includes(option)) {
            updatedOptions.push(option);
          }
        } else {
          updatedOptions = updatedOptions.filter((o) => o !== option);
        }

        return { ...v, selectedOptions: updatedOptions };
      }),
    );
  };

  const isChecked = (field: FilterField) => {
    const value = values.find((v) => v.name === field.name)?.value;

    if (value) {
      return toBoolean(value);
    } else {
      return false;
    }
  };

  return (
    <form className="flex flex-col gap-4 w-full">
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === PublicMapColumnType.String ? (
            // text input
            <FormFieldWrapper
              label={field.label || field.name}
              id={`filters-${field.name}`}
            >
              <Input
                type="text"
                autoComplete="off"
                id={`filters-${field.name}`}
                name={field.name}
                value={values.find((v) => v.name === field.name)?.value || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </FormFieldWrapper>
          ) : field.type === PublicMapColumnType.Boolean ? (
            // boolean checkbox
            <div className="flex gap-2">
              <Checkbox
                id={`filters-${field.name}`}
                checked={isChecked(field)}
                onCheckedChange={(checked) =>
                  handleChange(field.name, checked ? "Yes" : "")
                }
              />
              <Label htmlFor={`filters-${field.name}`} className="font-normal">
                {field.label || field.name}
              </Label>
            </div>
          ) : field?.options?.length ? (
            // multiselect
            <FiltersMultiSelect
              field={field}
              values={values}
              onSelect={handleOptionCheck}
            />
          ) : (
            <></>
          )}
        </div>
      ))}
      <div className="sr-only">
        <Button type="submit">Filter</Button>
      </div>
    </form>
  );
}

const FiltersMultiSelect = ({
  field,
  values,
  onSelect,
}: {
  field: FilterField;
  values: PublicFiltersFormValue[];
  onSelect: (fieldName: string, option: string, checked: boolean) => void;
}) => {
  const onChange = (option: string) => {
    const checked =
      values
        ?.find((v) => v.name === field.name)
        ?.selectedOptions?.includes(option) || false;

    onSelect(field.name, option, !checked);
  };

  return (
    <div className="my-2">
      <CustomMultiSelect
        label={field.label || field.name}
        id={`filters-${field.name}`}
        allOptions={field.options || []}
        selectedOptions={
          values?.find((v) => v.name === field.name)?.selectedOptions || []
        }
        onChange={onChange}
      />
    </div>
  );
};

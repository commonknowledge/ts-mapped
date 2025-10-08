import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataRecordContext } from "@/app/map/[id]/context/DataRecordContext";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import { toBoolean } from "../utils";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export default function FiltersForm({
  fields,
  closeDialog,
}: {
  fields: FilterField[];
  closeDialog: () => void;
}) {
  const [values, setValues] = useState<PublicFiltersFormValue[]>([]);
  const { publicFilters, setPublicFilters } = useContext(PublicFiltersContext);
  const { activeTabId } = useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);

  // setting default values
  useEffect(() => {
    if (
      publicFilters &&
      activeTabId &&
      publicFilters[activeTabId] &&
      publicFilters[activeTabId].length
    ) {
      setValues(publicFilters[activeTabId]);
      return;
    }

    const defaultEmptyValues = fields.map((field) => {
      if (field.type === PublicMapColumnType.CommaSeparatedList) {
        return {
          name: field.name,
          type: field.type,
          selectedOptions: [],
        };
      }

      return {
        name: field.name,
        type: field.type,
        value: "",
      };
    });
    setValues(defaultEmptyValues);
  }, [activeTabId, fields, publicFilters]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v)),
    );
  };

  const handleOptionCheck = (
    fieldName: string,
    option: string,
    checked: boolean,
  ) => {
    setValues((prev) =>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTabId) {
      setPublicFilters({ ...publicFilters, [activeTabId]: values });
    }
    // closing the data record sidebar when applying filters - to avoid showing details of a record that is filtered out
    setSelectedDataRecord(null);
    // closing filters dialog
    closeDialog();
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
    <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === PublicMapColumnType.String ? (
            // text input
            <FormFieldWrapper label={field.name} id={`filters-${field.name}`}>
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
            // boolean swicth
            <FormFieldWrapper label={field.name} id={`filters-${field.name}`}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isChecked(field)}
                  onCheckedChange={(checked) =>
                    handleChange(field.name, checked ? "Yes" : "No")
                  }
                />
                <span className="text-sm">
                  {isChecked(field) ? "Yes" : "No"}
                </span>
              </div>
            </FormFieldWrapper>
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
      <div>
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
    <CustomMultiSelect
      label={field.name}
      id={`filters-${field.name}`}
      allOptions={field.options || []}
      selectedOptions={
        values?.find((v) => v.name === field.name)?.selectedOptions || []
      }
      onChange={onChange}
    />
  );
};

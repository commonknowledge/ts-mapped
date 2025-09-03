import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { PublicFiltersContext } from "@/components/PublicMap/context/PublicFiltersContext";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { toBoolean } from "./utils";
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
  const { setSelectedDataRecord } = useContext(DataRecordContext);

  // setting default values
  useEffect(() => {
    if (publicFilters && publicFilters?.length) {
      setValues(publicFilters);

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
  }, [fields, publicFilters]);

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
    setPublicFilters(values);
    // closing the data record sidebar when applying filters - to avoid showing details of a record that is filtered out
    setSelectedDataRecord(null);
    // closing filters dialog
    closeDialog();
  };

  const resetFilters = () => {
    setPublicFilters([]);
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
            <CustomMultiSelect
              label={field.name}
              id={`filters-${field.name}`}
              selectedOptions={
                values?.find((v) => v.name === field.name)?.selectedOptions ||
                []
              }
            >
              <DropdownMenuContent>
                {field?.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={values
                      ?.find((v) => v.name === field.name)
                      ?.selectedOptions?.includes(option)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) => {
                      handleOptionCheck(field.name, option, checked);
                    }}
                  >
                    {option}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </CustomMultiSelect>
          ) : (
            <></>
          )}
        </div>
      ))}
      <div className="flex gap-4">
        <Button type="submit">Filter</Button>

        {!!publicFilters?.length && (
          <Button
            type="button"
            variant="outline"
            onClick={() => resetFilters()}
          >
            Reset filters
          </Button>
        )}
      </div>
    </form>
  );
}

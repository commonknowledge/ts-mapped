import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export default function FiltersForm({
  fields,
  onSubmit,
}: {
  fields: FilterField[];
  onSubmit: () => void;
}) {
  const [values, setValues] = useState<PublicFiltersFormValue[]>([]);
  const { setPublicFilters } = useContext(PublicFiltersContext);

  console.log(values);

  useEffect(() => {
    const defaultValues = fields.map((field) => ({
      name: field.name,
      value: "",
      selectedOptions: [],
    }));
    setValues(defaultValues);
  }, [fields]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v))
    );
  };

  const handleOptionCheck = (
    fieldName: string,
    option: string,
    checked: boolean
  ) => {
    setValues((prev) =>
      prev.map((v) => {
        if (v.name !== fieldName) return v;

        let updatedOptions = [...(v.selectedOptions || [])];
        if (checked) {
          // add option if not already there
          if (!updatedOptions.includes(option)) {
            updatedOptions.push(option);
          }
        } else {
          // remove option
          updatedOptions = updatedOptions.filter((o) => o !== option);
        }

        return { ...v, selectedOptions: updatedOptions };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(values);
    setPublicFilters(values);
    onSubmit();
  };

  return (
    <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === PublicMapColumnType.String ? (
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
            <FormFieldWrapper label={field.name} id={`filters-${field.name}`}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={
                    values.find((v) => v.name === field.name)?.value === "true"
                  }
                  onCheckedChange={(checked) =>
                    handleChange(field.name, checked ? "true" : "false")
                  }
                />
                <span className="text-sm">
                  {values.find((v) => v.name === field.name)?.value === "true"
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </FormFieldWrapper>
          ) : field?.options?.length ? (
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
      <div>
        <Button type="submit">Filter</Button>
      </div>
    </form>
  );
}

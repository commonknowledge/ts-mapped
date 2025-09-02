import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { Button } from "@/shadcn/ui/button";
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

  useEffect(() => {
    const defaultValues = fields.map((field) => ({
      name: field.name,
      value: "",
    }));
    setValues(defaultValues);
  }, [fields]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(values);
    setPublicFilters(values);
    onSubmit();
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block mb-2">{field.name}</label>
          {field.type === PublicMapColumnType.String ? (
            <input
              className="border"
              type="text"
              value={values.find((v) => v.name === field.name)?.value || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === PublicMapColumnType.Boolean ? (
            <Switch
              checked={
                values.find((v) => v.name === field.name)?.value === "true"
              }
              onCheckedChange={(checked) =>
                handleChange(field.name, checked ? "true" : "false")
              }
            />
          ) : field?.options?.length ? (
            <select
              value={values.find((v) => v.name === field.name)?.value || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              <option value="">--Please choose an option--</option>
              {field.options.map((o) => (
                <option value={o} key={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ))}
      <Button type="submit">Filter</Button>
    </form>
  );
}

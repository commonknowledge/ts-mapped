import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { NewCSVConfig } from "../schema";

export default function CSVFields({
  config,
  onChange,
}: {
  config: Partial<NewCSVConfig>;
  onChange: (config: Partial<Pick<NewCSVConfig, "file" | "filename">>) => void;
}) {
  if (config.type !== DataSourceType.CSV) return;

  return (
    <FormFieldWrapper
      label="File"
      id="csv-file-input"
      hint={
        <span className="flex flex-col">
          <span className="mb-1">
            Make sure your CSV has been exported with quotes, e.g.:
          </span>
          <pre className="rounded border p-2 overflow-auto">
            {'"Code","Name","Value"\n'}
            {'"E06000019","Herefordshire, County of","67"'}
          </pre>
        </span>
      }
    >
      <Input
        type="file"
        className="w-full"
        accept=".csv"
        name="csv-file-input"
        required
        onChange={(e) => {
          const file = e.target.files ? e.target.files[0] : null;
          if (file) {
            onChange({ file, filename: file.name });
          } else {
            onChange({ file: undefined, filename: "" });
          }
        }}
      />
    </FormFieldWrapper>
  );
}

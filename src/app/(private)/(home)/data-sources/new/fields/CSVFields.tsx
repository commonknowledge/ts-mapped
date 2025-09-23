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
    <>
      <FormFieldWrapper label="File" id="csv-file-input">
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
    </>
  );
}

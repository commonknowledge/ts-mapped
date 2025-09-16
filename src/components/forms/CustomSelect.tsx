import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import FormFieldWrapper from "./FormFieldWrapper";

export default function CustomSelect({
  id,
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onValueChange?(value: string): void;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <FormFieldWrapper id={id} label={label} hint={hint}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}

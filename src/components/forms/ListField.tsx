import { useState } from "react";
import { Textarea } from "@/shadcn/ui/textarea";
import FormFieldWrapper from "./FormFieldWrapper";

export interface ListFieldProps {
  label: string;
  hint: React.ReactNode;
  placeholder: string;
  values: string[];
  isValid: (value: string) => boolean;
  invalidMessage: string;
  normalise?: (value: string) => string;
  onCommit: (values: string[]) => void;
  // Told whenever the text being typed becomes valid or invalid
  onInvalidChange?: (invalid: boolean) => void;
  disabled?: boolean;
}

/**
 * A one-per-line (or comma-separated) list, e.g. of emails. The text is
 * buffered while typing and committed on blur once every line is valid.
 */
export default function ListField({
  label,
  hint,
  placeholder,
  values,
  isValid,
  invalidMessage,
  normalise = (value) => value,
  onCommit,
  onInvalidChange,
  disabled,
}: ListFieldProps) {
  const [text, setText] = useState<string | null>(null);

  const parse = (value: string) => {
    const parsed = [
      ...new Set(
        value
          .split(/[\s,]+/)
          .map((line) => normalise(line.trim()))
          .filter(Boolean),
      ),
    ];
    return { parsed, invalid: parsed.filter((line) => !isValid(line)) };
  };

  const value = text ?? values.join("\n");
  const { parsed, invalid } = parse(value);

  const onChange = (next: string) => {
    setText(next);
    onInvalidChange?.(parse(next).invalid.length > 0);
  };

  const commit = () => {
    if (text === null || invalid.length > 0) {
      return;
    }
    onCommit(parsed);
    setText(null);
  };

  return (
    <FormFieldWrapper
      label={label}
      id={label}
      hint={hint}
      error={invalid.length ? `${invalidMessage}: ${invalid.join(", ")}` : null}
    >
      <Textarea
        id={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        disabled={disabled}
        className="w-full shadow-none"
        rows={3}
      />
    </FormFieldWrapper>
  );
}

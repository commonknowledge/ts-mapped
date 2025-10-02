import { Label } from "@/shadcn/ui/label";
import { HelpPopover } from "../HelpPopover";

export default function FormFieldWrapper({
  label,
  children,
  error,
  helpText,
  hint,
  id,
  isHorizontal = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string | string[] | null;
  helpText?: string | React.ReactNode;
  hint?: string | React.ReactNode;
  id?: string;
  isHorizontal?: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-1 w-full">
      <div
        className={`flex ${isHorizontal ? "flex-row-reverse justify-end gap-3" : "flex-col gap-2"}`}
      >
        <Label htmlFor={id || ""}>{label}</Label>
        {children}
      </div>
      {hint && <FormFieldHint> {hint} </FormFieldHint>}
      {error && (
        <FormFieldError
          error={typeof error === "string" ? error : error.join(", ")}
        />
      )}
      {helpText && (
        <div className="absolute top-0 right-0">
          <HelpPopover>{helpText}</HelpPopover>
        </div>
      )}
    </div>
  );
}
export function FormFieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function FormFieldError({
  error,
}: {
  error?: string | string[] | null;
}) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600">
      {typeof error === "string" ? error : error.join(", ")}
    </p>
  );
}

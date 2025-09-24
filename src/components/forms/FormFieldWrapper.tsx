import { Label } from "@/shadcn/ui/label";

export default function FormFieldWrapper({
  label,
  children,
  error,
  hint,
  id,
  isHorizontal = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string | string[] | null;
  hint?: string;
  id?: string;
  isHorizontal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={`flex ${isHorizontal ? "flex-row-reverse justify-end gap-3" : "flex-col gap-2"}`}
      >
        <Label htmlFor={id || ""}>{label}</Label>
        {children}
      </div>
      {hint && <FormFieldHint hint={hint} />}
      {error && (
        <FormFieldError
          error={typeof error === "string" ? error : error.join(", ")}
        />
      )}
    </div>
  );
}
export function FormFieldHint({ hint }: { hint: string }) {
  return <p className="text-sm text-muted-foreground">{hint}</p>;
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

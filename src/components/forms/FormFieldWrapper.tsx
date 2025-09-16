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

  error?: string;
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
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

import { Label } from "@/shadcn/ui/label";

export default function FormFieldWrapper({
  label,
  children,
  hint,
  id,
  isHorizontal = false,
}: {
  label: string;
  children: React.ReactNode;

  hint?: string;
  id?: string;
  isHorizontal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={`flex ${isHorizontal ? "flex-row-reverse justify-end gap-3" : "flex-col gap-1"}`}
      >
        <Label htmlFor={id || ""}>{label}</Label>
        {children}
      </div>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

import { Label } from "@/shadcn/ui/label";

export default function FormFieldWrapper({
  label,
  children,
  hint,
  isHorizontal = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  isHorizontal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className={`flex gap-3 ${isHorizontal ? "flex-row-reverse justify-end" : "flex-col"}`}
      >
        <Label>{label}</Label>
        {children}
      </div>

      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

import { CheckIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function ControlEditForm({
  initialValue,
  onChange,
  onSubmit,
}: {
  initialValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="w-full flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        value={initialValue}
        onChange={(e) => onChange(e.target.value)}
        className="grow h-8"
        ref={inputRef}
      />
      <Button type="submit" size="sm" variant="ghost" aria-label="Save">
        <CheckIcon size={12} />
      </Button>
    </form>
  );
}

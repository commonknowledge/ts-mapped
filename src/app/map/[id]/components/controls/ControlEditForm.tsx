import { CheckIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import type { RefObject } from "react";

export default function ControlEditForm({
  inputRef,
  initialValue,
  onChange,
  onSubmit,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  initialValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
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
        className="flex-1"
        ref={inputRef}
      />
      <Button type="submit" size="sm" variant="ghost" aria-label="Save">
        <CheckIcon size={12} />
      </Button>
    </form>
  );
}

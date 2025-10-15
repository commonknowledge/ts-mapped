import { TagIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";

export default function TagButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {

  return (
    <Button
      variant="outline"
      className="bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 border-purple-200 rounded-md"
      onClick={() => {
        onClick?.();
      }}
      disabled={disabled || !onClick}
    >
      <TagIcon className="w-4 h-4" />
      {children && children}
    </Button>
  );
}

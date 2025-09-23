import { cn } from "@/shadcn/utils";
export default function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose text-foreground prose-headings:text-primary prose-headings:font-medium prose-headings:tracking-tight",
        className,
      )}
    >
      {children}
    </div>
  );
}

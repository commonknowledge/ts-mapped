import { Link } from "@/components/Link";
import { cn } from "@/shadcn/utils";

/** The homepage's buttons, at a fixed size for the other marketing pages */
export default function MarketingButton({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: string;
  variant: "white" | "coral" | "ink";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-10 items-center justify-center rounded border px-3 text-sm leading-[0.98] font-bold tracking-[-0.02em] whitespace-nowrap drop-shadow-[0_0_8px_rgba(0,0,0,0.08)]",
        variant === "white" &&
          "border-ink/15 bg-white text-ink hover:bg-neutral-50",
        variant === "coral" &&
          "border-white/80 bg-[#ff6b6b] text-ink hover:bg-[#ff5252]",
        variant === "ink" && "border-ink bg-ink text-white hover:bg-ink/90",
        className,
      )}
    >
      {children}
    </Link>
  );
}

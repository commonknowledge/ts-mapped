import { cn } from "@/shadcn/utils";

export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // component to control max width of website content
  // please do not add vertical padding in here (use className prop instead)
  return (
    <div
      className={cn("w-full max-w-[1440px] px-4 md:px-10 mx-auto", className)}
    >
      {children}
    </div>
  );
}

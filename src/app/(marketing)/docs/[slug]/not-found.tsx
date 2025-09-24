import Link from "next/link";
import { TypographyH1, TypographyP } from "@/components/typography";
import { Button } from "@/shadcn/ui/button";

export default function NotFound() {
  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="text-center">
        <TypographyH1>Feature Not Found</TypographyH1>
        <TypographyP className="mt-4 text-neutral-600">
          The feature you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </TypographyP>
        <Button asChild className="mt-6">
          <Link href="/features">Back to Features</Link>
        </Button>
      </div>
    </div>
  );
}

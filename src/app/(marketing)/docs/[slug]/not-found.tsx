import { Link } from "@/components/Link";

export default function NotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-4xl leading-[0.98] font-bold tracking-[-0.052em]">
        Page not found
      </h1>
      <p className="text-lg text-ink/70">
        This docs page doesn&apos;t exist or has moved.
      </p>
      <Link href="/docs" className="font-medium underline hover:no-underline">
        Back to the docs
      </Link>
    </div>
  );
}

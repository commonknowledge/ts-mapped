import { Link } from "@/components/Link";
import { DOC_GROUPS } from "@/content/marketing/docs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Mapped",
  description: "How to map your members, overlay data and plan with Mapped.",
};

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <p className="text-lg leading-[1.35] text-ink/70">
        New to Mapped? Start with{" "}
        <Link
          href="/docs/tutorial"
          className="font-medium text-ink underline underline-offset-2 hover:no-underline"
        >
          the guided tutorial
        </Link>
        , then come back here for the details.
      </p>

      <div className="mt-12 space-y-14">
        {DOC_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-3xl leading-none font-bold tracking-[-0.042em]">
              {group.title}
            </h2>
            <p className="mt-2 text-ink/60">{group.description}</p>
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/docs/${page.slug}`}
                    className="group flex h-full flex-col gap-1.5 rounded-lg border border-ink/10 p-5 transition-colors hover:border-ink/25 hover:bg-mint"
                  >
                    <span className="flex items-center justify-between gap-2 font-bold tracking-[-0.02em]">
                      {page.title}
                      <span
                        aria-hidden
                        className="text-ink/40 transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                    <span className="text-sm leading-snug text-ink/60">
                      {page.subtitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Link } from "@/components/Link";
import { DOC_GROUPS } from "@/content/marketing/docs";
import { cn } from "@/shadcn/utils";

const itemClass = (active: boolean) =>
  cn(
    "block rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "bg-mint font-medium text-ink"
      : "text-ink/70 hover:bg-mint/60 hover:text-ink",
  );

/** The docs' contents, grouped as in content/marketing/docs.ts */
export default function DocsSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const nav = (
    <nav className="space-y-6" aria-label="Docs">
      <Link
        href="/docs"
        className={itemClass(pathname === "/docs")}
        onClick={() => setIsOpen(false)}
      >
        Overview
      </Link>
      {DOC_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 pb-1 font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
            {group.title}
          </p>
          {group.pages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/${page.slug}`}
              className={itemClass(pathname === `/docs/${page.slug}`)}
              onClick={() => setIsOpen(false)}
            >
              {page.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Phones: the contents in a drawer */}
      <button
        type="button"
        className="flex w-fit items-center gap-2 rounded border border-ink/15 px-3 py-2 text-sm font-medium text-ink md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon className="size-4" />
        Docs contents
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-ink/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold tracking-[-0.02em] text-ink">Docs</p>
              <button
                type="button"
                aria-label="Close"
                className="rounded p-1 text-ink hover:bg-mint"
                onClick={() => setIsOpen(false)}
              >
                <XIcon className="size-4" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="hidden w-60 shrink-0 md:block">
        <div className="sticky top-8 border-r border-ink/10 pr-6">{nav}</div>
      </div>
    </>
  );
}

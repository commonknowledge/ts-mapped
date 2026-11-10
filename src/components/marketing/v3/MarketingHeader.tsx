"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Link } from "@/components/Link";
import { SOLUTIONS } from "@/content/marketing/solutions";
import { cn } from "@/shadcn/utils";
import { NAV_ITEMS, REQUEST_ACCESS_URL } from "./constants";
import MarketingButton from "./MarketingButton";
import MobileMenu from "./MobileMenu";

/**
 * The marketing pages' top bar, in the homepage's colours: the ink
 * wordmark, its links, and Request Access and Login (a menu on phones,
 * where there's no login as the app needs a desktop)
 */
export default function MarketingHeader() {
  const pathname = usePathname();
  return (
    <header className="relative z-30 border-b border-ink/10 bg-mint">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:h-20 lg:px-[30px]">
        <Link href="/" className="block w-24 shrink-0 lg:w-32">
          <Image
            src="/logo-wordmark-ink.svg"
            alt="Mapped"
            width={220}
            height={72}
            priority
            className="h-auto w-full"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const link = (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded px-3 py-2 text-[15px] leading-none font-medium tracking-[-0.01em] text-ink hover:underline",
                    active && "underline underline-offset-4",
                  )}
                >
                  {item.label}
                </Link>
              );
              if (item.href !== "/solutions") {
                return <li key={item.href}>{link}</li>;
              }
              // Solutions opens a menu of the solution pages on hover/focus
              return (
                <li key={item.href} className="group/solutions relative">
                  {link}
                  <div className="invisible absolute top-full left-1/2 z-40 w-[420px] -translate-x-1/2 pt-3 opacity-0 transition-opacity group-focus-within/solutions:visible group-focus-within/solutions:opacity-100 group-hover/solutions:visible group-hover/solutions:opacity-100">
                    <ul className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-white p-2 shadow-[0_12px_40px_rgba(21,33,59,0.12)]">
                      {SOLUTIONS.map((solution) => (
                        <li key={solution.slug}>
                          <Link
                            href={`/solutions/${solution.slug}`}
                            className="flex flex-col gap-0.5 rounded-md px-3 py-2.5 hover:bg-mint"
                          >
                            <span className="font-bold tracking-[-0.02em] text-ink">
                              {solution.title}
                            </span>
                            <span className="text-sm leading-snug text-ink/60">
                              {solution.summary}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <MarketingButton href={REQUEST_ACCESS_URL} variant="white">
              Request Access
            </MarketingButton>
            <MarketingButton href="/login" variant="coral">
              Login
            </MarketingButton>
          </div>
        </nav>

        <div className="lg:hidden">
          <MobileMenu items={NAV_ITEMS} requestAccessUrl={REQUEST_ACCESS_URL} />
        </div>
      </div>
    </header>
  );
}

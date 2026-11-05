import { ArrowLeftIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { Link } from "@/components/Link";
import { DEFAULT_AUTH_REDIRECT } from "@/constants";
import type * as React from "react";

// The marketing site's display font, for the tagline
const manrope = Manrope({ subsets: ["latin"], weight: ["700"] });

/**
 * Sign-in pages: the marketing site's map and wordmark on the left, the
 * form on the right. Phones get the form alone, under the ink wordmark.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverSession = await getServerSession();
  if (serverSession.currentUser) {
    return redirect(DEFAULT_AUTH_REDIRECT);
  }

  return (
    <div className="grid min-h-svh bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Graphic */}
      <aside className="relative hidden overflow-hidden bg-[#e8eef0] lg:block">
        <Image
          src="/marketing-v3/hero-map.png"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover"
        />
        {/* Scrims so the wordmark and line read over the map */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink/85 to-transparent" />

        <Link href="/" className="absolute top-8 left-8 block w-40">
          <Image
            src="/marketing-v3/wordmark-header.svg"
            alt="Mapped"
            width={220}
            height={72}
            priority
            className="h-auto w-full"
          />
        </Link>

        <div className="absolute right-8 bottom-8 left-8 text-white">
          <p className="mb-3 font-mono text-[11px] tracking-[0.13em] uppercase opacity-70">
            Geographic mapping for political organisers
          </p>
          <p
            className={`${manrope.className} max-w-md text-4xl leading-[1.05] font-bold tracking-[-0.042em]`}
          >
            Made for the movement, by the movement
          </p>
        </div>
      </aside>

      {/* Form */}
      <div className="relative flex flex-col overflow-hidden px-6 py-6 md:px-10">
        <Image
          src="/marketing-v3/pattern-hero.svg"
          alt=""
          aria-hidden
          width={468}
          height={467}
          className="pointer-events-none absolute -right-10 -bottom-10 hidden w-96 max-w-none rotate-90 opacity-25 lg:block"
        />

        <header className="relative flex items-center justify-between">
          <Link href="/" className="block w-24 lg:hidden">
            <Image
              src="/logo-wordmark-ink.svg"
              alt="Mapped"
              width={220}
              height={72}
              priority
              className="h-auto w-full"
            />
          </Link>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1.5 text-sm text-neutral-500 hover:text-ink"
          >
            <ArrowLeftIcon className="size-4" />
            Back to home
          </Link>
        </header>

        <main className="relative flex flex-1 items-center justify-center py-16">
          {children}
        </main>

        <p className="relative text-xs text-neutral-500">
          Made by{" "}
          <a
            href="https://commonknowledge.coop"
            className="underline hover:no-underline"
          >
            Common Knowledge
          </a>
        </p>
      </div>
    </div>
  );
}

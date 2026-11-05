"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/components/Link";

/**
 * The phone header's menu: a burger that opens the site's pages full
 * screen, with Request Access. No login: the app needs a desktop.
 */
export default function MobileMenu({
  items,
  requestAccessUrl,
}: {
  items: { label: string; href: string }[];
  requestAccessUrl: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Escape closes it, and the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="-mr-2 flex size-10 cursor-pointer items-center justify-center rounded-md text-[#15213b] hover:bg-[#15213b]/5"
      >
        <MenuIcon className="size-6" />
      </button>

      {/* On the page itself: the hero is a CSS container, which would
          otherwise trap a fixed menu inside it */}
      {isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col bg-[#f0fbed] px-5 pt-4 pb-8"
          >
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setIsOpen(false)} className="w-24">
                <Image
                  src="/logo-wordmark-ink.svg"
                  alt="Mapped"
                  width={220}
                  height={72}
                  className="h-auto w-full"
                />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="-mr-2 flex size-10 cursor-pointer items-center justify-center rounded-md text-[#15213b] hover:bg-[#15213b]/5"
              >
                <XIcon className="size-6" />
              </button>
            </div>

            <nav className="mt-10 flex-1">
              <ul className="flex flex-col">
                {items.map((item) => (
                  <li
                    key={item.label}
                    className="border-b border-[#15213b]/10 first:border-t"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-3xl leading-none font-bold tracking-[-0.04em] text-[#15213b]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              href={requestAccessUrl}
              className="flex h-12 items-center justify-center rounded border border-white/80 bg-white text-base font-bold tracking-[-0.02em] text-[#16223c] shadow-[0_0_8px_rgba(0,0,0,0.08)]"
            >
              Request Access
            </Link>
            <p className="mt-3 text-center text-xs text-[#15213b]/60">
              Mapped is made for desktop. Sign in on a computer.
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

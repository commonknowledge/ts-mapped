"use client";

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/shadcn/ui/navigation-menu";
import { cn } from "@/shadcn/utils";
import type { CurrentUser } from "@/authTypes";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Solutions", href: "/solutions" },
  { label: "Docs", href: "/docs" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
];

export const MarketingNavbar = ({
  currentUser,
}: {
  currentUser: CurrentUser | null;
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center px-4 md:px-6 h-16 md:h-20 sticky top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center">
          <Link href="/" className="pr-2 shrink-0">
            <Image
              src="/logo.svg"
              alt="Mapped"
              width={28}
              height={28}
              className="md:w-8 md:h-8"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 mx-auto justify-center p-4 ">
          <DesktopNavbar />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md bg-brand-background"
            aria-label="Toggle mobile menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-0.5" : "-translate-y-1"}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1"}`}
              ></span>
            </div>
          </button>
        </div>

        {currentUser ? (
          <Link href="/dashboard" className="hidden md:block">
            <Button size="sm" className="text-xs md:text-sm">
              Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/login" className="hidden md:block">
            <Button size="sm" className="text-xs md:text-sm">
              Login
            </Button>
          </Link>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-black/50 z-40",
          isMobileMenuOpen ? "" : "invisible",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col space-y-4">
            {/* Navigation Items */}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4">
              Mapped is built to be used on desktop. We recommend using a
              desktop browser to get the best experience.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DesktopNavbar = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {NAV_ITEMS.map((item) => (
          <NavigationMenuLink
            key={item.href}
            asChild
            className={navigationMenuTriggerStyle()}
          >
            <Link href={item.href}>{item.label}</Link>
          </NavigationMenuLink>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

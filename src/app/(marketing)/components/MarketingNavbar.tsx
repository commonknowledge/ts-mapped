"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/components/Link";
import { useCurrentUser } from "@/hooks";
import { urlFor } from "@/sanity/lib/image";
import { Button } from "@/shadcn/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shadcn/ui/navigation-menu";
import { cn } from "@/shadcn/utils";

interface Solution {
  _id: string;
  title: string;
  subtitle: string;
  slug: { current: string };
  position: number;
  icon: string;
}

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
];

export const MarketingNavbar = ({ solutions }: { solutions: Solution[] }) => {
  const { currentUser } = useCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);

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
          <DesktopNavbar solutions={solutions} />
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
            {/* Solutions Accordion */}
            <div>
              <button
                onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                className="flex items-center justify-between w-full text-lg font-medium py-2 border-b border-gray-100"
              >
                Solutions
                {isSolutionsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {isSolutionsOpen && (
                <div className="space-y-2 mt-2">
                  {solutions.length > 0 ? (
                    solutions
                      .sort((a, b) => a.position - b.position)
                      .map((solution) => (
                        <Link
                          key={solution._id}
                          href={`/solutions/${solution.slug?.current || solution._id}`}
                          className="text-base py-2 pl-2 border-b border-gray-100 flex gap-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Image
                            src={urlFor(solution.icon).url()}
                            alt={solution.title}
                            className="w-4 h-4 mr-2 mt-1 opacity-50"
                            width={20}
                            height={20}
                          />
                          <div className="flex flex-col">
                            <div className="font-medium">{solution.title}</div>
                            <div className="text-sm text-neutral-500">
                              {solution.subtitle}
                            </div>
                          </div>
                        </Link>
                      ))
                  ) : (
                    <div className="text-sm text-neutral-500 pl-4">
                      No solutions available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
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

const DesktopNavbar = ({ solutions }: { solutions: Solution[] }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent className="border-0 shadow-lg">
            <ul className="grid w-[400px] gap-2 p-2">
              {solutions.length > 0 ? (
                solutions
                  .sort((a, b) => a.position - b.position)
                  .map((solution) => (
                    <li
                      key={solution._id}
                      className="cursor-pointer hover:bg-neutral-100 p-2 rounded-sm"
                    >
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/solutions/${solution.slug?.current || solution._id}`}
                          className="flex  gap-1"
                        >
                          <Image
                            src={urlFor(solution.icon).url()}
                            alt={solution.title}
                            className="w-4 h-4 mr-2 mt-1 opacity-50"
                            width={20}
                            height={20}
                          />
                          <div className="flex flex-col">
                            <div className="font-medium">{solution.title}</div>
                            <div className="text-muted-foreground text-sm">
                              {solution.subtitle}
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No solutions available
                </li>
              )}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
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

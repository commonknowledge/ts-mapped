"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isPrivateRoute } from "@/config/routes";
import { Button } from "@/shadcn/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/shadcn/ui/navigation-menu";

export default function ConditionalMarketingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isPrivateRoute(pathname)) {
    return null;
  }

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
          <Link href="/features" className="text-sm">
            Features
          </Link>
          <Link href="/about" className="text-sm">
            About
          </Link>
          <Link href="/privacy" className="text-sm">
            Privacy
          </Link>
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

        <Link href="/login" className="hidden md:block">
          <Button size="sm" className="text-xs md:text-sm">
            Login
          </Button>
        </Link>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href="/features"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/about"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy
              </Link>
              <div className="pt-4">
                Mapped is built to be used on desktop. We recommend using a
                desktop browser to get the best experience.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const DesktopNavbar = () => {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch("/api/solutions");
        const solutions = await response.json();
        setSolutions(solutions || []);
      } catch (error) {
        console.error("Error fetching solutions:", error);
        setSolutions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSolutions();
  }, []);
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : solutions.length > 0 ? (
                solutions.map((solution) => (
                  <li
                    key={solution._id}
                    className="cursor-pointer hover:bg-neutral-100 p-1 rounded-sm"
                  >
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/solutions/${solution.slug?.current || solution._id}`}
                      >
                        <div className="font-medium">{solution.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {solution.subtitle}
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
      </NavigationMenuList>
    </NavigationMenu>
  );
};

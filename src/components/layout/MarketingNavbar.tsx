"use client";

import Image from "next/image";
import { useState } from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";

export default function MarketingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 bg-transparent z-50">
        <Container>
          <nav className="flex justify-between items-center h-16 md:h-20">
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
            <div className="hidden md:flex items-center gap-6 mx-auto justify-center p-4 bg-brand-background rounded-lg">
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
        </Container>
      </div>

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

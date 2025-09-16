"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import type { FeatureSetProps } from "./types";

export default function DocsSidebar({ featureSets }: FeatureSetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <nav className="space-y-6">
      {/* Overview Link */}
      <div>
        <Link
          href="/docs"
          className={cn(
            "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === "/docs"
              ? "bg-neutral-100"
              : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
          )}
        >
          Overview
        </Link>
      </div>

      {/* Feature Sets */}
      {featureSets.map((featureSet) => (
        <div key={featureSet._id} className="space-y-2">
          {/* Feature Set Header */}
          <div className="px-3">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {featureSet.title}
            </h3>
          </div>

          {/* Features in this set */}
          <div className="space-y-1">
            {featureSet.features && featureSet.features.length > 0
              ? featureSet.features
                  .filter((feature) => feature.isActive !== false)
                  .map((feature) => (
                    <Link
                      key={feature._id}
                      href={`/docs/${feature.slug.current}`}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-md transition-colors ml-3",
                        pathname === `/docs/${feature.slug.current}`
                          ? "bg-neutral-100"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100",
                      )}
                    >
                      {feature.title}
                    </Link>
                  ))
              : null}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden mb-4"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-4 w-4 mr-2" />
        Menu
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Documentation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-8">{sidebarContent}</div>
      </div>
    </>
  );
}

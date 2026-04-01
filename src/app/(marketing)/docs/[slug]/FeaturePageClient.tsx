"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/components/Link";
import { TypographyH1, TypographyLead } from "@/components/typography";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { cn } from "@/shadcn/utils";

interface Frontmatter {
  title: string;
  subtitle?: string;
  featureSet: string;
  featureSetSlug: string;
}

function slugifySection(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FeaturePageClient({
  children,
  frontmatter,
  sections,
}: {
  children: React.ReactNode;
  frontmatter: Frontmatter;
  sections: string[];
}) {
  const [activeSection, setActiveSection] = useState(0);
  const sectionEls = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    sectionEls.current = sections.map((section) =>
      document.getElementById(slugifySection(section)),
    );

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      sectionEls.current.forEach((el, index) => {
        if (el) {
          const { offsetTop, offsetHeight } = el;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (index: number) => {
    sectionEls.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSection(index);
  };

  return (
    <div className="flex gap-8">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl flex flex-col gap-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList className="flex items-center space-x-2 text-sm text-neutral-500">
            <BreadcrumbItem>
              <Link href="/docs" className="hover:text-neutral-700">
                Docs
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{frontmatter.featureSet}</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-foreground font-medium">
              {frontmatter.title}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mt-4">
          <TypographyH1>{frontmatter.title}</TypographyH1>
          {frontmatter.subtitle && (
            <TypographyLead className="mt-4">
              {frontmatter.subtitle}
            </TypographyLead>
          )}
        </div>

        {/* MDX Content */}
        <div className="prose max-w-2xl [--tw-prose-body:var(--foreground)] [--tw-prose-headings:var(--foreground)] [--tw-prose-bold:var(--foreground)] [--tw-prose-links:var(--foreground)] [--tw-prose-code:var(--foreground)]">{children}</div>
      </div>

      {/* TOC — only show if more than one section */}
      {sections.length > 1 && (
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(index)}
                    className={cn(
                      "block w-full text-left text-sm rounded-md transition-colors",
                      activeSection === index
                        ? "text-neutral-800 underline"
                        : "text-neutral-500 hover:text-neutral-900",
                    )}
                  >
                    {section}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

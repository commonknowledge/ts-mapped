"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import { TypographyH2 } from "@/components/typography";
import Container from "@/components/layout/Container";

interface Solution {
  _id: string;
  title: string;
  slug: { current: string };
  icon: string;
}

interface SolutionsTableOfContentsProps {
  solutions: Solution[];
}

// Generate slug-friendly IDs for anchor links
const getSolutionId = (slug: string) => {
  return slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

export default function SolutionsTableOfContents({
  solutions,
}: SolutionsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observerOptions = {
      rootMargin: "-100px 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Find the entry with the highest intersection ratio that's intersecting
      const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
      
      if (intersectingEntries.length === 0) {
        // If nothing is intersecting, find the closest section above the viewport
        const allElements = solutions.map((solution) => {
          const solutionId = getSolutionId(
            solution.slug?.current || solution.title,
          );
          return document.getElementById(solutionId);
        }).filter(Boolean) as HTMLElement[];

        const viewportTop = window.scrollY + 200; // Account for sticky header + TOC
        let closestElement: HTMLElement | null = null;
        let closestDistance = Infinity;

        allElements.forEach((element) => {
          const elementTop = element.getBoundingClientRect().top + window.scrollY;
          const distance = Math.abs(elementTop - viewportTop);
          
          if (elementTop <= viewportTop && distance < closestDistance) {
            closestDistance = distance;
            closestElement = element;
          }
        });

        if (closestElement) {
          setActiveId(closestElement.id);
        }
        return;
      }

      // Sort by intersection ratio (highest first), then by position in viewport
      intersectingEntries.sort((a, b) => {
        if (b.intersectionRatio !== a.intersectionRatio) {
          return b.intersectionRatio - a.intersectionRatio;
        }
        // If ratios are equal, prefer the one higher up in the viewport
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });

      // Set the most visible intersecting section as active
      if (intersectingEntries.length > 0) {
        setActiveId(intersectingEntries[0].target.id);
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // Observe all solution sections
    solutions.forEach((solution) => {
      const solutionId = getSolutionId(
        solution.slug?.current || solution.title,
      );
      const element = document.getElementById(solutionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Also handle scroll events to update active state when clicking links
    const handleScroll = () => {
      const allElements = solutions.map((solution) => {
        const solutionId = getSolutionId(
          solution.slug?.current || solution.title,
        );
        return document.getElementById(solutionId);
      }).filter(Boolean) as HTMLElement[];

      const viewportTop = window.scrollY + 200;
      let activeElement: HTMLElement | null = null;
      let minDistance = Infinity;

      allElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const distance = Math.abs(elementTop - viewportTop);

        // Prefer elements that are at or above the viewport top
        if (rect.top <= 200 && distance < minDistance) {
          minDistance = distance;
          activeElement = element;
        }
      });

      if (activeElement) {
        setActiveId(activeElement.id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      solutions.forEach((solution) => {
        const solutionId = getSolutionId(
          solution.slug?.current || solution.title,
        );
        const element = document.getElementById(solutionId);
        if (element) {
          observer.unobserve(element);
        }
      });
      window.removeEventListener("scroll", handleScroll);
    };
  }, [solutions]);

  return (
    <div className="sticky top-16 md:top-20 z-[45] bg-brand-background border-b border-neutral-200 shadow-sm">
      <Container className="py-4">
        <nav className="flex flex-wrap gap-4">
          {solutions.map((solution) => {
            const solutionId = getSolutionId(
              solution.slug?.current || solution.title,
            );
            const isActive = activeId === solutionId;

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              const element = document.getElementById(solutionId);
              if (element) {
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            };

            return (
              <a
                key={solution._id}
                href={`#${solutionId}`}
                onClick={handleClick}
                className={`text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? "text-brand-primary font-medium"
                    : "text-neutral-600 hover:text-brand-primary"
                }`}
              >
                <Image
                  src={urlFor(solution.icon).url()}
                  alt={solution.title}
                  className={`w-4 h-4 transition-opacity ${
                    isActive ? "opacity-100" : "opacity-50"
                  }`}
                  width={16}
                  height={16}
                />
                {solution.title}
              </a>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}


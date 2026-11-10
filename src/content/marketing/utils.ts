import { DOC_GROUPS } from "./docs";
import { SOLUTIONS } from "./solutions";
import type { DocGroup, DocPage, Solution } from "./types";

export const getSolution = (slug: string): Solution | undefined =>
  SOLUTIONS.find((solution) => solution.slug === slug);

export const getAllDocPages = (): DocPage[] =>
  DOC_GROUPS.flatMap((group) => group.pages);

export const getDocPage = (
  slug: string,
): { page: DocPage; group: DocGroup } | undefined => {
  for (const group of DOC_GROUPS) {
    const page = group.pages.find((p) => p.slug === slug);
    if (page) return { page, group };
  }
  return undefined;
};

/** The pages either side, in sidebar order, for previous/next links */
export const getDocNeighbours = (slug: string) => {
  const pages = getAllDocPages();
  const index = pages.findIndex((p) => p.slug === slug);
  return {
    previous: index > 0 ? pages[index - 1] : undefined,
    next: index >= 0 && index < pages.length - 1 ? pages[index + 1] : undefined,
  };
};

export type InlinePart =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string };

/** Splits a paragraph into text, **bold** and [link](href) parts */
export const parseInline = (text: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last)
      parts.push({ type: "text", text: text.slice(last, index) });
    if (match[1]) {
      parts.push({ type: "bold", text: match[1] });
    } else {
      parts.push({ type: "link", text: match[2], href: match[3] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
};

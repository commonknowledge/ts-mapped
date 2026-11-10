// Marketing content written in code (Solutions and Docs), replacing the
// CMS for those pages. Paragraphs are plain strings; **bold** and
// [links](/path) are the only formatting (see utils.ts).

export interface ContentImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

export interface Solution {
  slug: string;
  title: string;
  subtitle: string;
  /** One line for the Solutions index and the header menu */
  summary: string;
  status: "available" | "coming-soon";
  items: {
    title: string;
    paragraphs: string[];
    image?: ContentImage;
    /** A docs page that explains how */
    docSlug?: string;
  }[];
}

export interface DocStep {
  title: string;
  body?: string;
}

export interface DocSection {
  title: string;
  paragraphs?: string[];
  steps?: DocStep[];
  image?: ContentImage;
}

export interface DocPage {
  slug: string;
  title: string;
  subtitle: string;
  intro?: string[];
  sections: DocSection[];
  /** Other docs pages worth reading next */
  related?: string[];
}

export interface DocGroup {
  title: string;
  description: string;
  pages: DocPage[];
}

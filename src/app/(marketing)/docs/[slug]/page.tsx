import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { manifest } from "../../../../../docs-content/manifest";
import FeaturePageClient from "./FeaturePageClient";

const DOCS_CONTENT_DIR = path.join(process.cwd(), "docs-content");

interface Frontmatter {
  title: string;
  subtitle?: string;
  featureSet: string;
  featureSetSlug: string;
}

function findMdxFile(slug: string): { content: string; data: Frontmatter } | null {
  for (const set of manifest) {
    const filePath = path.join(DOCS_CONTENT_DIR, set.slug, `${slug}.mdx`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { content, data } = matter(raw);
      return { content, data: data as Frontmatter };
    }
  }
  return null;
}

function extractSections(content: string): string[] {
  return content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^## /, "").trim());
}

function slugifySection(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const mdxComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => {
    const text = typeof children === "string" ? children : "";
    const id = slugifySection(text);
    return (
      <h2 id={id} className="text-xl font-semibold mt-10 mb-4 scroll-mt-24">
        {children}
      </h2>
    );
  },
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-medium mt-6 mb-2">{children}</h3>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="w-full border rounded-md border-neutral-200 shadow-md my-4"
    />
  ),
};

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const file = findMdxFile(slug);

  if (!file) {
    notFound();
  }

  const { content, data } = file;
  const sections = extractSections(content);

  return (
    <FeaturePageClient frontmatter={data} sections={sections}>
      <MDXRemote source={content} components={mdxComponents} />
    </FeaturePageClient>
  );
}

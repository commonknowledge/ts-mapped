import type { RichTextBlock } from "@/app/(marketing)/types";

// Helper function to extract plain text from rich text blocks
export function getTextFromBlocks(blocks: RichTextBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children
          .map((child: { text: string }) => child.text || "")
          .join("");
      }
      return "";
    })
    .join(" ");
}

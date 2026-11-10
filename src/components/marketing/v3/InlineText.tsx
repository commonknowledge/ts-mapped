import { Link } from "@/components/Link";
import { parseInline } from "@/content/marketing/utils";

/** A paragraph of marketing content, with its **bold** and [links](/path) */
export default function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, index) => {
        if (part.type === "bold") {
          return (
            <strong key={index} className="font-bold text-ink">
              {part.text}
            </strong>
          );
        }
        if (part.type === "link") {
          return (
            <Link
              key={index}
              href={part.href}
              className="font-medium text-ink underline underline-offset-2 hover:no-underline"
            >
              {part.text}
            </Link>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

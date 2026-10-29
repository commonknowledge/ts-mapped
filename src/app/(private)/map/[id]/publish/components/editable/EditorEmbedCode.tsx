import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { getAbsoluteUrl, getPublicMapUrl } from "@/utils/appUrl";
import { usePublicMapValue } from "../../hooks/usePublicMap";
import { getSubdomain } from "../../utils";

/**
 * The snippet for embedding the public map on another site. It uses
 * embed.js rather than a bare iframe because by-request maps need it: the
 * script passes access link tokens, and which page the map is on, into the
 * iframe.
 */
export default function EditorEmbedCode() {
  const publicMap = usePublicMapValue();

  // Nothing to embed until the subdomain is filled in
  if (!publicMap?.host || !getSubdomain(publicMap.host)) {
    return null;
  }

  // A by-request map works at its own address, but can only be embedded on
  // listed websites, so the code is only handed out once there is one
  const needsWebsite =
    publicMap.accessMode === PublicMapAccessMode.Moderated &&
    publicMap.embedOrigins.length === 0;
  if (needsWebsite) {
    return (
      <FormFieldWrapper label="Embed code" id="Embed code">
        <p className="text-sm text-muted-foreground">
          Visitors can request access at the map&apos;s own address:{" "}
          <a
            href={getPublicMapUrl(publicMap.host)}
            target="_blank"
            className="underline"
          >
            {getPublicMapUrl(publicMap.host)}
          </a>
          . To embed it on a website too, add the website under &ldquo;Websites
          this map is embedded on&rdquo; below.
        </p>
      </FormFieldWrapper>
    );
  }

  const snippet = [
    `<div data-mapped-map="${getPublicMapUrl(publicMap.host)}" style="height: 600px"></div>`,
    `<script src="${getAbsoluteUrl("embed.js")}" async></script>`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Embed code copied");
    } catch {
      toast.error("Could not copy. Select the code and copy it instead.");
    }
  };

  return (
    <FormFieldWrapper
      label="Embed code"
      id="Embed code"
      hint={
        publicMap.accessMode === PublicMapAccessMode.Moderated
          ? `Paste this into the page where the map should appear, on one of: ${publicMap.embedOrigins.join(", ")}. Change the height to suit. Embedding works once the map is published.`
          : "Paste this into the page where the map should appear. Change the height to suit. Embedding works once the map is published."
      }
    >
      <Textarea
        id="Embed code"
        readOnly
        value={snippet}
        onFocus={(e) => e.target.select()}
        className="w-full shadow-none font-mono text-xs"
        rows={4}
      />
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        Copy embed code
      </Button>
    </FormFieldWrapper>
  );
}

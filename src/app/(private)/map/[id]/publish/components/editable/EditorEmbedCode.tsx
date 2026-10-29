import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { usePublicMapValue } from "../../hooks/usePublicMap";

/**
 * The snippet for embedding the public map on another site. It uses
 * embed.js rather than a bare iframe because by-request maps need it: the
 * script passes access link tokens, and which page the map is on, into the
 * iframe.
 */
export default function EditorEmbedCode() {
  const publicMap = usePublicMapValue();

  // Hosts are "<subdomain>.<base host>": nothing to embed until the
  // subdomain is filled in
  const subdomain = publicMap?.host?.split(".")[0];
  if (!publicMap?.host || !subdomain) {
    return null;
  }

  const protocol = new URL(getAbsoluteUrl()).protocol;
  const snippet = [
    `<div data-mapped-map="${protocol}//${publicMap.host}" style="height: 600px"></div>`,
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
      hint="Paste this into the page where the map should appear. Change the height to suit. Embedding works once the map is published."
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

import { useState } from "react";
import z from "zod";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import {
  usePublicMapValue,
  useUpdatePublicMap,
} from "../../hooks/usePublicMap";

const parseEmails = (value: string) =>
  value
    .split(/[\s,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isEmail = (value: string) => z.email().safeParse(value).success;
const isUrl = (value: string) => z.url().safeParse(value).success;

export default function EditorAccessSettings() {
  const publicMap = usePublicMapValue();
  const updatePublicMap = useUpdatePublicMap();

  // Text buffers: the draft only accepts valid emails and URLs (it is
  // validated when auto-saved), so half-typed values are committed on blur
  const [moderatorEmailsText, setModeratorEmailsText] = useState<string | null>(
    null,
  );
  const [embedUrlText, setEmbedUrlText] = useState<string | null>(null);

  if (!publicMap) {
    return null;
  }

  const moderated = publicMap.accessMode === PublicMapAccessMode.Moderated;

  const moderatorEmailsValue =
    moderatorEmailsText ?? publicMap.moderatorEmails.join("\n");
  const invalidEmails = parseEmails(moderatorEmailsValue).filter(
    (email) => !isEmail(email),
  );

  const embedUrlValue = embedUrlText ?? publicMap.embedUrl;
  const embedUrlInvalid = Boolean(embedUrlValue) && !isUrl(embedUrlValue);

  const commitModeratorEmails = () => {
    if (moderatorEmailsText === null) {
      return;
    }
    if (invalidEmails.length === 0) {
      updatePublicMap({ moderatorEmails: parseEmails(moderatorEmailsText) });
      setModeratorEmailsText(null);
    }
  };

  const commitEmbedUrl = () => {
    if (embedUrlText === null) {
      return;
    }
    if (!embedUrlInvalid) {
      updatePublicMap({ embedUrl: embedUrlText.trim() });
      setEmbedUrlText(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FormFieldWrapper
        label="Access"
        id="Public map access"
        hint={
          moderated
            ? "Visitors request access by email. A moderator approves each request, then the visitor is emailed a link that works for one week."
            : "Anyone with the link can see the map."
        }
      >
        <Select
          value={publicMap.accessMode}
          onValueChange={(value) =>
            updatePublicMap({ accessMode: value as PublicMapAccessMode })
          }
        >
          <SelectTrigger className="w-full" id="Public map access">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PublicMapAccessMode.Open}>
              Open to everyone
            </SelectItem>
            <SelectItem value={PublicMapAccessMode.Moderated}>
              By request, approved by a moderator
            </SelectItem>
          </SelectContent>
        </Select>
      </FormFieldWrapper>

      {moderated && (
        <>
          <FormFieldWrapper
            label="Moderator emails"
            id="Moderator emails"
            hint="One per line. Each is emailed when someone requests access."
            error={
              invalidEmails.length
                ? `Not a valid email: ${invalidEmails.join(", ")}`
                : null
            }
          >
            <Textarea
              id="Moderator emails"
              placeholder="moderator@example.org"
              value={moderatorEmailsValue}
              onChange={(e) => setModeratorEmailsText(e.target.value)}
              onBlur={commitModeratorEmails}
              className="w-full shadow-none"
              rows={3}
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            label="Embedded on page"
            id="Embed page URL"
            hint="The page the map is embedded on. Access links take visitors there. Leave blank to link to the map's own address."
            error={embedUrlInvalid ? "Not a valid URL" : null}
          >
            <Input
              id="Embed page URL"
              placeholder="https://example.org/map"
              value={embedUrlValue}
              onChange={(e) => setEmbedUrlText(e.target.value)}
              onBlur={commitEmbedUrl}
              className="w-full shadow-none"
              type="url"
            />
          </FormFieldWrapper>
        </>
      )}
    </div>
  );
}

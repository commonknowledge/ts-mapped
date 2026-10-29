import { useState } from "react";
import z from "zod";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { PublicMapAccessMode } from "@/models/PublicMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import { toOrigin } from "@/utils/publicMapAccess";
import {
  usePublicMapValue,
  useUpdatePublicMap,
} from "../../hooks/usePublicMap";

const isEmail = (value: string) => z.email().safeParse(value).success;
const isOrigin = (value: string) => toOrigin(value) === value;

export default function EditorAccessSettings() {
  const publicMap = usePublicMapValue();
  const updatePublicMap = useUpdatePublicMap();

  if (!publicMap) {
    return null;
  }

  const moderated = publicMap.accessMode === PublicMapAccessMode.Moderated;

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
          <ListField
            label="Moderator emails"
            hint="One per line. Each is emailed when someone requests access."
            placeholder="moderator@example.org"
            values={publicMap.moderatorEmails}
            isValid={isEmail}
            invalidMessage="Not a valid email"
            normalise={(value) => value.toLowerCase()}
            onCommit={(moderatorEmails) => updatePublicMap({ moderatorEmails })}
          />
          <ListField
            label="Websites this map is embedded on"
            hint={
              <>
                One website per line, e.g. https://example.org. The map can then
                be embedded on any page of that website, and access links take
                visitors back to the page they asked from. Anything after the
                website&apos;s address is ignored.
                <br />
                <br />
                If the map is embedded on a website that isn&apos;t listed, it
                shows &ldquo;This map hasn&apos;t been set up to be embedded on
                this site&rdquo; instead of the request form. The map&apos;s own
                address always works, listed or not.
              </>
            }
            placeholder="https://example.org"
            values={publicMap.embedOrigins}
            isValid={isOrigin}
            invalidMessage="Not a website address"
            normalise={(value) => toOrigin(value) ?? value}
            onCommit={(embedOrigins) => updatePublicMap({ embedOrigins })}
          />
        </>
      )}
    </div>
  );
}

/**
 * A one-per-line list. The draft only accepts valid values (it is
 * validated when auto-saved), so the text is buffered while typing and
 * committed on blur once every line is valid.
 */
function ListField({
  label,
  hint,
  placeholder,
  values,
  isValid,
  invalidMessage,
  normalise = (value) => value,
  onCommit,
}: {
  label: string;
  hint: React.ReactNode;
  placeholder: string;
  values: string[];
  isValid: (value: string) => boolean;
  invalidMessage: string;
  normalise?: (value: string) => string;
  onCommit: (values: string[]) => void;
}) {
  const [text, setText] = useState<string | null>(null);

  const value = text ?? values.join("\n");
  const parsed = [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((line) => normalise(line.trim()))
        .filter(Boolean),
    ),
  ];
  const invalid = parsed.filter((line) => !isValid(line));

  const commit = () => {
    if (text === null || invalid.length > 0) {
      return;
    }
    onCommit(parsed);
    setText(null);
  };

  return (
    <FormFieldWrapper
      label={label}
      id={label}
      hint={hint}
      error={invalid.length ? `${invalidMessage}: ${invalid.join(", ")}` : null}
    >
      <Textarea
        id={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        className="w-full shadow-none"
        rows={3}
      />
    </FormFieldWrapper>
  );
}

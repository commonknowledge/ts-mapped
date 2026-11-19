import { useEffect } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import ListField from "@/components/forms/ListField";
import { PublicMapAccessMode } from "@/models/PublicMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { toOrigin } from "@/utils/publicMapAccess";
import { isEmail } from "@/utils/text";
import {
  usePublicMapValue,
  useSetFieldInvalid,
  useUpdatePublicMap,
} from "../../hooks/usePublicMap";
import type { ListFieldProps } from "@/components/forms/ListField";

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
          <DraftListField
            label="Moderator emails"
            hint="One per line. Each is emailed when someone requests access."
            placeholder="moderator@example.org"
            values={publicMap.moderatorEmails}
            isValid={isEmail}
            invalidMessage="Not a valid email"
            normalise={(value) => value.toLowerCase()}
            onCommit={(moderatorEmails) => updatePublicMap({ moderatorEmails })}
          />
          <DraftListField
            label="Websites this map is embedded on"
            hint={
              <>
                Optional. Leave empty if visitors will only use the map&apos;s
                own address. To embed the map, list each website it will appear
                on, one per line, e.g. https://example.org. It can then go on
                any page of those websites, and access links bring visitors back
                to the page they asked from.
                <br />
                <br />
                On websites not listed here, the map shows &ldquo;This map
                hasn&apos;t been set up to be embedded on this site&rdquo;.
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
 * A ListField in the public map draft. The draft only accepts valid values
 * (it is validated when auto-saved), so until every line is valid,
 * publishing is blocked, as it would silently use the last valid list.
 */
function DraftListField(props: Omit<ListFieldProps, "onInvalidChange">) {
  const setFieldInvalid = useSetFieldInvalid();
  const { label } = props;

  // Hidden fields (e.g. after switching to open access) don't block publishing
  useEffect(
    () => () => setFieldInvalid(label, false),
    [label, setFieldInvalid],
  );

  return (
    <ListField
      {...props}
      onInvalidChange={(invalid) => setFieldInvalid(label, invalid)}
    />
  );
}

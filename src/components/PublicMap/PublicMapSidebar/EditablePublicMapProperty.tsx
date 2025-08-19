import { Pencil } from "lucide-react";
import { FormEvent, ReactNode, useContext, useRef, useState } from "react";
import { PublicMapQuery } from "@/__generated__/types";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Input } from "@/shadcn/ui/input";

export default function EditablePublicMapProperty({
  property,
  children,
}: {
  property: keyof NonNullable<PublicMapQuery["publicMap"]>;
  children: ReactNode;
}) {
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialValue = publicMap ? String(publicMap[property]) : "";

  const [value, setValue] = useState(initialValue);
  const [isEditing, setEditing] = useState(false);

  const onSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    updatePublicMap({ [property]: value });
    setEditing(false);
  };

  return (
    <form onSubmit={onSubmit}>
      {isEditing ? (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onSubmit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setValue(initialValue);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div
          className="cursor-pointer flex gap-2 items-center"
          role="button"
          onClick={() => {
            setEditing(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 10);
          }}
        >
          <div>{children}</div>
          <Pencil className="h-4 w-4" />
        </div>
      )}
    </form>
  );
}

import { Pencil } from "lucide-react";
import { FormEvent, ReactNode, useContext, useRef, useState } from "react";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Input } from "@/shadcn/ui/input";

export default function EditablePublicMapProperty({
  property,
  dataSourceProperty,
  additionalColumnProperty,
  placeholder,
  children,
}: {
  property?: "name" | "description" | "descriptionLink";
  dataSourceProperty?: {
    dataSourceId: string;
    property: "dataSourceLabel" | "nameLabel" | "descriptionLabel";
  };
  additionalColumnProperty?: {
    columnIndex: number;
    dataSourceId: string;
    property: "label";
  };
  placeholder: string;
  children: ReactNode;
}) {
  const {
    publicMap,
    updatePublicMap,
    updateDataSourceConfig,
    updateAdditionalColumn,
    editable,
  } = useContext(PublicMapContext);
  const inputRef = useRef<HTMLInputElement>(null);

  let initialValue = "";
  if (publicMap) {
    if (property) {
      initialValue = publicMap[property] || "";
    } else if (dataSourceProperty) {
      const dataSourceConfig = publicMap.dataSourceConfigs.find(
        (dsc) => dsc.dataSourceId === dataSourceProperty.dataSourceId
      );
      initialValue = dataSourceConfig
        ? dataSourceConfig[dataSourceProperty.property] || ""
        : "";
    } else if (additionalColumnProperty) {
      const dataSourceConfig = publicMap.dataSourceConfigs.find(
        (dsc) => dsc.dataSourceId === additionalColumnProperty.dataSourceId
      );
      initialValue =
        dataSourceConfig &&
        dataSourceConfig.additionalColumns[additionalColumnProperty.columnIndex]
          ? dataSourceConfig.additionalColumns[
              additionalColumnProperty.columnIndex
            ][additionalColumnProperty.property] || ""
          : "";
    }
  }

  const [value, setValue] = useState(initialValue);
  const [isEditing, setEditing] = useState(false);

  if (!editable) {
    return children;
  }

  const onSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (property) {
      updatePublicMap({ [property]: value });
    } else if (dataSourceProperty) {
      updateDataSourceConfig(dataSourceProperty.dataSourceId, {
        [dataSourceProperty.property]: value,
      });
    } else if (additionalColumnProperty) {
      updateAdditionalColumn(
        additionalColumnProperty.dataSourceId,
        additionalColumnProperty.columnIndex,
        {
          [additionalColumnProperty.property]: value,
        }
      );
    }
    setEditing(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex gap-2 items-center border border-neutral-300 rounded-md p-2 border-dashed group "
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          placeholder={placeholder}
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
          <Pencil className="absolute right-5 h-4 w-4 text-muted-foreground shrink-0 group-hover:opacity-100 opacity-0 transition-opacity duration-200" />
        </div>
      )}
    </form>
  );
}

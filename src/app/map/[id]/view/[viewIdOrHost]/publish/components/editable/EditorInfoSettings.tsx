import { useContext } from "react";
import { publicMapColourSchemes } from "@/app/map/[id]/styles";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import { PublicMapContext } from "../../context/PublicMapContext";

export default function EditorInfoSettings() {
  const { publicMap, updatePublicMap } = useContext(PublicMapContext);

  return (
    <div className="flex flex-col gap-6">
      <FormFieldWrapper label="Public map title" id="Public map title">
        <Input
          placeholder="Title"
          value={publicMap?.name || ""}
          onChange={(e) => updatePublicMap({ name: e.target.value })}
          className="w-full shadow-none"
          type="text"
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Short description"
        id="Public map short description"
      >
        <Textarea
          placeholder="Public map short description"
          value={publicMap?.description || ""}
          onChange={(e) => updatePublicMap({ description: e.target.value })}
          className="w-full shadow-none"
          rows={3}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Long description"
        id="Public map full description"
      >
        <RichTextEditor
          value={publicMap?.descriptionLong || ""}
          onChange={(html) => updatePublicMap({ descriptionLong: html })}
        />
      </FormFieldWrapper>

      <FormFieldWrapper label="Contact email" id="Contact email">
        <Input
          placeholder="Contact email"
          value={publicMap?.descriptionLink || ""}
          onChange={(e) => updatePublicMap({ descriptionLink: e.target.value })}
          className="w-full shadow-none"
          type="email"
        />
      </FormFieldWrapper>

      <FormFieldWrapper label="Colour scheme" id="Colour scheme">
        <Select
          value={publicMap?.colourScheme}
          onValueChange={(value) => updatePublicMap({ colourScheme: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select colour scheme" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(publicMapColourSchemes).map((key) => (
              <SelectItem value={key} key={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldWrapper>
    </div>
  );
}

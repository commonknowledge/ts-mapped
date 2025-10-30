import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Textarea } from "@/shadcn/ui/textarea";
import { usePublicMapStore } from "../../stores/usePublicMapStore";

export default function EditorInfoSettings() {
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const updatePublicMap = usePublicMapStore((s) => s.updatePublicMap);
  const mapTitle = publicMap?.name;
  const mapDescription = publicMap?.description;
  const mapDescriptionLink = publicMap?.descriptionLink;

  const infoSettings = [
    {
      label: "Public Map Title",
      value: mapTitle,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => updatePublicMap({ name: e.target.value }),
    },
    {
      label: "Public Map Description",
      value: mapDescription,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => updatePublicMap({ description: e.target.value }),
      multiline: true,
    },
    {
      label: "Contact Email",
      value: mapDescriptionLink,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => updatePublicMap({ descriptionLink: e.target.value }),
      type: "email",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {infoSettings.map((setting) => (
        <div className="flex flex-col gap-2" key={setting.label}>
          <Label>{setting.label}</Label>
          {setting.multiline ? (
            <Textarea
              placeholder={setting.label}
              value={setting.value || ""}
              onChange={setting.onChange}
              className="w-full shadow-none"
              rows={3}
            />
          ) : (
            <Input
              placeholder={setting.label}
              value={setting.value || ""}
              onChange={setting.onChange}
              className="w-full shadow-none"
              type={setting.type || "text"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

import { Label } from "@/shadcn/ui/label";

export default function EditorStyleSettings() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label>Colour Scheme</Label>
        <Label>Map style</Label>
      </div>
    </div>
  );
}

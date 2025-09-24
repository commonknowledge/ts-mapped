import { LoaderPinwheel } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { uploadFile } from "@/services/uploads";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { getInitials } from "@/utils/text";

interface EditableAvatarProps {
  name: string;
  onChange: (avatarUrl: string) => void;
  src?: string | null;
}

export const AvatarInput: React.FC<EditableAvatarProps> = ({
  src,
  name,
  onChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    try {
      if (!file) {
        throw new Error("Missing file");
      }
      setLoading(true);
      const avatarUrl = await uploadFile(file);
      onChange(avatarUrl);
    } catch (e) {
      console.error("Error uploading avatar image", e);
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer" onClick={triggerFileInput}>
          <Avatar>
            <AvatarImage
              src={loading ? undefined : src || undefined}
              alt={name}
            />
            <AvatarFallback>
              {loading ? (
                <LoaderPinwheel className="animate-spin" size={16} />
              ) : (
                getInitials(name)
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      </TooltipTrigger>

      <TooltipContent>Click to change</TooltipContent>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </Tooltip>
  );
};

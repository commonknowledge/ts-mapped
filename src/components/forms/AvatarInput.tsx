import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { getInitials } from "@/utils";

interface EditableAvatarProps {
  name: string;
  onChange: (file: File | undefined) => void;

  src?: string;
}

export const AvatarInput: React.FC<EditableAvatarProps> = ({
  src,
  name,
  onChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onChange(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer" onClick={triggerFileInput}>
          <Avatar>
            <AvatarImage src={src} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
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

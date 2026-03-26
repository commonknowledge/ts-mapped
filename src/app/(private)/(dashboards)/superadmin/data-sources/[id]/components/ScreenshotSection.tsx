"use client";

import { useRef, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";

interface ScreenshotSectionProps {
  screenshotUrl: string | null | undefined;
  onUploaded: (url: string) => void;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function ScreenshotSection({
  screenshotUrl,
  isUploading,
  onUpload,
}: ScreenshotSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-neutral-200 p-6 mb-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Preview screenshot</h3>
        <p className="text-sm text-muted-foreground">
          Upload a screenshot shown in the map data source picker.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl ?? "/screenshot-placeholder.jpeg"}
              alt=""
              className="w-full aspect-video object-cover"
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label>Upload new screenshot (JPEG or PNG)</Label>
            <Input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={async () => {
                if (!selectedFile) return;
                await onUpload(selectedFile);
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

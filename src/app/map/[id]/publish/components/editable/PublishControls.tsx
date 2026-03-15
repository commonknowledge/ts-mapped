"use client";

import { Loader2, Redo2, Upload } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Switch } from "@/shadcn/ui/switch";
import {
  useHasDraftChanges,
  useHostAvailable,
  usePublicMapValue,
} from "../../hooks/usePublicMap";
import { usePublishActions } from "../../hooks/usePublishActions";

export default function PublishControls() {
  const publicMap = usePublicMapValue();
  const hasDraftChanges = useHasDraftChanges();
  const hostAvailable = useHostAvailable();

  const {
    loading,
    isPublishing,
    isPublishedOnServer,
    publishedHost,
    handleSwitchChange,
    handlePublishChanges,
    handleRevert,
  } = usePublishActions();

  if (!publicMap) return null;

  const switchChecked = publicMap.published;

  const getBaseUrl = () =>
    new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-md">
      {/* Switch + label */}
      <div className="flex items-center gap-2">
        <Switch
          checked={switchChecked}
          onCheckedChange={handleSwitchChange}
          disabled={loading}
        />
        <span className="text-sm whitespace-nowrap">
          {loading ? (
            <span className="flex items-center gap-1 text-neutral-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isPublishing ? "Publishing…" : "Reverting…"}
            </span>
          ) : switchChecked && publishedHost ? (
            <>
              Published at{" "}
              <a
                href={`${getBaseUrl().protocol}//${publishedHost}`}
                target="_blank"
                className="underline hover:text-neutral-800"
              >
                {publishedHost}
              </a>
            </>
          ) : switchChecked ? (
            "Published"
          ) : (
            "Unpublished"
          )}
        </span>
      </div>

      {/* Unpublished changes banner */}
      {isPublishedOnServer && hasDraftChanges && !loading && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 w-full">
          <span className="text-xs text-amber-800 font-medium whitespace-nowrap">
            Unpublished changes
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              onClick={handleRevert}
              disabled={loading}
            >
              <Redo2 className="w-3 h-3 mr-1" />
              Revert
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={handlePublishChanges}
              disabled={loading || hostAvailable === false}
            >
              <Upload className="w-3 h-3 mr-1" />
              Publish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

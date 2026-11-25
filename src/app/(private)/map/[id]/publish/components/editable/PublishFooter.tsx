"use client";

import { Loader2, Redo2, Upload } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { getPublicMapBaseUrl } from "@/utils/appUrl";
import {
  useHasDraftChanges,
  useHasInvalidFields,
  useHostAvailable,
  usePublicMapValue,
} from "../../hooks/usePublicMap";
import { usePublishActions } from "../../hooks/usePublishActions";
import { getPublishBlocker, getSubdomain } from "../../utils";

/**
 * Publish status and actions, pinned to the bottom of the publishing sidebar
 * so they stay visible whichever sidebar tab is open.
 */
export default function PublishFooter() {
  const publicMap = usePublicMapValue();
  const hasDraftChanges = useHasDraftChanges();
  const hostAvailable = useHostAvailable();
  const hasInvalidFields = useHasInvalidFields();

  const {
    loading,
    isApplyingDraft,
    isPublishedOnServer,
    publishedHost,
    handlePublish,
    handleUnpublish,
    handleApplyDraft,
    handleRevert,
  } = usePublishActions();

  if (!publicMap) return null;

  const hasSubdomain = Boolean(getSubdomain(publicMap.host ?? ""));
  const blocker = getPublishBlocker({
    hasSubdomain,
    hostTaken: hostAvailable === false,
    hasInvalidFields,
  });
  const hasPendingChanges = isPublishedOnServer && hasDraftChanges;
  const canPublishSomething = !isPublishedOnServer || hasPendingChanges;
  const showBlocker = Boolean(blocker) && !loading && canPublishSomething;

  return (
    <div className="dark flex flex-col gap-2 bg-background p-4 text-foreground">
      <PublishStatus
        loading={loading}
        isApplyingDraft={isApplyingDraft}
        isPublishedOnServer={isPublishedOnServer}
        isUnpublishing={isPublishedOnServer && !publicMap.published}
        publishedHost={publishedHost}
        hasPendingChanges={hasPendingChanges}
      />

      {showBlocker && <p className="text-xs text-red-400">{blocker}</p>}

      {isPublishedOnServer ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleUnpublish}
            disabled={loading}
          >
            Unpublish
          </Button>
          {hasPendingChanges && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={handleRevert}
                disabled={loading}
              >
                <Redo2 className="w-3 h-3" />
                Revert
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyDraft}
                disabled={loading || Boolean(blocker)}
              >
                <Upload className="w-3 h-3" />
                Publish changes
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button
          type="button"
          onClick={handlePublish}
          disabled={loading || Boolean(blocker)}
        >
          <Upload className="w-4 h-4" />
          Publish
        </Button>
      )}
    </div>
  );
}

function PublishStatus({
  loading,
  isApplyingDraft,
  isPublishedOnServer,
  isUnpublishing,
  publishedHost,
  hasPendingChanges,
}: {
  loading: boolean;
  isApplyingDraft: boolean;
  isPublishedOnServer: boolean;
  isUnpublishing: boolean;
  publishedHost: string | null | undefined;
  hasPendingChanges: boolean;
}) {
  if (loading) {
    const applyingLabel = getApplyingLabel({
      isPublishedOnServer,
      isUnpublishing,
    });
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        {isApplyingDraft ? applyingLabel : "Reverting…"}
      </p>
    );
  }

  if (!isPublishedOnServer) {
    return <p className="text-sm text-muted-foreground">Not published</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex items-center gap-1.5 text-sm">
        <span className="size-2 rounded-full bg-green-400" />
        Live
        {publishedHost && (
          <>
            {" at "}
            <a
              href={`${getPublicMapBaseUrl().protocol}//${publishedHost}`}
              target="_blank"
              className="truncate underline hover:text-muted-foreground"
            >
              {publishedHost}
            </a>
          </>
        )}
      </p>
      {hasPendingChanges && (
        <p className="text-xs text-amber-300">
          You have changes that aren&apos;t live yet.
        </p>
      )}
    </div>
  );
}

const getApplyingLabel = ({
  isPublishedOnServer,
  isUnpublishing,
}: {
  isPublishedOnServer: boolean;
  isUnpublishing: boolean;
}) => {
  if (isUnpublishing) return "Unpublishing…";
  if (isPublishedOnServer) return "Publishing changes…";
  return "Publishing…";
};

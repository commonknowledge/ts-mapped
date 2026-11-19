"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/atoms/sessionAtoms";
import ListField from "@/components/forms/ListField";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Switch } from "@/shadcn/ui/switch";
import { buildMapShareAccessLink } from "@/utils/mapAccess";
import { isEmail } from "@/utils/text";
import type { RouterOutputs } from "@/services/trpc/react";

type ShareState = RouterOutputs["mapShare"]["get"];

/**
 * The Share button + popover in the private map navbar. Shares the live
 * map, read-only, with people outside the organisation. Access works as on
 * a moderated public map: visitors request it by email, a moderator
 * approves, and the visitor is emailed a link that works for one week.
 * Distinct from Publish mode, which builds a public campaign site.
 */
export default function ShareMapDialog({ mapId }: { mapId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  const { data: share, isPending: shareLoading } = useQuery(
    trpc.mapShare.get.queryOptions({ mapId }),
  );

  const updateShareCache = (data: ShareState) =>
    queryClient.setQueryData(trpc.mapShare.get.queryKey({ mapId }), data);

  const { mutate: enableShare, isPending: enabling } = useMutation(
    trpc.mapShare.enable.mutationOptions({
      onSuccess: (data) => updateShareCache(data),
      onError: (error) => toast.error(error.message),
    }),
  );
  const { mutate: disableShare, isPending: disabling } = useMutation(
    trpc.mapShare.disable.mutationOptions({
      onSuccess: (data) => updateShareCache(data),
      onError: () => toast.error("Failed to stop sharing"),
    }),
  );
  const { mutate: setModeratorEmails, isPending: savingModerators } =
    useMutation(
      trpc.mapShare.setModeratorEmails.mutationOptions({
        onSuccess: (data) => updateShareCache(data),
        onError: (error) => toast.error(error.message),
      }),
    );

  const mutating = enabling || disabling || savingModerators;
  const enabled = Boolean(share?.enabled);
  // Before the map is first shared, the editor is the suggested moderator:
  // enabling sharing saves them as one (see mapShare.enable)
  const defaultModeratorEmails = currentUser
    ? [currentUser.email.toLowerCase()]
    : [];
  const moderatorEmails = share
    ? share.moderatorEmails
    : defaultModeratorEmails;
  const hasModerators = moderatorEmails.length > 0;
  const shareUrl = share
    ? buildMapShareAccessLink({ shareToken: share.token })
    : "";

  const onToggleSharing = (checked: boolean) => {
    if (checked) {
      enableShare({ mapId });
    } else {
      disableShare({ mapId });
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy the link");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon />
          Share link
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Share this map</h2>

        <ListField
          label="Moderator emails"
          hint="One per line. Each is emailed when someone requests access."
          placeholder="moderator@example.org"
          values={moderatorEmails}
          isValid={isEmail}
          invalidMessage="Not a valid email"
          normalise={(value) => value.toLowerCase()}
          onCommit={(emails) =>
            setModeratorEmails({ mapId, moderatorEmails: emails })
          }
          disabled={shareLoading || savingModerators}
        />

        <div className="flex items-start justify-between gap-4 border-t pt-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Enable share link</p>
            <p className="text-xs text-muted-foreground">
              {hasModerators
                ? "People outside your organisation request access by email. A moderator approves each request, then the person is emailed a link that works for one week. They can view the live map, but not edit it."
                : "Add at least one moderator email to share this map."}
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={shareLoading || mutating || (!enabled && !hasModerators)}
            onCheckedChange={onToggleSharing}
            aria-label="Enable share link"
          />
        </div>

        {enabled && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs"
                aria-label="Share link"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button size="sm" variant="secondary" onClick={onCopyLink}>
                <CopyIcon />
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this link to the people you want to share the map with. Only
              people a moderator approves can see the map.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

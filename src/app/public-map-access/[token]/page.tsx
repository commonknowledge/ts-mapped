import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import AccessReview from "./components/AccessReview";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Review access request - Mapped",
  robots: { index: false, follow: false },
};

/**
 * Where a moderator lands from the access request email. Moderators are not
 * Mapped users: the signed token in the URL is the authorisation, and only
 * covers this one request. Deciding is a button press (a POST), never the
 * page load itself, because email link scanners open every link.
 */
export default async function PublicMapAccessReviewPage({ params }: Props) {
  const { token } = await params;
  const caller = await createCaller();

  let review;
  try {
    review = await caller.publicMapAccess.review({ token });
  } catch {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData(
    trpc.publicMapAccess.review.queryKey({ token }),
    review,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccessReview token={token} />
    </HydrationBoundary>
  );
}

import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getServerSession } from "@/auth";
import { ORGANISATION_COOKIE_NAME } from "@/constants";
import NProgressProvider from "@/providers/NProgressProvider";
import OrganisationProvider from "@/providers/OrganisationProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import SessionProvider from "@/providers/SessionProvider";
import { TRPCReactProvider } from "@/services/trpc/react";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import { Toaster } from "@/shadcn/ui/sonner";
import { getAbsoluteUrl } from "@/utils/appUrl";
import HTMLBody from "./HTMLBody";
import type { Organisation } from "@/models/Organisation";
import type { Metadata, Viewport } from "next";
import "nprogress/nprogress.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAbsoluteUrl()),
  title: "Mapped",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverSession = await getServerSession();
  const queryClient = getQueryClient();

  let organisations: Organisation[] = [];
  if (serverSession.currentUser) {
    const caller = await createCaller();
    organisations = await caller.organisation.list();
    queryClient.setQueryData<Organisation[]>(
      trpc.organisation.list.queryKey(),
      organisations,
    );
  }

  const cookieStore = await cookies();
  const storedOrgId = cookieStore.get(ORGANISATION_COOKIE_NAME)?.value ?? null;

  return (
    <HTMLBody>
      <TRPCReactProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SessionProvider serverSession={serverSession}>
            <PostHogProvider>
              <OrganisationProvider
                organisations={organisations}
                storedOrgId={storedOrgId}
              >
                <NProgressProvider>
                  <main className="min-h-screen relative z-10">{children}</main>
                  <Toaster position="top-center" />
                </NProgressProvider>
              </OrganisationProvider>
            </PostHogProvider>
          </SessionProvider>
        </HydrationBoundary>
      </TRPCReactProvider>
    </HTMLBody>
  );
}

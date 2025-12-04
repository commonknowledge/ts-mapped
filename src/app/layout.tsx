import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getServerSession } from "@/auth";
import NProgressProvider from "@/providers/NProgressProvider";
import OrganisationsProvider from "@/providers/OrganisationsProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
import { TRPCReactProvider } from "@/services/trpc/react";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import { Toaster } from "@/shadcn/ui/sonner";
import { getAbsoluteUrl } from "@/utils/appUrl";
import type { Organisation } from "@/server/models/Organisation";
import type { Metadata, Viewport } from "next";
import "nprogress/nprogress.css";
import "./global.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  preload: true,
});

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

  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} `}
    >
      <body className={ibmPlexSans.className + " antialiased"}>
        <TRPCReactProvider>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ServerSessionProvider serverSession={serverSession}>
              <PostHogProvider>
                <OrganisationsProvider initialOrganisations={organisations}>
                  <NProgressProvider>
                    <main className="min-h-screen relative z-10">
                      {children}
                    </main>
                    <Toaster position="top-center" />
                  </NProgressProvider>
                </OrganisationsProvider>
              </PostHogProvider>
            </ServerSessionProvider>
          </HydrationBoundary>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

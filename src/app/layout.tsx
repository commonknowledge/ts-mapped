import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getServerSession } from "@/auth";
import NProgressProvider from "@/providers/NProgressProvider";
import OrganisationsProvider from "@/providers/OrganisationsProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
import { TRPCReactProvider } from "@/services/trpc/react";
import { createCaller } from "@/services/trpc/server";
import { Toaster } from "@/shadcn/ui/sonner";
import type { Metadata } from "next";
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
  title: "Mapped",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverSession = await getServerSession();
  const organisations = serverSession.currentUser
    ? await getOrganisations()
    : [];

  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} `}
    >
      <body className={ibmPlexSans.className + " antialiased"}>
        <ServerSessionProvider serverSession={serverSession}>
          <PostHogProvider>
            <OrganisationsProvider organisations={organisations}>
              <TRPCReactProvider>
                <NProgressProvider>
                  <main className="min-h-screen relative z-10">{children}</main>
                  <Toaster position="top-center" />
                </NProgressProvider>
              </TRPCReactProvider>
            </OrganisationsProvider>
          </PostHogProvider>
        </ServerSessionProvider>
      </body>
    </html>
  );
}

const getOrganisations = async () => {
  const trpcServer = await createCaller();
  return trpcServer.organisation.list();
};

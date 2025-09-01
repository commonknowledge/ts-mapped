import "nprogress/nprogress.css";
import "./global.css";
import { gql } from "@apollo/client";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import {
  ListOrganisationsQuery,
  ListOrganisationsQueryVariables,
} from "@/__generated__/types";
import { getServerSession } from "@/auth";
import PublicMapPage from "@/components/PublicMapPage";
import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import ApolloProvider from "@/providers/ApolloProvider";
import NProgressProvider from "@/providers/NProgressProvider";
import OrganisationsProvider from "@/providers/OrganisationsProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
import { getClient } from "@/services/apollo";
import { Toaster } from "@/shadcn/ui/sonner";
import type { Metadata } from "next";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Full Stack TS Mapped",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host");

  const mainHost = new URL(
    process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
  );
  if (host && host !== mainHost.host) {
    return (
      <html
        lang="en"
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      >
        <body className={ibmPlexSans.className}>
          <ApolloProvider ignoreAuthErrors>
            <NProgressProvider>
              <main>
                <PublicMapPage host={host} />
              </main>
            </NProgressProvider>
          </ApolloProvider>
        </body>
      </html>
    );
  }

  const serverSession = await getServerSession();
  const organisations = await getOrganisations();
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className={ibmPlexSans.className}>
        <ServerSessionProvider serverSession={serverSession}>
          <OrganisationsProvider organisations={organisations}>
            <ApolloProvider>
              <NProgressProvider>
                <main>{children}</main>
                <Toaster position="top-right" />
              </NProgressProvider>
            </ApolloProvider>
          </OrganisationsProvider>
        </ServerSessionProvider>
      </body>
    </html>
  );
}

const getOrganisations = async () => {
  const apolloClient = await getClient();
  const { data } = await apolloClient.query<
    ListOrganisationsQuery,
    ListOrganisationsQueryVariables
  >({
    query: gql`
      query ListOrganisations {
        organisations {
          id
          name
        }
      }
    `,
  });
  return data?.organisations || [];
};

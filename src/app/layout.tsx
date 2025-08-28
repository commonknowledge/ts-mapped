import "nprogress/nprogress.css";
import "./global.css";
import { gql } from "@apollo/client";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import {
  ListOrganisationsQuery,
  ListOrganisationsQueryVariables,
} from "@/__generated__/types";
import { getServerSession } from "@/auth";
import { TRPCReactProvider } from "@/lib/trpc";
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
              <TRPCReactProvider>
                <NProgressProvider>
                  <main>{children}</main>
                  <Toaster position="top-right" />
                </NProgressProvider>
              </TRPCReactProvider>
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

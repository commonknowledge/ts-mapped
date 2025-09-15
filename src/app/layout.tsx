import "nprogress/nprogress.css";
import "./global.css";
import { gql } from "@apollo/client";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import {
  ListOrganisationsQuery,
  ListOrganisationsQueryVariables,
} from "@/__generated__/types";
import { getServerSession } from "@/auth";
import ConditionalMarketingFooter from "@/components/ConditionalMarketingFooter";
import ConditionalMarketingNavbar from "@/components/ConditionalMarketingNavbar";

import ApolloProvider from "@/providers/ApolloProvider";
import NProgressProvider from "@/providers/NProgressProvider";
import OrganisationsProvider from "@/providers/OrganisationsProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
import { getClient } from "@/services/apollo";
import type { Metadata } from "next";

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
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} `}
    >
      <body className={ibmPlexSans.className + " antialiased"}>
        <ServerSessionProvider serverSession={serverSession}>
          <OrganisationsProvider organisations={organisations}>
            <ApolloProvider>
              <NProgressProvider>
                <ConditionalMarketingNavbar />
                <main className=" min-h-screen">{children}</main>
                <ConditionalMarketingFooter />
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

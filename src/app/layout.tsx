import "nprogress/nprogress.css";
// import "./mvp.css";
import "./global.css";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getServerSession } from "@/auth";
import Navbar from "@/components/Navbar";
import ApolloProvider from "@/providers/ApolloProvider";
import NProgressProvider from "@/providers/NProgressProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
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
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className={ibmPlexSans.className}>
        <ServerSessionProvider serverSession={serverSession}>
          <ApolloProvider>
            <NProgressProvider>
              <Navbar />
              <main>{children}</main>
            </NProgressProvider>
          </ApolloProvider>
        </ServerSessionProvider>
      </body>
    </html>
  );
}

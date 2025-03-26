import "nprogress/nprogress.css";
import "./mvp.css";
import "./global.css";
import { getServerSession } from "@/auth";
import Navbar from "@/components/Navbar";
import ApolloProvider from "@/providers/ApolloProvider";
import NProgressProvider from "@/providers/NProgressProvider";
import ServerSessionProvider from "@/providers/ServerSessionProvider";
import type { Metadata } from "next";

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
    <html lang="en">
      <body>
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

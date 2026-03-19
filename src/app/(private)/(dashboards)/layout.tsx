import { DesktopOnly } from "@/components/layout/DesktopOnly";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Dashboard",
};

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DesktopOnly>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto p-10 w-full">{children}</div>
      </div>
    </DesktopOnly>
  );
}

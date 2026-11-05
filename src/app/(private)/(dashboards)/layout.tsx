import { DesktopOnly } from "@/components/layout/DesktopOnly";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Dashboard",
};

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DesktopOnly>
      <div className="flex h-screen bg-neutral-50">
        <Sidebar />
        {/* A quiet canvas, with the page at a readable width */}
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-10 py-8">{children}</div>
        </main>
      </div>
    </DesktopOnly>
  );
}

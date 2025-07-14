"use client";

import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useCurrentUser } from "@/hooks";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useCurrentUser();
  const pathname = usePathname();

  if (!user) {
    redirect("/");
  }

  // If we're on a map page, don't show sidebar (map has its own navbar)
  if (pathname.startsWith("/map/")) {
    return <>{children}</>;
  }

  // For authenticated users on other pages, show sidebar layout
  return (
    <div className="flex h-screen">
      <Sidebar slug={pathname} />
      <div className="flex-1 overflow-auto p-10 max-w-6xl w-full">
        {children}
      </div>
    </div>
  );
}

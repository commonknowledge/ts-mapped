import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import type * as React from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (user.currentUser) redirect("/dashboard");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-brand-background">
      {children}
    </div>
  );
}

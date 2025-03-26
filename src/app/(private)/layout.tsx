"use client"

import { redirect } from "next/navigation";
import { useCurrentUser } from "@/hooks";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useCurrentUser();
  if (!user) {
    redirect("/")
  }
  return <>{children}</>
}

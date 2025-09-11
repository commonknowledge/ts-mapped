import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import AuthLayout from "@/components/layout/AuthLayout";
import type * as React from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (user.currentUser) redirect("/dashboard");

  return <AuthLayout>{children}</AuthLayout>;
}

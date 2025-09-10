import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSession();

  if (!user) redirect("/");

  return <>{children}</>;
}

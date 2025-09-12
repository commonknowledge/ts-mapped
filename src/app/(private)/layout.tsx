import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverSession = await getServerSession();

  if (!serverSession.currentUser) {
    return redirect("/");
  }

  return <>{children}</>;
}

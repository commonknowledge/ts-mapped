import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import type * as React from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (user.currentUser) redirect("/dashboard");

  return (
    <div className="bg-brand-background">
      <header className="absolute top-0 left-0 w-full flex items-center h-16 md:h-20">
        <Container>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Mapped"
              width={28}
              height={28}
              className="md:w-8 md:h-8"
            />
          </Link>
        </Container>
      </header>
      <main className="min-h-[100vh] / flex justify-center items-center py-[120px] px-6">
        {children}
      </main>
    </div>
  );
}

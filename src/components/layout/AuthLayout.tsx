import Image from "next/image";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
      <main className="h-full / flex justify-center items-center py-[120px] px-6">
        {children}
      </main>
    </>
  );
}

import Container from "@/components/layout/Container";
import type * as React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="py-[80px] md:py-[160px]">
      <Container>{children}</Container>
    </main>
  );
}

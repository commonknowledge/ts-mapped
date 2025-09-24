import Container from "@/components/layout/Container";

export default function Layout({ children }: { children: React.ReactNode }) {
  // component to wrap marketing pages that don't have a hero
  return (
    <div className="pt-16 md:pt-20 pb-20 md:pb-[120px]">
      <Container>{children}</Container>
    </div>
  );
}

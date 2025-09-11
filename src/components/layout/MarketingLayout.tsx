import Container from "@/components/layout/Container";
import MarketingFooter from "@/components/layout/MarketingFooter";
import MarketingNavbar from "@/components/layout/MarketingNavbar";

export default function MarketingLayout({
  children,
  withContainer = false,
}: {
  children: React.ReactNode;
  withContainer?: boolean;
}) {
  return (
    <>
      <MarketingNavbar />

      {withContainer ? (
        <main className="py-[80px] md:py-[160px]">
          <Container>{children}</Container>
        </main>
      ) : (
        children
      )}

      <MarketingFooter />
    </>
  );
}

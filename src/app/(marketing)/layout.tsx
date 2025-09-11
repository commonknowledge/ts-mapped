import MarketingFooter from "@/app/(marketing)/MarketingFooter";
import MarketingNavbar from "@/app/(marketing)/MarketingNavbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </>
  );
}

import DocsSidebar from "@/app/(marketing)/components/DocsSidebar";
import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingPageHero
        eyebrow="Docs"
        title="Documentation"
        description="How to map your members, overlay data and plan with Mapped."
      />
      <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-[30px]">
        <div className="flex flex-col gap-8 py-10 md:flex-row md:gap-12 md:pt-16 md:pb-24">
          <DocsSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}

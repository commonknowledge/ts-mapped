import { manrope } from "@/components/marketing/v3/fonts";
import MarketingCTA from "@/components/marketing/v3/MarketingCTA";
import MarketingFooter from "@/components/marketing/v3/MarketingFooter";
import MarketingHeader from "@/components/marketing/v3/MarketingHeader";
import type * as React from "react";

/** The marketing pages, in the homepage's type, colours, header and footer */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manrope.className} min-h-screen bg-white text-ink`}>
      <MarketingHeader />
      {children}
      <MarketingCTA />
      <MarketingFooter />
    </div>
  );
}

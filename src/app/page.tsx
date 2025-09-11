"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import MarketingLayout from "@/components/layout/MarketingLayout";
import { Link } from "@/components/Link";
import HomepageFeatureSection from "@/components/marketing/HomepageFeatureSection";
import { useCurrentUser } from "@/hooks";
import { Button } from "@/shadcn/ui/button";
export default function HomePage() {
  const user = useCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <MarketingLayout>
      <div className="flex flex-col items-center justify-center relative bg-brand-background py-16 md:py-[120px] p-4 overflow-hidden">
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -top-10 -right-4 w-1/2"
          height={533}
          width={512}
        />
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -bottom-4 -left-4 rotate-180 w-1/2"
          height={533}
          width={512}
        />
        <div className="relative z-10 flex flex-col w-full items-center justify-center">
          <Image
            src="/hero-new.svg"
            alt="Mapped"
            height={456}
            width={1024}
            priority={true}
            className="w-full max-w-[880px]"
          />
          <p className="text-3xl md:text-5xl font-normal tracking-tight max-w-[25ch] text-center md:-mt-14 mb-8 md:mb-12">
            Enhance your organising strategy with visual mapping tools.
          </p>

          <Button asChild={true}>
            <Link
              href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign up to waitlist
            </Link>
          </Button>
        </div>
      </div>

      <HomepageFeatureSection />
    </MarketingLayout>
  );
}

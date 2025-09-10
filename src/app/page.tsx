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
      <div className="flex flex-col items-center justify-center relative bg-brand-background md:pt-32 pt-16 py-16 p-4 overflow-hidden">
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
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/hero-new.svg"
            alt="Mapped"
            height={456}
            width={1024}
            priority={true}
            className="w-full h-[40vh] object-contain z-30"
          />
          <p className="md:text-5xl text-3xl font-light tracking-tight max-w-2xl text-center -mt-16 mb-8 z-30">
            Enhance your organising strategy with visual mapping tools.
          </p>
          <Link
            href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>Sign up to waitlist</Button>
          </Link>
        </div>
      </div>

      <HomepageFeatureSection />
    </MarketingLayout>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import CTA from "@/components/CTA";
import HomepageFeatureSection from "@/components/HomepageFeatureSection";
import { useCurrentUser } from "@/hooks";
import { Button } from "@/shadcn/ui/button";

export default function HomePage() {
  const user = useCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col items-center justify-center relative bg-brand-background pt-32 py-16 p-4 overflow-hidden">
        <div className="flex flex-col items-center justify-center z-10">
          <Image
            src="/hero.svg"
            alt="Mapped"
            height={456}
            width={1024}
            priority={true}
          />
          <p className="text-5xl font-light tracking-tight max-w-2xl text-center -mt-16 mb-8">
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
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -top-40 -right-4"
          height={533}
          width={512}
        />
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -bottom-4 -left-4 rotate-180"
          height={533}
          width={512}
        />
      </div>

      <HomepageFeatureSection />
      <CTA />
    </div>
  );
}

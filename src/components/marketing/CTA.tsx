"use client";
import Image from "next/image";
import React from "react";
import { Button } from "@/shadcn/ui/button";
import { Link } from "../Link";
import { usePathname } from "next/navigation";

export default function CTA() {
  const pathname = usePathname();
  if (pathname.includes("/support")) {
    return null;
  }
  return (
    <div className="bg-brand-background py-20 md:py-[160px] flex flex-col items-center justify-center relative overflow-hidden">
      <Image
        src="/pattern.svg"
        alt="Mapped"
        className="absolute top-0 -right-4 w-1/2"
        height={533}
        width={512}
      />
      <Image
        src="/pattern.svg"
        alt="Mapped"
        className="absolute bottom-0 -left-4 rotate-180 w-1/2"
        height={533}
        width={512}
      />
      <div className="flex flex-col items-center justify-center gap-12 relative z-10">
        <h2 className="text-3xl md:text-5xl font-normal tracking-tight max-w-[25ch] text-center text-balance">
          Transform your membership list into interactive maps.
        </h2>
        <Link
          href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
          target="_blank"
          rel="noopener noreferrer"
          className="z-30"
        >
          <Button>Request access</Button>
        </Link>
      </div>
    </div>
  );
}

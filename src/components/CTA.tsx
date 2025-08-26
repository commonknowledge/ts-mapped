import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "@/shadcn/ui/button";

export default function CTA() {
  return (
    <div className=" bg-brand-background h-[50vh] flex flex-col items-center justify-center relative overflow-hidden">
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
      <div className="flex flex-col items-center justify-center gap-8 ">
        <h2 className="text-5xl font-light tracking-tight text-balance max-w-2xl text-center z-30">
          Transform your membership list into interactive maps.
        </h2>
        <Link
          href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
          target="_blank"
          rel="noopener noreferrer"
          className="z-30"
        >
          <Button>Sign up to waitlist</Button>
        </Link>
      </div>
    </div>
  );
}

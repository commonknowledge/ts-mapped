import Image from "next/image";
import React from "react";
import { Link } from "@/components/Link";

export default function AboutPage() {
  return (
    <div className="py-[160px]">
      <div className="container">
        <div className="prose mx-auto text-foreground prose-headings:text-primary prose-headings:font-medium prose-headings:tracking-tight">
          <h1>About Mapped</h1>
          <p>
            Mapped is a tool for organising and mobilising people. It&apos;s a
            project by Common Knowledge, a not-for-profit worker cooperative
            that uses digital technology to build power for social movements.
          </p>
          <Link href="https://commonknowledge.coop">
            <Image
              src="/CK_Logo_Black.svg"
              alt="Common Knowledge"
              width={300}
              height={200}
              className="max-w-48 mt-8"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

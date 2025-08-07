import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 mt-16 ">
      <h1 className="text-4xl font-medium  mb-4 tracking-tight">
        About Mapped
      </h1>
      <p className="text-lg max-w-2xl ">
        Mapped is a tool for organising and mobilising people. It&apos;s a
        project by Common Knowledge, a not-for-profit worker cooperative that
        uses digital technology to build power for social movements.
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
  );
}

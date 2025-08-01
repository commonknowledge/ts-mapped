"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import MarketingNavbar from "@/components/MarketingNavbar";
import { useCurrentUser } from "@/hooks";

export default function HomePage() {
  const user = useCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="overflow-hidden">
      <MarketingNavbar />
      <div className="flex flex-col items-center justify-center relative bg-[#678DE312] py-16 p-4">
        <Image
          src="/hero.svg"
          alt="Mapped"
          height={456}
          width={1024}
          priority={true}
        />
        <p className="text-5xl font-light tracking-tight max-w-2xl text-center -mt-16 mb-8">
          Making the right connections for organisers & activists
        </p>
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -top-4 -right-4 z-[-1]"
          height={533}
          width={512}
        />
        <Image
          src="/pattern.svg"
          alt="Mapped"
          className="absolute -bottom-4 -left-4 z-[-1] rotate-180"
          height={533}
          width={512}
        />
      </div>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <h2 className="text-brandBlue font-mono uppercase">Features</h2>
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2">
              <h2 className="text-2xl tracking-tight">{feature.title}</h2>
              <p className="text-sm text-muted-foreground text-balance">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className=" mx-auto max-w-screen-xl py-16">
        <Image
          src="/screenshot.png"
          alt="screenshot"
          className="mx-auto "
          width={1024}
          height={768}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <h2 className="text-brandBlue font-mono uppercase">Layers</h2>
          {layers.map((layer) => (
            <div key={layer.title} className="flex flex-col gap-2">
              <h2 className="text-2xl tracking-tight">{layer.title}</h2>
              <p className="text-sm text-muted-foreground text-balance">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Mapping",
    description:
      "Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts.",
    href: "/data-sources",
  },
  {
    title: "Data Syncing",
    description: "View and manage your data sources.",
    href: "/data-sources",
  },
  {
    title: "Collaborate",
    description: "Invite your team to collaborate on your data sources.",
    href: "/data-sources",
  },
];

const layers = [
  {
    title: "Members",
    description:
      "Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts.",
    href: "/data-sources",
  },
  {
    title: "Locations",
    description: "View and manage your data sources.",
    href: "/data-sources",
  },
  {
    title: "Turf",
    description: "Invite your team to collaborate on your data sources.",
    href: "/data-sources",
  },
];

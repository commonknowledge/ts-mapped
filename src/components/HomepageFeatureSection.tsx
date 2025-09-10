import Image from "next/image";
import React from "react";
import Container from "@/components/layout/Container";
import { Separator } from "@/shadcn/ui/separator";

export default function HomepageFeatureSection() {
  return (
    <Container>
      <div className="flex flex-col gap-10 / py-20">
        <FeatureCard
          title="Map your movement"
          description="Transform static, siloed databases into live, interactive maps."
          image="/homepage/hp-feat-map.png"
          bulletPoints={[
            "See where your members are",
            "Highlight local groups, hubs and targets",
            "Define turf for canvassing, flyering or outreach",
          ]}
        />
        <Separator />
        <FeatureCard
          title="Bring your data to life"
          description="You don’t need to be a tech expert, just plug in your existing tools."
          image="/homepage/hp-feat-data.png"
          alternate
          bulletPoints={[
            "Connect to Action Network, Airtable or Mailchimp",
            "Upload custom spreadsheets and CSVs",
            "Overlay political boundaries like constituencies or councils",
          ]}
        />
        <Separator />
        <FeatureCard
          title="Strategise together"
          description="Move in sync with your group and sharpen your collective strategy."
          image="/homepage/hp-feat-strategy.png"
          bulletPoints={[
            "Share maps with organisers and allies",
            "Ground your decision-making in shared visualisations",
            "Support democratic planning and coordination",
          ]}
        />
      </div>
    </Container>
  );
}

function FeatureCard({
  title,
  description,
  image,
  alternate,
  bulletPoints,
}: {
  title: string;
  description: string;
  image: string;
  alternate?: boolean;
  bulletPoints?: string[];
}) {
  return (
    <div
      className={` px-2 md:px-6 py-6  flex flex-col md:flex-row gap-4 ${
        alternate ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className="w-full md:w-1/2">
        <h3 className="text-3xl font-bold tracking-tight mb-3">{title}</h3>
        <p className="text-3xl mb-5 text-balance">{description}</p>
        {bulletPoints && (
          <ul className="list-disc list-inside text-xl">
            {bulletPoints.map((point) => (
              <li key={point} className="mb-2 text-xl">
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
      {image && (
        <Image
          src={image}
          alt={title}
          width={1400}
          height={1000}
          className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full md:w-1/2 object-contain"
        />
      )}
    </div>
  );
}

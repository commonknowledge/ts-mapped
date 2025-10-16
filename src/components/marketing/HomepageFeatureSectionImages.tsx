import Image from "next/image";
import React from "react";
import Container from "@/components/layout/Container";
import { Separator } from "@/shadcn/ui/separator";

export default function HomepageFeatureSectionImages() {
    return (
        <Container>
            <div className="flex flex-col gap-10 md:gap-20 / py-10 md:py-[160px]">
                <FeatureCardImages
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
                <FeatureCardImages
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
                <FeatureCardImages
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

function FeatureCardImages({
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
            className={`flex flex-col md:flex-row gap-8 xl:gap-20 ${alternate ? "md:flex-row-reverse" : ""
                }`}
        >
            <div className="w-full md:w-1/2">
                <div className="max-w-[50ch] flex flex-col gap-4 md:gap-6 / text-base md:text-lg text-balance">
                    <h3 className="text-2xl md:text-4xl font-medium tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xl font-medium">{description}</p>
                    {bulletPoints && (
                        <ul className="flex flex-col gap-2 / list-disc list-inside">
                            {bulletPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {image && (
                <div className="w-full md:w-1/2">
                    <Image
                        src={image}
                        alt={title}
                        width={1400}
                        height={1000}
                        className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                </div>
            )}
        </div>
    );
}

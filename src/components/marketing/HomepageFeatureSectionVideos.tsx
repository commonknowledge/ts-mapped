import Image from "next/image";
import React from "react";
import Container from "@/components/layout/Container";
import { Separator } from "@/shadcn/ui/separator";
import { client } from "@/sanity/lib/client";
import MuxVideoPlayer from "./MuxVideoPlayer";
import RichTextComponent from "@/app/(marketing)/components/RichTextComponent";
import { PortableText } from "next-sanity";

interface HomepageVideo {
  _id: string;
  title: string;
  description: any[]; // Rich text content
  video: {
    asset: {
      playbackId: string;
      status: string;
      data: any;
    };
  };
  order: number;
}

const homepageVideosQuery = `*[_type == "homepageVideos"] | order(order asc) {
  _id,
  title,
  description,
  video {
    asset->{
      playbackId,
      status,
      data
    }
  },
  order
}`;

export default async function HomepageFeatureSectionVideos() {
  const homepageVideos = await client.fetch(homepageVideosQuery);
  if (!homepageVideos || homepageVideos.length === 0) {
    return <div>No homepage videos found</div>;
  }
  return (
    <Container>
      <div className="flex flex-col gap-10 md:gap-20 / py-10 md:py-[160px]">
        {homepageVideos.map((video: HomepageVideo, index: number) => (
          <FeatureCardVideos
            key={video._id}
            title={video.title}
            description={video.description}
            video={video.video}
            alternate={index % 2 === 1}
          />
        ))}
      </div>
    </Container>
  );
}


function FeatureCardVideos({
  title,
  description,
  video,
  alternate,
  bulletPoints,
}: {
  title: string;
  description: any[]; // Rich text content
  video: {
    asset: {
      playbackId: string;
      status: string;
      data: any;
    };
  };
  alternate?: boolean;
  bulletPoints?: string[];
}) {
  const playbackId = video?.asset?.playbackId;

  // Debug logging
  console.log('Video data:', video);
  console.log('Playback ID:', playbackId);

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

          <RichTextComponent content={description} className="text-lg max-w-[60ch]" />

        </div>
      </div>
      <div className="w-full md:w-1/2 shadow-lg rounded-md overflow-hidden">
        {playbackId ? (
          <MuxVideoPlayer
            playbackId={playbackId}
            className="w-full h-auto block"
            autoplay={true}
            loop={true}
            muted={true}
            controls={false}
          />
        ) : (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">No video available</p>
          </div>
        )}
      </div>
    </div>
  );
}

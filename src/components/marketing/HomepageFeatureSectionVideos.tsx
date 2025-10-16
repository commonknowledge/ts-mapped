import React from "react";
import RichTextComponent from "@/app/(marketing)/components/RichTextComponent";
import Container from "@/components/layout/Container";
import { client } from "@/sanity/lib/client";
import MuxVideoPlayer from "./MuxVideoPlayer";

interface RichTextBlock {
  _key: string;
  _type: string;
  children: {
    _key: string;
    _type: string;
    text: string;
    marks?: string[];
  }[];
  markDefs?: {
    _key: string;
    _type: string;
    href?: string;
  }[];
  style?: string;
}

interface HomepageVideo {
  _id: string;
  title: string;
  description: RichTextBlock[];
  video: {
    asset: {
      playbackId: string;
      status: string;
      data: Record<string, unknown>;
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
}: {
  title: string;
  description: RichTextBlock[];
  video: {
    asset: {
      playbackId: string;
      status: string;
      data: Record<string, unknown>;
    };
  };
  alternate?: boolean;
}) {
  const playbackId = video?.asset?.playbackId;

  return (
    <div
      className={`flex flex-col md:flex-row gap-8 xl:gap-20 ${
        alternate ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className="w-full md:w-1/2">
        <div className="max-w-[50ch] flex flex-col gap-4 md:gap-6 / text-base md:text-lg text-balance">
          <h3 className="text-2xl md:text-4xl font-medium tracking-tight">
            {title}
          </h3>

          <RichTextComponent
            content={description}
            className="text-lg max-w-[60ch]"
          />
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

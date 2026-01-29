"use client";

interface MuxVideoPlayerProps {
  playbackId: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export default function MuxVideoPlayer({
  playbackId,
  className,
  autoplay = true,
  loop = true,
  muted = true,
}: MuxVideoPlayerProps) {
  // Build the iframe URL with query parameters
  const iframeUrl = `https://player.mux.com/${playbackId}?autoplay=${autoplay ? "true" : "false"}&loop=${loop ? "true" : "false"}&muted=${muted ? "true" : "false"}`;

  return (
    <iframe
      src={iframeUrl}
      className={className}
      style={{
        width: "100%",
        border: "none",
        aspectRatio: "16/9",
        display: "block",
      }}
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
      allowFullScreen
    />
  );
}

"use client";

import MuxPlayer from "@mux/mux-player-react";

interface MuxVideoPlayerProps {
    playbackId: string;
    className?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
}

export default function MuxVideoPlayer({
    playbackId,
    className,
    autoplay = true,
    loop = true,
    muted = true,
    controls = false
}: MuxVideoPlayerProps) {
    return (
        <MuxPlayer
            playbackId={playbackId}
            className={className}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            controls={controls}
            style={{
                width: '100%',
                height: 'auto',
                backgroundColor: 'transparent',
                display: 'block',
                margin: 0,
                padding: 0,
            }}
            streamType="on-demand"
            metadata={{
                video_id: playbackId,
                video_title: 'Homepage Video',
            }}
        />
    );
}

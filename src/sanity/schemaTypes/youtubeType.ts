import { PlayIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const youtubeType = defineType({
  name: "youtube",
  type: "object",
  title: "YouTube Embed",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "src",
      type: "url",
      title: "YouTube video URL",
    }),
  ],
});

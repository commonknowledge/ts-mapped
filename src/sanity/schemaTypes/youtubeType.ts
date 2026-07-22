// @sanity/icons v5 moved individual icons to subpath exports; the root entry
// point now only exports the generic Icon component and the icons map
import { PlayIcon } from "@sanity/icons/Play";
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

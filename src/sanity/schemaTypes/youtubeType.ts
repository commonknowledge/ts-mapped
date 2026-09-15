import { Icon } from "@sanity/icons";
import { createElement } from "react";
import { defineField, defineType } from "sanity";

export const youtubeType = defineType({
  name: "youtube",
  type: "object",
  title: "YouTube Embed",
  // @sanity/icons 5 replaced named icons with <Icon symbol="..." />
  icon: () => createElement(Icon, { symbol: "play" }),
  fields: [
    defineField({
      name: "src",
      type: "url",
      title: "YouTube video URL",
    }),
  ],
});

import { defineField, defineType } from "sanity";

export const homepageVideosType = defineType({
  name: "homepageVideos",
  title: "Homepage Videos",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
    }),
    defineField({
      name: "description",
      type: "blockContent",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      title: "Order",
      description: "Order for display",
      initialValue: 0,
    }),
    defineField({
      name: "video",
      type: "mux.video",
      title: "Video",
      description:
        "Upload a new video or select from existing videos in your Mux account",
      options: {
        // Allow selecting from existing Mux videos
        selectExisting: true,
      },
    }),
  ],
});

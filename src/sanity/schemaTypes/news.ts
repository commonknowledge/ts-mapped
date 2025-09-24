import { defineField, defineType } from "sanity";

export const newsSchema = defineType({
  name: "news",
  title: "News",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
    }),
    defineField({
      name: "content",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "body",
      type: "blockContent",
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
    }),

    defineField({
      name: "image",
      type: "image",
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
    }),
    defineField({
      name: "isPublished",
      type: "boolean",
    }),
  ],
});

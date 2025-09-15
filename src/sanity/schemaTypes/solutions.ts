import { defineField, defineType } from "sanity";

export const solutionsType = defineType({
  name: "solutions",
  title: "Solutions",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "solutionsArray",
      title: "Solutions Array",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "image",
              type: "image",
            }),
            defineField({
              name: "button",
              type: "object",
              fields: [
                defineField({
                  name: "text",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "url",
                  type: "url",
                  validation: (rule) => rule.required(),
                }),
              ],
            }),
          ],
        },
      ],
    }),
  ],
});

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
      name: "position",
      type: "number",
      initialValue: 0,
      validation: (rule) => rule.required(),
      description: "Position in the list (lower numbers appear first)",
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
              title: "Button (Optional)",
              fields: [
                defineField({
                  name: "text",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "linkType",
                  type: "string",
                  title: "Link Type",
                  options: {
                    list: [
                      { title: "External URL", value: "external" },
                      { title: "Internal Docs Page", value: "docs" },
                    ],
                    layout: "dropdown",
                  },
                  initialValue: "external",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "url",
                  type: "url",
                  title: "External URL",
                  hidden: ({ parent }) => parent?.linkType !== "external",
                  validation: (rule) =>
                    rule.custom((value, context) => {
                      const parent = context.parent as { linkType?: string };
                      if (parent?.linkType === "external" && !value) {
                        return "External URL is required when link type is external";
                      }
                      return true;
                    }),
                }),
                defineField({
                  name: "docsPage",
                  type: "reference",
                  title: "Docs Page",
                  to: [{ type: "feature" }],
                  hidden: ({ parent }) => parent?.linkType !== "docs",
                  validation: (rule) =>
                    rule.custom((value, context) => {
                      const parent = context.parent as { linkType?: string };
                      if (parent?.linkType === "docs" && !value) {
                        return "Docs page is required when link type is docs";
                      }
                      return true;
                    }),
                }),
              ],
            }),
          ],
        },
      ],
    }),
  ],
});

import { defineField, defineType } from "sanity";
import { getTextFromBlocks } from "../../sanity/helpers";

export const featureSetType = defineType({
  name: "featureSet",
  title: "Feature Set",
  type: "document",
  fields: [

    defineField({
      name: "title",
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
      name: "description",
      type: "text",
    }),

    defineField({
      name: "order",
      type: "number",
      description: "Order for display",
    }),

  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      media: "icon",
    },
  },
});

export const featureType = defineType({
  name: "feature",
  title: "Feature",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      initialValue: "active",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "In Development", value: "in-development" },
          { title: "Draft", value: "draft" },
          { title: "Archived", value: "archived" },
          { title: "Roadmap", value: "roadmap" },
        ],
        layout: "dropdown",
      },
      description: "Whether this feature is active/available",
    }),
    defineField({
      name: "title",
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
      name: "explainer",
      type: "blockContent",

    }),
    defineField({
      name: "howToUse",
      title: "How to Use",
      type: "array",
      of: [
        {
          type: "object",
          name: "howToUseSection",
          title: "How to Use Section",
          fields: [
            defineField({
              name: "title",
              type: "string",
              title: "Section Title",
              description: "Title for the 'How to Use' section",
            }),
            defineField({
              name: "steps",
              type: "array",
              title: "Steps",
              of: [
                {
                  type: "object",
                  name: "step",
                  title: "Step",
                  fields: [
                    defineField({
                      name: "title",
                      type: "string",
                      title: "Step Title",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "description",
                      type: "array",
                      title: "Step Description",
                      of: [
                        {
                          type: "block",
                          styles: [
                            { title: "Normal", value: "normal" },
                            { title: "H2", value: "h2" },
                            { title: "H3", value: "h3" },
                            { title: "Quote", value: "blockquote" },
                          ],
                          lists: [
                            { title: "Bullet", value: "bullet" },
                            { title: "Number", value: "number" },
                          ],
                          marks: {
                            decorators: [
                              { title: "Strong", value: "strong" },
                              { title: "Emphasis", value: "em" },
                              { title: "Code", value: "code" },
                            ],
                            annotations: [
                              {
                                title: "URL",
                                name: "link",
                                type: "object",
                                fields: [
                                  {
                                    title: "URL",
                                    name: "href",
                                    type: "url",
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "images",
                      type: "array",
                      title: "Step Images",
                      of: [
                        {
                          type: "image",
                          options: {
                            hotspot: true,
                          },
                          fields: [
                            defineField({
                              name: "alt",
                              type: "string",
                              title: "Alt Text",
                              description: "Alternative text for accessibility",
                            }),
                            defineField({
                              name: "caption",
                              type: "string",
                              title: "Caption",
                              description: "Optional caption for the image",
                            }),
                          ],
                        },
                      ],
                      options: {
                        layout: "grid",
                      },
                    }),
                    defineField({
                      name: "order",
                      type: "number",
                      title: "Step Order",
                      initialValue: 1,
                    }),
                  ],
                  preview: {
                    select: {
                      title: "title",
                      subtitle: "description",
                      media: "images.0",
                    },
                    prepare(selection) {
                      const { title, subtitle } = selection;

                      const descriptionText = getTextFromBlocks(subtitle);

                      return {
                        title: title || "Untitled Step",
                        subtitle: descriptionText
                          ? descriptionText.substring(0, 50) + "..."
                          : "No description",
                      };
                    },
                  },
                },
              ],
              validation: (rule) =>
                rule.min(1).error("At least one step is required"),
            }),
          ],
          options: {
            layout: "grid",
          },
        },
      ],
    }),
    defineField({
      name: "featureSet",
      type: "reference",
      to: [{ type: "featureSet" }],
      description: "The feature set this feature belongs to",
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Order within the feature set",
    }),

  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      featureSet: "featureSet.title",
      status: "status",
    },
    prepare(selection) {
      const { title, subtitle, featureSet, status } = selection;
      return {
        title,
        subtitle: featureSet ? `${featureSet} - ${subtitle || ""}` : subtitle,
        media:
          status === "active"
            ? "Active"
            : status === "roadmap"
              ? "Roadmap"
              : "Inactive",
      };
    },
  },
});

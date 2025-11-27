import { Check } from "lucide-react";
import { X } from "lucide-react";
import { defineField, defineType } from "sanity";

export const supportType = defineType({
  name: "support",
  title: "Support",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "version",
      type: "number",
      initialValue: 1,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "active",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "openCollectiveProjectSlug",
      type: "string",
      title: "Open Collective Project Slug",
      description: "The slug of the Open Collective project",
      validation: (rule) => rule.required(),
    }),

    defineField({
      title: "Intro Text",
      name: "introText",
      type: "text",
    }),
    defineField({
      name: "body",
      type: "blockContent",
    }),
    defineField({
      name: "primaryImage",
      type: "image",
      options: { hotspot: true },
    }),

    // Intro Section
    defineField({
      name: "introSections",
      title: "Intro Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "headline",
              type: "string",
              title: "Headline",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              type: "blockContent",
              title: "Body",
            }),
          ],
          preview: {
            select: {
              headline: "headline",
              active: "active",
            },
            prepare({ headline, active }) {
              return {
                title: headline || "Untitled Intro Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // Stats Section
    defineField({
      name: "statsSections",
      title: "Stats Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
            defineField({
              name: "image",
              type: "image",
              title: "Image",
              options: { hotspot: true },
            }),
            defineField({
              name: "stats",
              type: "array",
              title: "Stats",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({
                      name: "value",
                      type: "string",
                      title: "Value",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "label",
                      type: "string",
                      title: "Label",
                      validation: (rule) => rule.required(),
                    }),
                  ],
                },
              ],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled Stats Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // Video Section
    defineField({
      name: "videoSections",
      title: "Video Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
            defineField({
              name: "videoPlaybackId",
              type: "string",
              title: "Video Playback ID (Mux)",
              description: "Mux video playback ID for the video player",
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled Video Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // Cards Section
    defineField({
      name: "featuresSection",
      title: "Features Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "cards",
              type: "array",
              title: "Cards",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({
                      name: "title",
                      type: "string",
                      title: "Card Title",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "description",
                      type: "text",
                      title: "Description",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "iconType",
                      type: "string",
                      title: "Icon Type",
                      options: {
                        list: [
                          { title: "People", value: "people" },
                          { title: "Impact", value: "impact" },
                          { title: "Action", value: "action" },
                        ],
                      },
                      initialValue: "impact",
                    }),
                    defineField({
                      name: "iconBgColor",
                      type: "string",
                      title: "Icon Background Color",
                      description:
                        "Tailwind CSS class (e.g., bg-brand-blue/10)",
                      initialValue: "bg-brand-blue/10",
                    }),
                    defineField({
                      name: "iconTextColor",
                      type: "string",
                      title: "Icon Text Color",
                      description: "Tailwind CSS class (e.g., text-brand-blue)",
                      initialValue: "text-brand-blue",
                    }),
                  ],
                },
              ],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled Cards Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // Why Support Section
    defineField({
      name: "whySupportSections",
      title: "Why Support Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled Why Support Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "imageBreak",
      type: "image",
      title: "Image Break",
      description: "Optional image to display between sections",
      options: { hotspot: true },
    }),

    // What Supporters Get Section
    defineField({
      name: "whatSupportersGetSections",
      title: "What Supporters Get Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
            defineField({
              name: "benefits",
              type: "array",
              title: "Benefits",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({
                      name: "title",
                      type: "string",
                      title: "Benefit Title",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "description",
                      type: "text",
                      title: "Description",
                      validation: (rule) => rule.required(),
                    }),
                  ],
                },
              ],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled What Supporters Get Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // Who This Is For Section
    defineField({
      name: "whoThisIsForSections",
      title: "Who This Is For Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
            defineField({
              name: "audiences",
              type: "array",
              title: "Audiences",
              of: [{ type: "string" }],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled Who This Is For Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),

    // CTA Section
    defineField({
      name: "ctaSections",
      title: "CTA Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "active",
              type: "boolean",
              title: "Active",
              initialValue: false,
            }),
            defineField({
              name: "title",
              type: "string",
              title: "Title",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              type: "text",
              title: "Description",
            }),
            defineField({
              name: "buttonText",
              type: "string",
              title: "Button Text",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "title",
              active: "active",
            },
            prepare({ title, active }) {
              return {
                title: title || "Untitled CTA Section",
                subtitle: active ? "Active" : "Inactive",
                media: active ? Check : X,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      active: "active",
      version: "version",
    },
    prepare(selection) {
      const { title, active, version } = selection;
      return {
        title,
        subtitle: `Version ${version}`,
        media: active ? Check : X,
      };
    },
  },
});

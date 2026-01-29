import { defineField, defineType } from "sanity";

export const featuresType = defineType({
    name: "features",
    title: "Features",
    type: "document",
    fields: [
        defineField({
            name: "showOnHomepage",
            type: "boolean",
            title: "Show on Homepage",
            initialValue: false,
            description: "Display this feature on the homepage",
        }),
        defineField({
            name: "homepageOrder",
            type: "number",
            title: "Homepage Order",
            description: "Controls the order this feature appears on the homepage (lower = earlier).",
            initialValue: 0,
            hidden: ({ parent }) => !parent?.showOnHomepage,
            validation: (rule) => rule.min(0).integer(),
        }),
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
            title: "Image",
            options: {
                hotspot: true,
            },
            description: "Use either an image or a video (not both required)",
        }),
        defineField({
            name: "video",
            type: "mux.video",
            title: "Video",
            description:
                "Upload a new video or select from existing videos in your Mux account. Use either an image or a video.",
            options: {
                // Allow selecting from existing Mux videos
                selectExisting: true,
            },
        }),
        defineField({
            name: "button",
            type: "object",
            title: "Button (Optional)",
            fields: [
                defineField({
                    name: "text",
                    type: "string",
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
                    to: [{ type: "docs" }],
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
    preview: {
        select: {
            title: "title",
            subtitle: "description",
            media: "image",
            hasVideo: "video.asset.playbackId",
        },
        prepare(selection) {
            const { title, subtitle, media, hasVideo } = selection;
            return {
                title: title || "Untitled Feature",
                subtitle: hasVideo
                    ? `[Video] ${subtitle ? subtitle.substring(0, 40) + "..." : "No description"}`
                    : subtitle
                        ? subtitle.substring(0, 50) + "..."
                        : "No description",
                media: media || undefined,
            };
        },
    },
});


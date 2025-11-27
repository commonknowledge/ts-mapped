import { defineField, defineType } from "sanity";
import { Check } from "lucide-react";
import { X } from "lucide-react";

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

    ],
    preview: {
        select: {
            title: "title",
            active: "active",
            version: "version",
        },
        prepare(selection) {
            const { title, active, version } = selection;
            return { title, subtitle: `Version ${version}`, media: active ? Check : X };
        },
    },
});
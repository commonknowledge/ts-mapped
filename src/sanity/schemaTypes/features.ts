import { defineField, defineType } from "sanity";

export const featureSetType = defineType({
    name: 'featureSet',
    title: 'Feature Set',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'subtitle',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            options: { source: 'title' },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'description',
            type: 'text',
        }),
        defineField({
            name: 'icon',
            type: 'string',
            description: 'Icon name or identifier',
        }),
        defineField({
            name: 'order',
            type: 'number',
            description: 'Order for display',
        }),
        defineField({
            name: 'features',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'feature' }] }],
            description: 'Features that belong to this set',
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'subtitle',
            media: 'icon',
        },
    },
});

export const featureType = defineType({
    name: 'feature',
    title: 'Feature',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'subtitle',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            options: { source: 'title' },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'description',
            type: 'text',
        }),
        defineField({
            name: 'icon',
            type: 'string',
            description: 'Icon name or identifier',
        }),
        defineField({
            name: 'order',
            type: 'number',
            description: 'Order within the feature set',
        }),
        defineField({
            name: 'featureSet',
            type: 'reference',
            to: [{ type: 'featureSet' }],
            description: 'The feature set this feature belongs to',
        }),
        defineField({
            name: 'isActive',
            type: 'boolean',
            initialValue: true,
            description: 'Whether this feature is active/available',
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'subtitle',
            featureSet: 'featureSet.title',
            media: 'icon',
        },
        prepare(selection) {
            const { title, subtitle, featureSet } = selection;
            return {
                title,
                subtitle: featureSet ? `${featureSet} - ${subtitle || ''}` : subtitle,
            };
        },
    },
});
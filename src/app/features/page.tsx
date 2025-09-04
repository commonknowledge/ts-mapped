import React from 'react'
import {
    TypographyH1,
    TypographyH2,
    TypographyH3,
    TypographyP,
    TypographyLead,
    TypographyMuted,
    TypographyList,
    TypographyBlockquote
} from '@/components/typography';

export default function FeaturesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <TypographyMuted className="mb-4">
                    — Features
                </TypographyMuted>

                <TypographyH1>Our Platform Features</TypographyH1>

                <TypographyLead className="mt-6">
                    Discover the powerful tools and capabilities that make our platform the ultimate solution for data management and mapping.
                </TypographyLead>

                {/* Feature Sets */}
                <div className="mt-12 space-y-12">
                    {/* Connect your Data */}
                    <section>
                        <TypographyH2>Connect your Data</TypographyH2>
                        <TypographyP>
                            Seamlessly integrate with your existing data sources and bring all your information together in one place.
                        </TypographyP>

                        <div className="mt-6 space-y-4">
                            <div>
                                <TypographyH3>Integrations</TypographyH3>
                                <TypographyP>
                                    Connect to popular platforms like Airtable, Google Sheets, and more with our extensive integration library.
                                </TypographyP>
                            </div>

                            <div>
                                <TypographyH3>Data Types</TypographyH3>
                                <TypographyP>
                                    Support for various data formats including CSV, JSON, and structured databases.
                                </TypographyP>
                            </div>
                        </div>
                    </section>

                    {/* Filter Data */}
                    <section>
                        <TypographyH2>Filter Data</TypographyH2>
                        <TypographyP>
                            Advanced filtering and segmentation capabilities to help you find exactly what you need.
                        </TypographyP>

                        <TypographyList>
                            <li>Filter by data column</li>
                            <li>Filter by "Proximity to Marker"</li>
                            <li>Filter by "Within Area"</li>
                            <li>Send To CRM</li>
                        </TypographyList>
                    </section>

                    {/* Maps */}
                    <section>
                        <TypographyH2>Maps</TypographyH2>
                        <TypographyP>
                            Create stunning visualizations and interactive maps to better understand your data.
                        </TypographyP>

                        <TypographyBlockquote>
                            "Maps are the most powerful tool for understanding spatial relationships in your data."
                        </TypographyBlockquote>

                        <div className="mt-6 space-y-4">
                            <div>
                                <TypographyH3>Create Organising Map</TypographyH3>
                                <TypographyP>
                                    Organize your data geographically with custom markers and boundaries.
                                </TypographyP>
                            </div>

                            <div>
                                <TypographyH3>Create Public Map</TypographyH3>
                                <TypographyP>
                                    Share your insights with stakeholders through beautiful, interactive public maps.
                                </TypographyP>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

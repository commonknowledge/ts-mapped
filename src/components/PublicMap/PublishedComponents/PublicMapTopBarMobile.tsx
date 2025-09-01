"use client";

import { MapIcon, Search, Menu, X } from "lucide-react";
import { useContext, useState } from "react";
import { publicMapColourSchemes } from "@/components/Map/styles";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import PublicMapGeocoder from "@/components/PublicMap/PublicMapGeocoder";
import { cn } from "@/shadcn/utils";
import EditablePublicMapProperty from "../EditorComponents/EditablePublicMapProperty";

export default function PublicMapTopBarMobile() {
    const {
        publicMap,
        editable,
        setSearchLocation,
        colourScheme,
    } = useContext(PublicMapContext);

    const [isOverlayOpen, setIsOverlayOpen] = useState(false);

    // Convert string colourScheme to actual color scheme object
    const activeColourScheme =
        publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

    if (!publicMap) {
        return null;
    }

    return (
        <>
            {/* Top Bar */}
            <div
                className="w-full bg-white border-b border-neutral-200 px-3 py-2 h-24"

            >
                <div className="absolute top-0 left-0 right-0  h-full" style={{ backgroundColor: activeColourScheme.muted }}></div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left side - Map icon and title */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <MapIcon
                                className="w-8 h-8 shrink-0"
                                style={{
                                    fill: "white",
                                    stroke: activeColourScheme.primary,
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <EditablePublicMapProperty
                                    property="name"
                                    placeholder="Map name"
                                >
                                    <h1 className="text-lg font-medium leading-tight text-balance tracking-tight truncate">
                                        {publicMap.name}
                                    </h1>
                                </EditablePublicMapProperty>
                            </div>
                        </div>

                        {/* Right side - Search and Menu */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsOverlayOpen(true)}
                                className="p-2 hover:bg-white/20 rounded transition-colors"
                            >
                                <Menu className="w-5 h-5" style={{ color: activeColourScheme.primary }} />
                            </button>
                        </div>
                    </div>
                    <PublicMapGeocoder
                        onGeocode={(p) => setSearchLocation(p)}
                        colourScheme={activeColourScheme}
                        className="w-full pl-10 pr-4 py-2  bg-white border border-neutral-300 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Overlay Modal */}
            {isOverlayOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16">
                    <div
                        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/20">
                            <div className="flex items-center gap-2">
                                <MapIcon
                                    className="w-8 h-8 shrink-0"
                                    style={{
                                        fill: "white",
                                        stroke: activeColourScheme.primary,
                                    }}
                                />
                                <EditablePublicMapProperty
                                    property="name"
                                    placeholder="Map name"
                                >
                                    <h1 className="text-xl font-medium leading-tight text-balance tracking-tight">
                                        {publicMap.name}
                                    </h1>
                                </EditablePublicMapProperty>
                            </div>
                            <button
                                onClick={() => setIsOverlayOpen(false)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                                <X className="w-5 h-5" style={{ color: activeColourScheme.primary }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col gap-4">
                            {/* Description */}
                            <div className="flex flex-col gap-1">
                                <EditablePublicMapProperty
                                    property="description"
                                    placeholder="Map description"
                                >
                                    <p className="text-sm">
                                        {publicMap.description || (
                                            <span className="text-sm text-neutral-500 italic">
                                                Add a description to your map
                                            </span>
                                        )}
                                    </p>
                                </EditablePublicMapProperty>
                            </div>

                            {/* Link */}
                            <div className="flex flex-col gap-1">
                                <EditablePublicMapProperty
                                    property="descriptionLink"
                                    placeholder="https://example.com"
                                >
                                    {publicMap.descriptionLink && (
                                        <a
                                            className="underline text-sm"
                                            style={{
                                                color: activeColourScheme.primary,
                                            }}
                                            href={publicMap.descriptionLink}
                                            target="_blank"
                                            onClick={(e) => editable && e.preventDefault()}
                                        >
                                            {publicMap.descriptionLink}
                                        </a>
                                    )}
                                </EditablePublicMapProperty>
                            </div>


                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

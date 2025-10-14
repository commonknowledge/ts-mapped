"use client";

import { Button } from "@/shadcn/ui/button";
import { TagIcon } from "lucide-react";

interface TagExplainerCardProps {
    onConfigureTag: () => void;
}

export default function TagExplainerCard({ onConfigureTag }: TagExplainerCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-purple-600 rounded-sm flex items-center justify-center text-white">
                    <TagIcon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold">Tag View</h2>
            </div>

            <p className="text-sm text-gray-700 mb-4">
                This is a tag view. Open the table panel to configure tag settings and send tags to your data source.
            </p>

            <Button
                onClick={onConfigureTag}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
                Configure Tag
            </Button>
        </div>
    );
}

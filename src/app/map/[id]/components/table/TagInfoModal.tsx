"use client";

import { Info, TagIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shadcn/ui/dialog";

export default function TagInfoModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Info className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-600 rounded-sm flex items-center justify-center">
                            <TagIcon className="w-4 h-4" />                        </div>
                        Send Tags to your Datasource
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-neutral-700 leading-relaxed">
                        Segment your data by tagging records based on mapped data. This will:
                    </p>
                    <ul className="text-sm text-neutral-700 space-y-2 ml-4">
                        <li>• Create a new column in your datasource with the name of your tag label below</li>
                        <li>• Mark any record that meets the segmentation settings as "true" so you can make the same segmentation with-in your CRM/tool.</li>
                        <li>• Resend the tags if you update the segmentation settings.</li>
                    </ul>
                    <p className="text-sm text-neutral-700">
                        Currently works with Airtable, Google Sheets and Action Network.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shadcn/ui/dialog";
import OpenCollectiveEmbed from "./OpenCollectiveEmbed";

interface CTAModalButtonProps {
    collectiveSlug: string;
    buttonText: string;
}

export default function CTAModalButton({ collectiveSlug, buttonText }: CTAModalButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button size="lg" onClick={() => setIsModalOpen(true)}>
                {buttonText}
            </Button>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl w-full p-0 gap-0">
                    <DialogTitle className="sr-only">{buttonText}</DialogTitle>
                    <div className="w-full">
                        <OpenCollectiveEmbed variant="custom" collectiveSlug={collectiveSlug} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


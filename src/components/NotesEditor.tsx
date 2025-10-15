import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/shadcn/ui/button";

interface NotesEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (notes: string) => void;
    initialNotes: string;
    title: string;
}

export default function NotesEditor({
    isOpen,
    onClose,
    onSave,
    initialNotes,
    title,
}: NotesEditorProps) {
    const [notes, setNotes] = useState(initialNotes);

    useEffect(() => {
        if (isOpen) {
            setNotes(initialNotes);
        }
    }, [isOpen, initialNotes]);

    const handleSave = () => {
        onSave(notes);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter" && e.ctrlKey) {
            handleSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add your notes here..."
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Notes</Button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                    Press Ctrl+Enter to save, or Escape to cancel
                </div>
            </div>
        </div>
    );
}

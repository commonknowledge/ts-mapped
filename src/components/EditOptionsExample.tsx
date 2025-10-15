import React, { useState } from "react";
import EditOptions from "@/components/EditOptions";

// Example component showing how to use EditOptions
export default function ExampleUsage() {
    const [items, setItems] = useState([
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
    ]);

    const handleRename = (id: number) => {
        const newName = prompt("Enter new name:");
        if (newName) {
            setItems(items.map(item =>
                item.id === id ? { ...item, name: newName } : item
            ));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this item?")) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">Example Usage of EditOptions</h3>
            {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded group hover:bg-gray-50">
                    <span>{item.name}</span>
                    <EditOptions
                        onRename={() => handleRename(item.id)}
                        onDelete={() => handleDelete(item.id)}
                        size="sm"
                    />
                </div>
            ))}

            <div className="mt-4 p-4 bg-gray-100 rounded">
                <h4 className="font-medium mb-2">Different Sizes:</h4>
                <div className="flex items-center gap-4">
                    <span>Small:</span>
                    <EditOptions size="sm" onRename={() => { }} onDelete={() => { }} />

                    <span>Medium:</span>
                    <EditOptions size="md" onRename={() => { }} onDelete={() => { }} />

                    <span>Large:</span>
                    <EditOptions size="lg" onRename={() => { }} onDelete={() => { }} />
                </div>
            </div>
        </div>
    );
}

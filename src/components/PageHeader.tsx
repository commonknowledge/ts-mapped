import React from "react";

export default function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-4xl tracking-tight font-light mb-2">{title}</h1>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
    </div>
  );
}

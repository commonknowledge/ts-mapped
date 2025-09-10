export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose mx-auto text-foreground prose-headings:text-primary prose-headings:font-medium prose-headings:tracking-tight">
      {children}
    </div>
  );
}

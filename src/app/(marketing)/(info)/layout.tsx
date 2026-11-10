// Each page opens with its own full-width hero, so this adds no wrapper
export default function Layout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}

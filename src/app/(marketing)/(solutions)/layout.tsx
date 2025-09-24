export default function Layout({ children }: { children: React.ReactNode }) {
  // component to wrap marketing pages that don't have a hero
  return <main>{children}</main>;
}

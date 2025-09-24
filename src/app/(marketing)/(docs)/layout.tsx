import Container from "@/components/layout/Container";

export default function Layout({ children }: { children: React.ReactNode }) {
  // component to wrap docs
  // TODO: move sidebar here and refactor pages
  return <Container>{children}</Container>;
}

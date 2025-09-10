export default function Container({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1440px] px-4 md:px-10 mx-auto">{children}</div>;
}

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[1440px] px-4 md:px-10 mx-auto py-[40px] md:py-[80px]">
      {children}
    </div>
  );
}

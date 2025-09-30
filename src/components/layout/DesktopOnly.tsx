import type { ReactNode } from "react";

export function DesktopOnly({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:hidden flex h-screen w-full justify-center items-center p-8 text-center">
        <p className=" max-w-[40ch] font-medium text-base">
          Your screen is too small to use this application. Please use a device
          with a larger screen.
        </p>
      </div>
      <div className="lg:block hidden">{children}</div>
    </>
  );
}

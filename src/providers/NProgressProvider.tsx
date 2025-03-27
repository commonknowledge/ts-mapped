"use client";

import { usePathname } from "next/navigation";
import nProgress from "nprogress";
import { useEffect } from "react";

export default function NProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    nProgress.done();
  }, [pathname]);
  return children;
}

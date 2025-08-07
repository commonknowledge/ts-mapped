"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/shadcn/ui/button";

export default function ConditionalMarketingNavbar() {
  const pathname = usePathname();

  // I feel like there is better logic for this, something that catches all the private routes
  // and doesn't need to be updated when new private routes are added
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/data-sources") ||
    pathname.startsWith("/map/")
  ) {
    return null;
  }

  return (
    <nav className="flex justify-between items-center p-4 h-20 fixed top-0 left-0 right-0 bg-transparent z-50">
      <div className="flex items-center">
        <Link href="/" className="pr-2 shrink-0">
          <Image src="/logo.svg" alt="Mapped" width={32} height={32} />
        </Link>
      </div>
      <div className="flex items-center gap-6 mx-auto justify-center p-4 bg-brand-background rounded-lg">
        <Link href="/features" className="text-sm">
          Features
        </Link>
        <Link href="/about" className="text-sm">
          About
        </Link>
        <Link href="/privacy" className="text-sm">
          Privacy
        </Link>
      </div>

      <Link href="/login">
        <Button size="sm">Login</Button>
      </Link>
    </nav>
  );
}

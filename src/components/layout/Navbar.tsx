import Image from "next/image";
import { Link } from "@/components/Link";

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <nav className="flex items-center gap-4 p-4 relative z-100 h-[var(--navbar-height)] border-b border-neutral-200 bg-white">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Mapped" width={24} height={24} />
      </Link>
      <div className="grow">{children}</div>
    </nav>
  );
}

"use client";

import { BookOpenIcon, Clock2, DatabaseIcon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Link } from "@/components/Link";
import SidebarUserMenu from "@/components/SidebarUserMenu";
import { cn } from "@/shadcn/utils";

export default function Sidebar() {
  const slug = usePathname();

  const isActive = (href: string) => slug === href;

  const navItems = [
    {
      label: "Recent maps",
      href: "/dashboard",
      icon: <Clock2 className="w-4 h-4" />,
    },
    {
      label: "Your data sources",
      href: "/data-sources",
      icon: <DatabaseIcon className="w-4 h-4" />,
    },
    {
      label: "Movement data library",
      href: "/data-library",
      icon: <BookOpenIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-64 h-screen bg-primary-foreground border-r border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo-full-lock-up.svg"
            alt="Mapped"
            width={320}
            height={32}
            priority
          />
        </Link>
        {/* TODO: Implement functionality */}
        {/*         <Button variant="outline" size="sm">
          <PlusIcon className="w-4 h-4" />
        </Button> */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center font-medium gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded",
                  isActive(item.href) && "bg-neutral-100 text-primary",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <SidebarUserMenu />
    </div>
  );
}

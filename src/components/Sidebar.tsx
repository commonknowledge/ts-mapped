"use client";

import { Clock2, DatabaseIcon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { useCurrentUser } from "@/hooks";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Avatar, AvatarFallback } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { getInitials } from "@/utils";
import { Link } from "./Link";
import type { SyntheticEvent } from "react";

export default function Sidebar() {
  const slug = usePathname();

  const { currentUser: user } = useCurrentUser();
  const { organisations, organisationId, setOrganisationId } =
    useContext(OrganisationsContext);

  const onSubmitLogout = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    document.cookie = "JWT=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    location.href = "/";
  };

  const isActive = (href: string) => slug === href;

  const navItems = [
    {
      label: "Recent Maps",
      href: "/dashboard",
      icon: <Clock2 className="w-4 h-4" />,
    },
    {
      label: "Data Sources",
      href: "/data-sources",
      icon: <DatabaseIcon className="w-4 h-4" />,
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

      {/* Organisation Selector */}
      <div className="p-4 border-t border-neutral-200">
        <label className="text-sm font-medium text-neutral-700 mb-2 block">
          Organisation
        </label>
        <Select
          onValueChange={(value) => setOrganisationId(value)}
          value={organisationId || ""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an organisation" />
          </SelectTrigger>
          <SelectContent>
            {organisations.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* User Section */}
      <div className="p-4 space-y-2 border-t border-neutral-200">
        <Link
          href={"/account"}
          className={cn(
            "flex items-center font-medium gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded",
            isActive("/account") && "bg-neutral-100 text-primary",
          )}
        >
          <Avatar>
            <AvatarFallback
              className={isActive("/account") ? "bg-neutral-200" : ""}
            >
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>{" "}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.name || user?.email}
            </p>
          </div>
        </Link>

        <form onSubmit={onSubmitLogout}>
          <Button variant="outline" size="sm" className="w-full">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

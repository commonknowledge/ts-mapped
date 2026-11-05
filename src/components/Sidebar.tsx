"use client";

import {
  BookOpenIcon,
  DatabaseIcon,
  LockIcon,
  MailPlusIcon,
  MapIcon,
  UserCogIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "@/components/Link";
import SidebarUserMenu from "@/components/SidebarUserMenu";
import { useCurrentUser, useFeatureFlagEnabled } from "@/hooks";
import { useOrganisations } from "@/hooks/useOrganisations";
import { Feature } from "@/models/Organisation";
import { UserRole } from "@/models/User";
import { cn } from "@/shadcn/utils";

export default function Sidebar() {
  const slug = usePathname();

  const { currentUser } = useCurrentUser();
  const { currentOrganisation } = useOrganisations();
  const [mounted, setMounted] = useState(false);
  const showPublicMaps = useFeatureFlagEnabled(
    Feature.PublicMaps,
    currentOrganisation?.features,
  );

  useEffect(() => setMounted(true), []);

  // A page and the pages under it, e.g. a data source's own page
  const isActive = (href: string) =>
    slug === href || slug.startsWith(`${href}/`);

  const mapItems = showPublicMaps
    ? [
        { label: "Private maps", href: "/maps", icon: LockIcon },
        { label: "Public maps", href: "/public-maps", icon: MapIcon },
      ]
    : [{ label: "Maps", href: "/maps", icon: MapIcon }];
  const dataItems = [
    { label: "Your data sources", href: "/data-sources", icon: DatabaseIcon },
    {
      label: "Movement data library",
      href: "/data-library",
      icon: BookOpenIcon,
    },
  ];
  const adminItems = [
    ...(currentUser?.role === UserRole.Advocate ||
    currentUser?.role === UserRole.Superadmin
      ? [
          {
            label: "Invite organisation",
            href: "/invite-organisation",
            icon: MailPlusIcon,
          },
        ]
      : []),
    ...(currentUser?.role === UserRole.Superadmin
      ? [{ label: "Superadmin", href: "/superadmin", icon: UserCogIcon }]
      : []),
  ];
  const sections = [
    { label: "Maps", items: mapItems },
    { label: "Data", items: dataItems },
    ...(adminItems.length ? [{ label: "Admin", items: adminItems }] : []),
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="px-5 pt-5 pb-6">
        <Link href="/maps" className="block w-fit">
          {/* The marketing site's wordmark, its white text in ink */}
          <Image
            src="/logo-wordmark-ink.svg"
            alt="Mapped"
            width={110}
            height={36}
            priority
          />
        </Link>
      </div>

      {/* Prevent hydration mismatch caused by the feature flag */}
      {mounted && (
        <>
          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-2.5 font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-neutral-100 font-medium text-ink"
                              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-ink" : "text-neutral-400",
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-neutral-100 p-3">
            <SidebarUserMenu />
          </div>
        </>
      )}
    </aside>
  );
}

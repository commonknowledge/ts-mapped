"use client";

import Image from "next/image";
import { SyntheticEvent, useContext } from "react";
import { useCurrentUser } from "@/hooks";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Link } from "./Link";

export default function Sidebar() {
  const user = useCurrentUser();
  const { organisations, organisationId, setOrganisationId } =
    useContext(OrganisationsContext);

  const onSubmitLogout = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    document.cookie = "JWT=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    location.reload();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Mapped" width={32} height={32} />
          <span className="font-semibold">Mapped</span>
        </Link>
      </div>

      {/* Organisation Selector */}
      <div className="p-4 border-b border-neutral-200">
        <label className="text-sm font-medium text-neutral-700 mb-2 block">
          Organisation
        </label>
        <select
          onChange={(e) => setOrganisationId(e.target.value)}
          value={organisationId || ""}
          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
        >
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/data-sources"
              className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded"
            >
              Data Sources
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.id?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              User
            </p>
          </div>
        </div>
        <form onSubmit={onSubmitLogout}>
          <Button variant="outline" size="sm" className="w-full">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

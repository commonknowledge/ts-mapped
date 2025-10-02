"use client";

import {
  CheckIcon,
  ChevronDown,
  LifeBuoyIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { useContext } from "react";
import { useCurrentUser } from "@/hooks";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

import { cn } from "@/shadcn/utils";
import { getInitials } from "@/utils/text";
import { Link } from "./Link";
import type { SyntheticEvent } from "react";

export default function SidebarUserMenu() {
  const { currentUser: user } = useCurrentUser();
  const { organisations, organisationId, setOrganisationId, getOrganisation } =
    useContext(OrganisationsContext);

  const onSubmitLogout = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    document.cookie = "JWT=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          className={cn(
            "flex items-center font-medium gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded",
          )}
        >
          <Avatar>
            <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
            <AvatarFallback className="bg-neutral-200">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>{" "}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-left truncate">
              {user?.name || user?.email}
            </p>
          </div>
          <ChevronDown size={16} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={12}
        className="min-w-[200px]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>

          <DropdownMenuItem className="truncate pointer-events-none">
            {user?.name || user?.email}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Organisation</DropdownMenuLabel>

          {organisations?.length > 1 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="truncate">
                {getOrganisation()?.name}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="flex flex-col">
                  {organisations.map((o) => (
                    <button
                      type="button"
                      key={o.id}
                      onClick={() => setOrganisationId(o.id)}
                    >
                      <DropdownMenuItem>
                        {o.id === organisationId && <CheckIcon />}
                        {o.name}
                      </DropdownMenuItem>
                    </button>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem className="truncate pointer-events-none">
              {getOrganisation()?.name}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <Link href={"/account"}>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <Link href={"/docs"}>
          <DropdownMenuItem>
            <LifeBuoyIcon />
            Docs
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <form onSubmit={onSubmitLogout}>
          <button type="submit" className="w-full">
            <DropdownMenuItem>
              <LogOutIcon />
              Logout
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

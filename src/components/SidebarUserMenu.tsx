"use client";

import {
  CheckIcon,
  ChevronsUpDownIcon,
  LifeBuoyIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { logout } from "@/auth/logout";
import { useCurrentUser } from "@/hooks";
import { useOrganisations } from "@/hooks/useOrganisations";
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
import { getInitials } from "@/utils/text";
import { Link } from "./Link";
import type { SyntheticEvent } from "react";

export default function SidebarUserMenu() {
  const { currentUser: user } = useCurrentUser();
  const {
    organisations,
    organisationId,
    setOrganisationId,
    currentOrganisation,
  } = useOrganisations();

  const onSubmitLogout = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full cursor-pointer rounded-lg text-left outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-300 data-[state=open]:bg-neutral-100">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="size-7">
            <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
            <AvatarFallback className="bg-mint text-[11px] font-medium text-ink">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">
              {user?.name || user?.email}
            </p>
            {currentOrganisation?.name && (
              <p className="truncate text-[11px] text-neutral-500">
                {currentOrganisation.name}
              </p>
            )}
          </div>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-neutral-400" />
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

          {organisations.length > 1 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="truncate">
                {currentOrganisation?.name}
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
              {currentOrganisation?.name}
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

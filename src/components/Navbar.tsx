"use client";

import Image from "next/image";
import { SyntheticEvent, useContext, useState } from "react";
import { useCurrentUser } from "@/hooks";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { Link } from "./Link";

export default function Navbar() {
  const user = useCurrentUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { organisations, organisationId, setOrganisationId } =
    useContext(OrganisationsContext);

  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({ email, password }),
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Response code ${response.status}`);
      }
      location.reload();
    } catch (e) {
      console.error(`Login failed: ${e}`);
      setLoading(false);
    }
  };

  const onSubmitLogout = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    document.cookie = "JWT=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    location.reload();
  };

  return (
    <nav className="flex justify-between items-center p-4 z-1">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Mapped" width={32} height={32} />
          Mapped
        </Link>
        <Separator orientation="vertical" />
        <Link
          href="/map"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          Map
        </Link>
        <Link
          href="/data-sources"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          Data Sources
        </Link>
      </div>
      {user ? (
        <div className="flex gap-4">
          <select
            onChange={(e) => setOrganisationId(e.target.value)}
            value={organisationId || ""}
          >
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <form onSubmit={onSubmitLogout}>
            <button>Logout</button>
          </form>
        </div>
      ) : (
        <form onSubmit={onSubmitLogin}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button disabled={loading}>Login</Button>
        </form>
      )}
    </nav>
  );
}

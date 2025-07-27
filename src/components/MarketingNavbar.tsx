"use client";

import Image from "next/image";
import { SyntheticEvent, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Link } from "./Link";

export default function MarketingNavbar() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <nav className="flex justify-between items-center p-4 z-1 h-14 border-b border-neutral-200">
      <div className="flex items-center">
        <Link href="/" className="pr-2">
          <Image src="/logo.svg" alt="Mapped" width={32} height={32} />
        </Link>
        <div className="flex items-baseline gap-4">
          <Link href="/">Mapped</Link>
          <Link href="/privacy" className="text-sm">
            Privacy
          </Link>
        </div>
      </div>
      <form onSubmit={onSubmitLogin} className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-1 border border-neutral-300 rounded text-sm"
        />
        <input
          name="password"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-3 py-1 border border-neutral-300 rounded text-sm"
        />
        <Button disabled={loading} size="sm">
          Login
        </Button>
      </form>
    </nav>
  );
}

"use client";

import { SyntheticEvent, useState } from "react";
import { useCurrentUser } from "@/hooks";
import { Link } from "./Link";
import styles from "./Navbar.module.css";
import { Separator } from "@/shadcn/ui/separator";

export default function Navbar() {
  const user = useCurrentUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
    if (response.ok) {
      location.reload();
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
          <img src="/logo.svg" alt="Mapped" width={32} height={32} />
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
        <form className="flex gap-2" onSubmit={onSubmitLogout}>
          <button>Logout</button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={onSubmitLogin}>
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
          <button>Login</button>
        </form>
      )}
    </nav>
  );
}

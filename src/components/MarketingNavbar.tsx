"use client";

import { gql, useMutation } from "@apollo/client";
import Image from "next/image";
import { SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import {
  MutationForgotPasswordArgs,
  MutationResponse,
} from "@/__generated__/types";
import { Button } from "@/shadcn/ui/button";
import { Link } from "./Link";

export default function MarketingNavbar() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPassword, { loading: forgotPasswordLoading }] = useMutation<
    MutationResponse,
    MutationForgotPasswordArgs
  >(gql`
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email) {
        code
      }
    }
  `);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmitForgotPassword = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await forgotPassword({ variables: { email } });
    setPassword("");
    setEmail("");
    toast.success("Instructions sent!", {
      description: "Please check your email to reset your password",
    });
    setIsForgotPasswordOpen(false);
  };

  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({ email, password }),
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Response code ${response.status}`);
      }
      location.reload();
    } catch {
      setError("Login failed, please check your credentials.");
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
      {isForgotPasswordOpen ? (
        <form
          onSubmit={onSubmitForgotPassword}
          className="flex gap-2 items-center"
        >
          <span className="text-sm">{error}</span>
          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(false)}
            className="text-sm hover:underline"
          >
            Login
          </button>
          <input
            name="email"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-1 border border-neutral-300 rounded text-sm w-[240px]"
          />

          <Button disabled={forgotPasswordLoading} size="sm">
            {forgotPasswordLoading ? "Sending..." : "Send instructions"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmitLogin} className="flex gap-2 items-center">
          <span className="text-sm">{error}</span>
          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-sm hover:underline"
          >
            Forgot password?
          </button>
          <input
            name="email"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-1 border border-neutral-300 rounded text-sm w-[240px]"
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
      )}
    </nav>
  );
}

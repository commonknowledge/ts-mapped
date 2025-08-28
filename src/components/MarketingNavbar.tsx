"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/shadcn/ui/button";
import { Link } from "./Link";

export default function MarketingNavbar() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const trpc = useTRPC();

  const { mutate: forgotPassword, isPending: forgotPasswordLoading } =
    useMutation(
      trpc.auth.forgotPassword.mutationOptions({
        onSuccess: () => {
          toast.success("Instructions sent!", {
            description: "Please check your email to reset your password",
          });
          setPassword("");
          setEmail("");
          setIsForgotPasswordOpen(false);
        },
        onError: () => {
          setError("Failed to send instructions, please try again.");
        },
      }),
    );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const onSubmitForgotPassword = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword({ email });
  };

  const { mutate: login, isPending: loginLoading } = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: () => {
        location.reload();
      },
      onError: () => {
        setError("Login failed, please check your credentials.");
      },
    }),
  );

  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    login({ email, password });
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
          <Button disabled={loginLoading} size="sm">
            Login
          </Button>
        </form>
      )}
    </nav>
  );
}

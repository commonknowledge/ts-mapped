"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import Link from "next/link";
import { useEffect } from "react";
import { logout } from "@/auth/logout";
import { TRIAL_EXPIRED_MESSAGE } from "@/constants";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardTitle } from "@/shadcn/ui/card";
import HTMLBody from "./HTMLBody";

function isTrialExpiredError(error: Error) {
  return error.name === "TRPCError" && error.message === TRIAL_EXPIRED_MESSAGE;
}

function TrialExpired() {
  return (
    <div className="bg-brand-background">
      <header className="absolute top-0 left-0 w-full flex items-center h-16 md:h-20">
        <div className="w-full max-w-[1440px] px-4 md:px-10 mx-auto">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Mapped" width={28} height={28} />
          </Link>
        </div>
      </header>
      <main className="min-h-[100vh] flex justify-center items-center py-[120px] px-6">
        <Card className="w-[350px] border-none">
          <CardContent className="flex flex-col gap-4">
            <CardTitle className="text-2xl">Trial Expired</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your trial period has ended. Please contact us to continue using
              Mapped.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="sm">
                <a href="mailto:hello@commonknowledge.coop">Get in touch</a>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (!isTrialExpiredError(error)) {
      Sentry.captureException(error);
    }
  }, [error]);

  if (isTrialExpiredError(error)) {
    return (
      <HTMLBody>
        <TrialExpired />
      </HTMLBody>
    );
  }

  return (
    <HTMLBody>
      {/* `NextError` is the default Next.js error page component. Its type
      definition requires a `statusCode` prop. However, since the App Router
      does not expose status codes for errors, we simply pass 0 to render a
      generic error message. */}
      <NextError statusCode={0} />
    </HTMLBody>
  );
}

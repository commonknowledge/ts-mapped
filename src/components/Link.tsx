"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import nProgress from "nprogress";
import { useTransition } from "react";

/**
 * A custom Link component that wraps Next.js's next/link component.
 */
export function Link({
  href,
  children,
  replace,
  ...rest
}: Parameters<typeof NextLink>[0]) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (isPending) {
    nProgress.start();
  } else {
    nProgress.done();
  }

  return (
    <NextLink
      href={href}
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => {
          const url = href.toString();
          if (replace) {
            router.replace(url);
          } else {
            router.push(url);
          }
        });
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

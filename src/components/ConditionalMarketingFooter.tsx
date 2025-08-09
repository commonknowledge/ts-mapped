"use client";

import { GithubIcon, HeartHandshakeIcon, MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import CTA from "@/components/CTA";
import { isPrivateRoute } from "@/config/routes";

export default function ConditionalMarketingFooter() {
  const pathname = usePathname();

  // I feel like there is better logic for this, something that catches all the private routes
  // and doesn't need to be updated when new private routes are added
  if (isPrivateRoute(pathname)) {
    return null;
  }

  return (
    <>
      <CTA />

      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:p-10 p-6">
        <div className="col-span-2">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 className="text-3xl">Made for the movement, by the movement</h2>
            <p>
              Mapped was built for and with organisers: tenant unions, climate
              action groups, migrant solidarity organisations, divestment
              campaigns and more.
            </p>
            <p>
              It’s a project by Common Knowledge, a not-for-profit worker
              cooperative that uses digital technology to build power for social
              movements.
            </p>
            <Link href="https://commonknowledge.coop">
              <Image
                src="/CK_Logo_Black.svg"
                alt="Common Knowledge"
                width={300}
                height={200}
                className="max-w-48"
              />
            </Link>
            <p className="mt-8">Funded by</p>
            <div className="flex gap-4">
              <Image
                src="/funders/CVC.svg"
                alt="Funding"
                width={300}
                height={200}
                className="max-w-24 object-contain"
              />
              <Image
                src="/funders/GOWER_ST.png"
                alt="Funding"
                width={300}
                height={200}
                className="max-w-24 object-contain"
              />
              <Image
                src="/funders/JRRT.png"
                alt="Funding"
                width={300}
                height={200}
                className="max-w-24 object-contain"
              />
            </div>
          </div>
        </div>
        <div>
          <ul className="flex flex-col gap-8">
            <li>
              <Link
                href="/"
                className="flex items-center gap-2 font-medium mb-2 underline"
              >
                <MailIcon />
                Contact us
              </Link>
              We’d love to hear from you if you have feedback and requests for
              similar tools, or if you’d like to collaborate with us on a
              project.
            </li>
            <li>
              <Link
                href="/https://opencollective.com/commonknowledge"
                className="flex items-center gap-2 font-medium mb-2 underline"
              >
                <HeartHandshakeIcon />
                Support our work{" "}
              </Link>
              Mapped will always be free for grassroots organisers. We rely on
              grants and donations to do this work — you can help us ramp up our
              activity by donating.{" "}
            </li>
            <li>
              <Link
                href="https://github.com/commonknowledge/mapped"
                className="flex items-center gap-2 font-medium mb-2 underline "
              >
                <GithubIcon /> Check out the code
              </Link>
              Mapped is open sourced on Github under the GNU Affero GPL license.
            </li>
            <Link href="/privacy-policy" className="underline">
              Privacy policy
            </Link>
          </ul>
        </div>
      </footer>
    </>
  );
}

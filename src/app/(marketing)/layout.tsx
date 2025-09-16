"use client";

import { GithubIcon, HeartHandshakeIcon, MailIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import CTA from "@/components/marketing/CTA";
import Prose from "@/components/Prose";
import { useCurrentUser } from "@/hooks";
import { client } from "@/sanity/lib/client";
import { Button } from "@/shadcn/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shadcn/ui/navigation-menu";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </>
  );
}

function MarketingNavbar() {
  const { currentUser } = useCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center px-4 md:px-6 h-16 md:h-20 sticky top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center">
          <Link href="/" className="pr-2 shrink-0">
            <Image
              src="/logo.svg"
              alt="Mapped"
              width={28}
              height={28}
              className="md:w-8 md:h-8"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 mx-auto justify-center p-4 ">
          <DesktopNavbar />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md bg-brand-background"
            aria-label="Toggle mobile menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-0.5" : "-translate-y-1"}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1"}`}
              ></span>
            </div>
          </button>
        </div>

        {currentUser ? (
          <Link href="/login" className="hidden md:block">
            <Button size="sm" className="text-xs md:text-sm">
              Login
            </Button>
          </Link>
        ) : (
          <Link href="/login" className="hidden md:block">
            <Button size="sm" className="text-xs md:text-sm">
              Login
            </Button>
          </Link>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href="/features"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/about"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-lg font-medium py-2 border-b border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacy
              </Link>
              <div className="pt-4">
                Mapped is built to be used on desktop. We recommend using a
                desktop browser to get the best experience.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MarketingFooter() {
  return (
    <>
      <CTA />

      <Container>
        <footer className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full md:py-20 py-12">
          <div className="col-span-2">
            <div className="flex flex-col items-start gap-4 max-w-2xl">
              <Prose className="mx-0 text-balance">
                <h2>Made for the movement, by the movement</h2>
                <p>
                  Mapped was built for and with organisers: tenant unions,
                  climate action groups, migrant solidarity organisations,
                  divestment campaigns and more.
                </p>
                <p>
                  It’s a project by Common Knowledge, a not-for-profit worker
                  cooperative that uses digital technology to build power for
                  social movements.
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
              </Prose>

              <h3>Funded by:</h3>
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
                grants and donations to do this work — you can help us ramp up
                our activity by donating.{" "}
              </li>
              <li>
                <Link
                  href="https://github.com/commonknowledge/mapped"
                  className="flex items-center gap-2 font-medium mb-2 underline "
                >
                  <GithubIcon /> Check out the code
                </Link>
                Mapped is open sourced on Github under the GNU Affero GPL
                license.
              </li>
              <Link href="/privacy" className="underline">
                Privacy policy
              </Link>
            </ul>
          </div>
        </footer>
      </Container>
    </>
  );
}

interface Solution {
  _id: string;
  title: string;
  subtitle: string;
  slug: { current: string };
  position: number;
}

const DesktopNavbar = () => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const solutions = await client.fetch(
          `*[_type == "solutions"] | order(position asc)`,
        );
        setSolutions(solutions || []);
      } catch (error) {
        console.error("Error fetching solutions:", error);
        setSolutions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSolutions();
  }, []);
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent className="border-0 shadow-lg">
            <ul className="grid w-[400px] gap-2 p-2">
              {isLoading ? (
                <li className="text-sm text-muted-foreground">Loading...</li>
              ) : solutions.length > 0 ? (
                solutions
                  .sort((a, b) => a.position - b.position)
                  .map((solution) => (
                    <li
                      key={solution._id}
                      className="cursor-pointer hover:bg-neutral-100 p-2 rounded-sm"
                    >
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/solutions/${solution.slug?.current || solution._id}`}
                        >
                          <div className="font-medium">{solution.title}</div>
                          <div className="text-muted-foreground text-sm">
                            {solution.subtitle}
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No solutions available
                </li>
              )}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/docs">Docs</Link>
        </NavigationMenuLink>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/about">About</Link>
        </NavigationMenuLink>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/privacy">Privacy</Link>
        </NavigationMenuLink>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

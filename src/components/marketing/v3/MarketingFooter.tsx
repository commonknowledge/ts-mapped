import Image from "next/image";
import { Link } from "@/components/Link";

/**
 * The marketing site's footer: the movement line, the big wordmark and the
 * Common Knowledge and privacy links. From lg it's a fixed-ratio frame like
 * the homepage's sections, sized in container query units.
 */
export default function MarketingFooter() {
  return (
    <footer className="@container relative w-full overflow-clip">
      <div className="relative flex flex-col bg-white px-5 pt-10 pb-8 lg:aspect-[1440/527] lg:block lg:px-0 lg:pt-0 lg:pb-0">
        <Image
          src="/marketing-v3/footer-rule.svg"
          alt=""
          width={1379}
          height={1}
          className="absolute top-0 left-5 w-[calc(100%-2.5rem)] max-w-none lg:left-[2.083%] lg:w-[95.764%]"
        />

        <div className="relative z-10 flex flex-col gap-6 text-sm leading-[1.3] text-black lg:absolute lg:top-[4.08%] lg:left-[2.083%] lg:w-[95.764%] lg:flex-row lg:items-start lg:gap-[1.545cqw] lg:text-[1.111cqw]">
          <p className="text-2xl leading-none font-bold tracking-[-0.032em] text-[#15213b] lg:w-[30.764cqw] lg:text-[1.667cqw]">
            Made for the movement,
            <br />
            by the movement
          </p>
          <div className="flex flex-col gap-4 sm:flex-row lg:flex-1 lg:items-start lg:gap-[1.528cqw]">
            <p className="flex-1">
              Mapped was built for and with organisers: tenant unions, climate
              action groups, migrant solidarity organisations, divestment
              campaigns and more.
            </p>
            <p className="flex-1">
              It’s a project by Common Knowledge, a not-for-profit worker
              cooperative that uses digital technology to build power for social
              movements.
            </p>
          </div>
        </div>

        <Image
          src="/marketing-v3/wordmark-footer.svg"
          alt="Mapped"
          width={1386}
          height={452}
          className="pointer-events-none relative mt-8 h-auto w-full max-w-none lg:absolute lg:top-[10.911%] lg:left-[1.944%] lg:mt-0 lg:w-[96.25%]"
        />

        <div className="relative z-10 mt-6 flex items-center justify-between gap-4 text-sm leading-[1.3] text-black lg:static lg:mt-0 lg:text-[1.111cqw]">
          <p className="lg:absolute lg:top-[93.454%] lg:left-[1.944%]">
            Made by{" "}
            <a
              href="https://commonknowledge.coop"
              className="underline hover:no-underline"
            >
              Common Knowledge
            </a>
          </p>
          <Link
            href="/privacy"
            className="underline hover:no-underline lg:absolute lg:top-[93.454%] lg:left-[90.139%]"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

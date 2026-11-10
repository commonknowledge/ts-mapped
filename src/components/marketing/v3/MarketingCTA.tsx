import Image from "next/image";
import { REQUEST_ACCESS_URL } from "./constants";
import MarketingButton from "./MarketingButton";

/** The ask at the foot of each marketing page, on the demo section's ink */
export default function MarketingCTA() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <Image
        src="/marketing-v3/pattern-dark.svg"
        alt=""
        aria-hidden
        width={468}
        height={451}
        className="pointer-events-none absolute -right-10 -bottom-10 w-56 max-w-none rotate-90 opacity-60 md:w-[380px] md:opacity-100"
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-5 py-16 lg:px-[30px] lg:py-24">
        <p className="font-mono text-[11px] leading-[1.08] tracking-[0.13em] text-white uppercase opacity-50 lg:text-xs">
          Mapping for political organisers
        </p>
        <h2 className="max-w-3xl text-4xl leading-[0.98] font-bold tracking-[-0.052em] text-balance text-white md:text-6xl">
          Map your members, overlay data, strategise and win.
        </h2>
        <MarketingButton href={REQUEST_ACCESS_URL} variant="coral">
          Request Access
        </MarketingButton>
      </div>
    </section>
  );
}

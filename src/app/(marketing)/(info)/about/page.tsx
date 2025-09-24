import Image from "next/image";
import { Link } from "@/components/Link";
import Prose from "@/components/Prose";

export default function AboutPage() {
  return (
    <Prose className="mx-auto">
      <h1>About Mapped</h1>
      <p>
        Mapped is a tool for organising and mobilising people. It&apos;s a
        project by Common Knowledge, a not-for-profit worker cooperative that
        uses digital technology to build power for social movements.
      </p>
      <Link href="https://commonknowledge.coop">
        <Image
          src="/CK_Logo_Black.svg"
          alt="Common Knowledge"
          width={300}
          height={200}
          className="max-w-48 mt-8"
        />
      </Link>
    </Prose>
  );
}

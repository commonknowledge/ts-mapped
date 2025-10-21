import {
  Button,
  Container,
  Hr,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { EmailLayout } from "./layout";

export default function Invite({ token = "123" }: { token: string }) {
  const baseUrl = getAbsoluteUrl();

  const link = `${baseUrl}invite/${token}`;
  return (
    <EmailLayout>
      <Preview>Click here to confirm your invite</Preview>
      <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
        <Section className="mt-[32px]">
          <Img
            alt="Mapped logo"
            src={`${baseUrl}logo.png`}
            width="40"
            height="40"
            className="mx-auto my-0"
          />
        </Section>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          Hello,
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          Thanks for your patience while we’ve been building the newest version
          of Mapped. We’re happy to share that it is now ready to use!
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          You can confirm your invite here:
        </Text>
        <Section className="mt-[32px] mb-[32px] text-center">
          <Button
            className="rounded bg-brandBlue px-5 py-3 font-sans text-center font-semibold text-[12px] text-white no-underline"
            href={link}
          >
            Confirm invite
          </Button>
        </Section>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          We’ve been rigorously testing the platform internally, but as with any
          software there will sometimes be bugs. If something doesn’t work for
          you, you can report a bug using the icon in the bottom right of the
          platform.
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          Mapped is built with movements, not just for them. If you use it, we’d
          love to hear what works for your organising and what doesn’t — just
          email{" "}
          <a href="mailto:mapped@commonknowledge.coop">
            mapped@commonknowledge.coop
          </a>
          . Your feedback will shape what we build next.
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          We fund the ongoing development of Mapped through a mix of grants,
          feature commissions, individual donations and our own surplus income.
          Mapped will always be free for grassroots organisers, but if you’re in
          the position to{" "}
          <a href="https://opencollective.com/commonknowledge">
            support our work
          </a>{" "}
          with a donation, it would go a long way to making this work
          sustainable.
        </Text>

        <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
        <Text className="text-[#666666] text-[12px] font-sans leading-[24px]">
          If you did not request an invite, please ignore this email.
        </Text>
      </Container>
    </EmailLayout>
  );
}

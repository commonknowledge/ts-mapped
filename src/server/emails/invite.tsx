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
            src={`${baseUrl}logo.svg`}
            width="40"
            height="40"
            className="mx-auto my-0"
          />
        </Section>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          Hello!
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          You have been invited to Mapped. You can confirm your invite here:
        </Text>
        <Section className="mt-[32px] mb-[32px] text-center">
          <Button
            className="rounded bg-brandBlue px-5 py-3 font-sans text-center font-semibold text-[12px] text-white no-underline"
            href={link}
          >
            Confirm invite
          </Button>
        </Section>
        <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
        <Text className="text-[#666666] text-[12px] font-sans leading-[24px]">
          If you did not request an invite, please ignore this email.
        </Text>
      </Container>
    </EmailLayout>
  );
}

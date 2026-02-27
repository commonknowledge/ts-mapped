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
import { EmailLayout } from "./Layout";

export default function InviteExistingUser({
  organisationName,
  invitationId,
}: {
  organisationName: string;
  invitationId: string;
}) {
  const baseUrl = getAbsoluteUrl();

  const link = `${baseUrl}account/invitation/${invitationId}`;
  return (
    <EmailLayout>
      <Preview>
        You&apos;ve been invited to join {organisationName} on Mapped
      </Preview>
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
          You&apos;ve been invited to join <strong>{organisationName}</strong>{" "}
          on Mapped. Click the button below to accept or decline the invitation.
        </Text>

        <Section className="mt-[32px] mb-[32px] text-center">
          <Button
            className="rounded bg-brandBlue px-5 py-3 font-sans text-center font-semibold text-[12px] text-white no-underline"
            href={link}
          >
            View invitation
          </Button>
        </Section>

        <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
        <Text className="text-[#666666] text-[12px] font-sans leading-[24px]">
          If you did not expect this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </EmailLayout>
  );
}

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

export default function PublicMapAccessRequested({
  mapName = "My Public Map",
  email = "visitor@example.org",
  reviewUrl = "https://localhost:3000/public-map-access/123",
}: {
  mapName: string;
  email: string;
  reviewUrl: string;
}) {
  const baseUrl = getAbsoluteUrl();

  return (
    <EmailLayout>
      <Preview>{`${email} has asked to see ${mapName}`}</Preview>
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
          <strong>{email}</strong> has asked to see the map{" "}
          <strong>{mapName}</strong>. You are receiving this because you are a
          moderator for this map.
        </Text>
        <Text className="text-[14px] text-black font-sans leading-[24px]">
          If you approve, they will be emailed a link to the map.
        </Text>
        <Section className="mt-[32px] mb-[32px] text-center">
          <Button
            className="rounded bg-brandBlue px-5 py-3 font-sans text-center font-semibold text-[12px] text-white no-underline"
            href={reviewUrl}
          >
            Review request
          </Button>
        </Section>
        <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
        <Text className="text-[#666666] text-[12px] font-sans leading-[24px]">
          Keep this email: the same link lets you revoke their access later.
        </Text>
      </Container>
    </EmailLayout>
  );
}

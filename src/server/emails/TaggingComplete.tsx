import {
  Container,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { EmailLayout } from "./Layout";

export default function TaggingComplete({
  dataSourceName,
  viewName,
}: {
  dataSourceName: string;
  viewName: string;
}) {
  const baseUrl = getAbsoluteUrl();

  return (
    <EmailLayout>
      <Preview>Tagging complete for {dataSourceName}</Preview>
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
          The tagging job for data source <strong>{dataSourceName}</strong> with
          view <strong>{viewName}</strong> has completed successfully.
        </Text>

        <Text className="text-[14px] text-black font-sans leading-[24px]">
          All records have been tagged accordingly.
        </Text>
      </Container>
    </EmailLayout>
  );
}

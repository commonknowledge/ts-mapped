import { getServerSession } from "@/auth";
import { redirectToLogin } from "@/auth/redirectToLogin";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import TrialBanner from "@/components/TrialBanner";
import TrialExpired from "./TrialExpired";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Dashboard",
};

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverSession = await getServerSession();
  if (!serverSession.currentUser) {
    await redirectToLogin();
  }

  const { trialEndsAt } = serverSession.currentUser ?? {};
  if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
    return <TrialExpired />;
  }

  return (
    <>
      <TrialBanner />
      {children}
      <SentryFeedbackWidget />
    </>
  );
}

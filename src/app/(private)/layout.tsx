import { getServerSession } from "@/auth";
import { redirectToLogin } from "@/auth/redirectToLogin";
import SentryFeedbackWidget from "@/components/SentryFeedbackWidget";
import TrialBanner from "@/components/TrialBanner";
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
  return (
    <>
      {trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} />}
      {children}
      <SentryFeedbackWidget />
    </>
  );
}

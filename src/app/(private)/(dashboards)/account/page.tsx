import PageHeader from "@/components/PageHeader";
import ChangePasswordSection from "./components/ChangePasswordSection";
import InviteMemberDialog from "./components/InviteMemberDialog";
import OrganisationSettingsForm from "./components/OrganisationSettingsForm";
import OrganisationUsersTable from "./components/OrganisationUsersTable";
import PendingInvitationsTable from "./components/PendingInvitationsTable";
import SettingsSection from "./components/SettingsSection";
import UserSettingsForm from "./components/UserSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Account",
};

export default function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your profile, your organisation and who's in it."
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SettingsSection
            title="Your profile"
            description="How you appear to others in your organisation."
          >
            <UserSettingsForm />
          </SettingsSection>
          <SettingsSection
            title="Invitations"
            description="Organisations that have invited you to join them."
          >
            <PendingInvitationsTable />
          </SettingsSection>
          <SettingsSection title="Password">
            <ChangePasswordSection />
          </SettingsSection>
        </div>

        <div className="flex flex-col gap-6">
          <SettingsSection
            title="Organisation"
            description="Settings for everyone in your organisation."
          >
            <OrganisationSettingsForm />
          </SettingsSection>
          <SettingsSection
            title="Members"
            description="Who can see and edit your organisation's maps and data."
          >
            <OrganisationUsersTable />
            <InviteMemberDialog />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

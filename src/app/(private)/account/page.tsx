import PageHeader from "@/components/PageHeader";
import ChangePasswordSection from "./components/ChangePasswordSection";
import InviteMemberDialog from "./components/InviteMemberDialog";
import OrganisationSettingsForm from "./components/OrganisationSettingsForm";
import OrganisationUsersTable from "./components/OrganisationUsersTable";
import PendingInvitationsTable from "./components/PendingInvitationsTable";
import UserSettingsForm from "./components/UserSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Account",
};

export default function Page() {
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="flex flex-col gap-12">
          <div>
            <h2 className="mb-6 / text-xl font-medium">Your profile</h2>
            <UserSettingsForm />
          </div>
          <div>
            <h2 className="mb-6 / text-xl font-medium">Invitations</h2>
            <PendingInvitationsTable />
          </div>
          <div>
            <h2 className="mb-6 / text-xl font-medium">Password</h2>
            <ChangePasswordSection />
          </div>
        </div>

        <div className="">
          <h2 className="mb-6 / text-xl font-medium">Organisation settings</h2>
          <OrganisationSettingsForm />
          <div className="mt-12">
            <h2 className="mb-6 / text-xl font-medium">Members</h2>
            <OrganisationUsersTable />
            <InviteMemberDialog />
          </div>
        </div>
      </div>
    </div>
  );
}

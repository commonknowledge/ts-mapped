import PageHeader from "@/components/PageHeader";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

export default function Page() {
  return (
    <div>
      <PageHeader title="Account" />
      <ChangePasswordForm />
    </div>
  );
}

import PageHeader from "@/components/PageHeader";
import { Separator } from "@/shadcn/ui/separator";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

export default function Page() {
  return (
    <div>
      <PageHeader title="Account" />
      <Separator className="my-4" />

      <ChangePasswordForm />
    </div>
  );
}

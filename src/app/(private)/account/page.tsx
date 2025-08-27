import PageHeader from "@/components/PageHeader";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { Separator } from "@/shadcn/ui/separator";

export default function Page() {
  return (
    <div>
      <PageHeader title="Account" />
      <Separator className="my-4" />

      <ChangePasswordForm />
    </div>
  );
}

import PageHeader from "@/components/PageHeader";
// import { ChangePasswordForm } from "./components/ChangePasswordForm";

export default function Page() {
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-2 gap-8">
        <div className="">
          <h2 className="mb-6 / text-xl font-medium">Your profile</h2>
          {/* <ChangePasswordForm /> */}
        </div>

        <div className="">
           <h2 className="mb-6 / text-xl font-medium">Organisation settings</h2>

        </div>
      </div>
    </div>
  );
}

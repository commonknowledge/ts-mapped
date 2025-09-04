"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import {
  ForgotPasswordMutation,
  ForgotPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPassword] = useMutation<
    ForgotPasswordMutation,
    ForgotPasswordMutationVariables
  >(gql`
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email) {
        code
      }
    }
  `);
  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await forgotPassword({ variables: { email } });
      if (response.data?.forgotPassword?.code !== 200) {
        throw new Error(`Response code ${response.data?.forgotPassword?.code}`);
      }
      toast.success("Email sent to reset password");
      router.push("/login");
    } catch {
      setError("Email failed to send, please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-[350px] border-none">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <FormFieldWrapper id="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormFieldWrapper>

          <Button disabled={loading} size="sm">
            Send instructions
          </Button>
          <span className="text-sm text-red-500">{error}</span>
          <Link href="/login" className="text-sm text-center">
            Login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/shadcn/ui/button";
import { Card, CardHeader, CardContent } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { gql, useMutation } from "@apollo/client";
import * as React from "react";

export function ChangePasswordForm() {
  const [password, setPassword] = React.useState("");

  const [updateUserPassword, { loading, error }] = useMutation(gql`
    mutation UpdateUserPassword($password: String!) {
      updateUserPassword(password: $password) {
        code
      }
    }
  `);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await updateUserPassword({ variables: { password } });
      setPassword("");
      alert("Password updated");
      // todo toast
    } catch (error) {
      console.error(error);
      // todo toast
    }
  };

  return (
    <form className="max-w-md" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>Change your password</CardHeader>

        <CardContent className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            name="password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          {error && <p className="text-red-500">{error.message}</p>}
        </CardContent>
      </Card>
    </form>
  );
}

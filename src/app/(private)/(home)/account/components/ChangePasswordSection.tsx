"use client";

import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import ChangePasswordForm from "./ChangePasswordForm";

export default function ChangePassword() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const closeDialog = () => setDialogOpen(false);

  return (
    <div className="flex flex-col items-start gap-8">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <Button asChild={true}>
            <span>Change password</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="!max-w-[420px] !w-[90%] gap-2">
          <DialogHeader className="mb-8">
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription className="sr-only">
              Change password form
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm closeDialog={closeDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

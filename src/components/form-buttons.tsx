"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
  label = "Obriši",
}: {
  onDelete: () => Promise<void>;
  label?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-[var(--danger)] hover:bg-red-50"
      disabled={pending}
      onClick={() => {
        if (confirm("Da li ste sigurni da želite da obrišete?")) {
          start(async () => {
            await onDelete();
          });
        }
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Čuvam...",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        const form = (e.target as HTMLButtonElement).form;
        if (!form) return;
        e.preventDefault();
        start(async () => {
          form.requestSubmit();
        });
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

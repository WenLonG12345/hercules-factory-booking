"use client";

import { useTransition } from "react";
import { toast } from "sonner";

interface ActionFormProps {
  action: (formData: FormData) => Promise<void>;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}

export function ActionForm({
  action,
  successMessage = "Saved",
  className,
  children,
  resetOnSuccess,
  onSuccess,
}: ActionFormProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
        if (resetOnSuccess) form.reset();
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className} aria-busy={pending}>
      {children}
    </form>
  );
}

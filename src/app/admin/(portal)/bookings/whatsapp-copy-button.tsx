"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WhatsappCopyButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="quiet" onClick={handleCopy}>
      {copied ? "Copied! ✓" : "Copy WhatsApp message"}
    </Button>
  );
}

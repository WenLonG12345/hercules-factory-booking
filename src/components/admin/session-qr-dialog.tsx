"use client";

import { QRCodeSVG } from "qrcode.react";
import { RiQrCodeLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SessionQrDialog({
  classSessionId,
  sessionLabel,
}: {
  classSessionId: string;
  sessionLabel: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="quiet" className="h-8 gap-1.5 text-xs">
          <RiQrCodeLine className="size-3.5" />
          Show QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle>Class QR Code</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600">{sessionLabel}</p>
        <div className="flex justify-center rounded-xl bg-white p-4 ring-1 ring-stone-100">
          <QRCodeSVG value={classSessionId} size={240} />
        </div>
        <p className="text-xs text-stone-400">
          Display this QR for members to scan on arrival.
        </p>
      </DialogContent>
    </Dialog>
  );
}

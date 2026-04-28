import { useState } from "react";

export function useModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    setOpen,
  };
}

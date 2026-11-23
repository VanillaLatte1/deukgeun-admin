"use client";

import { X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ModalSize = "md" | "lg";

type ModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  children?: ReactNode;
  size?: ModalSize;
  showDefaultActions?: boolean;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  cancelLabel = "취소",
  confirmLabel = "확인",
  onConfirm,
  children,
  size = "md",
  showDefaultActions = true,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop" />
        <div className="modal-positioner">
      <Dialog.Popup className={`modal-panel modal-panel-${size}`}>
        <div className="modal-head">
          <Dialog.Title render={<h3 />}>{title}</Dialog.Title>
          <Button
            className="modal-close"
            type="button"
            aria-label="닫기"
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
          >
            <X size={18} />
          </Button>
        </div>

        {description ? <Dialog.Description render={<p />}>{description}</Dialog.Description> : null}
        {children}

        {showDefaultActions ? (
          <div className="modal-actions">
            <Button variant="outline" type="button" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="button" onClick={onConfirm ?? onClose}>
              {confirmLabel}
            </Button>
          </div>
        ) : null}
      </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

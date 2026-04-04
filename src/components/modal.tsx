"use client";

import { X } from "lucide-react";
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
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal-panel modal-panel-${size}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <Button className="modal-close" type="button" aria-label="닫기" onClick={onClose} variant="ghost" size="icon-sm">
            <X size={18} />
          </Button>
        </div>

        {description ? <p>{description}</p> : null}
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
      </div>
    </div>
  );
}

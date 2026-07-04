"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

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
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`modal-panel modal-panel-${size}`}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <Button
            ref={closeButtonRef}
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

        {description ? <p id={descriptionId}>{description}</p> : null}
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

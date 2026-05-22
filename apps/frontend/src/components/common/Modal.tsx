import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  closeLabel?: string;
};

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  showClose = true,
  closeLabel = "Close",
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    contentRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {showClose ? (
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

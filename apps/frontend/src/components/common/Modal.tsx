import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ isOpen, onClose, children, className = "" }: ModalProps) {
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
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={contentRef}
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

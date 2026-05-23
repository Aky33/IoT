import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  title = "No data",
  description = "Nothing to show right now.",
  action,
}: EmptyStateProps) {
  return (
    <section className="panel panel-compact" aria-live="polite">
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18M8 5V3M16 5V3" />
          </svg>
        </span>
        <span className="empty-state__title">{title}</span>
        <p className="text-sm text-muted">{description}</p>
        {action}
      </div>
    </section>
  );
}

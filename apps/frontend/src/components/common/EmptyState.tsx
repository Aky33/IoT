import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  title = "No data",
  description = "Nothing to show right now.",
  action
}: EmptyStateProps) {
  return (
    <section className="panel stack" aria-live="polite">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </section>
  );
}

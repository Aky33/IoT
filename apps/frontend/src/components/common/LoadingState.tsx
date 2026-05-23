type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <section className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </section>
  );
}

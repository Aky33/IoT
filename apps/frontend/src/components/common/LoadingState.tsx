type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <section className="panel" role="status" aria-live="polite">
      {label}
    </section>
  );
}

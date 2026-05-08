type ErrorStateProps = {
  message?: string | null;
  onRetry?: () => void;
};

export function ErrorState({ message = "Unexpected error.", onRetry }: ErrorStateProps) {
  return (
    <section className="panel stack" role="alert">
      <h3>Error</h3>
      <p>{message}</p>
      {onRetry ? <button onClick={onRetry}>Retry</button> : null}
    </section>
  );
}

type ErrorStateProps = {
  message?: string | null;
  onRetry?: () => void;
};

export function ErrorState({ message = "Unexpected error.", onRetry }: ErrorStateProps) {
  return (
    <section className="banner banner-danger stack-tight" role="alert">
      <span className="banner-title">Something went wrong</span>
      <span className="banner-text">{message}</span>
      {onRetry ? (
        <div className="row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </section>
  );
}

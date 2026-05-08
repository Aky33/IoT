type DoNotDisturbWarningProps = {
  isEnabled?: boolean;
  message?: string;
};

export function DoNotDisturbWarning({
  isEnabled = false,
  message = "Do not disturb can hide urgent alerts."
}: DoNotDisturbWarningProps) {
  if (!isEnabled) {
    return null;
  }

  return (
    <section className="panel" role="alert" style={{ borderColor: "#f59e0b" }}>
      {message}
    </section>
  );
}

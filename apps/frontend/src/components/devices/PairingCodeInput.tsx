type PairingCodeInputProps = {
  value?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
};

export function PairingCodeInput({
  value = "",
  onChange,
  onSubmit,
  error,
  disabled = false,
  placeholder = "Enter pairing code",
  submitLabel = "Pair device"
}: PairingCodeInputProps) {
  return (
    <section className="panel stack">
      <div className="row">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        <button onClick={onSubmit} disabled={disabled || !value.trim()}>
          {submitLabel}
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}

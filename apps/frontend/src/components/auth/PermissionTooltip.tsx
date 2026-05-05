type PermissionTooltipProps = {
  text?: string;
  children: React.ReactNode;
  isVisible?: boolean;
};

export function PermissionTooltip({
  text = "You do not have required permissions.",
  children,
  isVisible = true
}: PermissionTooltipProps) {
  return (
    <span title={isVisible ? text : undefined} style={{ display: "inline-flex" }}>
      {children}
    </span>
  );
}

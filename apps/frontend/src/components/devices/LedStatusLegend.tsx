import type { LedStatusLegendItem } from "../../types/dashboard";
import { defaultLedLegendItems } from "../../mocks/data";
import { LedStatusPreview } from "./LedStatusPreview";

type LedStatusLegendProps = {
  items?: LedStatusLegendItem[];
  compact?: boolean;
  showTitle?: boolean;
};

export function LedStatusLegend({
  items = defaultLedLegendItems,
  compact = false,
  showTitle = true
}: LedStatusLegendProps) {
  return (
    <section className="panel stack">
      {showTitle ? <h4>LED status legend</h4> : null}
      {items.map((item) => (
        <div key={item.status} className="row" style={{ alignItems: "center" }}>
          <LedStatusPreview status={item.status} showLabel={false} size={compact ? "s" : "m"} animated={item.status === "sending"} />
          <strong>{item.label}</strong>
          <span>{item.description}</span>
        </div>
      ))}
    </section>
  );
}

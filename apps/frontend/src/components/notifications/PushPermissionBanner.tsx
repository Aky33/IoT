import type { PushPermissionState } from "../../lib/api";

type PushPermissionBannerProps = {
  permission: PushPermissionState;
  pushEnabled: boolean;
  onEnablePush?: () => void;
};

export function PushPermissionBanner({ permission, pushEnabled, onEnablePush }: PushPermissionBannerProps) {
  if (permission === "granted" || (permission === "default" && pushEnabled)) return null;

  if (permission === "default") {
    return (
      <div className="panel banner banner-info">
        <strong>Zapněte si notifikace</strong>
        <p>Bez povolených notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.</p>
        {onEnablePush ? <button type="button" onClick={onEnablePush}>Povolit notifikace</button> : null}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div role="alert" className="panel banner banner-danger">
        <strong>Notifikace jsou zablokované</strong>
        <p>Prohlížeč blokuje notifikace — můžete přijít o urgentní alerty.</p>
        <p><small>Povolte notifikace v nastavení prohlížeče (ikona zámku v adresním řádku).</small></p>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div role="alert" className="panel banner banner-warning">
        <strong>Push notifikace nejsou podporované</strong>
        <p>Tento prohlížeč nepodporuje Web Push. Notifikace budou fungovat pouze při otevřené aplikaci.</p>
      </div>
    );
  }

  return null;
}

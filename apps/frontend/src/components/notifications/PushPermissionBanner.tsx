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
      <div className="banner banner-info">
        <span className="banner-title">Zapněte si notifikace</span>
        <span className="banner-text">
          Bez povolených notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.
        </span>
        {onEnablePush ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onEnablePush}>
            Povolit notifikace
          </button>
        ) : null}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div role="alert" className="banner banner-danger">
        <span className="banner-title">Notifikace jsou zablokované</span>
        <span className="banner-text">Prohlížeč blokuje notifikace — můžete přijít o urgentní alerty.</span>
        <small>Povolte notifikace v nastavení prohlížeče (ikona zámku v adresním řádku).</small>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div role="alert" className="banner banner-warning">
        <span className="banner-title">Push notifikace nejsou podporované</span>
        <span className="banner-text">
          Tento prohlížeč nepodporuje Web Push. Notifikace budou fungovat pouze při otevřené aplikaci.
        </span>
      </div>
    );
  }

  return null;
}

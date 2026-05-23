import { useEffect, useState } from "react";
import { useTheme } from "../../lib/theme";
import type { UserRole } from "../../types/common";

type NavbarProps = {
  userRole: UserRole;
  activeRoute: string;
  onNavigate: (route: string) => void;
  sessionLabel?: string;
  onLogout?: () => void;
  notificationCount?: number;
  urgentNotificationCount?: number;
};

type NavItem = {
  key: string;
  label: string;
  count?: number;
  urgent?: boolean;
};

export function Navbar({
  userRole,
  activeRoute,
  onNavigate,
  sessionLabel,
  onLogout,
  notificationCount = 0,
  urgentNotificationCount = 0,
}: NavbarProps) {
  const { theme, toggle } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [activeRoute]);

  // close on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  const items: NavItem[] = [
    { key: "/", label: "Dashboard" },
    {
      key: "/notifications",
      label: "Notifications",
      count: notificationCount,
      urgent: urgentNotificationCount > 0,
    },
    { key: "/settings", label: "Settings" },
    ...(userRole === "admin"
      ? [
          { key: "/admin/devices", label: "Devices" } as NavItem,
          { key: "/admin/users", label: "Patients" } as NavItem,
          { key: "/admin/caregivers", label: "Caregivers" } as NavItem,
          { key: "/admin/invitations", label: "Invitations" } as NavItem,
        ]
      : []),
  ];

  function renderNavLink(item: NavItem) {
    const isActive = activeRoute === item.key;
    return (
      <button
        key={item.key}
        className={`nav-link${isActive ? " active" : ""}`}
        onClick={() => onNavigate(item.key)}
        aria-current={isActive ? "page" : undefined}
      >
        <span>{item.label}</span>
        {item.urgent ? (
          <span className="dot dot-urgent" aria-label="Urgent notifications pending" />
        ) : null}
        {typeof item.count === "number" && item.count > 0 ? (
          <span className="nav-link__count" aria-hidden="true">{item.count}</span>
        ) : null}
      </button>
    );
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <a
        className="navbar-brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("/");
        }}
      >
        <span className="navbar-brand__mark" aria-hidden="true">IC</span>
        <span className="navbar-brand__text">IoT Care</span>
      </a>

      <div className="navbar-body">
        <div className="nav-items nav-items--desktop">{items.map(renderNavLink)}</div>

        <div className="nav-session">
          {sessionLabel ? <span className="nav-session__label">{sessionLabel}</span> : null}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          {onLogout ? (
            <button type="button" className="nav-link nav-link--logout" onClick={onLogout}>
              Logout
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="nav-mobile-menu"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {isMenuOpen ? (
        <>
          <div
            className="nav-mobile-backdrop"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="nav-mobile-menu" id="nav-mobile-menu" role="menu">
            <div className="nav-mobile-menu__items">{items.map(renderNavLink)}</div>
            <div className="nav-mobile-menu__footer">
              {sessionLabel ? (
                <span className="nav-mobile-menu__session">{sessionLabel}</span>
              ) : null}
              <div className="row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    toggle();
                  }}
                >
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
                </button>
                {onLogout ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

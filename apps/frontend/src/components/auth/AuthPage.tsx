import { useState } from "react";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  invitationCode: string;
};

type AuthPageProps = {
  isSubmitting?: boolean;
  error?: string | null;
  onLogin: (payload: LoginPayload) => void | Promise<void>;
  onRegister: (payload: RegisterPayload) => void | Promise<void>;
};

export function AuthPage({
  isSubmitting = false,
  error = null,
  onLogin,
  onRegister,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState<LoginPayload>({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    invitationCode: "",
  });

  const isLogin = mode === "login";

  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-hero__content">
          <span className="auth-hero__mark" aria-hidden="true">IC</span>
          <h1>IoT Care</h1>
          <p className="auth-hero__tagline">
            Calm, dependable monitoring for assistance buttons — so caregivers can respond the moment it matters.
          </p>
          <ul className="auth-hero__features">
            <li>
              <div>
                <strong>Real-time alerts</strong>
                <span>Push notifications when a button is pressed.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Role-aware access</strong>
                <span>Admins manage devices, caregivers respond to events.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Built for shifts</strong>
                <span>Quiet design, dark mode, friendly typography.</span>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <main className="auth-form-shell">
        <div className="auth-form-card">
          <div className="stack-tight">
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p className="auth-form-card__intro">
              {isLogin
                ? "Sign in to load your devices, notifications and settings."
                : "Use an invitation code from your administrator to register."}
            </p>
          </div>

          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={`segmented-item${isLogin ? " active" : ""}`}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={`segmented-item${!isLogin ? " active" : ""}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                onLogin(loginForm);
              }}
            >
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || !loginForm.email.trim() || !loginForm.password.trim()}
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                onRegister(registerForm);
              }}
            >
              <div className="field-row">
                <label className="field">
                  <span>First name</span>
                  <input
                    autoComplete="given-name"
                    value={registerForm.firstName}
                    onChange={(event) => setRegisterForm((previous) => ({ ...previous, firstName: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    autoComplete="family-name"
                    value={registerForm.lastName}
                    onChange={(event) => setRegisterForm((previous) => ({ ...previous, lastName: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, email: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, password: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <label className="field">
                <span>Phone <span className="text-subtle">(optional)</span></span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, phone: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <label className="field">
                <span>Invitation code</span>
                <input
                  className="text-mono"
                  value={registerForm.invitationCode}
                  onChange={(event) =>
                    setRegisterForm((previous) => ({ ...previous, invitationCode: event.target.value.toUpperCase() }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={
                  isSubmitting ||
                  !registerForm.firstName.trim() ||
                  !registerForm.lastName.trim() ||
                  !registerForm.email.trim() ||
                  !registerForm.password.trim() ||
                  !registerForm.invitationCode.trim()
                }
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {error ? (
            <p role="alert" className="text-danger text-sm">{error}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

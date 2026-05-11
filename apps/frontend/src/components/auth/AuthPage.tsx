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

  return (
    <section className="page" style={{ minHeight: "100vh", placeItems: "center", alignContent: "center" }}>
      <div className="modal stack" style={{ width: "min(520px, 100%)" }}>
        <div className="stack">
          <h1>IoT Care</h1>
          <p>Authenticate against the backend to load devices, notifications, and push settings.</p>
        </div>

        <div className="row">
          <button className={mode === "login" ? "nav-btn active" : "nav-btn"} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "register" ? "nav-btn active" : "nav-btn"} onClick={() => setMode("register")}>Register</button>
        </div>

        {mode === "login" ? (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin(loginForm);
            }}
          >
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            <button type="submit" disabled={isSubmitting || !loginForm.email.trim() || !loginForm.password.trim()}>
              {isSubmitting ? "Signing in..." : "Sign in"}
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
            <div className="row">
              <label>
                First name
                <input
                  value={registerForm.firstName}
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, firstName: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
              <label>
                Last name
                <input
                  value={registerForm.lastName}
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, lastName: event.target.value }))}
                  disabled={isSubmitting}
                />
              </label>
            </div>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((previous) => ({ ...previous, email: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((previous) => ({ ...previous, password: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Phone
              <input
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((previous) => ({ ...previous, phone: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            <label>
              Invitation code
              <input
                value={registerForm.invitationCode}
                onChange={(event) => setRegisterForm((previous) => ({ ...previous, invitationCode: event.target.value.toUpperCase() }))}
                disabled={isSubmitting}
              />
            </label>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !registerForm.firstName.trim() ||
                !registerForm.lastName.trim() ||
                !registerForm.email.trim() ||
                !registerForm.password.trim() ||
                !registerForm.invitationCode.trim()
              }
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        {error ? <p role="alert" style={{ color: "var(--color-danger-border)" }}>{error}</p> : null}
      </div>
    </section>
  );
}
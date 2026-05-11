import { useEffect, useRef, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  register as apiRegister,
  type SessionUser,
} from "../lib/api";
import { getErrorMessage } from "../lib/error";

type UseAuthOptions = {
  onAuthenticated: (session: SessionUser) => Promise<void>;
  onLogout: () => void;
};

export function useAuth({ onAuthenticated, onLogout }: UseAuthOptions) {
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const didRestoreSession = useRef(false);

  useEffect(() => {
    if (didRestoreSession.current) return;
    didRestoreSession.current = true;

    (async () => {
      try {
        const session = await refreshSession();

        if (!session) {
          setAuthStatus("unauthenticated");
          return;
        }

        setCurrentUser(session);
        setAuthStatus("authenticated");
        await onAuthenticated(session);
      } catch (error) {
        setAuthError(getErrorMessage(error, "Unable to restore the current session."));
        setAuthStatus("unauthenticated");
      }
    })();
  }, []);

  async function handleLogin(payload: { email: string; password: string }) {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await apiLogin(payload.email, payload.password);
      setCurrentUser(session);
      setAuthStatus("authenticated");
      await onAuthenticated(session);
    } catch (error) {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      setAuthError(getErrorMessage(error, "Unable to sign in."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleRegister(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    invitationCode: string;
  }) {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await apiRegister(payload);
      setCurrentUser(session);
      setAuthStatus("authenticated");
      await onAuthenticated(session);
    } catch (error) {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      setAuthError(getErrorMessage(error, "Unable to create the account."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleLogout() {
    await apiLogout();
    setCurrentUser(null);
    setAuthStatus("unauthenticated");
    onLogout();
  }

  return {
    authStatus,
    currentUser,
    authError,
    isAuthenticating,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}

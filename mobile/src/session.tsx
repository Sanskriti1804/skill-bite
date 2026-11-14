import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { loadSession, saveSession, type MobileSession } from "./sessionStore";
import type { Me } from "./types";

type SessionContextValue = {
  ready: boolean;
  session: MobileSession | null;
  profile: Me | null;
  setSession: (value: MobileSession | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Mobile UX: explore + create without a role switch. Elevates USER → CREATOR on the server. */
  ensurePublisher: () => Promise<MobileSession | null>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<MobileSession | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);

  const setSession = useCallback(async (value: MobileSession | null) => {
    setSessionState(value);
    await saveSession(value);
    if (!value) setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.token) {
      setProfile(null);
      return;
    }
    const me = await api<Me>("/api/v1/me", { token: session.token });
    setProfile(me);
    if (me.role !== session.role || me.userId !== session.userId) {
      const next = { ...session, role: me.role, userId: me.userId };
      setSessionState(next);
      await saveSession(next);
    }
  }, [session]);

  const ensurePublisher = useCallback(async (): Promise<MobileSession | null> => {
    if (!session) return null;
    if (session.role === "CREATOR" || session.role === "ADMIN") return session;
    await api("/api/v1/me/role", { method: "PATCH", token: session.token, body: { role: "CREATOR" } });
    const next = { ...session, role: "CREATOR" as const };
    setSessionState(next);
    await saveSession(next);
    try {
      const me = await api<Me>("/api/v1/me", { token: next.token });
      setProfile(me);
    } catch {
      /* profile refresh is best-effort */
    }
    return next;
  }, [session]);

  const signOut = useCallback(async () => {
    try {
      if (session?.token) await api("/api/v1/auth/logout", { method: "POST", token: session.token });
    } finally {
      await setSession(null);
    }
  }, [session, setSession]);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const stored = await loadSession();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const rotated = await api<{ accessToken: string; refreshToken: string }>("/api/v1/auth/refresh", {
          method: "POST",
          body: { refreshToken: stored.refreshToken },
        });
        let me = await api<Me>("/api/v1/me", { token: rotated.accessToken });
        if (me.role === "USER") {
          await api("/api/v1/me/role", { method: "PATCH", token: rotated.accessToken, body: { role: "CREATOR" } });
          me = await api<Me>("/api/v1/me", { token: rotated.accessToken });
        }
        if (cancelled) return;
        const next = {
          token: rotated.accessToken,
          refreshToken: rotated.refreshToken,
          role: me.role,
          userId: me.userId,
        };
        setSessionState(next);
        setProfile(me);
        await saveSession(next);
      } catch {
        if (!cancelled) {
          setSessionState(null);
          setProfile(null);
          await saveSession(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ ready, session, profile, setSession, refreshProfile, ensurePublisher, signOut }),
    [ready, session, profile, setSession, refreshProfile, ensurePublisher, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider is required");
  return value;
}

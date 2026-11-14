"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "../lib/services/auth";

const STORAGE_KEY = "skillbite.session";

type StoredSession = {
  token: string;
  refreshToken: string;
  role: string;
  userId?: string;
};

type SessionValue = {
  token: string;
  refreshToken: string;
  role: string;
  userId: string;
  ready: boolean;
  setSession: (value: { token: string; refreshToken: string; role: string; userId?: string }) => void;
  clear: () => void;
};

const SessionContext = createContext<SessionValue>({
  token: "",
  refreshToken: "",
  role: "",
  userId: "",
  ready: false,
  setSession: () => undefined,
  clear: () => undefined,
});

function readStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: StoredSession | null): void {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [refreshToken, setRefresh] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [ready, setReady] = useState(false);

  const setSession = useCallback((value: { token: string; refreshToken: string; role: string; userId?: string }) => {
    setToken(value.token);
    setRefresh(value.refreshToken);
    setRole(value.role);
    setUserId(value.userId ?? "");
    writeStored({
      token: value.token,
      refreshToken: value.refreshToken,
      role: value.role,
      userId: value.userId,
    });
  }, []);

  const clear = useCallback(() => {
    setToken("");
    setRefresh("");
    setRole("");
    setUserId("");
    writeStored(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const stored = readStored();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const rotated = await auth.refresh(stored.refreshToken);
        const me = await auth.me(rotated.accessToken);
        if (cancelled) return;
        setSession({
          token: rotated.accessToken,
          refreshToken: rotated.refreshToken,
          role: me.role,
          userId: me.userId,
        });
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [clear, setSession]);

  const value = useMemo(
    () => ({ token, refreshToken, role, userId, ready, setSession, clear }),
    [token, refreshToken, role, userId, ready, setSession, clear],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

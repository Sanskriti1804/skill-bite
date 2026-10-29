"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SessionValue = {
  token: string;
  refreshToken: string;
  role: string;
  setSession: (value: { token: string; refreshToken: string; role: string }) => void;
  clear: () => void;
};

const SessionContext = createContext<SessionValue>({
  token: "",
  refreshToken: "",
  role: "",
  setSession: () => undefined,
  clear: () => undefined,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [refreshToken, setRefresh] = useState("");
  const [role, setRole] = useState("");
  return (
    <SessionContext.Provider value={{
      token,
      refreshToken,
      role,
      setSession: (value) => {
        setToken(value.token);
        setRefresh(value.refreshToken);
        setRole(value.role);
      },
      clear: () => {
        setToken("");
        setRefresh("");
        setRole("");
      },
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

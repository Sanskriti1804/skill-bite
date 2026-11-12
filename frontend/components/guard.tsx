"use client";

import type { ReactNode } from "react";
import { ErrorState } from "./ui";
import { useSession } from "./session";

export function Guard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const session = useSession();
  if (!session.token) return <ErrorState>Sign in is required.</ErrorState>;
  if (!roles.includes(session.role)) return <ErrorState>The active role cannot do that.</ErrorState>;
  return children;
}

"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "./session";
import { Nav } from "./nav";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Nav />
      <main>{children}</main>
    </SessionProvider>
  );
}

"use client";

import type { ReactNode } from "react";
import { Guard } from "../../components/guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Guard roles={["ADMIN"]}>{children}</Guard>;
}

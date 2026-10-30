"use client";

import Link from "next/link";
import { useSession } from "../../components/session";
import { ErrorState } from "../../components/ui";

const links = [
  ["/admin/users", "Users"],
  ["/admin/content", "Content"],
  ["/admin/taxonomy", "Categories and tags"],
  ["/admin/settings", "Settings"],
  ["/admin/analytics", "Analytics"],
  ["/admin/audit", "Audit"],
];

export default function AdminPage() {
  const session = useSession();
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  return (
    <div className="stack">
      <h1>Admin</h1>
      {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
    </div>
  );
}

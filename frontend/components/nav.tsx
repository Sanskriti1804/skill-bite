"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "./session";

const userLinks = [
  ["/", "Browse"],
  ["/bookmarks", "Bookmarks"],
  ["/history", "History"],
  ["/notifications", "Notifications"],
  ["/account", "Account"],
];
const creatorLinks = [
  ["/creator", "Content"],
  ["/account", "Account"],
];
const adminLinks = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/content", "Content"],
  ["/admin/taxonomy", "Categories and tags"],
  ["/admin/settings", "Settings"],
  ["/admin/analytics", "Analytics"],
  ["/admin/audit", "Audit"],
];

export function Nav() {
  const session = useSession();
  const path = usePathname();
  const links = session.role === "ADMIN" ? adminLinks : session.role === "CREATOR" ? creatorLinks : userLinks;
  return (
    <nav>
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
      ))}
      {session.token ? null : <Link href="/login">Sign in</Link>}
    </nav>
  );
}

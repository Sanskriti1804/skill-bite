"use client";

import Link from "next/link";
import { useSession } from "./session";

export function Nav() {
  const session = useSession();
  return (
    <nav>
      <Link href="/">Browse</Link>
      <Link href="/bookmarks">Bookmarks</Link>
      <Link href="/history">History</Link>
      <Link href="/creator">Creator</Link>
      <Link href="/account">Account</Link>
      {session.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
      {session.token ? null : <Link href="/login">Sign in</Link>}
    </nav>
  );
}

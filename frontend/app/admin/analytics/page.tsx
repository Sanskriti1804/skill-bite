"use client";

import { ErrorState } from "../../../components/ui";
import { useSession } from "../../../components/session";

export default function AnalyticsPage() {
  const session = useSession();
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  return (
    <div className="stack">
      <h1>Analytics</h1>
      <p>Metrics are not defined yet. This page does not show placeholder numbers.</p>
    </div>
  );
}

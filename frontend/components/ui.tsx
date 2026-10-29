import type { ReactNode } from "react";
import { viewState } from "../lib/state";

export { viewState };

export function Button({ children, primary, type = "button", onClick }: { children: ReactNode; primary?: boolean; type?: "button" | "submit"; onClick?: () => void }) {
  return <button className={primary ? "primary" : ""} type={type} onClick={onClick}>{children}</button>;
}

export function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="stack">{label}<input value={value} type={type} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="muted">{status}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="banner">{children}</p>;
}

export function LoadingState() {
  return <p className="banner">Loading</p>;
}

export function ErrorState({ children }: { children: ReactNode }) {
  return <p className="banner error">{children}</p>;
}


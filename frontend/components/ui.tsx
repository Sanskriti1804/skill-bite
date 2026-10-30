import { useState, type ReactNode } from "react";
import { viewState } from "../lib/state";

export { viewState };

export function Button({ children, primary, danger, type = "button", disabled, onClick }: { children: ReactNode; primary?: boolean; danger?: boolean; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void }) {
  const className = primary ? "primary" : danger ? "danger" : "";
  return <button className={className} type={type} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function Field({ label, value, onChange, type = "text", hint, error }: { label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; error?: string }) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" && show ? "text" : type;
  return (
    <label className="stack">
      {label}
      <span className="row">
        <input aria-invalid={error ? true : undefined} value={value} type={inputType} onChange={(event) => onChange(event.target.value)} />
        {type === "password" ? <button type="button" onClick={() => setShow((current) => !current)}>{show ? "Hide" : "Show"}</button> : null}
      </span>
      {hint ? <span className="muted">{hint}</span> : null}
      {error ? <span className="error">{error}</span> : null}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="badge">{status}</span>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="dialog stack" role="dialog" aria-modal="true" aria-label={title}>
      <h2>{title}</h2>
      {children}
      <Button onClick={onClose}>Close</Button>
    </div>
  );
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


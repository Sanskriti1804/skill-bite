import type { ProgressItem } from "../types";

/** Local calendar day key YYYY-MM-DD from an ISO timestamp. */
export function dayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** Active learning days from video progress (watch / complete), not app opens. */
export function activeDayKeys(progress: ProgressItem[]): Set<string> {
  const days = new Set<string>();
  for (const item of progress) {
    if (item.completedAt) days.add(dayKey(item.completedAt));
    if (item.lastWatchedAt) days.add(dayKey(item.lastWatchedAt));
  }
  return days;
}

export function currentStreak(active: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = dayKey(cursor);
    if (!active.has(key)) {
      if (streak === 0 && key === todayKey()) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(d);
  }
  return days;
}

export function monthGrid(year: number, monthIndex: number): Array<Date | null> {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day, 12));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

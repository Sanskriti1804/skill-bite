import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  activeDayKeys,
  currentStreak,
  dayKey,
  lastNDays,
  monthGrid,
  todayKey,
} from "../learning/streak";
import { colors, font, radii, space } from "../theme";
import type { ProgressItem } from "../types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  progress: ProgressItem[];
};

export function StreakTracker({ progress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const active = useMemo(() => activeDayKeys(progress), [progress]);
  const streak = useMemo(() => currentStreak(active), [active]);
  const week = useMemo(() => lastNDays(7), []);
  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month),
    [cursor.month, cursor.year],
  );
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded((value) => !value)}>
        <View>
          <Text style={styles.title}>Learning streak</Text>
          <Text style={styles.meta}>
            {streak > 0 ? `${streak}-day streak` : "Start learning to build a streak"}
          </Text>
        </View>
        <Text style={styles.toggle}>{expanded ? "Collapse" : "Month"}</Text>
      </Pressable>

      {!expanded ? (
        <View style={styles.weekRow}>
          {week.map((day) => {
            const key = dayKey(day);
            const done = active.has(key);
            const isToday = key === todayKey();
            return (
              <View key={key} style={styles.dayCol}>
                <Text style={styles.dayLabel}>
                  {day.toLocaleDateString(undefined, { weekday: "narrow" })}
                </Text>
                <View
                  style={[
                    styles.dot,
                    done ? styles.dotOn : styles.dotOff,
                    isToday ? styles.dotToday : null,
                  ]}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.monthWrap}>
          <View style={styles.monthNav}>
            <Pressable
              hitSlop={8}
              onPress={() =>
                setCursor((current) => {
                  const d = new Date(current.year, current.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
            >
              <Text style={styles.navBtn}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              hitSlop={8}
              onPress={() =>
                setCursor((current) => {
                  const d = new Date(current.year, current.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
            >
              <Text style={styles.navBtn}>›</Text>
            </Pressable>
          </View>
          <View style={styles.weekHead}>
            {WEEKDAYS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekHeadText}>{label}</Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {cells.map((day, index) => {
              if (!day) return <View key={`pad-${index}`} style={styles.monthCell} />;
              const key = dayKey(day);
              const done = active.has(key);
              const isToday = key === todayKey();
              return (
                <View key={key} style={styles.monthCell}>
                  <View
                    style={[
                      styles.monthDay,
                      done ? styles.dotOn : styles.dotOff,
                      isToday ? styles.dotToday : null,
                    ]}
                  >
                    <Text style={[styles.monthDayText, done ? styles.monthDayOn : null]}>
                      {day.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.md,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 16 },
  meta: { color: colors.inkMuted, fontFamily: font.medium, fontWeight: "600", fontSize: 12, marginTop: 2 },
  toggle: { color: colors.accent, fontFamily: font.heavy, fontWeight: "800", fontSize: 13 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: space.sm, flex: 1 },
  dayLabel: { color: colors.inkMuted, fontSize: 11, fontFamily: font.bold, fontWeight: "700" },
  dot: { width: 28, height: 28, borderRadius: 14 },
  dotOn: { backgroundColor: colors.accent },
  dotOff: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.line },
  dotToday: { borderWidth: 2, borderColor: colors.ink },
  monthWrap: { gap: space.sm },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { color: colors.ink, fontSize: 24, paddingHorizontal: space.sm, fontFamily: font.bold },
  monthLabel: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 14 },
  weekHead: { flexDirection: "row" },
  weekHeadText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: colors.inkMuted,
    fontSize: 11,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  monthGrid: { flexDirection: "row", flexWrap: "wrap" },
  monthCell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: space.xs },
  monthDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayText: { color: colors.inkMuted, fontSize: 12, fontFamily: font.medium, fontWeight: "600" },
  monthDayOn: { color: colors.accentInk },
});

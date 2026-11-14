import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors } from "./theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export const icons = {
  home: "home-outline",
  homeActive: "home",
  learn: "school-outline",
  learnActive: "school",
  bookmark: "bookmark-outline",
  bookmarkActive: "bookmark",
  history: "time-outline",
  historyActive: "time",
  alerts: "notifications-outline",
  alertsActive: "notifications",
  account: "person-outline",
  accountActive: "person",
  search: "search-outline",
  share: "share-social-outline",
  play: "play",
  pause: "pause",
  back: "chevron-back",
  close: "close",
  course: "library-outline",
  video: "videocam-outline",
  continue: "play-forward-outline",
  logout: "log-out-outline",
  switchRole: "swap-horizontal-outline",
  attachment: "attach-outline",
  warning: "warning-outline",
  check: "checkmark-circle-outline",
  mail: "mail-outline",
  lock: "lock-closed-outline",
  eye: "eye-outline",
  eyeOff: "eye-off-outline",
  empty: "file-tray-outline",
  retry: "refresh-outline",
  studio: "color-wand-outline",
  studioActive: "color-wand",
  add: "add-circle-outline",
  addActive: "add-circle",
  create: "add-circle-outline",
  createActive: "add-circle",
  explore: "compass-outline",
  exploreActive: "compass",
} as const satisfies Record<string, IconName>;

export type AppIcon = keyof typeof icons;

type IconProps = {
  name: AppIcon;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = colors.ink }: IconProps) {
  return <Ionicons name={icons[name]} size={size} color={color} />;
}

export function tabIcon(
  route: "Home" | "Explore" | "Create" | "Profile",
  focused: boolean,
): IconName {
  switch (route) {
    case "Home":
      return focused ? icons.homeActive : icons.home;
    case "Explore":
      return focused ? icons.exploreActive : icons.explore;
    case "Create":
      return focused ? icons.createActive : icons.create;
    case "Profile":
      return focused ? icons.accountActive : icons.account;
  }
}

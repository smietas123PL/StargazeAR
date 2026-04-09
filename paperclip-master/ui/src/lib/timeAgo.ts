import { getCurrentLanguage } from "./i18n";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((now - then) / 1000);
  const language = getCurrentLanguage();

  if (seconds < MINUTE) return language === "pl" ? "przed chwilą" : "just now";
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return language === "pl" ? `${m} min temu` : `${m}m ago`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return language === "pl" ? `${h} godz. temu` : `${h}h ago`;
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return language === "pl" ? `${d} dni temu` : `${d}d ago`;
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    return language === "pl" ? `${w} tyg. temu` : `${w}w ago`;
  }
  const mo = Math.floor(seconds / MONTH);
  return language === "pl" ? `${mo} mies. temu` : `${mo}mo ago`;
}

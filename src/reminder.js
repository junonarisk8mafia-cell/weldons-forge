// ============================================================
// WELDON'S FORGE — 毎日の学習リマインダー(ローカル通知・Androidアプリのみ)
// 選んだ時刻に今後DAYS日分の通知を予約する。今日すでに学習していれば今日の分は出さない。
// アプリ起動時と、その日最初に問題を解いたとき("wf-studied")に予約し直す。
// ============================================================
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getStreak, getDueIds, loadExam, daysUntil } from "./stats";

const KEY = "weldon_reminder_v1";
const DAYS = 14;
const BASE_ID = 1001;

export const isNative = () => Capacitor.isNativePlatform();

export function loadReminder() {
  try { return { on: false, hour: 20, minute: 0, ...JSON.parse(localStorage.getItem(KEY)) }; }
  catch (e) { return { on: false, hour: 20, minute: 0 }; }
}
function saveReminder(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {} }

async function cancelAll() {
  const notifications = Array.from({ length: DAYS + 1 }, (_, i) => ({ id: BASE_ID + i }));
  try { await LocalNotifications.cancel({ notifications }); } catch (e) {}
}

// 通知本文:試験日が設定されていれば残り日数、なければ復習問題数
function bodyFor(dayOffset) {
  const exam = loadExam();
  if (exam) {
    const left = daysUntil(exam.date) - dayOffset;
    if (left >= 0) return `${exam.name}まであと${left}日。今日も1セット解いておこう。`;
  }
  const due = getDueIds().length;
  return due > 0 && dayOffset === 0
    ? `今日の復習が${due}問あります。3分で終わります。`
    : "今日の1セットで、合格に一歩近づこう。";
}

export async function refreshReminders() {
  if (!isNative()) return;
  const r = loadReminder();
  await cancelAll();
  if (!r.on) return;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return;

  const { studiedToday } = getStreak();
  const now = new Date();
  const notifications = [];
  for (let i = 0; i <= DAYS; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, r.hour, r.minute);
    if (i === 0 && (studiedToday || at <= now)) continue;
    notifications.push({ id: BASE_ID + i, title: "🔥 WELDON'S FORGE", body: bodyFor(i), schedule: { at, allowWhileIdle: true } });
  }
  await LocalNotifications.schedule({ notifications });
}

// "on" | "denied" | "unsupported" を返す
export async function enableReminder(hour, minute) {
  if (!isNative()) return "unsupported";
  let { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") ({ display } = await LocalNotifications.requestPermissions());
  if (display !== "granted") return "denied";
  saveReminder({ on: true, hour, minute });
  await refreshReminders();
  return "on";
}

export async function disableReminder() {
  saveReminder({ ...loadReminder(), on: false });
  if (isNative()) await cancelAll();
}

export function initReminders() {
  if (!isNative()) return;
  refreshReminders();
  window.addEventListener("wf-studied", () => { refreshReminders(); });
}

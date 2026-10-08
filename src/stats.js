// ============================================================
// WELDON'S FORGE — 学習記録・弱点分析(localStorage永続化)
// カテゴリ別の正答率を蓄積し、間違えた問題を復習対象として保持する。
// App.jsx の doAnswer から recordAnswer() を呼ぶだけで記録される。
// ============================================================

const KEY = "weldon_stats_v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { cats: {}, wrong: {} };
    const d = JSON.parse(raw);
    return { cats: d.cats || {}, wrong: d.wrong || {} };
  } catch (e) {
    return { cats: {}, wrong: {} };
  }
}

function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}

// 1問回答するたびに呼ぶ。entry = { id, cat, ok }
export function recordAnswer({ id, cat, ok }) {
  if (cat == null) return;
  const d = load();
  const c = d.cats[cat] || { t: 0, c: 0 };
  c.t += 1;
  if (ok) {
    c.c += 1;
    if (id != null && d.wrong[id]) delete d.wrong[id]; // 克服したら復習対象から外す
  } else if (id != null) {
    const w = d.wrong[id] || { cat, n: 0, ts: 0 };
    w.cat = cat; w.n += 1; w.ts = Date.now();
    d.wrong[id] = w;
  }
  d.cats[cat] = c;
  save(d);
  scheduleReview(id, ok);
  markStudiedToday();
}

// カテゴリ別統計。正答率の低い順(弱点順)→回答数の多い順にソート。
export function getCatStats() {
  const d = load();
  const arr = Object.keys(d.cats).map(cat => {
    const { t, c } = d.cats[cat];
    return { cat, total: t, correct: c, acc: t > 0 ? c / t : 0 };
  });
  arr.sort((a, b) => (a.acc - b.acc) || (b.total - a.total));
  return arr;
}

// 全体サマリー
export function getSummary() {
  const d = load();
  let t = 0, c = 0;
  Object.values(d.cats).forEach(v => { t += v.t; c += v.c; });
  return { total: t, correct: c, acc: t > 0 ? c / t : 0, wrongCount: Object.keys(d.wrong).length };
}

// 復習すべき問題ID一覧(間違えた回数が多い順→最近間違えた順)
export function getWrongIds() {
  const d = load();
  return Object.keys(d.wrong).map(id => ({ id: Number(id), ...d.wrong[id] }))
    .sort((a, b) => (b.n - a.n) || (b.ts - a.ts))
    .map(x => x.id);
}

// 記録をリセット
export function clearStats() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(RKEY); } catch (e) {}
}

// ── 間隔反復(今日の復習) ─────────────────────────────────
// 間違えた問題は翌日に出題。期日に正解するたびに 1→3→7→14→30日後 と間隔が延び、最後まで正解で卒業。
const RKEY = "weldon_srs_v1";
const INTERVALS = [1, 3, 7, 14, 30];

// 端末のローカル日付(YYYY-MM-DD)。toISOString()はUTCなので日本では9時に日付が変わってしまう。
const localDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDay(new Date());
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return localDay(d); };

function loadSrs() {
  try {
    const raw = localStorage.getItem(RKEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // 初回: この機能より前に間違えた問題は今日から復習対象にする
  const srs = {};
  Object.keys(load().wrong).forEach(id => { srs[id] = { box: 0, due: today() }; });
  return srs;
}
function saveSrs(srs) { try { localStorage.setItem(RKEY, JSON.stringify(srs)); } catch (e) {} }

function scheduleReview(id, ok) {
  if (id == null) return;
  const srs = loadSrs();
  const t = today();
  if (!ok) srs[id] = { box: 0, due: addDays(INTERVALS[0]) };
  else if (srs[id] && srs[id].due <= t) {
    const box = srs[id].box + 1;
    if (box >= INTERVALS.length) delete srs[id];
    else srs[id] = { box, due: addDays(INTERVALS[box]) };
  }
  saveSrs(srs);
}

// 今日復習すべき問題ID(期日が古い順)
export function getDueIds() {
  const srs = loadSrs();
  const t = today();
  return Object.keys(srs)
    .filter(id => srs[id].due <= t)
    .sort((a, b) => srs[a].due.localeCompare(srs[b].due))
    .map(Number);
}

// ── 連続学習日数 ─────────────────────────────────────────
const SKEY = "weldon_streak_v1";
function loadStreak() {
  try { return JSON.parse(localStorage.getItem(SKEY)) || { last: null, streak: 0, best: 0 }; }
  catch (e) { return { last: null, streak: 0, best: 0 }; }
}
// 1問でも解いたら呼ぶ(1日1回だけ数える)
export function markStudiedToday() {
  const s = loadStreak();
  const t = today();
  if (s.last === t) return s.streak;
  const y = addDays(-1);
  s.streak = s.last === y ? s.streak + 1 : 1;
  s.last = t;
  s.best = Math.max(s.best || 0, s.streak);
  try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
  window.dispatchEvent(new Event("wf-studied"));
  return s.streak;
}
// { streak, best, studiedToday } — 1日空くと途切れる
export function getStreak() {
  const s = loadStreak();
  const t = today();
  const alive = s.last === t || s.last === addDays(-1);
  return { streak: alive ? s.streak : 0, best: s.best || 0, studiedToday: s.last === t };
}

// ── 試験日カウントダウン ─────────────────────────────────
const EKEY = "weldon_exam_v1";
export function loadExam() {
  try { return JSON.parse(localStorage.getItem(EKEY)) || null; } catch (e) { return null; }
}
export function saveExam(exam) {
  try { exam ? localStorage.setItem(EKEY, JSON.stringify(exam)) : localStorage.removeItem(EKEY); } catch (e) {}
}
// 試験日までの残り日数(当日=0、過ぎたら負)
export function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - t0) / 86400000);
}

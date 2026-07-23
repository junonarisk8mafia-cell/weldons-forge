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
  try { localStorage.removeItem(KEY); } catch (e) {}
}

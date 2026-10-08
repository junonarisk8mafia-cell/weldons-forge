// ============================================================
// WELDON'S FORGE — 出題シャッフル
// 問題順と選択肢順を毎回ランダム化する(正解位置を覚えて解けないように)。
// ============================================================

// Fisher–Yates(sort(()=>Math.random()-0.5) は偏るので使わない)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 選択肢を並べ替えたコピーを返す。正解index(a)も追従させる。
export function shuffleOpts(q) {
  const order = shuffle(q.opts.map((_, i) => i));
  return { ...q, opts: order.map(i => q.opts[i]), a: order.indexOf(q.a) };
}

// n問を抽選し、選択肢もシャッフルして返す
export function drawQuestions(pool, n) {
  return shuffle(pool).slice(0, n).map(shuffleOpts);
}

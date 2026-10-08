// ============================================================
// WELDON'S FORGE — 今日の復習(間隔反復)
// 期日が来た問題(stats.js の getDueIds)を出題する。
// 回答は recordAnswer に記録され、1→3→7→14→30日後 と次の出題日が延びる。
// ============================================================
import { useEffect, useState } from "react";
import { QUIZ_STAGES } from "./questions";
import { recordAnswer, getDueIds } from "./stats";
import { shuffleOpts } from "./shuffle";
import { SFX } from "./sound";

const MAX = 20;
const F = "'Courier New',monospace";
const LETTERS = ["A", "B", "C", "D"];

const BY_ID = {};
QUIZ_STAGES.forEach(s => s.questions.forEach(q => { BY_ID[q.id] = q; }));

export function ReviewDrill({ onExit }) {
  const [qs] = useState(() =>
    getDueIds().map(id => BY_ID[id]).filter(Boolean).slice(0, MAX).map(shuffleOpts));
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [cur, finished]);

  const wrap = { minHeight: "100vh", background: "#F8FAFC", fontFamily: F, padding: "16px 14px 40px", maxWidth: 400, margin: "0 auto", boxSizing: "border-box" };
  const card = { background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" };
  const btn = primary => ({
    width: "100%", padding: "13px", borderRadius: 10, cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 13,
    border: primary ? "none" : "1px solid #CBD5E1", background: primary ? "#E85D04" : "white", color: primary ? "white" : "#475569",
  });

  if (!qs.length || finished) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center", marginTop: 40 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>{qs.length ? "🔥" : "✅"}</div>
          {qs.length > 0 && <div style={{ color: "#E85D04", fontWeight: 900, fontSize: 16, marginBottom: 8 }}>今日の復習 完了！</div>}
          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.8 }}>
            {qs.length
              ? <>正解 {score} / {qs.length} 問。<br />間違えた問題は明日、正解した問題は 3→7→14→30日後 にまた出題されます。</>
              : <>今日復習する問題はありません。<br />クイズや模試で間違えた問題が、翌日ここに出てきます。</>}
          </div>
        </div>
        <button onClick={onExit} style={{ ...btn(false), marginTop: 14 }}>← 戻る</button>
      </div>
    );
  }

  const q = qs[cur];
  const done = sel !== null;
  const ok = sel === q.a;

  function pick(i) {
    if (done) return;
    setSel(i);
    const right = i === q.a;
    recordAnswer({ id: q.id, cat: q.cat, ok: right });
    if (right) { setScore(s => s + 1); SFX.correct(); } else SFX.wrong();
  }
  function next() {
    if (cur + 1 >= qs.length) setFinished(true);
    else { setCur(c => c + 1); setSel(null); }
  }
  function optStyle(i) {
    let border = "#E2E8F0", bg = "white", color = "#1E293B";
    if (done && i === q.a) { border = "#16A34A"; bg = "#F0FDF4"; color = "#166534"; }
    else if (done && i === sel) { border = "#DC2626"; bg = "#FEF2F2"; color = "#991B1B"; }
    return {
      display: "flex", gap: 8, width: "100%", textAlign: "left", padding: "12px 13px", borderRadius: 10, marginBottom: 8,
      border: `2px solid ${border}`, background: bg, color, fontSize: 13, fontFamily: F, lineHeight: 1.6,
      cursor: done ? "default" : "pointer", boxSizing: "border-box",
    };
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onExit} style={{ background: "none", border: "none", color: "#64748B", fontFamily: F, fontSize: 12, cursor: "pointer", padding: 0 }}>← 戻る</button>
        <span style={{ color: "#E85D04", fontWeight: 900, fontSize: 13 }}>📅 今日の復習</span>
        <span style={{ color: "#64748B", fontSize: 12 }}>{cur + 1}/{qs.length}</span>
      </div>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#E85D04", fontWeight: 700, marginBottom: 6 }}>【{q.cat}】</div>
        <div style={{ fontSize: 14, color: "#1E293B", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{q.q}</div>
      </div>

      {q.opts.map((o, i) => (
        <button key={i} onClick={() => pick(i)} style={optStyle(i)}>
          <span style={{ fontWeight: 900, color: "#E85D04", flexShrink: 0 }}>{LETTERS[i]}.</span>
          <span>{o}</span>
        </button>
      ))}

      {done && (
        <div style={{ ...card, marginTop: 4, borderColor: ok ? "#16A34A" : "#DC2626" }}>
          <div style={{ color: ok ? "#16A34A" : "#DC2626", fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
            {ok ? "✓ 正解" : `✗ 不正解 — 正解は ${LETTERS[q.a]}`}
          </div>
          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>{q.exp}</div>
          <button onClick={next} style={btn(true)}>{cur + 1 >= qs.length ? "終了" : "次へ →"}</button>
        </div>
      )}
    </div>
  );
}

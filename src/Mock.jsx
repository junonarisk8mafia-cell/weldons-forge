// ============================================================
// WELDON'S FORGE — 模擬試験モード
// 本番形式(制限時間・解説非表示)→ 採点・合否判定・分野別内訳・誤答レビュー
// 回答は stats.js にも記録され、弱点分析に反映される。
// ============================================================
import { useState, useEffect, useRef } from "react";
import { QUIZ_STAGES } from "./questions";
import { recordAnswer } from "./stats";

const F = "'Courier New',monospace";
const PASS = 0.6; // 合格ライン60%

// 全問題をフラット化
const ALL_Q = [];
QUIZ_STAGES.forEach(s => s.questions.forEach(q => ALL_Q.push(q)));

function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }
function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

export function MockScreen() {
  const [phase, setPhase] = useState("setup"); // setup | exam | result
  const [qs, setQs] = useState([]);
  const [ans, setAns] = useState([]);   // 各問の選択index(null=未回答)
  const [cur, setCur] = useState(0);
  const [left, setLeft] = useState(0);  // 残り秒
  const [limit, setLimit] = useState(0);
  const timer = useRef(null);
  const qsRef = useRef([]);   // タイマー割り込み時に最新値を参照するためのref
  const ansRef = useRef([]);
  useEffect(() => { qsRef.current = qs; }, [qs]);
  useEffect(() => { ansRef.current = ans; }, [ans]);

  useEffect(() => () => clearInterval(timer.current), []);

  function start(n, minutes) {
    const pool = shuffle(ALL_Q).slice(0, Math.min(n, ALL_Q.length));
    setQs(pool);
    setAns(new Array(pool.length).fill(null));
    setCur(0);
    setLimit(minutes * 60);
    setLeft(minutes * 60);
    setPhase("exam");
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft(t => {
        if (t <= 1) { clearInterval(timer.current); finish(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function pick(i) {
    setAns(a => { const c = [...a]; c[cur] = i; return c; });
  }

  function finish() {
    clearInterval(timer.current);
    // 採点 & 弱点記録(タイマー割り込み経由でも最新値を使う)
    const cqs = qsRef.current, cans = ansRef.current;
    cqs.forEach((q, i) => {
      const ok = cans[i] === q.a;
      recordAnswer({ id: q.id, cat: q.cat, ok });
    });
    setPhase("result");
  }

  // 進捗確認して採点(未回答があれば確認)
  function submit() {
    const unanswered = ans.filter(a => a === null).length;
    if (unanswered > 0 && !window.confirm(`未回答が${unanswered}問あります。採点しますか？`)) return;
    finish();
  }

  // ── 設定画面 ──
  if (phase === "setup") {
    return (
      <div style={{ width: "100%", maxWidth: 400, padding: "14px 12px 90px", fontFamily: F }}>
        <div style={{ color: "#1E293B", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📝 模擬試験</div>
        <div style={{ color: "#94A3B8", fontSize: 10, lineHeight: 1.7, marginBottom: 16 }}>
          本番形式(制限時間つき・解説は採点後)。全分野からランダム出題。合格ライン{Math.round(PASS * 100)}%。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <MockBtn label="20問 ／ 15分" sub="スピード確認" onClick={() => start(20, 15)} />
          <MockBtn label="40問 ／ 30分" sub="本番想定ボリューム" onClick={() => start(40, 30)} />
        </div>
        <div style={{ marginTop: 16, background: "#F1F5F9", borderRadius: 8, padding: "10px 12px", fontSize: 9, color: "#64748B", lineHeight: 1.7 }}>
          ・回答中は解説が出ません<br />
          ・前後の問題に戻って見直し・修正できます<br />
          ・時間切れで自動採点されます<br />
          ・回答結果は「📊 弱点」分析にも反映されます
        </div>
      </div>
    );
  }

  // ── 試験画面 ──
  if (phase === "exam") {
    const q = qs[cur];
    const answered = ans.filter(a => a !== null).length;
    const low = left <= 60;
    return (
      <div style={{ width: "100%", maxWidth: 400, padding: "10px 12px 90px", fontFamily: F }}>
        {/* ヘッダー: 進捗 + タイマー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B" }}>問 {cur + 1} / {qs.length}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: low ? "#DC2626" : "#0891B2", fontFamily: F }}>
            ⏱ {fmt(left)}
          </span>
        </div>
        {/* 進捗バー */}
        <div style={{ background: "#E2E8F0", height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ width: (answered / qs.length * 100) + "%", height: "100%", background: "#E85D04", transition: "width .3s" }} />
        </div>

        {/* 問題 */}
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, marginBottom: 6 }}>[{q.cat}]</div>
          <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.65 }}>{q.q}</div>
        </div>

        {/* 選択肢(正誤は出さない) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {q.opts.map((o, i) => {
            const on = ans[cur] === i;
            return (
              <button key={i} onClick={() => pick(i)} style={{
                textAlign: "left", padding: "11px 12px", borderRadius: 8,
                border: "2px solid " + (on ? "#E85D04" : "#E2E8F0"),
                background: on ? "#FFF7ED" : "white",
                color: "#1E293B", fontSize: 12, fontFamily: F, cursor: "pointer", lineHeight: 1.5,
              }}>
                <span style={{ color: on ? "#E85D04" : "#94A3B8", fontWeight: 700, marginRight: 8 }}>
                  {["A", "B", "C", "D"][i]}
                </span>{o}
              </button>
            );
          })}
        </div>

        {/* ナビ */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => setCur(c => Math.max(0, c - 1))} disabled={cur === 0} style={navBtn(cur === 0)}>← 前へ</button>
          {cur < qs.length - 1
            ? <button onClick={() => setCur(c => c + 1)} style={navBtn(false, true)}>次へ →</button>
            : <button onClick={submit} style={{ ...navBtn(false), background: "#16A34A", color: "white", border: "none" }}>採点する</button>}
        </div>
        {cur === qs.length - 1 ? null : (
          <button onClick={submit} style={{ width: "100%", marginTop: 8, padding: "9px", borderRadius: 8, border: "1px dashed #CBD5E1", background: "white", color: "#94A3B8", fontSize: 10, cursor: "pointer", fontFamily: F }}>
            ここで採点する（{answered}/{qs.length}回答済み）
          </button>
        )}
      </div>
    );
  }

  // ── 結果画面 ──
  const correct = qs.reduce((n, q, i) => n + (ans[i] === q.a ? 1 : 0), 0);
  const acc = qs.length ? correct / qs.length : 0;
  const passed = acc >= PASS;
  const used = limit - left;
  // 分野別内訳
  const catMap = {};
  qs.forEach((q, i) => {
    const m = catMap[q.cat] || { t: 0, c: 0 };
    m.t++; if (ans[i] === q.a) m.c++;
    catMap[q.cat] = m;
  });
  const cats = Object.keys(catMap).map(c => ({ cat: c, ...catMap[c] })).sort((a, b) => (a.c / a.t) - (b.c / b.t));
  const missed = qs.map((q, i) => ({ q, sel: ans[i] })).filter(x => x.sel !== x.q.a);

  return (
    <div style={{ width: "100%", maxWidth: 400, padding: "14px 12px 90px", fontFamily: F }}>
      <div style={{ textAlign: "center", background: passed ? "#F0FDF4" : "#FEF2F2", border: "2px solid " + (passed ? "#16A34A" : "#DC2626"), borderRadius: 12, padding: "18px 12px", marginBottom: 16 }}>
        <div style={{ fontSize: 30, marginBottom: 4 }}>{passed ? "🎉" : "📝"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: passed ? "#16A34A" : "#DC2626" }}>
          {passed ? "合格ライン到達！" : "不合格"}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#1E293B", margin: "6px 0" }}>{correct}/{qs.length}</div>
        <div style={{ fontSize: 11, color: "#64748B" }}>正答率 {Math.round(acc * 100)}%（合格{Math.round(PASS * 100)}%） ／ 所要 {fmt(used)}</div>
      </div>

      {/* 分野別 */}
      <div style={{ color: "#64748B", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>分野別 正誤（弱点順）</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
        {cats.map(c => {
          const a = c.c / c.t;
          const col = a >= 0.8 ? "#16A34A" : a >= 0.6 ? "#CA8A04" : a >= 0.4 ? "#EA580C" : "#DC2626";
          return (
            <div key={c.cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: "#334155", fontWeight: 700 }}>{c.cat}</span>
              <span style={{ color: col, fontWeight: 700 }}>{c.c}/{c.t}</span>
            </div>
          );
        })}
      </div>

      {/* 誤答レビュー */}
      {missed.length > 0 && (
        <>
          <div style={{ color: "#64748B", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>間違えた問題の解説（{missed.length}問）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {missed.map((m, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, marginBottom: 3 }}>[{m.q.cat}]</div>
                <div style={{ fontSize: 11, color: "#1E293B", lineHeight: 1.5, marginBottom: 5 }}>{m.q.q}</div>
                <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, marginBottom: 4 }}>正解：{m.q.opts[m.q.a]}</div>
                <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.55 }}>{m.q.exp}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => setPhase("setup")} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#E85D04", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
        もう一度 模試に挑戦
      </button>
    </div>
  );
}

function navBtn(disabled, primary) {
  return {
    flex: 1, padding: "11px", borderRadius: 8,
    border: primary ? "none" : "1px solid #E2E8F0",
    background: disabled ? "#F1F5F9" : primary ? "#E85D04" : "white",
    color: disabled ? "#CBD5E1" : primary ? "white" : "#334155",
    fontSize: 12, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: F,
  };
}

function MockBtn({ label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 10,
      border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontFamily: F,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{label}</span>
        <span style={{ display: "block", fontSize: 9, color: "#94A3B8", marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ color: "#E85D04", fontSize: 18 }}>▶</span>
    </button>
  );
}

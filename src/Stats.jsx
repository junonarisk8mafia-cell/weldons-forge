// ============================================================
// WELDON'S FORGE — 弱点分析タブ
// カテゴリ別正答率のヒートバー + 間違えた問題だけの復習バトル起動
// ============================================================
import { useState } from "react";
import { QUIZ_STAGES } from "./questions";
import { getCatStats, getSummary, getWrongIds, clearStats } from "./stats";

const F = "'Courier New',monospace";

// 全問題を id で引ける索引を一度だけ構築
const Q_BY_ID = {};
QUIZ_STAGES.forEach(s => s.questions.forEach(q => { Q_BY_ID[q.id] = q; }));

function accColor(acc) {
  if (acc >= 0.8) return "#16A34A";   // 緑=得意
  if (acc >= 0.6) return "#CA8A04";   // 黄
  if (acc >= 0.4) return "#EA580C";   // 橙
  return "#DC2626";                    // 赤=弱点
}

export function StatsScreen({ onReview }) {
  const [tick, setTick] = useState(0); // リセット後の再描画用
  const stats = getCatStats();
  const sum = getSummary();
  const wrongIds = getWrongIds();

  function startReview() {
    const pool = wrongIds.map(id => Q_BY_ID[id]).filter(Boolean);
    if (pool.length === 0) {
      alert("復習できる問題がまだありません。まずクイズバトルに挑戦しよう！");
      return;
    }
    onReview(pool);
  }

  function reset() {
    if (window.confirm("学習記録をすべてリセットしますか？この操作は取り消せません。")) {
      clearStats();
      setTick(t => t + 1);
    }
  }

  const pct = n => Math.round(n * 100);

  return (
    <div style={{ width: "100%", maxWidth: 400, padding: "14px 12px 90px", fontFamily: F }}>
      <div style={{ color: "#1E293B", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📊 弱点分析</div>
      <div style={{ color: "#94A3B8", fontSize: 10, marginBottom: 14 }}>
        クイズで解いた記録から、苦手なカテゴリを可視化します。
      </div>

      {sum.total === 0 ? (
        <div style={{ background: "#F1F5F9", border: "1px dashed #CBD5E1", borderRadius: 10, padding: "22px 14px", textAlign: "center", color: "#64748B", fontSize: 12, lineHeight: 1.8 }}>
          まだ記録がありません。<br />クイズバトルを解くと、ここに<br />カテゴリ別の正答率が表示されます。
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <SummaryCard label="総回答数" value={sum.total + "問"} color="#1E293B" />
            <SummaryCard label="総合正答率" value={pct(sum.acc) + "%"} color={accColor(sum.acc)} />
            <SummaryCard label="復習対象" value={sum.wrongCount + "問"} color="#DC2626" />
          </div>

          {/* 弱点復習ボタン */}
          <button onClick={startReview} style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 10,
            background: sum.wrongCount > 0 ? "#E85D04" : "#CBD5E1",
            color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: F, marginBottom: 18,
          }}>
            🔥 弱点だけ復習バトル（最大20問）
          </button>

          {/* カテゴリ別ヒートバー */}
          <div style={{ color: "#64748B", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
            カテゴリ別 正答率（弱点順）
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {stats.map(s => (
              <div key={s.cat}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                  <span style={{ color: "#334155", fontWeight: 700 }}>{s.cat}</span>
                  <span style={{ color: accColor(s.acc), fontWeight: 700 }}>
                    {pct(s.acc)}% <span style={{ color: "#94A3B8", fontWeight: 400 }}>({s.correct}/{s.total})</span>
                  </span>
                </div>
                <div style={{ background: "#E2E8F0", borderRadius: 5, height: 8, overflow: "hidden" }}>
                  <div style={{ width: pct(s.acc) + "%", height: "100%", background: accColor(s.acc), borderRadius: 5, transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* リセット */}
          <button onClick={reset} style={{
            marginTop: 22, width: "100%", padding: "9px", border: "1px solid #E2E8F0",
            borderRadius: 8, background: "white", color: "#94A3B8", fontSize: 10,
            cursor: "pointer", fontFamily: F,
          }}>
            記録をリセット
          </button>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
      <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#94A3B8", fontSize: 9, marginTop: 2 }}>{label}</div>
    </div>
  );
}

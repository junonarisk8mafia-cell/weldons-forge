// ============================================================
// WELDON'S FORGE — 今日の学習パネル(クイズタブ上部)
// 試験日カウントダウン / 連続学習日数 / 今日の復習 / 毎日のリマインダー(アプリのみ)
// ============================================================
import { useState } from "react";
import { QUIZ_STAGES } from "./questions";
import { getDueIds, getStreak, loadExam, saveExam, daysUntil } from "./stats";
import { isNative, loadReminder, enableReminder, disableReminder } from "./reminder";

const F = "'Courier New',monospace";
const SETS = Math.ceil(QUIZ_STAGES.reduce((n, s) => n + s.questions.length, 0) / 20); // 20問=1セット
const EXAMS = [
  "JIS溶接技能者 基本級", "JIS溶接技能者 専門級", "AW検定", "普通ボイラー溶接士", "特別ボイラー溶接士",
  "溶接管理技術者 2級", "溶接管理技術者 1級", "溶接管理技術者 特別級", "IIW国際資格",
];

export function StudyPanel({ onReview }) {
  const [exam, setExam] = useState(loadExam);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => exam || { name: EXAMS[5], date: "" });
  const [rem, setRem] = useState(loadReminder);
  const [remMsg, setRemMsg] = useState("");
  const due = getDueIds().length;
  const { streak, best } = getStreak();
  const left = exam ? daysUntil(exam.date) : null;

  const box = { background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", marginBottom: 10 };
  const input = { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #CBD5E1", borderRadius: 8, fontFamily: F, fontSize: 13, background: "white", color: "#1E293B" };

  function saveDraft() {
    if (!draft.name.trim() || !draft.date) return;
    const e = { name: draft.name.trim(), date: draft.date };
    saveExam(e); setExam(e); setEditing(false);
  }
  function clearExam() { saveExam(null); setExam(null); setEditing(false); }

  async function toggleReminder() {
    if (rem.on) { await disableReminder(); setRem({ ...rem, on: false }); setRemMsg(""); return; }
    const res = await enableReminder(rem.hour, 0);
    if (res === "on") { setRem({ ...rem, on: true }); setRemMsg(""); }
    else setRemMsg("通知が許可されていません。端末の設定でWELDON'S FORGEの通知をオンにしてください。");
  }
  async function changeHour(h) {
    const r = { ...rem, hour: h };
    setRem(r);
    if (r.on) await enableReminder(h, 0);
  }

  return (
    <div>
      {/* 試験日カウントダウン */}
      <div style={{ ...box, background: "linear-gradient(135deg,#1E293B,#0F172A)", border: "none" }}>
        {!editing && exam ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "center", minWidth: 72 }}>
              <div style={{ color: "#94A3B8", fontSize: 9 }}>{left > 0 ? "試験まで" : left === 0 ? "試験当日" : "試験終了"}</div>
              <div style={{ color: "#FFE500", fontSize: left > 0 ? 30 : 18, fontWeight: 900, lineHeight: 1.2 }}>{left > 0 ? left : left === 0 ? "本番" : "おつかれ"}</div>
              {left > 0 && <div style={{ color: "#94A3B8", fontSize: 9 }}>日</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 700 }}>{exam.name}</div>
              <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>受験日 {exam.date.replaceAll("-", "/")}</div>
              {left > 0 && <div style={{ color: "#FDBA74", fontSize: 10, marginTop: 4 }}>1日{Math.ceil(SETS / left)}セット（{Math.ceil(SETS / left) * 20}問）で全範囲を一周できる</div>}
            </div>
            <button onClick={() => { setDraft(exam); setEditing(true); }} style={{ background: "none", border: "1px solid #475569", borderRadius: 8, color: "#CBD5E1", fontSize: 10, padding: "6px 8px", cursor: "pointer", fontFamily: F }}>変更</button>
          </div>
        ) : !editing ? (
          <button onClick={() => setEditing(true)} style={{ width: "100%", background: "none", border: "1px dashed #475569", borderRadius: 10, color: "#F8FAFC", padding: "12px", cursor: "pointer", fontFamily: F, fontSize: 12 }}>
            🎯 受験日を設定して、カウントダウンを始める
          </button>
        ) : (
          <div>
            <div style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🎯 目指す資格と受験日</div>
            <input list="wf-exams" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="資格名" style={{ ...input, marginBottom: 6 }} />
            <datalist id="wf-exams">{EXAMS.map(x => <option key={x} value={x} />)}</datalist>
            <input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} style={{ ...input, marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={saveDraft} disabled={!draft.date} style={{ flex: 2, padding: "9px", border: "none", borderRadius: 8, background: draft.date ? "#E85D04" : "#475569", color: "white", fontWeight: 700, fontFamily: F, fontSize: 12, cursor: draft.date ? "pointer" : "default" }}>保存</button>
              {exam && <button onClick={clearExam} style={{ flex: 1, padding: "9px", border: "1px solid #475569", borderRadius: 8, background: "none", color: "#CBD5E1", fontFamily: F, fontSize: 11, cursor: "pointer" }}>削除</button>}
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "9px", border: "1px solid #475569", borderRadius: 8, background: "none", color: "#CBD5E1", fontFamily: F, fontSize: 11, cursor: "pointer" }}>やめる</button>
            </div>
          </div>
        )}
      </div>

      {/* 今日の復習 + 連続学習 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={onReview} style={{ flex: 2, textAlign: "left", background: due > 0 ? "#FFF7ED" : "white", border: `2px solid ${due > 0 ? "#E85D04" : "#E2E8F0"}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontFamily: F }}>
          <div style={{ color: "#E85D04", fontSize: 12, fontWeight: 900 }}>📅 今日の復習</div>
          <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{due > 0 ? `${due}問 たまっています` : "今日はなし ✓"}</div>
        </button>
        <div style={{ flex: 1, background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
          <div style={{ color: "#1E293B", fontSize: 18, fontWeight: 900 }}>🔥 {streak}</div>
          <div style={{ color: "#64748B", fontSize: 9 }}>日連続（最高{best}）</div>
        </div>
      </div>

      {/* 毎日のリマインダー(Androidアプリのみ) */}
      {isNative() && (
        <div style={box}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, color: "#1E293B", fontSize: 12, fontWeight: 700 }}>⏰ 毎日のリマインダー</div>
            <select value={rem.hour} onChange={e => changeHour(Number(e.target.value))} style={{ ...input, width: "auto", padding: "6px 8px", fontSize: 12 }}>
              {Array.from({ length: 18 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{h}:00</option>)}
            </select>
            <button onClick={toggleReminder} style={{ padding: "7px 12px", borderRadius: 999, border: "none", background: rem.on ? "#16A34A" : "#CBD5E1", color: "white", fontWeight: 700, fontFamily: F, fontSize: 11, cursor: "pointer" }}>{rem.on ? "ON" : "OFF"}</button>
          </div>
          {remMsg && <div style={{ color: "#DC2626", fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>{remMsg}</div>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// WELDON'S FORGE — 計算ドリル(数値ランダム+ステップ解説)
// 入熱・炭素当量・のど厚・すみ肉許容力を反復練習。
// WES管理技術者/IWE等の計算問題対策。Calc タブのサブモード。
// ============================================================
import { useState } from "react";

const F = "'Courier New',monospace";
const r = (min, max, dec = 0) => {
  const v = min + Math.random() * (max - min);
  const p = Math.pow(10, dec);
  return Math.round(v * p) / p;
};

// 各ドリルの問題ジェネレータ。返り値: {type,q,unit,ans,tol,steps[]}
const GENERATORS = [
  // ① 入熱 H (kJ/mm)
  () => {
    const U = r(20, 34), I = r(150, 340, 0), v = r(150, 450, 0);
    const H = (U * I * 60) / (v * 1000);
    return {
      type: "入熱",
      q: `アーク電圧 U=${U}V、電流 I=${I}A、溶接速度 v=${v}mm/min のときの溶接入熱 H は？`,
      unit: "kJ/mm", ans: H, tol: Math.max(0.05, H * 0.03),
      steps: [
        "式：H = (U × I × 60) / (v × 1000)  [kJ/mm]",
        `= (${U} × ${I} × 60) / (${v} × 1000)`,
        `= ${(U * I * 60).toFixed(0)} / ${(v * 1000).toFixed(0)}`,
        `≈ ${H.toFixed(2)} kJ/mm`,
      ],
    };
  },
  // ② 炭素当量 CEV(IIW)
  () => {
    const C = r(0.14, 0.22, 2), Mn = r(0.6, 1.4, 2), Cr = r(0, 0.3, 2),
      Mo = r(0, 0.12, 2), V = r(0, 0.05, 2), Ni = r(0, 0.3, 2), Cu = r(0, 0.3, 2);
    const CE = C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;
    return {
      type: "炭素当量",
      q: `C=${C}, Mn=${Mn}, Cr=${Cr}, Mo=${Mo}, V=${V}, Ni=${Ni}, Cu=${Cu}(%）のとき、IIW式の炭素当量 CEV は？`,
      unit: "%", ans: CE, tol: 0.02,
      steps: [
        "式：CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15",
        `= ${C} + ${Mn}/6 + (${Cr}+${Mo}+${V})/5 + (${Ni}+${Cu})/15`,
        `= ${C} + ${(Mn / 6).toFixed(3)} + ${((Cr + Mo + V) / 5).toFixed(3)} + ${((Ni + Cu) / 15).toFixed(3)}`,
        `≈ ${CE.toFixed(2)} %  （高いほど溶接性が低下し予熱が必要）`,
      ],
    };
  },
  // ③ すみ肉溶接ののど厚 a
  () => {
    const S = r(4, 13, 0);
    const a = 0.7 * S;
    return {
      type: "のど厚",
      q: `等脚すみ肉溶接で脚長 S=${S}mm のとき、理論のど厚 a は？`,
      unit: "mm", ans: a, tol: 0.1,
      steps: [
        "式：a = 0.7 × S （a = S/√2 ≒ 0.707S）",
        `= 0.7 × ${S}`,
        `≈ ${a.toFixed(1)} mm`,
      ],
    };
  },
  // ④ すみ肉溶接の許容せん断力 F
  () => {
    const S = r(5, 10, 0), L = r(60, 200, 0), tau = r(80, 120, 0);
    const a = 0.7 * S;
    const Fn = a * L * tau;        // N
    const Fk = Fn / 1000;          // kN
    return {
      type: "許容力",
      q: `脚長 S=${S}mm・溶接長 L=${L}mm・許容せん断応力 τ=${tau}N/mm² のすみ肉溶接継手の許容せん断力 F は？`,
      unit: "kN", ans: Fk, tol: Math.max(0.5, Fk * 0.03),
      steps: [
        "式：F = a × L × τ  （a = 0.7S＝のど厚）",
        `のど厚 a = 0.7 × ${S} = ${a.toFixed(1)} mm`,
        `F = ${a.toFixed(1)} × ${L} × ${tau} = ${Fn.toFixed(0)} N`,
        `≈ ${Fk.toFixed(1)} kN`,
      ],
    };
  },
];

function makeProblem() {
  return GENERATORS[Math.floor(Math.random() * GENERATORS.length)]();
}

export function CalcDrill() {
  const [p, setP] = useState(makeProblem);
  const [inp, setInp] = useState("");
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [hit, setHit] = useState(0);

  function check() {
    if (checked) return;
    const val = parseFloat(inp);
    const good = !isNaN(val) && Math.abs(val - p.ans) <= p.tol;
    setOk(good); setChecked(true);
    setTotal(t => t + 1);
    if (good) { setHit(h => h + 1); setStreak(s => s + 1); }
    else setStreak(0);
  }
  function next() {
    setP(makeProblem()); setInp(""); setChecked(false); setOk(false);
  }

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ color: "#E85D04", fontSize: 12, fontWeight: 700 }}>🧮 計算ドリル</div>
        <div style={{ fontSize: 9, color: "#64748B" }}>
          連続 <b style={{ color: "#E85D04" }}>{streak}</b> ／ 正答 {hit}/{total}
        </div>
      </div>

      <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "7px 10px", marginBottom: 10, display: "inline-block" }}>
        <span style={{ fontSize: 9, color: "#0891B2", fontWeight: 700 }}>[{p.type}]</span>
      </div>

      <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.7, marginBottom: 12 }}>{p.q}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="number" value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") check(); }}
          placeholder="答えを入力" disabled={checked}
          style={{ flex: 1, padding: "10px 12px", border: "2px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: F, outline: "none" }} />
        <span style={{ color: "#64748B", fontSize: 12, fontWeight: 700, width: 46 }}>{p.unit}</span>
      </div>

      {!checked ? (
        <button onClick={check} style={btn("#E85D04")}>答え合わせ</button>
      ) : (
        <>
          <div style={{
            background: ok ? "#F0FDF4" : "#FEF2F2", border: "1px solid " + (ok ? "#16A34A" : "#DC2626"),
            borderRadius: 8, padding: "10px 12px", marginBottom: 10,
          }}>
            <div style={{ color: ok ? "#16A34A" : "#DC2626", fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
              {ok ? "✅ 正解！" : "❌ 不正解"} 　正解：{p.ans.toFixed(2)} {p.unit}
              <span style={{ color: "#94A3B8", fontWeight: 400, fontSize: 9 }}>（許容誤差 ±{p.tol.toFixed(2)}）</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {p.steps.map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: "#475569", lineHeight: 1.5, fontFamily: F }}>{s}</div>
              ))}
            </div>
          </div>
          <button onClick={next} style={btn("#0891B2")}>次の問題 →</button>
        </>
      )}
    </div>
  );
}

function btn(bg) {
  return {
    width: "100%", padding: "12px", border: "none", borderRadius: 8,
    background: bg, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F,
  };
}

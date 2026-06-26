import { useState, useEffect, useRef } from "react";

const PATTERNS = [
  { id: "stringer", name: "ストリンガー", en: "Stringer", desc: "直線ビード。最も基本的な運棒法。薄板や初層パスに使用。", color: "#E85D04", points: (t) => ({ x: (t % 1) * 280 + 10, y: 90 }) },
  { id: "zigzag", name: "ジグザグ", en: "Zigzag", desc: "左右に振りながら進む。広いビード幅が必要な時に使用。", color: "#F59E0B", points: (t) => ({ x: (t % 1) * 280 + 10, y: 90 + Math.sin(t * Math.PI * 8) * 40 }) },
  { id: "semicircle", name: "半円形", en: "Semicircle", desc: "半円を描きながら前進。肉盛り溶接や横向き溶接に有効。", color: "#10B981", points: (t) => ({ x: (t % 1) * 280 + 10, y: 90 - Math.abs(Math.sin((t * 6) % (2 * Math.PI))) * 50 }) },
  { id: "circular", name: "円形", en: "Circular", desc: "円を描きながら前進。溶融池のコントロールに優れる。", color: "#3B82F6", points: (t) => ({ x: (t % 1) * 280 + 10, y: 90 + Math.sin(t * Math.PI * 6) * 35 * Math.cos(t * Math.PI * 3) }) },
  { id: "figure8", name: "8の字", en: "Figure-8", desc: "8の字を描く高度な技法。深い溶け込みと広いビードを同時に確保。", color: "#8B5CF6", points: (t) => { const p = t * Math.PI * 6; return { x: (t % 1) * 280 + 10, y: 90 + Math.sin(p) * 40 * Math.cos(p / 2) }; } },
  { id: "sawtooth", name: "鋸歯形", en: "Sawtooth", desc: "鋸歯状に動かす。開先充填や多層盛りの中間層に使用。", color: "#EF4444", points: (t) => { const c = (t * 6) % 1; return { x: (t % 1) * 280 + 10, y: 90 + (c < 0.5 ? c * 2 - 0.5 : 1.5 - c * 2) * 60 }; } },
  { id: "cshape", name: "C字形", en: "C-Shape", desc: "Cの字を繰り返す。立向き溶接で溶融金属の垂れ防止に効果的。", color: "#06B6D4", points: (t) => { const p = (t * 5) % (2 * Math.PI); return { x: (t % 1) * 280 + 10, y: 90 + Math.sin(p) * 45 * (1 - Math.cos(p) * 0.3) }; } },
  { id: "ushape", name: "U字形", en: "U-Shape", desc: "U字を描く。開先底部の溶け込み確保に使用される技法。", color: "#F97316", points: (t) => { const c = (t * 5) % (2 * Math.PI); return { x: (t % 1) * 280 + 10, y: 90 + Math.pow(Math.sin(c / 2), 2) * 55 - 27 }; } },
  { id: "ladder", name: "はしご形", en: "Ladder", desc: "はしご状に動かす。広幅ビードの均一な溶け込みを確保。", color: "#84CC16", points: (t) => { const c = (t * 8) % 1; return { x: (t % 1) * 280 + 10, y: c < 0.25 ? 50 : c < 0.5 ? 130 : c < 0.75 ? 130 : 50 }; } },
  { id: "whip", name: "ウィップ", en: "Whip", desc: "鞭を打つように素早く往復。被覆アーク溶接の基本技法のひとつ。", color: "#EC4899", points: (t) => { const p = t * Math.PI * 10; const a = Math.exp(-Math.pow((p % (Math.PI * 2)) / Math.PI - 1, 2) * 2) * 50; return { x: (t % 1) * 280 + 10, y: 90 + Math.sin(p) * a }; } },
  { id: "triangle", name: "三角形", en: "Triangle", desc: "三角形を描く。開先角度に合わせた精密な溶け込みが可能。", color: "#A78BFA", points: (t) => { const c = (t * 5) % 1; return { x: (t % 1) * 280 + 10, y: c < 0.33 ? 90 - c * 3 * 60 : c < 0.66 ? 90 - 60 + (c - 0.33) * 3 * 60 : 90 + (c - 0.66) * 3 * 30 - 30 }; } },
  { id: "wave", name: "波形", en: "Wave", desc: "なめらかな波を描く。薄板の歪み抑制と美しいビード外観に優れる。", color: "#34D399", points: (t) => ({ x: (t % 1) * 280 + 10, y: 90 + Math.sin(t * Math.PI * 7) * 38 * Math.sin(t * Math.PI * 1.5) }) },
  { id: "cross", name: "クロス", en: "Cross", desc: "十字に動かす。肉盛り溶接での面積確保に使用される応用技法。", color: "#FCD34D", points: (t) => { const p = (t * 6) % (2 * Math.PI); return { x: (t % 1) * 280 + 10, y: 90 + Math.sin(p) * 40 + Math.sin(p * 2) * 15 }; } },
  { id: "spiral", name: "スパイラル", en: "Spiral", desc: "螺旋状に動かす高度技法。肉盛りや肉盛り補修溶接で活用。", color: "#F87171", points: (t) => { const r = 20 + Math.sin(t * Math.PI * 2) * 25; return { x: (t % 1) * 280 + 10, y: 90 + Math.sin(t * Math.PI * 9) * r * 0.8 }; } },
  { id: "diamond", name: "ダイヤ形", en: "Diamond", desc: "菱形を描く。開先充填の均一性と溶け込み深さのバランスに優れる。", color: "#60A5FA", points: (t) => { const c = (t * 5) % 1; return { x: (t % 1) * 280 + 10, y: c < 0.25 ? 90 - c * 4 * 50 : c < 0.5 ? 90 - 50 + (c - 0.25) * 4 * 50 : c < 0.75 ? 90 + (c - 0.5) * 4 * 50 : 90 + 50 - (c - 0.75) * 4 * 50 }; } },
  { id: "box", name: "ボックス", en: "Box", desc: "四角形を描く。隅肉溶接や開先の端部処理に使用される実用技法。", color: "#FB923C", points: (t) => { const c = (t * 5) % 1; return { x: (t % 1) * 280 + 10, y: c < 0.25 ? 50 : c < 0.5 ? 50 + (c - 0.25) * 4 * 80 : c < 0.75 ? 130 : 130 - (c - 0.75) * 4 * 80 }; } },
];

const SPEEDS = [{ label: "遅い", value: 0.003 }, { label: "普通", value: 0.007 }, { label: "速い", value: 0.015 }];

export function WeaveScreen() {
  const [selected, setSelected] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [t, setT] = useState(0);
  const trailRef = useRef([]);
  const animRef = useRef(null);
  const tRef = useRef(0);
  const pattern = PATTERNS[selected];

  useEffect(() => { trailRef.current = []; tRef.current = 0; setT(0); }, [selected]);

  useEffect(() => {
    const step = () => {
      if (running) {
        tRef.current += SPEEDS[speed].value;
        const pt = pattern.points(tRef.current);
        trailRef.current.push({ ...pt });
        if (trailRef.current.length > 120) trailRef.current.shift();
        setT(tRef.current);
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, selected]);

  const trail = trailRef.current;
  const cur = trail.length > 0 ? trail[trail.length - 1] : { x: 10, y: 90 };
  const F = "'Noto Sans JP', sans-serif";
  const BG = "#0F172A"; const CARD = "#1E293B"; const BORDER = "#334155";

  return (
    <div style={{ fontFamily: F, background: BG, minHeight: "100vh", padding: "12px", color: "#F1F5F9" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, marginBottom: 4 }}>WEAVING TECHNIQUE</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#E85D04" }}>ウィービング道場</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>運棒パターン {PATTERNS.length}種 マスターガイド</div>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: pattern.color }}>{pattern.name}</span>
            <span style={{ fontSize: 11, color: "#64748B", marginLeft: 6 }}>{pattern.en}</span>
          </div>
          <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#E85D04" : "#334155", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {running ? "⏸ 停止" : "▶ 再生"}
          </button>
        </div>
        <svg width="100%" viewBox="0 0 300 180" style={{ display: "block", background: "#0F172A", borderRadius: 8, border: `1px solid ${BORDER}` }}>
          {[30,60,90,120,150].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#1E293B" strokeWidth="1" />)}
          {[50,100,150,200,250].map(x => <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="#1E293B" strokeWidth="1" />)}
          <line x1="0" y1="90" x2="300" y2="90" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
          {trail.length > 1 && <polyline points={trail.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={pattern.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />}
          {trail.slice(-30).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={pattern.color} opacity={i / 30 * 0.5} />)}
          <circle cx={cur.x} cy={cur.y} r="7" fill={pattern.color} opacity="0.2" />
          <circle cx={cur.x} cy={cur.y} r="4" fill={pattern.color} />
          <circle cx={cur.x} cy={cur.y} r="2" fill="#fff" />
          {running && [0,60,120,180,240,300].map((angle, i) => { const rad = (angle + t * 200) * Math.PI / 180; const len = 4 + Math.sin(t * 20 + i) * 3; return <line key={i} x1={cur.x} y1={cur.y} x2={cur.x + Math.cos(rad) * len} y2={cur.y + Math.sin(rad) * len} stroke="#FCD34D" strokeWidth="1" opacity={0.6 + Math.sin(t * 15 + i) * 0.4} />; })}
        </svg>
        <div style={{ marginTop: 10, fontSize: 12, color: "#94A3B8", lineHeight: 1.6, background: "#0F172A", borderRadius: 8, padding: "8px 10px" }}>{pattern.desc}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#64748B", marginRight: 4 }}>速度：</span>
          {SPEEDS.map((s, i) => <button key={i} onClick={() => setSpeed(i)} style={{ background: speed === i ? "#E85D04" : "#334155", border: "none", borderRadius: 6, padding: "4px 10px", color: speed === i ? "#fff" : "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{s.label}</button>)}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8, letterSpacing: 1 }}>▼ パターンを選択</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PATTERNS.map((p, i) => (
          <button key={p.id} onClick={() => setSelected(i)} style={{ background: selected === i ? `${p.color}22` : CARD, border: `1.5px solid ${selected === i ? p.color : BORDER}`, borderRadius: 10, padding: "10px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: selected === i ? p.color : "#F1F5F9" }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{p.en}</div>
          </button>
        ))}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

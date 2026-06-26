import { useState, useEffect, useRef } from "react";

// 固定パスでパターンを定義。各pointsは [x, y] の配列（0-300, 0-180の座標系）
// 母材中心線: y=90, 上端: y=50, 下端: y=130
// 進行方向: 左→右 (x: 20→280)

const BASE_PATHS = {
  stringer: () => {
    const pts = [];
    for (let x = 20; x <= 280; x += 4) pts.push([x, 90]);
    return pts;
  },
  zigzag: () => {
    const pts = [];
    const W = 30; // 振り幅
    const STEP = 8;
    let dir = 1;
    for (let x = 20; x <= 280; x += 2) {
      const cycle = ((x - 20) % (STEP * 2)) / (STEP * 2);
      const y = 90 + (cycle < 0.5 ? cycle * 2 - 0.5 : 1.5 - cycle * 2) * W * 2;
      pts.push([x, y]);
    }
    return pts;
  },
  semicircle: () => {
    const pts = [];
    const R = 20;
    const SPAN = 40;
    for (let x = 20; x <= 280; x += 2) {
      const cycle = ((x - 20) % SPAN) / SPAN;
      const angle = cycle * Math.PI;
      const y = 90 - Math.sin(angle) * R;
      pts.push([x, y]);
    }
    return pts;
  },
  circular: () => {
    const pts = [];
    const SPAN = 50;
    const RX = 25; const RY = 18;
    let totalX = 20;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200 * (280 - 20) / SPAN;
      const angle = t * 2 * Math.PI;
      const x = 20 + (i / 200) * (260) + Math.cos(angle) * RX * 0.3;
      const y = 90 + Math.sin(angle) * RY;
      if (x >= 20 && x <= 280) pts.push([x, y]);
    }
    return pts;
  },
  figure8: () => {
    const pts = [];
    const SPAN = 60;
    for (let i = 0; i <= 200; i++) {
      const prog = i / 200;
      const x = 20 + prog * 260;
      const t = prog * (260 / SPAN) * 2 * Math.PI;
      const y = 90 + Math.sin(t) * 22 * Math.cos(t / 2);
      pts.push([x, y]);
    }
    return pts;
  },
  sawtooth: () => {
    const pts = [];
    const SPAN = 30; const AMP = 25;
    for (let x = 20; x <= 280; x += 2) {
      const cycle = ((x - 20) % SPAN) / SPAN;
      const y = 90 + (cycle < 0.5 ? cycle * 2 - 0.5 : 1.5 - cycle * 2) * AMP * 2;
      pts.push([x, y]);
    }
    return pts;
  },
  cshape: () => {
    const pts = [];
    // C字: 前進→上→後退→下→前進を繰り返す
    const unit = [
      [0,0],[4,-8],[8,-18],[12,-25],[16,-28],[20,-25],[24,-18],[28,-8],[32,0],
    ];
    let ox = 20;
    while (ox + 32 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 32;
    }
    return pts;
  },
  ushape: () => {
    const pts = [];
    const unit = [
      [0,0],[4,6],[8,14],[12,20],[16,24],[20,24],[24,20],[28,14],[32,6],[36,0],
    ];
    let ox = 20;
    while (ox + 36 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 36;
    }
    return pts;
  },
  ladder: () => {
    const pts = [];
    const unit = [
      [0,-22],[0,-22],[0,-16],[0,-8],[0,0],[0,8],[0,16],[0,22],
      [0,22],[8,22],[8,-22],[16,-22],
    ];
    let ox = 20;
    while (ox + 16 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 16;
    }
    return pts;
  },
  whip: () => {
    const pts = [];
    // 素早い前進＋小さな上下
    for (let x = 20; x <= 280; x += 2) {
      const cycle = ((x - 20) % 20) / 20;
      const amp = cycle < 0.3 ? cycle / 0.3 * 15 : cycle < 0.7 ? 15 - (cycle - 0.3) / 0.4 * 30 : -15 + (cycle - 0.7) / 0.3 * 15;
      pts.push([x, 90 + amp]);
    }
    return pts;
  },
  triangle: () => {
    const pts = [];
    const unit = [
      [0,0],[6,-10],[12,-20],[18,-28],[24,-22],[30,-14],[36,-6],[42,0],
    ];
    let ox = 20;
    while (ox + 42 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 42;
    }
    return pts;
  },
  wave: () => {
    const pts = [];
    for (let x = 20; x <= 280; x += 2) {
      const y = 90 + Math.sin((x - 20) / 260 * Math.PI * 8) * 20;
      pts.push([x, y]);
    }
    return pts;
  },
  diamond: () => {
    const pts = [];
    const unit = [
      [0,0],[6,-10],[12,-20],[18,-28],[24,-20],[30,-10],[36,0],[42,10],[48,20],[54,28],[60,20],[66,10],[72,0],
    ];
    let ox = 20;
    while (ox + 72 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 72;
    }
    return pts;
  },
  box: () => {
    const pts = [];
    const unit = [
      [0,-22],[8,-22],[8,22],[0,22],[0,-22],[16,-22],
    ];
    let ox = 20;
    while (ox + 16 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 16;
    }
    return pts;
  },
  cross: () => {
    const pts = [];
    const unit = [
      [0,0],[4,-15],[8,-25],[12,-15],[16,0],[20,15],[24,25],[28,15],[32,0],
    ];
    let ox = 20;
    while (ox + 32 <= 280) {
      unit.forEach(([dx, dy]) => pts.push([ox + dx, 90 + dy]));
      ox += 32;
    }
    return pts;
  },
  spiral: () => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const prog = i / 200;
      const x = 20 + prog * 260;
      const r = 10 + Math.sin(prog * Math.PI * 3) * 12;
      const angle = prog * Math.PI * 12;
      const y = 90 + Math.sin(angle) * r;
      pts.push([x, y]);
    }
    return pts;
  },
};

const PATTERNS = [
  { id: "stringer", name: "ストリンガー", en: "Stringer", color: "#E85D04",
    posture: ["下向き", "横向き", "立向き", "上向き"], use: ["初層", "薄板", "全姿勢"],
    desc: "直線に進む最も基本的な運棒。ビード幅は細く溶け込みが深い。初層や薄板溶接に最適。" },
  { id: "zigzag", name: "ジグザグ", en: "Zigzag", color: "#F59E0B",
    posture: ["下向き", "横向き"], use: ["すみ肉", "開先充填"],
    desc: "一定幅で左右に振る。ビード幅を広げたいときの基本。開先充填や隅肉溶接で多用。" },
  { id: "semicircle", name: "半円形", en: "Semicircle", color: "#10B981",
    posture: ["下向き", "横向き"], use: ["肉盛り", "補修"],
    desc: "上方向に半円を描きながら前進。肉盛り溶接や横向き溶接のビード整形に使う。" },
  { id: "circular", name: "円形", en: "Circular", color: "#3B82F6",
    posture: ["下向き"], use: ["肉盛り", "開先充填"],
    desc: "円を描きながらゆっくり前進。溶融池を十分コントロールできる高度な技法。" },
  { id: "figure8", name: "8の字", en: "Figure-8", color: "#8B5CF6",
    posture: ["下向き", "横向き"], use: ["肉盛り", "開先充填"],
    desc: "8の字を描く。深い溶け込みと広いビード幅を同時に確保できる上級技法。" },
  { id: "sawtooth", name: "鋸歯形", en: "Sawtooth", color: "#EF4444",
    posture: ["下向き", "立向き"], use: ["開先充填", "多層盛り"],
    desc: "鋸歯状に動かす。開先の充填や多層盛りの中間層に使用。均一な溶け込みが得やすい。" },
  { id: "cshape", name: "C字形", en: "C-Shape", color: "#06B6D4",
    posture: ["立向き", "上向き"], use: ["立向き", "上向き溶接"],
    desc: "Cの字を繰り返す。立向き・上向きで溶融金属が垂れないようコントロールする技法。" },
  { id: "ushape", name: "U字形", en: "U-Shape", color: "#F97316",
    posture: ["下向き", "立向き"], use: ["開先底部", "深溶け込み"],
    desc: "U字を描く。開先底部の溶け込みを確実に確保したいときに使う。" },
  { id: "ladder", name: "はしご形", en: "Ladder", color: "#84CC16",
    posture: ["下向き", "横向き"], use: ["広幅ビード", "肉盛り"],
    desc: "はしご状に動かす。広いビード幅が必要なとき、均一な溶け込みを確保できる。" },
  { id: "whip", name: "ウィップ", en: "Whip", color: "#EC4899",
    posture: ["下向き", "立向き"], use: ["被覆アーク", "薄板"],
    desc: "前進しながら素早く上下に振る。被覆アーク溶接で溶け込みと冷却を交互に行う技法。" },
  { id: "triangle", name: "三角形", en: "Triangle", color: "#A78BFA",
    posture: ["下向き", "横向き"], use: ["開先", "すみ肉"],
    desc: "三角形を描く。開先角度に沿った精密な溶け込みが可能。すみ肉にも使われる。" },
  { id: "wave", name: "波形", en: "Wave", color: "#34D399",
    posture: ["下向き", "横向き"], use: ["薄板", "外観重視"],
    desc: "なめらかな波を描く。薄板の歪み抑制と美しいビード外観が得やすい技法。" },
  { id: "diamond", name: "ダイヤ形", en: "Diamond", color: "#60A5FA",
    posture: ["下向き"], use: ["肉盛り", "開先充填"],
    desc: "菱形を描く。溶け込み深さと充填量のバランスに優れる。肉盛り補修に有効。" },
  { id: "box", name: "ボックス", en: "Box", color: "#FB923C",
    posture: ["下向き", "横向き"], use: ["すみ肉", "端部処理"],
    desc: "四角形を描く。隅肉溶接や開先端部の処理に使われる実用的な技法。" },
  { id: "cross", name: "クロス", en: "Cross", color: "#FCD34D",
    posture: ["下向き"], use: ["肉盛り", "広幅"],
    desc: "十字に動かす。肉盛り溶接で広い面積を均一に盛りたいときに使う応用技法。" },
  { id: "spiral", name: "スパイラル", en: "Spiral", color: "#F87171",
    posture: ["下向き"], use: ["肉盛り補修", "広幅"],
    desc: "螺旋状に動かす。肉盛り・補修溶接で広い範囲を均一に仕上げる高度技法。" },
];

const POSTURE_COLOR = {
  "下向き": "#E85D04", "横向き": "#3B82F6", "立向き": "#10B981", "上向き": "#8B5CF6",
};
const USE_COLOR = {
  "すみ肉": "#F59E0B", "肉盛り": "#EF4444", "開先充填": "#06B6D4", "初層": "#34D399",
  "薄板": "#A78BFA", "全姿勢": "#EC4899", "補修": "#FB923C", "立向き": "#10B981",
  "上向き溶接": "#8B5CF6", "開先底部": "#60A5FA", "深溶け込み": "#60A5FA",
  "広幅ビード": "#84CC16", "被覆アーク": "#F87171", "開先": "#06B6D4",
  "外観重視": "#FCD34D", "端部処理": "#FB923C", "広幅": "#84CC16",
  "多層盛り": "#EF4444", "肉盛り補修": "#F87171",
};

const SPEEDS = [
  { label: "遅い", value: 0.4 },
  { label: "普通", value: 1.0 },
  { label: "速い", value: 2.2 },
];

// 母材の種類
const BASE_MATERIALS = [
  { id: "flat", name: "平板", desc: "下向き溶接" },
  { id: "fillet", name: "すみ肉", desc: "T継手" },
  { id: "groove", name: "開先", desc: "V開先" },
];

export function WeaveScreen() {
  const [selected, setSelected] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [baseMat, setBaseMat] = useState(0);
  const animRef = useRef(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(null);

  const pattern = PATTERNS[selected];
  const paths = BASE_PATHS[pattern.id] ? BASE_PATHS[pattern.id]() : [];

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = null;
  }, [selected]);

  useEffect(() => {
    const step = (timestamp) => {
      if (running) {
        if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        progressRef.current = (progressRef.current + delta * SPEEDS[speed].value * 30) % paths.length;
        setProgress(Math.floor(progressRef.current));
      } else {
        lastTimeRef.current = null;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, selected, paths.length]);

  const trailLen = Math.min(60, progress);
  const trailPts = paths.slice(Math.max(0, progress - trailLen), progress + 1);
  const cur = paths[progress] || [20, 90];

  const F = "'Noto Sans JP', sans-serif";
  const BG = "#0F172A"; const CARD = "#1E293B"; const BORDER = "#334155";

  // 母材SVGパーツ
  const renderBaseMaterial = () => {
    if (baseMat === 0) { // 平板
      return (
        <>
          <rect x="10" y="130" width="280" height="20" fill="#374151" rx="2" />
          <rect x="10" y="128" width="280" height="4" fill="#4B5563" rx="1" />
          <line x1="10" y1="90" x2="290" y2="90" stroke="#4B5563" strokeWidth="1" strokeDasharray="6,4" />
        </>
      );
    }
    if (baseMat === 1) { // すみ肉
      return (
        <>
          <rect x="10" y="100" width="280" height="20" fill="#374151" rx="2" />
          <rect x="130" y="40" width="20" height="70" fill="#374151" rx="2" />
          <rect x="130" y="38" width="20" height="4" fill="#4B5563" />
          <rect x="10" y="98" width="280" height="4" fill="#4B5563" rx="1" />
          <line x1="140" y1="40" x2="140" y2="100" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,3" />
          <line x1="10" y1="100" x2="290" y2="100" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,3" />
        </>
      );
    }
    if (baseMat === 2) { // V開先
      return (
        <>
          <rect x="10" y="115" width="120" height="20" fill="#374151" rx="2" />
          <rect x="170" y="115" width="120" height="20" fill="#374151" rx="2" />
          <polygon points="130,115 140,90 150,90 160,115" fill="#1E293B" stroke="#4B5563" strokeWidth="1" />
          <rect x="10" y="113" width="120" height="4" fill="#4B5563" rx="1" />
          <rect x="170" y="113" width="120" height="4" fill="#4B5563" rx="1" />
          <line x1="10" y1="90" x2="290" y2="90" stroke="#4B5563" strokeWidth="1" strokeDasharray="6,4" />
        </>
      );
    }
  };

  return (
    <div style={{ fontFamily: F, background: BG, minHeight: "100vh", padding: "12px", color: "#F1F5F9" }}>

      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 3, marginBottom: 3 }}>WEAVING TECHNIQUE</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#E85D04" }}>ウィービング道場</div>
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>運棒パターン {PATTERNS.length}種</div>
      </div>

      {/* デモエリア */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px", marginBottom: 10 }}>

        {/* パターン名＋タグ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 900, color: pattern.color }}>{pattern.name}</span>
              <span style={{ fontSize: 10, color: "#64748B", marginLeft: 6 }}>{pattern.en}</span>
            </div>
            <button onClick={() => setRunning(r => !r)} style={{ background: running ? "#E85D04" : "#334155", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {running ? "⏸" : "▶"}
            </button>
          </div>

          {/* 姿勢タグ */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#64748B", marginRight: 2, lineHeight: "20px" }}>姿勢：</span>
            {pattern.posture.map(p => (
              <span key={p} style={{ fontSize: 10, background: `${POSTURE_COLOR[p]}33`, color: POSTURE_COLOR[p], border: `1px solid ${POSTURE_COLOR[p]}66`, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>{p}</span>
            ))}
          </div>

          {/* 用途タグ */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#64748B", marginRight: 2, lineHeight: "20px" }}>用途：</span>
            {pattern.use.map(u => (
              <span key={u} style={{ fontSize: 10, background: `${USE_COLOR[u] || "#64748B"}33`, color: USE_COLOR[u] || "#94A3B8", border: `1px solid ${USE_COLOR[u] || "#64748B"}66`, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>{u}</span>
            ))}
          </div>
        </div>

        {/* 母材選択 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#64748B" }}>母材：</span>
          {BASE_MATERIALS.map((b, i) => (
            <button key={b.id} onClick={() => setBaseMat(i)} style={{ background: baseMat === i ? "#1E3A5F" : "#0F172A", border: `1px solid ${baseMat === i ? "#3B82F6" : BORDER}`, borderRadius: 6, padding: "3px 8px", color: baseMat === i ? "#93C5FD" : "#64748B", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              {b.name}
            </button>
          ))}
        </div>

        {/* SVGキャンバス */}
        <svg width="100%" viewBox="0 0 300 180" style={{ display: "block", background: "#0A0F1A", borderRadius: 8, border: `1px solid ${BORDER}` }}>

          {/* 母材 */}
          {renderBaseMaterial()}

          {/* グリッド（薄く） */}
          {[45, 90, 135].map(y => (
            <line key={y} x1="10" y1={y} x2="290" y2={y} stroke="#1E293B" strokeWidth="0.5" />
          ))}

          {/* トレイル（ビード跡） */}
          {trailPts.length > 1 && (
            <polyline
              points={trailPts.map(p => `${p[0]},${p[1]}`).join(" ")}
              fill="none"
              stroke={pattern.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}

          {/* フェード跡 */}
          {trailPts.slice(-20).map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={2} fill={pattern.color} opacity={i / 20 * 0.4} />
          ))}

          {/* 現在位置（溶接点） */}
          <circle cx={cur[0]} cy={cur[1]} r="8" fill={pattern.color} opacity="0.15" />
          <circle cx={cur[0]} cy={cur[1]} r="4.5" fill={pattern.color} opacity="0.9" />
          <circle cx={cur[0]} cy={cur[1]} r="2" fill="#fff" />

          {/* スパーク */}
          {running && [0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle + progress * 15) * Math.PI / 180;
            const len = 5 + (i % 3) * 2;
            return (
              <line key={i}
                x1={cur[0]} y1={cur[1]}
                x2={cur[0] + Math.cos(rad) * len}
                y2={cur[1] + Math.sin(rad) * len}
                stroke="#FCD34D" strokeWidth="1.2"
                opacity={0.5 + (i % 2) * 0.4}
              />
            );
          })}

          {/* 進行方向矢印 */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
            </marker>
          </defs>
          <line x1="260" y1="168" x2="285" y2="168" stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="248" y="171" fontSize="8" fill="#475569">進行</text>
        </svg>

        {/* 説明 */}
        <div style={{ marginTop: 8, fontSize: 11, color: "#94A3B8", lineHeight: 1.7, background: "#0A0F1A", borderRadius: 8, padding: "8px 10px" }}>
          {pattern.desc}
        </div>

        {/* スピード */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#64748B" }}>速度：</span>
          {SPEEDS.map((s, i) => (
            <button key={i} onClick={() => setSpeed(i)} style={{ background: speed === i ? "#E85D04" : "#1E293B", border: `1px solid ${speed === i ? "#E85D04" : BORDER}`, borderRadius: 6, padding: "3px 10px", color: speed === i ? "#fff" : "#64748B", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* パターン一覧 */}
      <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6, letterSpacing: 1 }}>▼ パターンを選択</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {PATTERNS.map((p, i) => (
          <button key={p.id} onClick={() => setSelected(i)}
            style={{ background: selected === i ? `${p.color}18` : CARD, border: `1.5px solid ${selected === i ? p.color : BORDER}`, borderRadius: 10, padding: "9px 10px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: selected === i ? p.color : "#F1F5F9" }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
              {p.posture.slice(0, 2).join("・")}
            </div>
          </button>
        ))}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
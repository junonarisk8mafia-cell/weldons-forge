import { useState, useEffect, useRef } from "react";

// ============================================================
// パターン定義 - 固定座標パス
// 座標系: viewBox 0 0 220 320 (縦向き用) or 0 0 320 220 (横向き用)
// ============================================================

// 横向きパス生成 (x:20→300, y中心:110)
const H = (pts) => pts; // horizontal
// 縦向きパス生成 (y:20→300, x中心:110)  
const V = (pts) => pts; // vertical

const mkZigzag = (cx, horiz, amp=28, span=24) => {
  const pts = [];
  if (horiz) {
    for (let x = 20; x <= 300; x += 3) {
      const c = ((x-20) % span) / span;
      const y = cx + (c < 0.5 ? (c*2-0.5) : (1.5-c*2)) * amp * 2;
      pts.push([x, y]);
    }
  } else {
    for (let y = 20; y <= 300; y += 3) {
      const c = ((y-20) % span) / span;
      const x = cx + (c < 0.5 ? (c*2-0.5) : (1.5-c*2)) * amp * 2;
      pts.push([x, y]);
    }
  }
  return pts;
};

const mkSine = (cx, horiz, amp=22, period=40) => {
  const pts = [];
  if (horiz) {
    for (let x = 20; x <= 300; x += 3) {
      pts.push([x, cx + Math.sin((x-20)/period*Math.PI*2)*amp]);
    }
  } else {
    for (let y = 20; y <= 300; y += 3) {
      pts.push([cx + Math.sin((y-20)/period*Math.PI*2)*amp, y]);
    }
  }
  return pts;
};

const mkSemiCircle = (cx, horiz, r=18, span=36) => {
  const pts = [];
  if (horiz) {
    for (let x = 20; x <= 300; x += 3) {
      const c = ((x-20) % span) / span;
      pts.push([x, cx - Math.sin(c*Math.PI)*r]);
    }
  } else {
    for (let y = 20; y <= 300; y += 3) {
      const c = ((y-20) % span) / span;
      pts.push([cx + Math.sin(c*Math.PI)*r, y]);
    }
  }
  return pts;
};

const mkCShape = (cx, horiz) => {
  const unit = horiz
    ? [[0,0],[5,-8],[10,-16],[15,-22],[20,-25],[25,-22],[30,-16],[35,-8],[40,0]]
    : [[0,0],[-8,5],[-16,10],[-22,15],[-25,20],[-22,25],[-16,30],[-8,35],[0,40]];
  const pts = [];
  if (horiz) {
    let ox=20; while(ox+40<=300){unit.forEach(([dx,dy])=>pts.push([ox+dx,cx+dy]));ox+=40;}
  } else {
    let oy=20; while(oy+40<=300){unit.forEach(([dx,dy])=>pts.push([cx+dx,oy+dy]));oy+=40;}
  }
  return pts;
};

const mkStringer = (cx, horiz) => {
  const pts = [];
  if (horiz) { for(let x=20;x<=300;x+=4) pts.push([x,cx]); }
  else { for(let y=20;y<=300;y+=4) pts.push([cx,y]); }
  return pts;
};

const mkFigure8 = (cx, horiz) => {
  const pts = [];
  if (horiz) {
    for(let i=0;i<=200;i++){
      const t=i/200; const x=20+t*280; const p=t*(280/55)*Math.PI*2;
      pts.push([x, cx+Math.sin(p)*22*Math.cos(p/2)]);
    }
  } else {
    for(let i=0;i<=200;i++){
      const t=i/200; const y=20+t*280; const p=t*(280/55)*Math.PI*2;
      pts.push([cx+Math.sin(p)*22*Math.cos(p/2), y]);
    }
  }
  return pts;
};

const mkTriangle = (cx, horiz) => {
  const unit = horiz
    ? [[0,0],[7,-12],[14,-22],[21,-28],[28,-22],[35,-12],[42,0]]
    : [[0,0],[-12,7],[-22,14],[-28,21],[-22,28],[-12,35],[0,42]];
  const pts = [];
  if (horiz) {
    let ox=20; while(ox+42<=300){unit.forEach(([dx,dy])=>pts.push([ox+dx,cx+dy]));ox+=42;}
  } else {
    let oy=20; while(oy+42<=300){unit.forEach(([dx,dy])=>pts.push([cx+dx,oy+dy]));oy+=42;}
  }
  return pts;
};

// ============================================================
// パターン定義
// ============================================================
const PATTERNS = [
  {
    id:"stringer", name:"ストリンガー", en:"Stringer", color:"#E85D04",
    posture:["下向き","横向き","立向き","上向き"], use:["初層","薄板","全姿勢"],
    desc:"直線に進む最も基本的な運棒。溶け込みが深く初層や薄板に最適。",
    orientation:"horizontal",
    getPts:(cx,horiz)=>mkStringer(cx,horiz),
  },
  {
    id:"zigzag", name:"ジグザグ", en:"Zigzag", color:"#F59E0B",
    posture:["下向き","横向き"], use:["すみ肉","開先充填"],
    desc:"一定幅で左右に振る。ビード幅を広げたいときの基本技法。",
    orientation:"horizontal",
    getPts:(cx,horiz)=>mkZigzag(cx,horiz,28,24),
  },
  {
    id:"semicircle", name:"半円形", en:"Semicircle", color:"#10B981",
    posture:["下向き","横向き"], use:["肉盛り","補修"],
    desc:"上方向に半円を描きながら前進。肉盛り・横向き溶接のビード整形に使う。",
    orientation:"horizontal",
    getPts:(cx,horiz)=>mkSemiCircle(cx,horiz,20,40),
  },
  {
    id:"cshape", name:"C字形", en:"C-Shape", color:"#06B6D4",
    posture:["立向き","上向き"], use:["立向き","上向き溶接"],
    desc:"Cの字を繰り返す。立向き・上向きで溶融金属の垂れを防ぐ技法。",
    orientation:"vertical",
    getPts:(cx,horiz)=>mkCShape(cx,horiz),
  },
  {
    id:"figure8", name:"8の字", en:"Figure-8", color:"#8B5CF6",
    posture:["下向き","横向き"], use:["肉盛り","開先充填"],
    desc:"8の字を描く。深い溶け込みと広いビード幅を同時に確保できる上級技法。",
    orientation:"horizontal",
    getPts:(cx,horiz)=>mkFigure8(cx,horiz),
  },
  {
    id:"wave", name:"波形", en:"Wave", color:"#34D399",
    posture:["下向き","横向き"], use:["薄板","外観重視"],
    desc:"なめらかな波を描く。薄板の歪み抑制と美しいビード外観に優れる。",
    orientation:"horizontal",
    getPts:(cx,horiz)=>mkSine(cx,horiz,20,40),
  },
  {
    id:"triangle", name:"三角形", en:"Triangle", color:"#A78BFA",
    posture:["下向き","立向き"], use:["開先","すみ肉"],
    desc:"三角形を描く。開先角度に沿った精密な溶け込みが可能。",
    orientation:"vertical",
    getPts:(cx,horiz)=>mkTriangle(cx,horiz),
  },
];

const POSTURE_COLOR = {"下向き":"#E85D04","横向き":"#3B82F6","立向き":"#10B981","上向き":"#8B5CF6"};
const USE_COLOR = {"すみ肉":"#F59E0B","肉盛り":"#EF4444","開先充填":"#06B6D4","初層":"#34D399","薄板":"#A78BFA","全姿勢":"#EC4899","補修":"#FB923C","立向き":"#10B981","上向き溶接":"#8B5CF6","開先":"#06B6D4","外観重視":"#FCD34D"};

const SPEEDS = [{label:"遅い",fps:0.3},{label:"普通",fps:0.8},{label:"速い",fps:1.8}];

// ============================================================
// 溶接トーチSVG（ノズル＋ワイヤー）
// pos: 現在位置, angle: 進行角度(rad), color: アークカラー
// ============================================================
function WeldTorch({x, y, angle, color, running}) {
  // トーチ本体の向き: 進行方向と逆側から来る
  const torchAngle = angle + Math.PI * 0.75; // 斜め後ろから
  const nozzleLen = 22;
  const nozzleW = 5;
  
  // ノズル先端→根元
  const tx = x + Math.cos(torchAngle) * nozzleLen;
  const ty = y + Math.sin(torchAngle) * nozzleLen;
  
  // ワイヤー（ノズルから母材へ）
  const wireLen = 8;
  const wx = x + Math.cos(angle + Math.PI) * wireLen * 0.3;
  const wy = y + Math.sin(angle + Math.PI) * wireLen * 0.3;

  return (
    <g>
      {/* アーク光 */}
      {running && (
        <>
          <circle cx={x} cy={y} r="10" fill={color} opacity="0.12"/>
          <circle cx={x} cy={y} r="5" fill={color} opacity="0.25"/>
        </>
      )}
      {/* ワイヤー */}
      <line x1={x} y1={y} x2={tx} y2={ty}
        stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round"/>
      {/* ノズル（太い部分） */}
      <line x1={tx} y1={ty}
        x2={tx + Math.cos(torchAngle)*8} y2={ty + Math.sin(torchAngle)*8}
        stroke="#94A3B8" strokeWidth={nozzleW} strokeLinecap="round"/>
      {/* ノズル先端 */}
      <circle cx={tx} cy={ty} r="3" fill="#64748B"/>
      {/* 溶接点 */}
      <circle cx={x} cy={y} r="3.5" fill={color} opacity="0.9"/>
      <circle cx={x} cy={y} r="1.5" fill="#fff"/>
      {/* スパーク */}
      {running && [0,72,144,216,288].map((deg,i)=>{
        const r=(deg+Date.now()*0.3)%360*Math.PI/180;
        const len=4+(i%3)*2;
        return <line key={i} x1={x} y1={y}
          x2={x+Math.cos(r)*len} y2={y+Math.sin(r)*len}
          stroke="#FCD34D" strokeWidth="1.2" opacity={0.7}/>;
      })}
    </g>
  );
}

// ============================================================
// 母材レンダリング
// ============================================================
function BaseMaterial({type, posture}) {
  // posture: "down"=下向き, "vertical"=立向き, "overhead"=上向き, "horizontal"=横向き
  
  if (posture === "vertical") {
    // 立向き: 縦に伸びた板、進行方向は下→上
    return (
      <g>
        <rect x="85" y="10" width="50" height="300" fill="#374151" rx="3"/>
        <rect x="83" y="10" width="6" height="300" fill="#4B5563" rx="2"/>
        <rect x="131" y="10" width="6" height="300" fill="#4B5563" rx="2"/>
        {/* 溶接線ガイド */}
        <line x1="110" y1="10" x2="110" y2="310" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        {/* 進行矢印（上向き） */}
        <text x="145" y="280" fontSize="9" fill="#475569">▲</text>
        <text x="142" y="292" fontSize="8" fill="#475569">進行</text>
      </g>
    );
  }
  
  if (posture === "overhead") {
    // 上向き: 天井側に母材、下から見上げる
    return (
      <g>
        <rect x="10" y="10" width="300" height="40" fill="#374151" rx="3"/>
        <rect x="10" y="46" width="300" height="6" fill="#4B5563" rx="2"/>
        {/* 天井感 */}
        <rect x="10" y="8" width="300" height="4" fill="#1E293B"/>
        {/* ハッチング（天井板） */}
        {[30,60,90,120,150,180,210,240,270].map(x=>(
          <line key={x} x1={x} y1="10" x2={x-20} y2="50" stroke="#4B5563" strokeWidth="1" opacity="0.5"/>
        ))}
        {/* 溶接線ガイド */}
        <line x1="20" y1="52" x2="300" y2="52" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        {/* 進行矢印 */}
        <text x="275" y="70" fontSize="9" fill="#475569">→進行</text>
      </g>
    );
  }

  if (type === "fillet") {
    // すみ肉（T継手）
    return (
      <g>
        <rect x="10" y="150" width="300" height="25" fill="#374151" rx="2"/>
        <rect x="10" y="148" width="300" height="5" fill="#4B5563" rx="1"/>
        <rect x="148" y="50" width="24" height="105" fill="#374151" rx="2"/>
        <rect x="146" y="48" width="4" height="107" fill="#4B5563" rx="1"/>
        <rect x="168" y="48" width="4" height="107" fill="#4B5563" rx="1"/>
        <line x1="148" y1="150" x2="148" y2="50" stroke="#475569" strokeWidth="1" strokeDasharray="4,3"/>
        <line x1="20" y1="150" x2="300" y2="150" stroke="#475569" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="270" y="170" fontSize="9" fill="#475569">→進行</text>
      </g>
    );
  }

  if (type === "groove") {
    // V開先
    return (
      <g>
        <rect x="10" y="155" width="130" height="25" fill="#374151" rx="2"/>
        <rect x="180" y="155" width="130" height="25" fill="#374151" rx="2"/>
        <rect x="10" y="153" width="130" height="5" fill="#4B5563" rx="1"/>
        <rect x="180" y="153" width="130" height="5" fill="#4B5563" rx="1"/>
        <polygon points="140,155 155,120 165,120 180,155" fill="#1E293B" stroke="#4B5563" strokeWidth="1"/>
        <line x1="20" y1="120" x2="300" y2="120" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        <text x="270" y="145" fontSize="9" fill="#475569">→進行</text>
      </g>
    );
  }

  // 平板（デフォルト・下向き）
  return (
    <g>
      <rect x="10" y="155" width="300" height="25" fill="#374151" rx="2"/>
      <rect x="10" y="153" width="300" height="5" fill="#4B5563" rx="1"/>
      {/* 板の質感ライン */}
      {[40,80,120,160,200,240,280].map(x=>(
        <line key={x} x1={x} y1="155" x2={x} y2="180" stroke="#4B5563" strokeWidth="0.5" opacity="0.4"/>
      ))}
      <line x1="20" y1="153" x2="300" y2="153" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="270" y="148" fontSize="9" fill="#475569">→進行</text>
    </g>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export function WeaveScreen() {
  const [selected, setSelected] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [baseMat, setBaseMat] = useState(0);
  const [postureIdx, setPostureIdx] = useState(0);
  const animRef = useRef(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(null);
  const tickRef = useRef(0);

  const pattern = PATTERNS[selected];
  const posture = pattern.posture[postureIdx] || pattern.posture[0];

  // 姿勢に応じてキャンバス方向決定
  const isVertical = posture === "立向き";
  const isOverhead = posture === "上向き";
  
  // 中心線座標
  const cx = isVertical ? 110 : (isOverhead ? 52 : 153);
  const horiz = !isVertical;
  
  const paths = pattern.getPts(cx, horiz);

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = null;
  }, [selected, postureIdx]);

  useEffect(() => {
    const step = (timestamp) => {
      if (running) {
        if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        tickRef.current += 1;
        progressRef.current = (progressRef.current + delta * SPEEDS[speed].fps * 40) % Math.max(1, paths.length);
        setProgress(Math.floor(progressRef.current));
      } else {
        lastTimeRef.current = null;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, selected, postureIdx, paths.length]);

  const idx = Math.min(progress, paths.length - 1);
  const trailLen = Math.min(80, idx);
  const trailPts = paths.slice(Math.max(0, idx - trailLen), idx + 1);
  const cur = paths[idx] || [isVertical ? 110 : 20, isVertical ? 20 : cx];
  
  // 進行角度計算
  const prev = paths[Math.max(0, idx - 3)] || cur;
  const angle = Math.atan2(cur[1] - prev[1], cur[0] - prev[0]);

  // 母材タイプ
  const BASE_MATS = [
    {id:"flat", name:"平板"},
    {id:"fillet", name:"すみ肉"},
    {id:"groove", name:"V開先"},
  ];

  const F = "'Noto Sans JP', sans-serif";
  const BG = "#0F172A"; const CARD = "#1E293B"; const BORDER = "#334155";

  // ビュー設定
  const vbW = isVertical ? 220 : 320;
  const vbH = isVertical ? 320 : 220;

  return (
    <div style={{fontFamily:F, background:BG, minHeight:"100vh", padding:"12px", color:"#F1F5F9"}}>

      {/* ヘッダー */}
      <div style={{textAlign:"center", marginBottom:10}}>
        <div style={{fontSize:10, color:"#94A3B8", letterSpacing:3, marginBottom:2}}>WEAVING TECHNIQUE</div>
        <div style={{fontSize:18, fontWeight:900, color:"#E85D04"}}>ウィービング道場</div>
      </div>

      {/* デモエリア */}
      <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px", marginBottom:10}}>

        {/* パターン名＋コントロール */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <div>
            <span style={{fontSize:16, fontWeight:900, color:pattern.color}}>{pattern.name}</span>
            <span style={{fontSize:10, color:"#64748B", marginLeft:6}}>{pattern.en}</span>
          </div>
          <button onClick={()=>setRunning(r=>!r)}
            style={{background:running?"#E85D04":"#334155", border:"none", borderRadius:6, padding:"4px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"}}>
            {running?"⏸":"▶"}
          </button>
        </div>

        {/* 姿勢タグ（クリックで切替） */}
        <div style={{display:"flex", flexWrap:"wrap", gap:5, marginBottom:6}}>
          <span style={{fontSize:9, color:"#64748B", lineHeight:"22px", marginRight:2}}>姿勢：</span>
          {pattern.posture.map((p,i)=>(
            <button key={p} onClick={()=>setPostureIdx(i)}
              style={{fontSize:11, background:postureIdx===i?`${POSTURE_COLOR[p]}33`:"transparent",
                color:postureIdx===i?POSTURE_COLOR[p]:"#64748B",
                border:`1.5px solid ${postureIdx===i?POSTURE_COLOR[p]:"#334155"}`,
                borderRadius:5, padding:"2px 8px", fontWeight:700, cursor:"pointer"}}>
              {p}
            </button>
          ))}
        </div>

        {/* 用途タグ */}
        <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:8}}>
          <span style={{fontSize:9, color:"#64748B", lineHeight:"18px", marginRight:2}}>用途：</span>
          {pattern.use.map(u=>(
            <span key={u} style={{fontSize:10, background:`${USE_COLOR[u]||"#64748B"}22`,
              color:USE_COLOR[u]||"#94A3B8", border:`1px solid ${USE_COLOR[u]||"#64748B"}55`,
              borderRadius:4, padding:"1px 7px", fontWeight:700}}>{u}</span>
          ))}
        </div>

        {/* 母材選択 */}
        {!isVertical && !isOverhead && (
          <div style={{display:"flex", gap:5, marginBottom:8, alignItems:"center"}}>
            <span style={{fontSize:10, color:"#64748B"}}>母材：</span>
            {BASE_MATS.map((b,i)=>(
              <button key={b.id} onClick={()=>setBaseMat(i)}
                style={{background:baseMat===i?"#1E3A5F":"#0F172A",
                  border:`1px solid ${baseMat===i?"#3B82F6":BORDER}`,
                  borderRadius:6, padding:"3px 8px",
                  color:baseMat===i?"#93C5FD":"#64748B",
                  fontSize:10, fontWeight:700, cursor:"pointer"}}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* SVGキャンバス */}
        <svg width="100%" viewBox={`0 0 ${vbW} ${vbH}`}
          style={{display:"block", background:"#0A0F1A", borderRadius:10, border:`1px solid ${BORDER}`}}>

          {/* グリッド */}
          {(isVertical
            ? [55,110,165]
            : [55,110,165,220,275]
          ).map(v=>(
            isVertical
              ? <line key={v} x1={v} y1="0" x2={v} y2={vbH} stroke="#1A2535" strokeWidth="0.5"/>
              : <line key={v} x1="0" y1={v} x2={vbW} y2={v} stroke="#1A2535" strokeWidth="0.5"/>
          ))}

          {/* 母材 */}
          <BaseMaterial
            type={BASE_MATS[baseMat].id}
            posture={isVertical?"vertical":isOverhead?"overhead":"down"}
          />

          {/* ビード跡（溶接済み部分） */}
          {trailPts.length > 1 && (
            <polyline
              points={trailPts.map(p=>`${p[0]},${p[1]}`).join(" ")}
              fill="none" stroke={pattern.color}
              strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.6"
            />
          )}

          {/* ビード光沢 */}
          {trailPts.length > 1 && (
            <polyline
              points={trailPts.map(p=>`${p[0]},${p[1]}`).join(" ")}
              fill="none" stroke="#fff"
              strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.15"
            />
          )}

          {/* トーチ */}
          <WeldTorch x={cur[0]} y={cur[1]} angle={angle} color={pattern.color} running={running}/>

        </svg>

        {/* 説明 */}
        <div style={{marginTop:8, fontSize:11, color:"#94A3B8", lineHeight:1.7,
          background:"#0A0F1A", borderRadius:8, padding:"8px 10px"}}>
          {pattern.desc}
        </div>

        {/* スピード */}
        <div style={{display:"flex", gap:6, marginTop:8, alignItems:"center"}}>
          <span style={{fontSize:10, color:"#64748B"}}>速度：</span>
          {SPEEDS.map((s,i)=>(
            <button key={i} onClick={()=>setSpeed(i)}
              style={{background:speed===i?"#E85D04":"#1E293B",
                border:`1px solid ${speed===i?"#E85D04":BORDER}`,
                borderRadius:6, padding:"3px 10px",
                color:speed===i?"#fff":"#64748B",
                fontSize:10, fontWeight:700, cursor:"pointer"}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* パターン一覧 */}
      <div style={{fontSize:10, color:"#64748B", marginBottom:6, letterSpacing:1}}>▼ パターンを選択</div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
        {PATTERNS.map((p,i)=>(
          <button key={p.id} onClick={()=>{setSelected(i);setPostureIdx(0);}}
            style={{background:selected===i?`${p.color}18`:CARD,
              border:`1.5px solid ${selected===i?p.color:BORDER}`,
              borderRadius:10, padding:"9px 10px",
              cursor:"pointer", textAlign:"left", transition:"all .15s"}}>
            <div style={{display:"flex", alignItems:"center", gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/>
              <span style={{fontSize:12, fontWeight:800, color:selected===i?p.color:"#F1F5F9"}}>{p.name}</span>
            </div>
            <div style={{fontSize:9, color:"#475569", marginTop:2}}>
              {p.posture.join("・")}
            </div>
          </button>
        ))}
      </div>
      <div style={{height:40}}/>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";

// ============================================================
// 座標系
// viewBox: 0 0 320 240
// 母材別中心線:
//   flat(平板):   y=160, 左→右
//   fillet(すみ肉): x=160, 上→下 (垂直板に沿って上進)
//   groove(V開先): y=140, 左→右
//   buildup(肉盛り): y=160, 左→右 (上へ積む=ビードが上方向)
// ============================================================

// --- パス生成ユーティリティ ---

// 水平パス (左→右, cy=中心y)
const hPath = (cy, fn) => {
  const pts = [];
  for (let x = 20; x <= 300; x += 3) {
    pts.push([x, fn(x, cy)]);
  }
  return pts;
};

// 垂直パス (下→上, cx=中心x) ※すみ肉用
const vPath = (cx, fn) => {
  const pts = [];
  for (let y = 210; y >= 30; y -= 3) {
    pts.push([fn(y, cx), y]);
  }
  return pts;
};

// --- パターンパス定義 (母材タイプ別) ---
const buildPaths = (patternId, matType) => {
  const isVert = matType === "fillet";

  // すみ肉は垂直板のx中心=160
  const CX = 160; // vertical center x
  const CY = matType === "groove" ? 138 : 158; // horizontal center y

  switch (patternId) {
    case "stringer":
      return isVert
        ? vPath(CX, (y, cx) => cx)
        : hPath(CY, (x, cy) => cy);

    case "zigzag": {
      const AMP = 22, SPAN = 20;
      return isVert
        ? vPath(CX, (y, cx) => { const c=((210-y)%SPAN)/SPAN; return cx+(c<0.5?(c*2-0.5):(1.5-c*2))*AMP*2; })
        : hPath(CY, (x, cy) => { const c=((x-20)%SPAN)/SPAN; return cy+(c<0.5?(c*2-0.5):(1.5-c*2))*AMP*2; });
    }

    case "semicircle": {
      const R = 18, SPAN = 36;
      return isVert
        ? vPath(CX, (y, cx) => { const c=((210-y)%SPAN)/SPAN; return cx+Math.sin(c*Math.PI)*R; })
        : hPath(CY, (x, cy) => { const c=((x-20)%SPAN)/SPAN; return cy-Math.sin(c*Math.PI)*R; });
    }

    case "cshape": {
      const unit = isVert
        ? [[0,0],[8,5],[16,10],[22,15],[25,20],[22,25],[16,30],[8,35],[0,40]]  // 横に広がるC
        : [[0,0],[5,-8],[10,-16],[15,-22],[20,-25],[25,-22],[30,-16],[35,-8],[40,0]];
      const pts = [];
      if (isVert) {
        let oy=210; while(oy-40>=30){ unit.forEach(([dy,dx])=>pts.push([CX+dx, oy-dy])); oy-=40; }
      } else {
        let ox=20; while(ox+40<=300){ unit.forEach(([dx,dy])=>pts.push([ox+dx, CY+dy])); ox+=40; }
      }
      return pts;
    }

    case "figure8":
      return isVert
        ? vPath(CX, (y, cx) => { const t=(210-y)/180; const p=t*(180/55)*Math.PI*2; return cx+Math.sin(p)*20*Math.cos(p/2); })
        : hPath(CY, (x, cy) => { const t=(x-20)/280; const p=t*(280/55)*Math.PI*2; return cy+Math.sin(p)*20*Math.cos(p/2); });

    case "wave": {
      const AMP = 16, PERIOD = 40;
      return isVert
        ? vPath(CX, (y, cx) => cx+Math.sin((210-y)/PERIOD*Math.PI*2)*AMP)
        : hPath(CY, (x, cy) => cy+Math.sin((x-20)/PERIOD*Math.PI*2)*AMP);
    }

    case "triangle": {
      const unit = isVert
        ? [[0,0],[7,-10],[14,-20],[21,-26],[28,-20],[35,-10],[42,0]]
        : [[0,0],[7,-12],[14,-22],[21,-28],[28,-22],[35,-12],[42,0]];
      const pts = [];
      if (isVert) {
        let oy=210; while(oy-42>=30){ unit.forEach(([dy,dx])=>pts.push([CX+dx, oy-dy])); oy-=42; }
      } else {
        let ox=20; while(ox+42<=300){ unit.forEach(([dx,dy])=>pts.push([ox+dx, CY+dy])); ox+=42; }
      }
      return pts;
    }

    case "diamond": {
      const unit = [[0,0],[8,-14],[16,-26],[24,-34],[32,-26],[40,-14],[48,0],[56,14],[64,26],[72,34],[80,26],[88,14],[96,0]];
      const pts = [];
      let ox=20; while(ox+96<=300){ unit.forEach(([dx,dy])=>pts.push([ox+dx, CY+dy])); ox+=96; }
      return pts;
    }

    case "whip": {
      return hPath(CY, (x, cy) => {
        const c = ((x-20)%20)/20;
        return cy+(c<0.3?c/0.3*12:c<0.7?12-(c-0.3)/0.4*24:-12+(c-0.7)/0.3*12);
      });
    }

    default:
      return hPath(CY, (x, cy) => cy);
  }
};

// ============================================================
// パターン定義
// ============================================================
const PATTERNS = [
  { id:"stringer",  name:"ストリンガー", en:"Stringer",  color:"#E85D04", posture:["下向き","横向き","立向き","上向き"], use:["初層","薄板","全姿勢"],   desc:"直線に進む最も基本的な運棒。溶け込みが深く初層や薄板に最適。" },
  { id:"zigzag",    name:"ジグザグ",     en:"Zigzag",    color:"#F59E0B", posture:["下向き","横向き"],               use:["すみ肉","開先充填"],         desc:"一定幅で左右に振る。ビード幅を広げたいときの基本技法。" },
  { id:"semicircle",name:"半円形",       en:"Semicircle",color:"#10B981", posture:["下向き","横向き"],               use:["肉盛り","補修"],             desc:"半円を描きながら前進。肉盛り・横向き溶接のビード整形に使う。" },
  { id:"cshape",    name:"C字形",        en:"C-Shape",   color:"#06B6D4", posture:["立向き","上向き"],               use:["立向き","上向き溶接"],       desc:"Cの字を繰り返す。立向き・上向きで溶融金属の垂れを防ぐ技法。" },
  { id:"figure8",   name:"8の字",        en:"Figure-8",  color:"#8B5CF6", posture:["下向き","横向き"],               use:["肉盛り","開先充填"],         desc:"8の字を描く。深い溶け込みと広いビード幅を同時に確保できる上級技法。" },
  { id:"wave",      name:"波形",         en:"Wave",      color:"#34D399", posture:["下向き","横向き"],               use:["薄板","外観重視"],           desc:"なめらかな波を描く。薄板の歪み抑制と美しいビード外観に優れる。" },
  { id:"triangle",  name:"三角形",       en:"Triangle",  color:"#A78BFA", posture:["下向き","立向き"],               use:["開先","すみ肉"],             desc:"三角形を描く。開先角度に沿った精密な溶け込みが可能。" },
  { id:"diamond",   name:"ダイヤ形",     en:"Diamond",   color:"#60A5FA", posture:["下向き"],                        use:["肉盛り","開先充填"],         desc:"菱形を描く。溶け込み深さと充填量のバランスに優れる。肉盛り補修に有効。" },
  { id:"whip",      name:"ウィップ",     en:"Whip",      color:"#EC4899", posture:["下向き","立向き"],               use:["被覆アーク","薄板"],         desc:"前進しながら素早く上下に振る。被覆アーク溶接で溶け込みと冷却を交互に行う。" },
];

// 母材タイプ定義
const MAT_TYPES = [
  { id:"flat",    name:"平板",   desc:"下向き溶接" },
  { id:"fillet",  name:"すみ肉", desc:"T継手・垂直板" },
  { id:"groove",  name:"V開先",  desc:"突合せ溶接" },
  { id:"buildup", name:"肉盛り", desc:"補修・肉盛り" },
];

const POSTURE_COLOR = {"下向き":"#E85D04","横向き":"#3B82F6","立向き":"#10B981","上向き":"#8B5CF6"};
const USE_COLOR = {"すみ肉":"#F59E0B","肉盛り":"#EF4444","開先充填":"#06B6D4","初層":"#34D399","薄板":"#A78BFA","全姿勢":"#EC4899","補修":"#FB923C","立向き":"#10B981","上向き溶接":"#8B5CF6","開先":"#06B6D4","外観重視":"#FCD34D","被覆アーク":"#F87171"};
const SPEEDS = [{label:"遅い",fps:0.25},{label:"普通",fps:0.7},{label:"速い",fps:1.6}];

// ============================================================
// 母材SVG
// ============================================================
function BaseMaterial({matType}) {
  if (matType === "fillet") {
    return (
      <g>
        {/* 水平板 */}
        <rect x="10" y="185" width="300" height="30" fill="#374151" rx="2"/>
        <rect x="10" y="183" width="300" height="5" fill="#4B5563" rx="1"/>
        {/* 垂直板 */}
        <rect x="148" y="20" width="24" height="168" fill="#374151" rx="2"/>
        <rect x="146" y="20" width="5" height="168" fill="#4B5563" rx="1"/>
        <rect x="167" y="20" width="5" height="168" fill="#4B5563" rx="1"/>
        {/* 溶接線ガイド（垂直板中心） */}
        <line x1="160" y1="20" x2="160" y2="185" stroke="#475569" strokeWidth="1" strokeDasharray="4,4"/>
        {/* 進行矢印（上向き） */}
        <text x="175" y="50" fontSize="9" fill="#475569">▲</text>
        <text x="172" y="62" fontSize="8" fill="#475569">進行</text>
      </g>
    );
  }
  if (matType === "groove") {
    return (
      <g>
        {/* 左板 */}
        <rect x="10" y="148" width="128" height="30" fill="#374151" rx="2"/>
        <rect x="10" y="146" width="128" height="5" fill="#4B5563" rx="1"/>
        {/* 右板 */}
        <rect x="182" y="148" width="128" height="30" fill="#374151" rx="2"/>
        <rect x="182" y="146" width="128" height="5" fill="#4B5563" rx="1"/>
        {/* V開先形状 */}
        <polygon points="138,148 155,118 165,118 182,148" fill="#0A0F1A" stroke="#4B5563" strokeWidth="1.5"/>
        {/* ルート部 */}
        <rect x="153" y="115" width="14" height="5" fill="#374151"/>
        {/* 溶接線ガイド */}
        <line x1="20" y1="118" x2="300" y2="118" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        <text x="268" y="113" fontSize="9" fill="#475569">→進行</text>
      </g>
    );
  }
  if (matType === "buildup") {
    return (
      <g>
        {/* ベース板（補修対象） */}
        <rect x="10" y="168" width="300" height="30" fill="#374151" rx="2"/>
        <rect x="10" y="166" width="300" height="5" fill="#4B5563" rx="1"/>
        {/* 既存ビード跡（肉盛り済み部分のイメージ） */}
        <rect x="10" y="155" width="80" height="14" fill="#4B5563" rx="1" opacity="0.6"/>
        <ellipse cx="90" cy="162" rx="6" ry="7" fill="#4B5563" opacity="0.5"/>
        {/* 溶接線ガイド（肉盛り面） */}
        <line x1="20" y1="158" x2="300" y2="158" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        <text x="268" y="153" fontSize="9" fill="#475569">→進行</text>
        <text x="12" y="148" fontSize="8" fill="#64748B">← 肉盛り済み</text>
      </g>
    );
  }
  // flat（平板）デフォルト
  return (
    <g>
      <rect x="10" y="168" width="300" height="30" fill="#374151" rx="2"/>
      <rect x="10" y="166" width="300" height="5" fill="#4B5563" rx="1"/>
      {[50,90,130,170,210,250,290].map(x=>(
        <line key={x} x1={x} y1="168" x2={x} y2="198" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>
      ))}
      <line x1="20" y1="166" x2="300" y2="166" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="268" y="161" fontSize="9" fill="#475569">→進行</text>
    </g>
  );
}

// ============================================================
// 溶接トーチ
// ============================================================
function WeldTorch({x, y, angle, color, running, tick}) {
  const torchAngle = angle + Math.PI * 0.8;
  const nLen = 24;
  const tx = x + Math.cos(torchAngle) * nLen;
  const ty = y + Math.sin(torchAngle) * nLen;
  const bodyAngle = torchAngle;
  const bx = tx + Math.cos(bodyAngle) * 10;
  const by = ty + Math.sin(bodyAngle) * 10;

  const sparks = running ? [0,60,120,180,240,300].map((deg,i)=>{
    const r = (deg + tick*8) % 360 * Math.PI / 180;
    const len = 5 + (i%3)*2;
    return <line key={i} x1={x} y1={y} x2={x+Math.cos(r)*len} y2={y+Math.sin(r)*len} stroke="#FCD34D" strokeWidth="1.2" opacity={0.6+(i%2)*0.3}/>;
  }) : null;

  return (
    <g>
      {/* アーク光 */}
      {running && <>
        <circle cx={x} cy={y} r="12" fill={color} opacity="0.1"/>
        <circle cx={x} cy={y} r="6" fill={color} opacity="0.2"/>
      </>}
      {sparks}
      {/* ワイヤー（ノズル先端→母材） */}
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      {/* ノズル */}
      <line x1={tx} y1={ty} x2={bx} y2={by} stroke="#94A3B8" strokeWidth="6" strokeLinecap="round"/>
      <line x1={tx} y1={ty} x2={bx} y2={by} stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
      {/* ノズル口 */}
      <circle cx={tx} cy={ty} r="3.5" fill="#64748B" stroke="#94A3B8" strokeWidth="1"/>
      {/* 溶接点 */}
      <circle cx={x} cy={y} r="4" fill={color} opacity="0.95"/>
      <circle cx={x} cy={y} r="1.8" fill="#fff"/>
    </g>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export function WeaveScreen() {
  const [selected, setSelected]   = useState(0);
  const [speed, setSpeed]         = useState(1);
  const [running, setRunning]     = useState(true);
  const [progress, setProgress]   = useState(0);
  const [matIdx, setMatIdx]       = useState(0);
  const [postureIdx, setPostureIdx] = useState(0);
  const [tick, setTick]           = useState(0);
  const animRef    = useRef(null);
  const progRef    = useRef(0);
  const lastRef    = useRef(null);
  const tickRef    = useRef(0);

  const pattern = PATTERNS[selected];
  const matType = MAT_TYPES[matIdx].id;
  const posture = pattern.posture[postureIdx] || pattern.posture[0];

  const paths = buildPaths(pattern.id, matType);

  useEffect(() => {
    progRef.current = 0; setProgress(0); lastRef.current = null;
  }, [selected, matIdx, postureIdx]);

  useEffect(() => {
    const step = (ts) => {
      if (running) {
        if (!lastRef.current) lastRef.current = ts;
        const d = (ts - lastRef.current) / 1000;
        lastRef.current = ts;
        tickRef.current += 1;
        progRef.current = (progRef.current + d * SPEEDS[speed].fps * 40) % Math.max(1, paths.length);
        setProgress(Math.floor(progRef.current));
        setTick(tickRef.current);
      } else { lastRef.current = null; }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, selected, matIdx, postureIdx, paths.length]);

  const idx   = Math.min(progress, paths.length - 1);
  const trail = paths.slice(Math.max(0, idx - 80), idx + 1);
  const cur   = paths[idx] || [20, 158];
  const prev  = paths[Math.max(0, idx - 4)] || cur;
  const angle = Math.atan2(cur[1]-prev[1], cur[0]-prev[0]);

  const F = "'Noto Sans JP', sans-serif";
  const BG = "#0F172A"; const CARD = "#1E293B"; const BORDER = "#334155";

  return (
    <div style={{fontFamily:F, background:BG, minHeight:"100vh", padding:"12px", color:"#F1F5F9"}}>

      {/* ヘッダー */}
      <div style={{textAlign:"center", marginBottom:10}}>
        <div style={{fontSize:10, color:"#94A3B8", letterSpacing:3, marginBottom:2}}>WEAVING TECHNIQUE</div>
        <div style={{fontSize:18, fontWeight:900, color:"#E85D04"}}>ウィービング道場</div>
      </div>

      {/* デモエリア */}
      <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px", marginBottom:10}}>

        {/* パターン名 */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7}}>
          <div>
            <span style={{fontSize:16, fontWeight:900, color:pattern.color}}>{pattern.name}</span>
            <span style={{fontSize:10, color:"#64748B", marginLeft:6}}>{pattern.en}</span>
          </div>
          <button onClick={()=>setRunning(r=>!r)}
            style={{background:running?"#E85D04":"#334155", border:"none", borderRadius:6, padding:"4px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"}}>
            {running?"⏸":"▶"}
          </button>
        </div>

        {/* 姿勢タグ */}
        <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:5}}>
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
        <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:7}}>
          <span style={{fontSize:9, color:"#64748B", lineHeight:"18px", marginRight:2}}>用途：</span>
          {pattern.use.map(u=>(
            <span key={u} style={{fontSize:10, background:`${USE_COLOR[u]||"#64748B"}22`,
              color:USE_COLOR[u]||"#94A3B8", border:`1px solid ${USE_COLOR[u]||"#64748B"}55`,
              borderRadius:4, padding:"1px 7px", fontWeight:700}}>{u}</span>
          ))}
        </div>

        {/* 母材選択 */}
        <div style={{display:"flex", gap:5, marginBottom:8, alignItems:"center"}}>
          <span style={{fontSize:10, color:"#64748B"}}>母材：</span>
          {MAT_TYPES.map((m,i)=>(
            <button key={m.id} onClick={()=>setMatIdx(i)}
              style={{background:matIdx===i?"#1E3A5F":"#0F172A",
                border:`1px solid ${matIdx===i?"#3B82F6":BORDER}`,
                borderRadius:6, padding:"3px 8px",
                color:matIdx===i?"#93C5FD":"#64748B",
                fontSize:10, fontWeight:700, cursor:"pointer"}}>
              {m.name}
            </button>
          ))}
        </div>

        {/* SVGキャンバス */}
        <svg width="100%" viewBox="0 0 320 220"
          style={{display:"block", background:"#0A0F1A", borderRadius:10, border:`1px solid ${BORDER}`}}>

          {/* グリッド */}
          {[55,110,165,220,275].map(x=>(
            <line key={`vg${x}`} x1={x} y1="0" x2={x} y2="220" stroke="#111827" strokeWidth="0.5"/>
          ))}
          {[44,88,132,176].map(y=>(
            <line key={`hg${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#111827" strokeWidth="0.5"/>
          ))}

          {/* 母材 */}
          <BaseMaterial matType={matType}/>

          {/* ビード跡 */}
          {trail.length > 1 && (
            <polyline
              points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")}
              fill="none" stroke={pattern.color}
              strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
          )}
          {trail.length > 1 && (
            <polyline
              points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")}
              fill="none" stroke="#fff"
              strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.12"/>
          )}

          {/* トーチ */}
          <WeldTorch x={cur[0]} y={cur[1]} angle={angle} color={pattern.color} running={running} tick={tick}/>

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
            <div style={{fontSize:9, color:"#475569", marginTop:2}}>{p.posture.join("・")}</div>
          </button>
        ))}
      </div>
      <div style={{height:40}}/>
    </div>
  );
}
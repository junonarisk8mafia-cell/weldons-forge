import { useState, useEffect, useRef } from "react";

// ============================================================
// パス生成
// flat:    水平 左→右 y=160
// fillet:  T継手角部 左→右 y=158（水平板面に沿って）
// groove:  V開先 上から俯瞰 左→右 y=160（開先中心）
// buildup: 肉盛り 左→右 y=155
// ============================================================
const buildPaths = (patternId, matType) => {
  const CY = matType==="fillet" ? 170 : matType==="groove" ? 155 : matType==="buildup" ? 155 : 162;

  const hPath=(cy,fn)=>{ const p=[]; for(let x=22;x<=298;x+=3) p.push([x,fn(x,cy)]); return p; };

  switch(patternId) {
    case "stringer": return hPath(CY,(x,cy)=>cy);
    case "zigzag": {
      const A=22,S=20;
      return hPath(CY,(x,cy)=>{const c=((x-22)%S)/S;return cy+(c<0.5?(c*2-0.5):(1.5-c*2))*A*2;});
    }
    case "semicircle": {
      const R=18,S=34;
      return hPath(CY,(x,cy)=>{const c=((x-22)%S)/S;return cy-Math.sin(c*Math.PI)*R;});
    }
    case "cshape": {
      const unit=[[0,0],[5,-8],[10,-15],[15,-20],[20,-23],[25,-20],[30,-15],[35,-8],[40,0]];
      const p=[]; let ox=22; while(ox+40<=298){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=40;} return p;
    }
    case "figure8": return hPath(CY,(x,cy)=>{const t=(x-22)/276;const ph=t*(276/50)*Math.PI*2;return cy+Math.sin(ph)*19*Math.cos(ph/2);});
    case "wave": return hPath(CY,(x,cy)=>cy+Math.sin((x-22)/38*Math.PI*2)*15);
    case "triangle": {
      const unit=[[0,0],[7,-12],[14,-22],[21,-27],[28,-22],[35,-12],[42,0]];
      const p=[]; let ox=22; while(ox+42<=298){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=42;} return p;
    }
    case "diamond": {
      const unit=[[0,0],[8,-13],[16,-23],[24,-30],[32,-23],[40,-13],[48,0],[56,13],[64,23],[72,30],[80,23],[88,13],[96,0]];
      const p=[]; let ox=22; while(ox+96<=298){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=96;} return p;
    }
    case "whip": return hPath(CY,(x,cy)=>{const c=((x-22)%20)/20;return cy+(c<0.3?c/0.3*10:c<0.7?10-(c-0.3)/0.4*20:-10+(c-0.7)/0.3*10);});
    default: return hPath(CY,(x,cy)=>cy);
  }
};

const PATTERNS = [
  {id:"stringer",  name:"ストリンガー", en:"Stringer",  color:"#E85D04", posture:["下向き","横向き","立向き","上向き"], use:["初層","薄板","全姿勢"],  desc:"直線に進む最も基本的な運棒。溶け込みが深く初層や薄板に最適。"},
  {id:"zigzag",    name:"ジグザグ",     en:"Zigzag",    color:"#F59E0B", posture:["下向き","横向き"],               use:["すみ肉","開先充填"],        desc:"一定幅で左右に振る。ビード幅を広げたいときの基本技法。"},
  {id:"semicircle",name:"半円形",       en:"Semicircle",color:"#10B981", posture:["下向き","横向き"],               use:["肉盛り","補修"],            desc:"半円を描きながら前進。肉盛り・横向き溶接のビード整形に使う。"},
  {id:"cshape",    name:"C字形",        en:"C-Shape",   color:"#06B6D4", posture:["立向き","上向き"],               use:["立向き","上向き溶接"],      desc:"Cの字を繰り返す。立向き・上向きで溶融金属の垂れを防ぐ技法。"},
  {id:"figure8",   name:"8の字",        en:"Figure-8",  color:"#8B5CF6", posture:["下向き","横向き"],               use:["肉盛り","開先充填"],        desc:"8の字を描く。深い溶け込みと広いビード幅を同時に確保できる上級技法。"},
  {id:"wave",      name:"波形",         en:"Wave",      color:"#34D399", posture:["下向き","横向き"],               use:["薄板","外観重視"],          desc:"なめらかな波を描く。薄板の歪み抑制と美しいビード外観に優れる。"},
  {id:"triangle",  name:"三角形",       en:"Triangle",  color:"#A78BFA", posture:["下向き","立向き"],               use:["開先","すみ肉"],            desc:"三角形を描く。開先角度に沿った精密な溶け込みが可能。"},
  {id:"diamond",   name:"ダイヤ形",     en:"Diamond",   color:"#60A5FA", posture:["下向き"],                        use:["肉盛り","開先充填"],        desc:"菱形を描く。溶け込み深さと充填量のバランスに優れる。"},
  {id:"whip",      name:"ウィップ",     en:"Whip",      color:"#EC4899", posture:["下向き","立向き"],               use:["被覆アーク","薄板"],        desc:"前進しながら素早く上下に振る。被覆アーク溶接の基本技法のひとつ。"},
];

const MAT_TYPES=[
  {id:"flat",    name:"平板"},
  {id:"fillet",  name:"すみ肉"},
  {id:"groove",  name:"V開先"},
  {id:"buildup", name:"肉盛り"},
];

const POSTURE_COLOR={"下向き":"#E85D04","横向き":"#3B82F6","立向き":"#10B981","上向き":"#8B5CF6"};
const USE_COLOR={"すみ肉":"#F59E0B","肉盛り":"#EF4444","開先充填":"#06B6D4","初層":"#34D399","薄板":"#A78BFA","全姿勢":"#EC4899","補修":"#FB923C","立向き":"#10B981","上向き溶接":"#8B5CF6","開先":"#06B6D4","外観重視":"#FCD34D","被覆アーク":"#F87171"};
const SPEEDS=[{label:"遅い",fps:0.25},{label:"普通",fps:0.7},{label:"速い",fps:1.6}];

// ============================================================
// 母材SVG
// ============================================================
function BaseMaterial({matType}) {

  if (matType==="fillet") {
    // T継手 斜め俯瞰イメージ（写真のようなアングル）
    return (
      <g>
        {/* 奥行き感のある水平板（台形で遠近感） */}
        <polygon points="22,175 298,175 310,205 10,205" fill="#374151"/>
        <polygon points="22,173 298,173 310,175 10,175" fill="#4B5563"/>
        {/* 水平板 質感 */}
        <line x1="80"  y1="175" x2="77"  y2="205" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>
        <line x1="140" y1="175" x2="136" y2="205" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>
        <line x1="200" y1="175" x2="195" y2="205" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>
        <line x1="260" y1="175" x2="254" y2="205" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>

        {/* 垂直板（立ち板）斜め俯瞰 */}
        <polygon points="148,80 172,80 175,175 145,175" fill="#4B5563"/>
        <polygon points="145,80 148,80 145,175" fill="#374151"/>
        <polygon points="172,80 178,80 178,175 175,175" fill="#2D3748"/>
        {/* 垂直板 正面 */}
        <rect x="148" y="80" width="24" height="95" fill="#374151" rx="1"/>
        <rect x="146" y="80" width="4" height="95" fill="#4B5563" rx="1"/>
        <rect x="170" y="80" width="4" height="95" fill="#2D3748" rx="1"/>

        {/* 溶接部（角部の盛り上がり） */}
        <ellipse cx="148" cy="174" rx="22" ry="5" fill="#E85D04" opacity="0.25" transform="rotate(-8 148 174)"/>
        <ellipse cx="148" cy="172" rx="16" ry="4" fill="#E85D04" opacity="0.4" transform="rotate(-8 148 172)"/>

        {/* 溶接線ガイド */}
        <line x1="22" y1="174" x2="298" y2="174" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>

        {/* 説明テキスト */}
        <text x="15" y="215" fontSize="9" fill="#64748B">T継手すみ肉 — 立板と水平板の角部を溶接</text>
        <text x="175" y="90" fontSize="8" fill="#94A3B8">立板</text>
        <text x="230" y="185" fontSize="8" fill="#94A3B8">水平板</text>
        <text x="15" y="170" fontSize="8" fill="#E85D04">← 溶接線</text>
        <text x="235" y="78" fontSize="9" fill="#475569">→ 進行方向</text>
        <line x1="230" y1="74" x2="298" y2="74" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
        <polygon points="298,70 310,74 298,78" fill="#475569"/>
      </g>
    );
  }

  if (matType==="groove") {
    // V開先 上から見た俯瞰図
    return (
      <g>
        {/* 左母材（上から見た平面） */}
        <rect x="22" y="100" width="128" height="90" fill="#374151" rx="2"/>
        <rect x="22" y="98" width="128" height="5" fill="#4B5563" rx="1"/>
        {/* 左母材の開先面（斜め） */}
        <polygon points="150,100 165,145 150,190" fill="#2D3748" stroke="#4B5563" strokeWidth="1"/>

        {/* 右母材（上から見た平面） */}
        <rect x="170" y="100" width="128" height="90" fill="#374151" rx="2"/>
        <rect x="170" y="98" width="128" height="5" fill="#4B5563" rx="1"/>
        {/* 右母材の開先面（斜め） */}
        <polygon points="170,100 155,145 170,190" fill="#2D3748" stroke="#4B5563" strokeWidth="1"/>

        {/* 開先部（V字の溝） */}
        <polygon points="150,100 165,145 155,145 170,100" fill="#0A0F1A" stroke="#334155" strokeWidth="1"/>
        <polygon points="165,145 150,190 170,190 155,145" fill="#0A0F1A" stroke="#334155" strokeWidth="1"/>

        {/* ルートギャップ */}
        <rect x="155" y="143" width="10" height="4" fill="#1E293B" rx="1"/>

        {/* 溶接線ガイド（開先中心） */}
        <line x1="22" y1="145" x2="298" y2="145" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>

        {/* 説明テキスト */}
        <text x="15" y="215" fontSize="9" fill="#64748B">V開先（上面） — トーチが開先溝の中心を進行</text>
        <text x="30" y="148" fontSize="8" fill="#94A3B8">左母材</text>
        <text x="215" y="148" fontSize="8" fill="#94A3B8">右母材</text>
        <text x="144" y="132" fontSize="7" fill="#64748B">開先</text>
        <text x="235" y="95" fontSize="9" fill="#475569">→ 進行方向</text>
        <line x1="230" y1="91" x2="298" y2="91" stroke="#475569" strokeWidth="1.2" strokeLinecap="round"/>
        <polygon points="298,87 310,91 298,95" fill="#475569"/>
      </g>
    );
  }

  if (matType==="buildup") {
    return (
      <g>
        <rect x="22" y="168" width="276" height="28" fill="#374151" rx="1"/>
        <rect x="22" y="166" width="276" height="4" fill="#4B5563" rx="1"/>
        <rect x="22" y="155" width="110" height="13" fill="#4B5563" rx="1" opacity="0.6"/>
        <ellipse cx="132" cy="161" rx="8" ry="6" fill="#4B5563" opacity="0.4"/>
        <line x1="22" y1="155" x2="298" y2="155" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        <text x="15" y="150" fontSize="8" fill="#64748B">← 肉盛り済み</text>
        <text x="235" y="150" fontSize="9" fill="#475569">→ 進行</text>
        <text x="15" y="210" fontSize="9" fill="#64748B">肉盛り補修 — 消耗した母材面を積み上げる</text>
      </g>
    );
  }

  // flat
  return (
    <g>
      <rect x="22" y="170" width="276" height="28" fill="#374151" rx="1"/>
      <rect x="22" y="168" width="276" height="4" fill="#4B5563" rx="1"/>
      {[60,100,140,180,220,260].map(x=>(
        <line key={x} x1={x} y1="170" x2={x} y2="198" stroke="#4B5563" strokeWidth="0.5" opacity="0.25"/>
      ))}
      <line x1="22" y1="168" x2="298" y2="168" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="235" y="163" fontSize="9" fill="#475569">→ 進行</text>
      <text x="15" y="210" fontSize="9" fill="#64748B">平板下向き溶接</text>
    </g>
  );
}

// ============================================================
// 溶接トーチ
// ============================================================
function WeldTorch({x,y,angle,color,running,tick}) {
  const ta=angle+Math.PI*0.8, nl=22;
  const tx=x+Math.cos(ta)*nl, ty=y+Math.sin(ta)*nl;
  const bx=tx+Math.cos(ta)*10, by=ty+Math.sin(ta)*10;
  return (
    <g>
      {running&&<><circle cx={x} cy={y} r="12" fill={color} opacity="0.1"/><circle cx={x} cy={y} r="6" fill={color} opacity="0.22"/></>}
      {running&&[0,60,120,180,240,300].map((deg,i)=>{
        const r=(deg+tick*8)%360*Math.PI/180,l=5+(i%3)*2;
        return <line key={i} x1={x} y1={y} x2={x+Math.cos(r)*l} y2={y+Math.sin(r)*l} stroke="#FCD34D" strokeWidth="1.2" opacity={0.5+(i%2)*0.4}/>;
      })}
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1={tx} y1={ty} x2={bx} y2={by} stroke="#94A3B8" strokeWidth="6" strokeLinecap="round"/>
      <line x1={tx} y1={ty} x2={bx} y2={by} stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
      <circle cx={tx} cy={ty} r="3.5" fill="#64748B" stroke="#94A3B8" strokeWidth="1"/>
      <circle cx={x} cy={y} r="4" fill={color} opacity="0.95"/>
      <circle cx={x} cy={y} r="1.8" fill="#fff"/>
    </g>
  );
}

// ============================================================
// メイン
// ============================================================
export function WeaveScreen() {
  const [selected,setSelected]     = useState(0);
  const [speed,setSpeed]           = useState(1);
  const [running,setRunning]       = useState(true);
  const [progress,setProgress]     = useState(0);
  const [matIdx,setMatIdx]         = useState(0);
  const [postureIdx,setPostureIdx] = useState(0);
  const [tick,setTick]             = useState(0);
  const animRef=useRef(null),progRef=useRef(0),lastRef=useRef(null),tickRef=useRef(0);

  const pattern=PATTERNS[selected];
  const matType=MAT_TYPES[matIdx].id;
  const paths=buildPaths(pattern.id,matType);

  useEffect(()=>{progRef.current=0;setProgress(0);lastRef.current=null;},[selected,matIdx,postureIdx]);

  useEffect(()=>{
    const step=(ts)=>{
      if(running){
        if(!lastRef.current)lastRef.current=ts;
        const d=(ts-lastRef.current)/1000;lastRef.current=ts;
        tickRef.current+=1;
        progRef.current=(progRef.current+d*SPEEDS[speed].fps*40)%Math.max(1,paths.length);
        setProgress(Math.floor(progRef.current));setTick(tickRef.current);
      }else{lastRef.current=null;}
      animRef.current=requestAnimationFrame(step);
    };
    animRef.current=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(animRef.current);
  },[running,speed,selected,matIdx,postureIdx,paths.length]);

  const idx=Math.min(progress,paths.length-1);
  const trail=paths.slice(Math.max(0,idx-80),idx+1);
  const cur=paths[idx]||[22,162];
  const prev=paths[Math.max(0,idx-4)]||cur;
  const angle=Math.atan2(cur[1]-prev[1],cur[0]-prev[0]);

  const F="'Noto Sans JP', sans-serif";
  const BG="#0F172A",CARD="#1E293B",BORDER="#334155";

  return (
    <div style={{fontFamily:F,background:BG,minHeight:"100vh",padding:"12px",color:"#F1F5F9"}}>
      <div style={{textAlign:"center",marginBottom:10}}>
        <div style={{fontSize:10,color:"#94A3B8",letterSpacing:3,marginBottom:2}}>WEAVING TECHNIQUE</div>
        <div style={{fontSize:18,fontWeight:900,color:"#E85D04"}}>ウィービング道場</div>
      </div>

      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px",marginBottom:10}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <div>
            <span style={{fontSize:16,fontWeight:900,color:pattern.color}}>{pattern.name}</span>
            <span style={{fontSize:10,color:"#64748B",marginLeft:6}}>{pattern.en}</span>
          </div>
          <button onClick={()=>setRunning(r=>!r)}
            style={{background:running?"#E85D04":"#334155",border:"none",borderRadius:6,padding:"4px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {running?"⏸":"▶"}
          </button>
        </div>

        {/* 姿勢 */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>
          <span style={{fontSize:9,color:"#64748B",lineHeight:"22px",marginRight:2}}>姿勢：</span>
          {pattern.posture.map((p,i)=>(
            <button key={p} onClick={()=>setPostureIdx(i)}
              style={{fontSize:11,background:postureIdx===i?`${POSTURE_COLOR[p]}33`:"transparent",
                color:postureIdx===i?POSTURE_COLOR[p]:"#64748B",
                border:`1.5px solid ${postureIdx===i?POSTURE_COLOR[p]:"#334155"}`,
                borderRadius:5,padding:"2px 8px",fontWeight:700,cursor:"pointer"}}>{p}</button>
          ))}
        </div>

        {/* 用途 */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
          <span style={{fontSize:9,color:"#64748B",lineHeight:"18px",marginRight:2}}>用途：</span>
          {pattern.use.map(u=>(
            <span key={u} style={{fontSize:10,background:`${USE_COLOR[u]||"#64748B"}22`,
              color:USE_COLOR[u]||"#94A3B8",border:`1px solid ${USE_COLOR[u]||"#64748B"}55`,
              borderRadius:4,padding:"1px 7px",fontWeight:700}}>{u}</span>
          ))}
        </div>

        {/* 母材 */}
        <div style={{display:"flex",gap:5,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#64748B"}}>母材：</span>
          {MAT_TYPES.map((m,i)=>(
            <button key={m.id} onClick={()=>{setMatIdx(i);}}
              style={{background:matIdx===i?"#1E3A5F":"#0F172A",
                border:`1px solid ${matIdx===i?"#3B82F6":BORDER}`,
                borderRadius:6,padding:"3px 8px",
                color:matIdx===i?"#93C5FD":"#64748B",
                fontSize:10,fontWeight:700,cursor:"pointer"}}>{m.name}</button>
          ))}
        </div>

        {/* SVG */}
        <svg width="100%" viewBox="0 0 320 220"
          style={{display:"block",background:"#0A0F1A",borderRadius:10,border:`1px solid ${BORDER}`}}>
          {[55,110,165,220,275].map(x=><line key={`vg${x}`} x1={x} y1="0" x2={x} y2="220" stroke="#111827" strokeWidth="0.5"/>)}
          {[44,88,132,176].map(y=><line key={`hg${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#111827" strokeWidth="0.5"/>)}
          <BaseMaterial matType={matType}/>
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke={pattern.color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>}
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.12"/>}
          <WeldTorch x={cur[0]} y={cur[1]} angle={angle} color={pattern.color} running={running} tick={tick}/>
        </svg>

        {/* 説明 */}
        <div style={{marginTop:8,fontSize:11,color:"#94A3B8",lineHeight:1.7,background:"#0A0F1A",borderRadius:8,padding:"8px 10px"}}>
          {pattern.desc}
        </div>

        {/* スピード */}
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#64748B"}}>速度：</span>
          {SPEEDS.map((s,i)=>(
            <button key={i} onClick={()=>setSpeed(i)}
              style={{background:speed===i?"#E85D04":"#1E293B",border:`1px solid ${speed===i?"#E85D04":BORDER}`,borderRadius:6,padding:"3px 10px",color:speed===i?"#fff":"#64748B",fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{fontSize:10,color:"#64748B",marginBottom:6,letterSpacing:1}}>▼ パターンを選択</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {PATTERNS.map((p,i)=>(
          <button key={p.id} onClick={()=>{setSelected(i);setPostureIdx(0);}}
            style={{background:selected===i?`${p.color}18`:CARD,border:`1.5px solid ${selected===i?p.color:BORDER}`,borderRadius:10,padding:"9px 10px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:800,color:selected===i?p.color:"#F1F5F9"}}>{p.name}</span>
            </div>
            <div style={{fontSize:9,color:"#475569",marginTop:2}}>{p.posture.join("・")}</div>
          </button>
        ))}
      </div>
      <div style={{height:40}}/>
    </div>
  );
}
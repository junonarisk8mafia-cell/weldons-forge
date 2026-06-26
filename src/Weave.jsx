import { useState, useEffect, useRef } from "react";

// ============================================================
// パス生成
// ============================================================
const buildPaths = (patternId, matType, layer) => {
  const isVert = matType === "fillet";

  // 溶接中心線の座標
  // groove: Root=y192, Fill=y174, Cap=y158
  // fillet: 垂直板左側 x=130, Root=y178, Fill=y163, Cap=y148
  // flat: y=163
  // buildup: y=158

  let CY = 163;
  let CX = 130; // fillet用

  if (matType === "groove") {
    CY = layer==="root" ? 192 : layer==="fill" ? 174 : 158;
  } else if (matType === "buildup") {
    CY = 158;
  } else if (matType === "fillet") {
    CX = 130;
    // Root: 角部すぐ y=178, Fill: y=163, Cap: y=148
  }

  const filletStartY = layer==="root" ? 182 : layer==="fill" ? 167 : 152;
  const filletEndY   = layer==="root" ? 155 : layer==="fill" ? 138 : 122;

  const hPath=(cy,fn)=>{ const p=[]; for(let x=20;x<=300;x+=3) p.push([x,fn(x,cy)]); return p; };
  const vPath=(startY,endY,fn)=>{ const p=[]; for(let y=startY;y>=endY;y-=3) p.push(fn(y)); return p; };

  if (isVert) {
    // すみ肉: 垂直方向パス
    const amp = layer==="root"?8:layer==="fill"?14:20;
    switch(patternId) {
      case "stringer": return vPath(filletStartY,filletEndY,y=>[CX,y]);
      case "zigzag": {
        const S=16;
        return vPath(filletStartY,filletEndY,y=>{
          const c=((filletStartY-y)%S)/S;
          return [CX+(c<0.5?(c*2-0.5):(1.5-c*2))*amp*2, y];
        });
      }
      case "semicircle": {
        const S=28;
        return vPath(filletStartY,filletEndY,y=>{
          const c=((filletStartY-y)%S)/S;
          return [CX+Math.sin(c*Math.PI)*amp, y];
        });
      }
      case "cshape": {
        const unit=[[0,0],[amp*0.3,5],[amp*0.6,10],[amp*0.85,15],[amp,19],[amp*0.85,24],[amp*0.6,29],[amp*0.3,33],[0,36]];
        const p=[]; let oy=filletStartY;
        while(oy-36>=filletEndY){ unit.forEach(([dx,dy])=>p.push([CX+dx, oy-dy])); oy-=36; }
        return p;
      }
      case "triangle": {
        const unit=[[0,0],[amp*0.4,6],[amp*0.8,12],[amp,18],[amp*0.8,24],[amp*0.4,30],[0,36]];
        const p=[]; let oy=filletStartY;
        while(oy-36>=filletEndY){ unit.forEach(([dx,dy])=>p.push([CX+dx, oy-dy])); oy-=36; }
        return p;
      }
      default: return vPath(filletStartY,filletEndY,y=>[CX,y]);
    }
  }

  // 水平パス（flat/groove/buildup）
  const amp = matType==="groove" ? (layer==="root"?8:layer==="fill"?14:20) : 18;
  switch(patternId) {
    case "stringer": return hPath(CY,(x,cy)=>cy);
    case "zigzag": {
      const S=18;
      return hPath(CY,(x,cy)=>{const c=((x-20)%S)/S;return cy+(c<0.5?(c*2-0.5):(1.5-c*2))*amp*2;});
    }
    case "semicircle": {
      const S=32;
      return hPath(CY,(x,cy)=>{const c=((x-20)%S)/S;return cy-Math.sin(c*Math.PI)*amp;});
    }
    case "cshape": {
      const unit=[[0,0],[5,-amp*0.32],[10,-amp*0.6],[15,-amp*0.84],[20,-amp],[25,-amp*0.84],[30,-amp*0.6],[35,-amp*0.32],[40,0]];
      const p=[]; let ox=20; while(ox+40<=300){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=40;} return p;
    }
    case "figure8": return hPath(CY,(x,cy)=>{const t=(x-20)/280;const ph=t*(280/50)*Math.PI*2;return cy+Math.sin(ph)*amp*0.85*Math.cos(ph/2);});
    case "wave": return hPath(CY,(x,cy)=>cy+Math.sin((x-20)/36*Math.PI*2)*amp*0.7);
    case "triangle": {
      const unit=[[0,0],[7,-amp*0.4],[14,-amp*0.8],[21,-amp],[28,-amp*0.8],[35,-amp*0.4],[42,0]];
      const p=[]; let ox=20; while(ox+42<=300){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=42;} return p;
    }
    case "diamond": {
      const unit=[[0,0],[8,-amp*0.4],[16,-amp*0.75],[24,-amp],[32,-amp*0.75],[40,-amp*0.4],[48,0],[56,amp*0.4],[64,amp*0.75],[72,amp],[80,amp*0.75],[88,amp*0.4],[96,0]];
      const p=[]; let ox=20; while(ox+96<=300){unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=96;} return p;
    }
    case "whip": return hPath(CY,(x,cy)=>{const c=((x-20)%20)/20;return cy+(c<0.3?c/0.3*10:c<0.7?10-(c-0.3)/0.4*20:-10+(c-0.7)/0.3*10);});
    default: return hPath(CY,(x,cy)=>cy);
  }
};

// ============================================================
// パターン・設定定義
// ============================================================
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
const LAYERS=[
  {id:"root", name:"Root", desc:"初層",   color:"#EF4444"},
  {id:"fill", name:"Fill", desc:"充填層", color:"#F59E0B"},
  {id:"cap",  name:"Cap",  desc:"仕上げ", color:"#10B981"},
];
const POSTURE_COLOR={"下向き":"#E85D04","横向き":"#3B82F6","立向き":"#10B981","上向き":"#8B5CF6"};
const USE_COLOR={"すみ肉":"#F59E0B","肉盛り":"#EF4444","開先充填":"#06B6D4","初層":"#34D399","薄板":"#A78BFA","全姿勢":"#EC4899","補修":"#FB923C","立向き":"#10B981","上向き溶接":"#8B5CF6","開先":"#06B6D4","外観重視":"#FCD34D","被覆アーク":"#F87171"};
const SPEEDS=[{label:"遅い",fps:0.25},{label:"普通",fps:0.7},{label:"速い",fps:1.6}];

// ============================================================
// 母材SVG（正しい断面形状）
// ============================================================
function BaseMaterial({matType, layer, layerIdx}) {

  if (matType==="fillet") {
    return (
      <g>
        {/* 水平板 */}
        <rect x="10" y="185" width="300" height="28" fill="#374151" rx="1"/>
        <rect x="10" y="183" width="300" height="4" fill="#4B5563" rx="1"/>
        {/* 垂直板 */}
        <rect x="143" y="15" width="24" height="170" fill="#374151" rx="1"/>
        <rect x="141" y="15" width="4" height="170" fill="#4B5563" rx="1"/>
        <rect x="165" y="15" width="4" height="170" fill="#4B5563" rx="1"/>

        {/* 左すみ肉部（三角形の空間） */}
        <polygon points="143,183 143,155 112,183" fill="#0F172A"/>
        <line x1="143" y1="183" x2="112" y2="183" stroke="#475569" strokeWidth="0.5"/>
        <line x1="143" y1="155" x2="112" y2="183" stroke="#475569" strokeWidth="0.5"/>

        {/* 既存ビード表示 */}
        {layerIdx>=1 && <ellipse cx="127" cy="177" rx="14" ry="6" fill="#EF4444" opacity="0.55" transform="rotate(-45 127 177)"/>}
        {layerIdx>=2 && <ellipse cx="122" cy="166" rx="18" ry="7" fill="#F59E0B" opacity="0.5" transform="rotate(-45 122 166)"/>}

        {/* 進行ガイド */}
        <line x1="130" y1="15" x2="130" y2="183" stroke="#475569" strokeWidth="1" strokeDasharray="4,4"/>

        {/* 層ラベル */}
        <text x="170" y="186" fontSize="8" fill="#EF4444">Root</text>
        <text x="170" y="170" fontSize="8" fill="#F59E0B">Fill</text>
        <text x="170" y="154" fontSize="8" fill="#10B981">Cap</text>
        <text x="15" y="32" fontSize="9" fill="#475569">▲ 進行</text>
        <text x="15" y="210" fontSize="8" fill="#64748B">断面図 / T継手すみ肉</text>
      </g>
    );
  }

  if (matType==="groove") {
    const rootY=192, fillY=174, capY=158;
    const guideY = layer==="root"?rootY:layer==="fill"?fillY:capY;
    return (
      <g>
        {/* 左母材（斜めカット） */}
        <polygon points="10,145 115,145 130,195 10,195" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
        <rect x="10" y="193" width="300" height="15" fill="#374151"/>
        {/* 右母材（斜めカット） */}
        <polygon points="310,145 205,145 190,195 310,195" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
        {/* 断面の縁取り */}
        <line x1="10" y1="145" x2="115" y2="145" stroke="#4B5563" strokeWidth="2"/>
        <line x1="310" y1="145" x2="205" y2="145" stroke="#4B5563" strokeWidth="2"/>
        <line x1="115" y1="145" x2="130" y2="195" stroke="#5B6B7C" strokeWidth="1.5"/>
        <line x1="205" y1="145" x2="190" y2="195" stroke="#5B6B7C" strokeWidth="1.5"/>

        {/* 開先内部（溶接空間） */}
        <polygon points="115,145 160,145 205,145 190,195 130,195" fill="#0A0F1A"/>

        {/* ルート部 */}
        <rect x="127" y="192" width="26" height="5" fill="#4B5563" rx="1"/>

        {/* 既存ビード */}
        {layerIdx>=1 && <ellipse cx="160" cy="192" rx="16" ry="4" fill="#EF4444" opacity="0.65"/>}
        {layerIdx>=2 && <ellipse cx="160" cy="175" rx="24" ry="5" fill="#F59E0B" opacity="0.6"/>}

        {/* 現在層ガイドライン */}
        <line x1="20" y1={guideY} x2="300" y2={guideY} stroke={layer==="root"?"#EF4444":layer==="fill"?"#F59E0B":"#10B981"} strokeWidth="1" strokeDasharray="5,4" opacity="0.6"/>

        {/* 層ラベル */}
        <text x="270" y={rootY-3} fontSize="8" fill="#EF4444">Root</text>
        <text x="270" y={fillY-3} fontSize="8" fill="#F59E0B">Fill</text>
        <text x="274" y={capY-3} fontSize="8" fill="#10B981">Cap</text>
        <text x="12" y="140" fontSize="8" fill="#64748B">断面図 / V開先</text>
        <text x="260" y="136" fontSize="9" fill="#475569">→進行</text>
      </g>
    );
  }

  if (matType==="buildup") {
    return (
      <g>
        <rect x="10" y="170" width="300" height="28" fill="#374151" rx="1"/>
        <rect x="10" y="168" width="300" height="4" fill="#4B5563" rx="1"/>
        {/* 既存肉盛り */}
        <rect x="10" y="156" width="115" height="14" fill="#4B5563" rx="1" opacity="0.65"/>
        <ellipse cx="125" cy="163" rx="9" ry="7" fill="#4B5563" opacity="0.45"/>
        <line x1="20" y1="158" x2="300" y2="158" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
        <text x="12" y="152" fontSize="8" fill="#64748B">← 肉盛り済み</text>
        <text x="260" y="152" fontSize="9" fill="#475569">→進行</text>
        <text x="12" y="184" fontSize="8" fill="#64748B">断面図 / 肉盛り補修</text>
      </g>
    );
  }

  // flat
  return (
    <g>
      <rect x="10" y="172" width="300" height="28" fill="#374151" rx="1"/>
      <rect x="10" y="170" width="300" height="4" fill="#4B5563" rx="1"/>
      {[50,90,130,170,210,250,290].map(x=>(
        <line key={x} x1={x} y1="172" x2={x} y2="200" stroke="#4B5563" strokeWidth="0.5" opacity="0.25"/>
      ))}
      <line x1="20" y1="170" x2="300" y2="170" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="260" y="165" fontSize="9" fill="#475569">→進行</text>
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
  const [layerIdx,setLayerIdx]     = useState(0);
  const [tick,setTick]             = useState(0);
  const animRef=useRef(null),progRef=useRef(0),lastRef=useRef(null),tickRef=useRef(0);

  const pattern=PATTERNS[selected];
  const matType=MAT_TYPES[matIdx].id;
  const layer=LAYERS[layerIdx].id;
  const showLayers=matType==="groove"||matType==="fillet";
  const paths=buildPaths(pattern.id,matType,layer);
  const activeColor=showLayers?LAYERS[layerIdx].color:pattern.color;

  useEffect(()=>{progRef.current=0;setProgress(0);lastRef.current=null;},[selected,matIdx,postureIdx,layerIdx]);

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
  },[running,speed,selected,matIdx,postureIdx,layerIdx,paths.length]);

  const idx=Math.min(progress,paths.length-1);
  const trail=paths.slice(Math.max(0,idx-80),idx+1);
  const cur=paths[idx]||[20,163];
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

        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
          <span style={{fontSize:9,color:"#64748B",lineHeight:"18px",marginRight:2}}>用途：</span>
          {pattern.use.map(u=>(
            <span key={u} style={{fontSize:10,background:`${USE_COLOR[u]||"#64748B"}22`,
              color:USE_COLOR[u]||"#94A3B8",border:`1px solid ${USE_COLOR[u]||"#64748B"}55`,
              borderRadius:4,padding:"1px 7px",fontWeight:700}}>{u}</span>
          ))}
        </div>

        <div style={{display:"flex",gap:5,marginBottom:showLayers?6:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#64748B"}}>母材：</span>
          {MAT_TYPES.map((m,i)=>(
            <button key={m.id} onClick={()=>{setMatIdx(i);setLayerIdx(0);}}
              style={{background:matIdx===i?"#1E3A5F":"#0F172A",
                border:`1px solid ${matIdx===i?"#3B82F6":BORDER}`,
                borderRadius:6,padding:"3px 8px",
                color:matIdx===i?"#93C5FD":"#64748B",
                fontSize:10,fontWeight:700,cursor:"pointer"}}>{m.name}</button>
          ))}
        </div>

        {showLayers&&(
          <div style={{display:"flex",gap:5,marginBottom:8,alignItems:"center"}}>
            <span style={{fontSize:10,color:"#64748B"}}>溶接層：</span>
            {LAYERS.map((l,i)=>(
              <button key={l.id} onClick={()=>setLayerIdx(i)}
                style={{background:layerIdx===i?`${l.color}33`:"#0F172A",
                  border:`1.5px solid ${layerIdx===i?l.color:BORDER}`,
                  borderRadius:6,padding:"3px 10px",
                  color:layerIdx===i?l.color:"#64748B",
                  fontSize:10,fontWeight:700,cursor:"pointer"}}>
                {l.name}<span style={{fontSize:8,marginLeft:3,opacity:0.7}}>{l.desc}</span>
              </button>
            ))}
          </div>
        )}

        <svg width="100%" viewBox="0 0 320 220"
          style={{display:"block",background:"#0A0F1A",borderRadius:10,border:`1px solid ${BORDER}`}}>
          {[55,110,165,220,275].map(x=><line key={`vg${x}`} x1={x} y1="0" x2={x} y2="220" stroke="#111827" strokeWidth="0.5"/>)}
          {[44,88,132,176].map(y=><line key={`hg${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#111827" strokeWidth="0.5"/>)}
          <BaseMaterial matType={matType} layer={layer} layerIdx={layerIdx}/>
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke={activeColor} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>}
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.12"/>}
          <WeldTorch x={cur[0]} y={cur[1]} angle={angle} color={activeColor} running={running} tick={tick}/>
        </svg>

        <div style={{marginTop:8,fontSize:11,color:"#94A3B8",lineHeight:1.7,background:"#0A0F1A",borderRadius:8,padding:"8px 10px"}}>
          {showLayers?`【${LAYERS[layerIdx].name}層 / ${LAYERS[layerIdx].desc}】${pattern.desc}`:pattern.desc}
        </div>

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
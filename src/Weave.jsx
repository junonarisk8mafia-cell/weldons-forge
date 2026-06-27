import { useState, useEffect, useRef } from "react";

// ============================================================
// パス生成
// flat/buildup: 水平 左→右
// groove:       縦方向 上→下（奥から手前）x中心=160
// fillet:       水平 左→右 y=172（角部）
// ============================================================

const buildFlatPath = (patternId, CY) => {
  const h=(cy,fn)=>{ const p=[]; for(let x=22;x<=298;x+=3) p.push([x,fn(x,cy)]); return p; };
  switch(patternId) {
    case "stringer":   return h(CY,(x,cy)=>cy);
    case "zigzag":     {
      // 両端で止まり、中央はスーッと通過する正しいジグザグ
      // 1サイクル=20px前進: 左端止まり→中央スーッ→右端止まり→中央スーッ
      const unit = [
        [0,-22],[1,-22],[2,-22],          // 左端で止まる
        [5,-14],[8,-5],[11,5],[14,14],    // 中央スーッと通過
        [17,22],[18,22],[19,22],[20,22],  // 右端で止まる
        [23,14],[26,5],[29,-5],[32,-14],  // 中央スーッと通過
        [35,-22],[36,-22],[37,-22],[38,-22] // 左端で止まる
      ];
      const p=[]; let ox=22;
      while(ox+38<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=38; }
      return p;
    }
    case "semicircle": {
      // 半円形: 片側だけ弧を描いて戻る、両端止まり
      const unit = [
        [0,0],[1,0],[2,0],               // スタート端で止まる
        [4,-6],[6,-11],[8,-16],[10,-20],  // 弧の上昇
        [12,-22],[13,-22],[14,-22],       // 頂点で止まる
        [16,-20],[18,-16],[20,-11],[22,-6],// 弧の下降
        [24,0],[25,0],[26,0]             // 戻り端で止まる
      ];
      const p=[]; let ox=22;
      while(ox+26<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=26; }
      return p;
    }
    case "cshape":     {
      // C字形: Cの字を描きながら前進、両端で止まる
      const unit = [
        [0,0],[1,0],[2,0],               // 開始端で止まる
        [3,-5],[5,-10],[7,-15],[9,-19],[11,-22],
        [13,-24],[14,-24],[15,-24],       // 上端で止まる
        [17,-22],[19,-18],[21,-12],[23,-5],
        [25,0],[26,0],[27,0],            // 中央端で止まる（Cの折り返し）
        [29,-5],[31,-10],[33,-15],        // 少し戻る
        [35,-18],[36,-18]               // 次のCへ
      ];
      const p=[]; let ox=22;
      while(ox+36<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=36; }
      return p;
    }
    case "figure8":    {
      // 8の字: 上ループ→下ループを繰り返しながら前進
      // 両端（上端・下端）で止まる
      const unit = [
        [0,0],[2,-5],[4,-10],[6,-15],[8,-19],[10,-21],
        [12,-22],[13,-22],[14,-22],       // 上端で止まる
        [16,-21],[18,-19],[20,-15],[22,-10],[24,-5],
        [26,0],[27,0],                    // 中心通過
        [28,5],[30,10],[32,15],[34,19],[36,21],
        [38,22],[39,22],[40,22],          // 下端で止まる
        [42,21],[44,19],[46,15],[48,10],[50,5],
        [52,0]                            // 1サイクル完了
      ];
      const p=[]; let ox=22;
      while(ox+52<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=52; }
      return p;
    }
    case "wave":       {
      // 波形: なめらかな波、両端で少し遅く（止まりは少なめ）
      const unit = [
        [0,0],[2,-5],[4,-10],[6,-14],[8,-17],[10,-19],
        [12,-20],[13,-20],[14,-20],       // 頂点でわずかに止まる
        [16,-19],[18,-17],[20,-14],[22,-10],[24,-5],
        [26,0],[28,5],[30,10],[32,14],[34,17],[36,19],
        [38,20],[39,20],[40,20],          // 底点でわずかに止まる
        [42,19],[44,17],[46,14],[48,10],[50,5],
        [52,0]
      ];
      const p=[]; let ox=22;
      while(ox+52<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=52; }
      return p;
    }
    case "triangle":   {
      // 三角形: 3頂点で止まりながら前進
      const unit = [
        [0,0],[1,0],[2,0],               // 底辺端で止まる
        [4,-8],[6,-16],[8,-22],[10,-26],
        [11,-28],[12,-28],[13,-28],       // 頂点で止まる
        [15,-26],[17,-22],[19,-16],[21,-8],
        [23,0],[24,0],[25,0],            // 底辺中央で止まる
        [27,8],[29,14],[31,18],
        [33,20],[34,20],                 // 下頂点で止まる（三角形によっては省略）
        [36,18],[38,14],[40,8],
        [42,0]
      ];
      const p=[]; let ox=22;
      while(ox+42<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=42; }
      return p;
    }
    case "diamond":    {
      // ダイヤ形: 上→右→下→左の菱形、各頂点で止まる
      const unit = [
        [0,0],[2,-6],[4,-12],[6,-18],[8,-22],
        [9,-24],[10,-24],[11,-24],        // 上頂点で止まる
        [13,-22],[15,-18],[17,-12],[19,-6],
        [21,0],[22,0],                    // 中心通過
        [23,6],[25,12],[27,18],[29,22],
        [30,24],[31,24],[32,24],          // 下頂点で止まる
        [34,22],[36,18],[38,12],[40,6],
        [42,0]                            // 1サイクル完了
      ];
      const p=[]; let ox=22;
      while(ox+42<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=42; }
      return p;
    }
    case "whip":       return h(CY,(x,cy)=>{const c=((x-22)%20)/20;return cy+(c<0.3?c/0.3*10:c<0.7?10-(c-0.3)/0.4*20:-10+(c-0.7)/0.3*10);});
    default:           return h(CY,(x,cy)=>cy);
  }
};

// V開先: 縦方向（上→下）x中心=160、溝幅に合わせてウィービング
const buildGroovePath = (patternId) => {
  const CX = 160; // 溝の中心x
  const v=(cx,fn)=>{ const p=[]; for(let y=40;y<=195;y+=3) p.push([fn(y,cx),y]); return p; };
  switch(patternId) {
    case "stringer":   return v(CX,(y,cx)=>cx);
    case "zigzag":     { const A=10,S=22; return v(CX,(y,cx)=>{const c=((y-40)%S)/S;return cx+(c<0.5?(c*2-0.5):(1.5-c*2))*A*2;}); }
    case "semicircle": { const R=9,S=30; return v(CX,(y,cx)=>{const c=((y-40)%S)/S;return cx+Math.sin(c*Math.PI)*R;}); }
    case "cshape":     { const u=[[0,0],[5,4],[9,8],[12,11],[14,13],[12,16],[9,20],[5,23],[0,26]]; const p=[]; let oy=40; while(oy+26<=195){u.forEach(([dy,dx])=>p.push([CX+dx,oy+dy]));oy+=26;} return p; }
    case "figure8":    return v(CX,(y,cx)=>{const t=(y-40)/155;const ph=t*(155/40)*Math.PI*2;return cx+Math.sin(ph)*10*Math.cos(ph/2);});
    case "wave":       return v(CX,(y,cx)=>cx+Math.sin((y-40)/28*Math.PI*2)*8);
    case "triangle":   { const u=[[0,0],[5,-6],[10,-10],[15,-12],[20,-10],[25,-6],[30,0]]; const p=[]; let oy=40; while(oy+30<=195){u.forEach(([dy,dx])=>p.push([CX+dx,oy+dy]));oy+=30;} return p; }
    case "diamond":    { const u=[[0,0],[6,-8],[12,-13],[18,-15],[24,-13],[30,-8],[36,0],[42,8],[48,13],[54,15],[60,13],[66,8],[72,0]]; const p=[]; let oy=40; while(oy+72<=195){u.forEach(([dy,dx])=>p.push([CX+dx,oy+dy]));oy+=72;} return p; }
    case "whip":       return v(CX,(y,cx)=>{const c=((y-40)%18)/18;return cx+(c<0.3?c/0.3*8:c<0.7?8-(c-0.3)/0.4*16:-8+(c-0.7)/0.3*8);});
    default:           return v(CX,(y,cx)=>cx);
  }
};

// すみ肉: 水平 左→右 y=172（角部）
const buildFilletPath = (patternId) => {
  const CY = 176;
  const h=(cy,fn)=>{ const p=[]; for(let x=22;x<=298;x+=3) p.push([x,fn(x,cy)]); return p; };
  switch(patternId) {
    case "stringer":   return h(CY,(x,cy)=>cy);
    case "zigzag":     { const A=16,S=20; return h(CY,(x,cy)=>{const c=((x-22)%S)/S;return cy+(c<0.5?(c*2-0.5):(1.5-c*2))*A*2;}); }
    case "semicircle": { const R=14,S=30; return h(CY,(x,cy)=>{const c=((x-22)%S)/S;return cy-Math.sin(c*Math.PI)*R;}); }
    case "cshape":     { const u=[[0,0],[5,-7],[10,-13],[15,-17],[18,-19],[15,-22],[10,-19],[5,-14],[0,-8]]; const p=[]; let ox=22; while(ox+36<=298){u.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=36;} return p; }
    case "figure8":    {
      const unit = [[0,0],[3,-6],[6,-11],[9,-14],[12,-16],[15,-14],[18,-11],[21,-6],[24,0],[27,6],[30,11],[33,14],[36,16],[39,14],[42,11],[45,6],[48,0]];
      const p=[]; let ox=22; while(ox+48<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=48; } return p;
    }
    case "wave":       return h(CY,(x,cy)=>cy+Math.sin((x-22)/36*Math.PI*2)*12);
    case "triangle":   { const u=[[0,0],[6,-10],[12,-18],[18,-22],[24,-18],[30,-10],[36,0]]; const p=[]; let ox=22; while(ox+36<=298){u.forEach(([dx,dy])=>p.push([ox+dx,CY+dy]));ox+=36;} return p; }
    case "diamond":    {
      const unit = [[0,0],[4,-8],[8,-15],[12,-20],[16,-24],[20,-20],[24,-15],[28,-8],[32,0],[36,8],[40,15],[44,20],[48,24],[52,20],[56,15],[60,8],[64,0]];
      const p=[]; let ox=22; while(ox+64<=298){ unit.forEach(([dx,dy])=>p.push([ox+dx,CY+dy])); ox+=64; } return p;
    }
    case "whip":       return h(CY,(x,cy)=>{const c=((x-22)%18)/18;return cy+(c<0.3?c/0.3*9:c<0.7?9-(c-0.3)/0.4*18:-9+(c-0.7)/0.3*9);});
    default:           return h(CY,(x,cy)=>cy);
  }
};

// ============================================================
// パターン定義
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

const POSTURE_COLOR={"下向き":"#E85D04","横向き":"#3B82F6","立向き":"#10B981","上向き":"#8B5CF6"};
const USE_COLOR={"すみ肉":"#F59E0B","肉盛り":"#EF4444","開先充填":"#06B6D4","初層":"#34D399","薄板":"#A78BFA","全姿勢":"#EC4899","補修":"#FB923C","立向き":"#10B981","上向き溶接":"#8B5CF6","開先":"#06B6D4","外観重視":"#FCD34D","被覆アーク":"#F87171"};
const SPEEDS=[{label:"遅い",fps:0.25},{label:"普通",fps:0.7},{label:"速い",fps:1.6}];

// ============================================================
// 母材SVG
// ============================================================

// V開先: 縦方向（奥から手前）の俯瞰断面
function GrooveBackground() {
  return (
    <g>
      {/* 左母材 */}
      <rect x="22" y="30" width="126" height="170" fill="#374151" rx="2"/>
      <rect x="20" y="30" width="5" height="170" fill="#4B5563" rx="1"/>
      {/* 右母材 */}
      <rect x="172" y="30" width="126" height="170" fill="#374151" rx="2"/>
      <rect x="295" y="30" width="5" height="170" fill="#4B5563" rx="1"/>
      {/* 開先面（斜めV字） */}
      <polygon points="148,30 172,30 166,200 154,200" fill="#0A0F1A" stroke="#5B6B7C" strokeWidth="1.5"/>
      {/* 左開先面 */}
      <polygon points="148,30 154,200 148,200" fill="#2D3748"/>
      {/* 右開先面 */}
      <polygon points="172,30 166,200 172,200" fill="#2D3748"/>
      {/* ルート */}
      <rect x="154" y="197" width="12" height="5" fill="#4B5563" rx="1"/>
      {/* 溝中心ガイド */}
      <line x1="160" y1="30" x2="160" y2="200" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
      {/* ラベル */}
      <text x="50" y="120" fontSize="9" fill="#64748B">左母材</text>
      <text x="200" y="120" fontSize="9" fill="#64748B">右母材</text>
      <text x="135" y="22" fontSize="8" fill="#94A3B8">← 開先 →</text>
      {/* 進行矢印（上→下） */}
      <line x1="295" y1="40" x2="295" y2="185" stroke="#475569" strokeWidth="1.2"/>
      <polygon points="291,185 295,198 299,185" fill="#475569"/>
      <text x="280" y="25" fontSize="9" fill="#475569">進行</text>
      {/* 説明 */}
      <text x="22" y="213" fontSize="9" fill="#64748B">V開先（上面） — 開先溝の中をトーチが進む</text>
    </g>
  );
}

// すみ肉: 立板は左寄り、トーチが角部を左→右に通過
function FilletBackground() {
  // 立板: x=60〜84, 水平板: y=178
  // 角部: x=60, y=178 → トーチはx=22から右へ走り角部付近でウィービング
  return (
    <g>
      {/* 水平板 */}
      <rect x="22" y="178" width="276" height="28" fill="#374151" rx="1"/>
      <rect x="22" y="176" width="276" height="4" fill="#4B5563" rx="1"/>
      {[80,120,160,200,240,280].map(x=>(
        <line key={x} x1={x} y1="178" x2={x} y2="206" stroke="#4B5563" strokeWidth="0.5" opacity="0.2"/>
      ))}
      {/* 立板（左寄り） */}
      <rect x="60" y="78" width="24" height="100" fill="#374151" rx="1"/>
      <rect x="58" y="78" width="4" height="100" fill="#4B5563" rx="1"/>
      <rect x="82" y="78" width="4" height="100" fill="#2D3748" rx="1"/>
      <rect x="60" y="76" width="24" height="4" fill="#5B6B7C" rx="1"/>
      {/* 角部の溶接空間（左側） */}
      <polygon points="60,176 60,152 30,176" fill="#0A0F1A" stroke="#334155" strokeWidth="1"/>
      {/* 右側のすみ肉空間 */}
      <polygon points="84,176 84,152 114,176" fill="#0A0F1A" stroke="#334155" strokeWidth="1"/>
      {/* 溶接線ガイド */}
      <line x1="22" y1="176" x2="298" y2="176" stroke="#475569" strokeWidth="1" strokeDasharray="5,4" opacity="0.6"/>
      {/* ラベル */}
      <text x="66" y="90" fontSize="8" fill="#94A3B8">立板</text>
      <text x="160" y="196" fontSize="8" fill="#64748B">水平板</text>
      <text x="22" y="168" fontSize="8" fill="#94A3B8">溶接部→</text>
      {/* 進行矢印 */}
      <line x1="200" y1="68" x2="292" y2="68" stroke="#475569" strokeWidth="1.2"/>
      <polygon points="292,64 304,68 292,72" fill="#475569"/>
      <text x="198" y="63" fontSize="9" fill="#475569">→ 進行</text>
      {/* 説明 */}
      <text x="22" y="214" fontSize="9" fill="#64748B">T継手すみ肉 — 立板と水平板の角部を溶接</text>
    </g>
  );
}

function FlatBackground() {
  return (
    <g>
      <rect x="22" y="172" width="276" height="28" fill="#374151" rx="1"/>
      <rect x="22" y="170" width="276" height="4" fill="#4B5563" rx="1"/>
      {[60,100,140,180,220,260].map(x=>(
        <line key={x} x1={x} y1="172" x2={x} y2="200" stroke="#4B5563" strokeWidth="0.5" opacity="0.2"/>
      ))}
      <line x1="22" y1="170" x2="298" y2="170" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="235" y="165" fontSize="9" fill="#475569">→ 進行</text>
      <text x="22" y="210" fontSize="9" fill="#64748B">平板下向き溶接</text>
    </g>
  );
}

function BuildupBackground() {
  return (
    <g>
      <rect x="22" y="168" width="276" height="28" fill="#374151" rx="1"/>
      <rect x="22" y="166" width="276" height="4" fill="#4B5563" rx="1"/>
      <rect x="22" y="155" width="110" height="13" fill="#4B5563" rx="1" opacity="0.6"/>
      <ellipse cx="132" cy="161" rx="8" ry="6" fill="#4B5563" opacity="0.4"/>
      <line x1="22" y1="155" x2="298" y2="155" stroke="#475569" strokeWidth="1" strokeDasharray="5,4"/>
      <text x="235" y="150" fontSize="9" fill="#475569">→ 進行</text>
      <text x="22" y="150" fontSize="8" fill="#64748B">← 肉盛り済み</text>
      <text x="22" y="210" fontSize="9" fill="#64748B">肉盛り補修</text>
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

  const paths = matType==="groove"  ? buildGroovePath(pattern.id)
              : matType==="fillet"  ? buildFilletPath(pattern.id)
              : matType==="buildup" ? buildFlatPath(pattern.id, 155)
              :                       buildFlatPath(pattern.id, 162);

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

        <div style={{display:"flex",gap:5,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#64748B"}}>母材：</span>
          {MAT_TYPES.map((m,i)=>(
            <button key={m.id} onClick={()=>setMatIdx(i)}
              style={{background:matIdx===i?"#1E3A5F":"#0F172A",
                border:`1px solid ${matIdx===i?"#3B82F6":BORDER}`,
                borderRadius:6,padding:"3px 8px",
                color:matIdx===i?"#93C5FD":"#64748B",
                fontSize:10,fontWeight:700,cursor:"pointer"}}>{m.name}</button>
          ))}
        </div>

        <svg width="100%" viewBox="0 0 320 220"
          style={{display:"block",background:"#0A0F1A",borderRadius:10,border:`1px solid ${BORDER}`}}>
          {[55,110,165,220,275].map(x=><line key={`vg${x}`} x1={x} y1="0" x2={x} y2="220" stroke="#111827" strokeWidth="0.5"/>)}
          {[44,88,132,176].map(y=><line key={`hg${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#111827" strokeWidth="0.5"/>)}
          {matType==="groove"  && <GrooveBackground/>}
          {matType==="fillet"  && <FilletBackground/>}
          {matType==="flat"    && <FlatBackground/>}
          {matType==="buildup" && <BuildupBackground/>}
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke={pattern.color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>}
          {trail.length>1&&<polyline points={trail.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.12"/>}
          <WeldTorch x={cur[0]} y={cur[1]} angle={angle} color={pattern.color} running={running} tick={tick}/>
        </svg>

        <div style={{marginTop:8,fontSize:11,color:"#94A3B8",lineHeight:1.7,background:"#0A0F1A",borderRadius:8,padding:"8px 10px"}}>
          {pattern.desc}
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
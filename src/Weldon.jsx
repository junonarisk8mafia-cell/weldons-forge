import React from "react";

// ============================================================
// WELDON'S FORGE - WELDONキャラクター
// レベルに応じて外見・色・エフェクトが変化
// ============================================================

// レベルデータ（App.jsxと共有）
export const LEVELS = [
  {level:1, name:"見習い溶接工",    minXP:0,    color:"#E85D04", hp:60,  wCol:"#E74C3C", evolveMsg:"WELDONが目覚めた！"},
  {level:2, name:"一人前溶接工",    minXP:200,  color:"#1D4ED8", hp:90,  wCol:"#2980B9", evolveMsg:"一人前に成長！WELDONがパワーアップ！"},
  {level:3, name:"熟練溶接工",      minXP:550,  color:"#D97706", hp:130, wCol:"#E67E22", evolveMsg:"熟練の技を習得！炎が宿った！"},
  {level:4, name:"上級溶接工",      minXP:950,  color:"#DC2626", hp:170, wCol:"#C0392B", evolveMsg:"上級者の域へ！赤い闘気を放つ！"},
  {level:5, name:"溶接マスター",    minXP:1450, color:"#7C3AED", hp:220, wCol:"#8E44AD", evolveMsg:"溶接マスター誕生！紫の覇気！"},
  {level:6, name:"IIW溶接エンジニア", minXP:2000, color:"#D4AC0D", hp:280, wCol:"#D4AC0D", evolveMsg:"伝説の称号！黄金のWELDON！！"},
];

export const getLv = xp => { for(let i=LEVELS.length-1;i>=0;i--) if(xp>=LEVELS[i].minXP) return LEVELS[i]; return LEVELS[0]; };
export const getNxt = xp => { const c=getLv(xp); return LEVELS.find(l=>l.level===c.level+1)||null; };

// レベルアップ変身イベント画面
// ============================================================
export function LevelUpEvent({lv, prevLv, onNext}){
  const F = "'Courier New',monospace";
  const css=`
    @keyframes evolve{0%{transform:translateY(120px) scale(0.4);opacity:0}55%{transform:translateY(-20px) scale(1.4);opacity:1}75%{transform:translateY(8px) scale(1.15)}100%{transform:translateY(0) scale(1.35);opacity:1}}
    @keyframes glow{0%,100%{text-shadow:0 0 15px #FFE500}50%{text-shadow:0 0 40px #FFE500,0 0 80px #FF6B00}}
    @keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes goldflash{0%{opacity:1}100%{opacity:0}}
    @keyframes lvuptext{0%{transform:scale(0) rotate(-20deg);opacity:0}45%{transform:scale(1.4) rotate(6deg);opacity:1}65%{transform:scale(0.9) rotate(-3deg)}80%{transform:scale(1.15) rotate(2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
    @keyframes lvupbounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes spark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
    @keyframes fireflicker{0%,100%{opacity:0.7;transform:translateY(0) scale(1)}50%{opacity:1;transform:translateY(-8px) scale(1.15)}}
  `;
  const stars = [
    {x:"8%",y:"12%",d:"0s"},{x:"92%",y:"18%",d:"0.2s"},{x:"15%",y:"75%",d:"0.4s"},
    {x:"85%",y:"70%",d:"0.1s"},{x:"50%",y:"8%",d:"0.3s"},{x:"25%",y:"40%",d:"0.5s"},
    {x:"75%",y:"45%",d:"0.15s"},{x:"5%",y:"50%",d:"0.35s"},
  ];

  // バイブレーション演出
  React.useEffect(()=>{
    if(navigator.vibrate) navigator.vibrate([60,40,60,40,140]);
  },[]);

  // 溶接スパーク（黄色い火花）
  const sparks = Array.from({length:18},(_,i)=>{
    const ang = (i/18)*Math.PI*2;
    const dist = 60+Math.random()*60;
    return {
      dx:`${Math.cos(ang)*dist}px`, dy:`${Math.sin(ang)*dist}px`,
      d:`${0.5+Math.random()*0.6}s`, delay:`${Math.random()*0.4}s`,
      size:2+Math.random()*3,
    };
  });

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0F172A 0%,#1E0A3C 50%,#0F172A 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:F,padding:20,textAlign:"center",position:"relative",overflow:"hidden"}}>
      <style>{css}</style>

      {/* 画面全体 金色フラッシュ */}
      <div style={{position:"fixed",inset:0,zIndex:60,pointerEvents:"none",background:"radial-gradient(circle, #FFF7CC 0%, #FFD700 40%, #FF8C00 100%)",animation:"goldflash 0.8s ease forwards"}}/>

      {/* 背景の星 */}
      {stars.map((s,i)=>(
        <div key={i} style={{position:"absolute",left:s.x,top:s.y,fontSize:18,animation:`sparkle 0.8s ${s.d} infinite`}}>✨</div>
      ))}

      {/* 変身エフェクト枠 */}
      <div style={{position:"relative",marginBottom:24}}>
        <div style={{
          position:"absolute",inset:-30,borderRadius:"50%",
          background:`radial-gradient(circle, ${lv.color}55 0%, transparent 70%)`,
          animation:"float 2s ease-in-out infinite",
        }}/>

        {/* 溶接スパーク（黄色い火花が散る） */}
        {sparks.map((s,i)=>(
          <div key={i} style={{
            position:"absolute",left:"50%",top:"35%",
            width:s.size,height:s.size,borderRadius:"50%",background:"#FFE500",
            boxShadow:"0 0 6px 2px #FFA500",
            "--dx":s.dx,"--dy":s.dy,
            animation:`spark ${s.d} ${s.delay} ease-out infinite`,
          }}/>
        ))}

        {/* 進化時の炎パーティクル */}
        {[-50,-25,0,25,50].map((x,i)=>(
          <div key={i} style={{
            position:"absolute",left:`calc(50% + ${x}px)`,bottom:"-10px",
            fontSize:22+Math.abs(x)/4,
            animation:`fireflicker ${0.4+i*0.1}s ease-in-out infinite`,
            animationDelay:`${i*0.07}s`,
          }}>🔥</div>
        ))}

        <div style={{animation:"evolve 0.9s cubic-bezier(.34,1.56,.64,1) forwards"}}>
          <div style={{animation:"float 2s ease-in-out infinite"}}>
            <img src={lv.level>=4?"/weldon-levelup-master.webp":"/weldon-levelup-normal.webp"} alt="WELDON" width={180}
              style={{filter:"drop-shadow(0 0 18px rgba(255,229,0,0.8)) drop-shadow(0 0 36px rgba(255,140,0,0.6))"}}/>
          </div>
        </div>
      </div>

      {/* テキスト */}
      <div style={{animation:"lvuptext 1s cubic-bezier(.34,1.56,.64,1) forwards",marginBottom:8}}>
        <div style={{fontSize:14,color:"#FFE500",letterSpacing:6,marginBottom:6,animation:"glow 1.5s infinite, lvupbounce 1s ease-in-out infinite"}}>★★★ LEVEL UP! ★★★</div>
        <div style={{fontSize:60,fontWeight:900,color:"#FFE500",animation:"glow 1.5s infinite"}}>Lv.{lv.level}</div>
        <div style={{fontSize:20,color:lv.color,fontWeight:700,marginTop:4}}>{lv.name}</div>
      </div>

      <div style={{color:"#94A3B8",fontSize:13,marginBottom:12}}>
        {prevLv?.name} → <span style={{color:lv.color,fontWeight:700}}>{lv.name}</span>
      </div>

      {/* 変身メッセージ */}
      <div style={{
        background:`${lv.color}20`,border:`1px solid ${lv.color}`,
        borderRadius:12,padding:"12px 20px",maxWidth:280,marginBottom:16,
      }}>
        <div style={{color:lv.color,fontSize:13,fontWeight:700,lineHeight:1.6}}>{lv.evolveMsg}</div>
      </div>

      {/* STAGE解放通知 */}
      {lv.level===2&&<StageUnlock color="#1D4ED8" msg="🔓 STAGE 2「AW・ボイラー・水中」解放！"/>}
      {lv.level===3&&<StageUnlock color="#D97706" msg="🔓 STAGE 3「WES管理技術者」解放！"/>}
      {lv.level===4&&<StageUnlock color="#DC2626" msg="🔓 STAGE 4「AWS」解放！"/>}
      {lv.level===5&&<StageUnlock color="#7C3AED" msg="🔓 STAGE 5「IIW国際資格」解放！最高峰！"/>}
      {lv.level===6&&<StageUnlock color="#D4AC0D" msg="👑 IIW溶接エンジニア！伝説の称号！"/>}

      <button onClick={onNext} style={{
        marginTop:20,background:`linear-gradient(135deg,${lv.color},${lv.wCol})`,
        border:"none",borderRadius:12,padding:"14px 40px",
        color:"white",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:F,
        boxShadow:`0 4px 20px ${lv.color}50`,
      }}>結果を確認 →</button>
    </div>
  );
}

function StageUnlock({color, msg}){
  return(
    <div style={{
      background:`${color}20`,border:`1px solid ${color}`,
      borderRadius:8,padding:"8px 14px",
      color:color,fontSize:11,fontWeight:700,marginTop:8,
    }}>{msg}</div>
  );
}

// ============================================================
// WELDON'S FORGE - メインApp（軽量ルーター）
// 各ファイルから import して繋ぐだけ
// ============================================================
import { useState, useEffect, lazy, Suspense } from "react";
import { QUIZ_STAGES } from "./questions";       // 既存の問題データ
import { SFX } from "./sound";                    // BGM/SE
import { LevelUpEvent, LEVELS, getLv, getNxt } from "./Weldon"; // キャラ+レベル

// ── WELDON リアル画像コンポーネント ──
const WELDON_IMGS={
  normal:    "/weldon-normal.webp",
  smile:     "/weldon-smile.webp",
  surprised: "/weldon-surprised.webp",
  neutral:   "/weldon-neutral.webp",
};
function WeldonImg({size=110, mood="smile", bounce=false, hit=false}){
  const src =
    mood==="happy"    ? WELDON_IMGS.smile     :
    mood==="hurt"     ? WELDON_IMGS.surprised :
    mood==="neutral"  ? WELDON_IMGS.neutral   :
    mood==="surprised"? WELDON_IMGS.surprised :
                        WELDON_IMGS.normal;
  return(
    <div style={{position:"relative",display:"inline-block",lineHeight:0}}>
      {/* スポットライト */}
      <div style={{
        position:"absolute",bottom:-4,left:"50%",transform:"translateX(-50%)",
        width:size*0.85,height:size*0.28,
        background:"radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)",
        borderRadius:"50%",pointerEvents:"none",
      }}/>
      <img
        src={src}
        width={size}
        height={size}
        alt="WELDON"
        style={{
          objectFit:"contain",
          borderRadius:"50%",
          transform: bounce?"translateY(-10px)": hit?"translateX(8px) scale(0.95)":"translateY(0)",
          transition:"transform .15s ease",
          filter: hit
            ?"brightness(0.7) sepia(1) saturate(5) hue-rotate(-30deg)"
            :"drop-shadow(0 0 14px rgba(255,255,255,0.9)) drop-shadow(0 0 26px rgba(255,255,255,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
          imageRendering:"auto",
        }}
      />
    </div>
  );
}
// タブ画面は開いたときに読み込む(初回表示を軽くする)
const TreeScreen   = lazy(()=>import("./Tree").then(m=>({default:m.TreeScreen})));   // ツリー
const CostScreen   = lazy(()=>import("./Tree").then(m=>({default:m.CostScreen})));   // コスト
const SymbolScreen = lazy(()=>import("./Symbol").then(m=>({default:m.SymbolScreen}))); // 溶接記号+図面の見方
const CalcScreen   = lazy(()=>import("./Calc").then(m=>({default:m.CalcScreen})));   // 溶接計算ツール
const WeaveScreen  = lazy(()=>import("./Weave").then(m=>({default:m.WeaveScreen}))); // ウィービングデモ
const MockScreen   = lazy(()=>import("./Mock").then(m=>({default:m.MockScreen})));   // 模擬試験タブ
import { recordAnswer } from "./stats";            // 学習記録(localStorage)
import { drawQuestions } from "./shuffle";         // 問題・選択肢シャッフル
import { StatsScreen } from "./Stats.jsx";             // 弱点分析タブ

// ============================================================
// STAGE 2 分岐設定（問題はquestions.jsから取得）
// ============================================================
const STAGE2_BRANCHES = [
  {id:"2A", label:"2A — AW検定（鉄骨）",    color:"#1D4ED8", icon:"🏗️", enemy:"ラメラテア将軍",  enemyHP:160, badge:"🏗️ AW検定合格",      qStageId:21},
  {id:"2B", label:"2B — ボイラー溶接士",    color:"#F97316", icon:"🏭", enemy:"高圧蒸気鬼",      enemyHP:160, badge:"🏭 ボイラー溶接士合格", qStageId:22},
  {id:"2C", label:"2C — 水中溶接士",        color:"#06B6D4", icon:"🌊", enemy:"深海溶接怪人",    enemyHP:160, badge:"🌊 水中溶接士合格",    qStageId:23},
];

// STAGE設定（questions.jsのQUIZ_STAGESと対応）
const MAIN_STAGES = [
  {id:1,  label:"STAGE 1 — JIS入門",       color:"#E85D04", icon:"⚡", unlockXP:0,    enemy:"スラグ鬼",    enemyHP:120, qStageId:1},
  {id:6,  label:"実技STAGE — TIG・半自動・現代溶接", color:"#0F766E", icon:"🛠️", unlockXP:200, enemy:"ひずみ大魔神", enemyHP:200, qStageId:6},
  {id:3,  label:"STAGE 3 — WES管理技術者", color:"#D97706", icon:"👑", unlockXP:550,  enemy:"ブローホール将軍", enemyHP:240, qStageId:3},
  {id:4,  label:"STAGE 4 — AWS",           color:"#DC2626", icon:"🇺🇸", unlockXP:950,  enemy:"CWI検査鬼",   enemyHP:300, qStageId:4},
  {id:5,  label:"STAGE 5 — IIW国際資格",  color:"#7C3AED", icon:"🌍", unlockXP:1450, enemy:"溶接魔王IWE", enemyHP:400, qStageId:5},
];

// questions.jsからSTAGE別問題を取得（stageIdで照合）
function getQuestions(qStageId){
  const stage = QUIZ_STAGES.find(s=>s.stageId===qStageId);
  return stage ? stage.questions : [];
}

const FB = "https://docs.google.com/forms/d/e/1FAIpQLSdw5Us-3pXujhPo3DNGjkCO5AC_2Ww2w6_QQla9tQUeS7A60g/viewform";
const F  = "'Courier New',monospace";
const MAX_Q = 20;

// タブ構成(4グループ。中身が複数あるグループはサブタブを出す)
const TAB_GROUPS = [
  {id:"learn",  l:"🎮 学ぶ",     subs:[{id:"quiz",l:"クイズ"},{id:"stats",l:"弱点復習"}]},
  {id:"exam",   l:"📝 試験",     subs:[{id:"mock",l:"模試・記述"}]},
  {id:"career", l:"🗺️ キャリア", subs:[{id:"tree",l:"昇段ラダー"},{id:"cost",l:"費用"}]},
  {id:"tools",  l:"🧰 ツール",   subs:[{id:"calc",l:"計算"},{id:"symbol",l:"記号"},{id:"weave",l:"運棒"}]},
];
const groupOf = tabId => TAB_GROUPS.find(g=>g.subs.some(t=>t.id===tabId)) || TAB_GROUPS[0];

// 進捗(XP・STAGE2クリア)の永続化
const PROG_KEY = "weldon_progress_v1";
function loadProgress(){
  try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch(e) { return {}; }
}

// ============================================================
// 敵キャラ（7体個別SVGアート・浮遊アニメ対応）
// ============================================================
function Enemy({st, hit, hp, maxHP, exploding}){
  const pct = Math.max(0,(hp/maxHP)*100);
  const hc  = pct>50?"#4CAF50":pct>25?"#FF9800":"#F44336";
  const id  = String(st?.id);
  const AC  = {"1":"#FF6B00","2A":"#60A5FA","2B":"#FB923C","2C":"#22D3EE","3":"#FFB300","4":"#F87171","5":"#CE93D8"};
  const ac  = AC[id]||"#aaa";

  const wrapAnim = exploding ? "explode 0.8s ease forwards"
                 : pct<=20&&pct>0 ? "shake 0.5s infinite"
                 : id==="5" ? "monSway 3s ease-in-out infinite"
                 : "monFloat 3s ease-in-out infinite";

  const svgBase = {
    display:"block",
    transform: hit ? "translateX(-14px)" : "translateX(0)",
    transition:"transform .15s",
    filter:`drop-shadow(0 0 ${8+Math.round((1-pct/100)*10)}px ${ac})`,
    overflow:"visible",
  };

  // ────────────────────────────────────────────────────────
  // 1. スラグ鬼 — 溶けたスラグの悪魔
  // ────────────────────────────────────────────────────────
  const slag = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="172" rx="38" ry="6" fill="#000" opacity="0.35"/>
      {/* 外オーラ */}
      <ellipse cx="80" cy="115" rx="58" ry="50" fill="#FF3300" opacity="0.07">
        <animate attributeName="rx" dur="1.8s" repeatCount="indefinite" values="54;64;54"/>
        <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.07;0.13;0.07"/>
      </ellipse>
      {/* 不定形ボディ */}
      <path d="M38,168 Q20,148 18,118 Q16,86 28,60 Q38,38 58,28 Q72,18 95,24 Q114,30 126,54 Q138,78 136,112 Q134,144 120,164 Q105,178 80,180 Q58,180 38,168Z" fill="#8B1A00"/>
      <path d="M44,162 Q28,142 28,114 Q27,86 38,63 Q48,44 65,36 Q77,28 96,34 Q112,40 122,62 Q132,86 130,114 Q128,138 116,158 Q102,172 80,174 Q60,174 44,162Z" fill="#CC2200"/>
      {/* 溶岩の内部光 */}
      <path d="M55,70 Q65,90 55,115 Q70,100 90,110 Q80,85 95,68Z" fill="#FF4400" opacity="0.25"/>
      {/* 亀裂ライン */}
      <path d="M52,45 L58,72 L50,100 L56,128 L52,155" stroke="#FFB300" strokeWidth="3" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.9;0.3;0.9"/>
      </path>
      <path d="M88,42 L94,68 L86,96 L94,122 L88,150" stroke="#FF6600" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" dur="0.7s" repeatCount="indefinite" values="0.8;0.2;0.8"/>
      </path>
      <path d="M110,65 L114,90 L108,118" stroke="#FF4400" strokeWidth="2" fill="none" opacity="0.7"/>
      {/* 亀裂の芯光 */}
      <path d="M52,45 L58,72 L50,100" stroke="#FFE500" strokeWidth="0.8" fill="none">
        <animate attributeName="opacity" dur="0.4s" repeatCount="indefinite" values="0.7;0;0.7"/>
      </path>
      {/* ドリップ */}
      <path d="M46,162 Q48,172 46,178" stroke="#CC2200" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M112,158 Q114,168 112,174" stroke="#AA1800" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <ellipse cx="48" cy="176" rx="7" ry="4" fill="#990000" opacity="0.7"/>
      {/* 目（左） */}
      <ellipse cx="63" cy="90" rx="14" ry="14" fill="#FF0000" opacity="0.9">
        <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.9;0.4;0.9"/>
      </ellipse>
      <ellipse cx="63" cy="90" rx="9" ry="10" fill="#FFE500"/>
      <ellipse cx="63" cy="91" rx="5" ry="6" fill="#180000"/>
      <ellipse cx="61" cy="88" rx="2" ry="2" fill="white" opacity="0.9"/>
      {/* 目（右） */}
      <ellipse cx="100" cy="87" rx="14" ry="14" fill="#FF0000" opacity="0.9">
        <animate attributeName="opacity" dur="1.7s" repeatCount="indefinite" values="0.9;0.3;0.9"/>
      </ellipse>
      <ellipse cx="100" cy="87" rx="9" ry="10" fill="#FFE500"/>
      <ellipse cx="100" cy="88" rx="5" ry="6" fill="#180000"/>
      <ellipse cx="98" cy="85" rx="2" ry="2" fill="white" opacity="0.9"/>
      {/* 口 */}
      <path d="M58,118 Q80,134 102,118" stroke="#FFB300" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {[64,72,80,88,96].map(x=>(
        <line key={x} x1={x} y1="120" x2={x+2} y2="130" stroke="#FF4400" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
      {/* 角 */}
      <path d="M52,30 L38,4 L54,22Z" fill="#8B1A00" stroke="#FF4400" strokeWidth="1"/>
      <path d="M106,28 L120,4 L104,20Z" fill="#8B1A00" stroke="#FF4400" strokeWidth="1"/>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 2. ラメラテア将軍 — 層状鉄板鎧の将軍
  // ────────────────────────────────────────────────────────
  const lamellar = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="174" rx="40" ry="6" fill="#000" opacity="0.3"/>
      {/* 金属オーラ */}
      <ellipse cx="80" cy="115" rx="60" ry="52" fill="#1E40AF" opacity="0.07">
        <animate attributeName="rx" dur="2.5s" repeatCount="indefinite" values="57;66;57"/>
      </ellipse>
      {/* 鎧本体（層状） */}
      {[168,154,140,126,112,98,85,72].map((y,i)=>(
        <g key={i}>
          <rect x={26+i*2} y={y} width={108-i*4} height={15} rx="3"
            fill={i%2===0?"#1E3A5F":"#243F72"}
            stroke="#60A5FA" strokeWidth="0.8" opacity={0.95-i*0.03}/>
          {/* 層ハイライト */}
          <rect x={28+i*2} y={y+2} width={35} height={3} rx="1" fill="white" opacity="0.07"/>
          {/* 層の端の金属感 */}
          <rect x={26+i*2} y={y} width={4} height={15} rx="1" fill="#60A5FA" opacity="0.18"/>
          <rect x={130-i*6} y={y} width={4} height={15} rx="1" fill="#60A5FA" opacity="0.18"/>
        </g>
      ))}
      {/* 層間の光 */}
      {[154,126,98].map((y,i)=>(
        <line key={i} x1="30" y1={y} x2="130" y2={y} stroke="#60A5FA" strokeWidth="0.8" opacity="0.4">
          <animate attributeName="opacity" dur={`${1.5+i*0.6}s`} repeatCount="indefinite" values="0.4;0.1;0.4"/>
        </line>
      ))}
      {/* 頭部 */}
      <rect x="42" y="24" width="76" height="55" rx="5" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="1.5"/>
      <rect x="46" y="28" width="68" height="47" rx="4" fill="#243F72"/>
      {/* 兜の層装飾 */}
      {[18,10,4].map((y,i)=>(
        <rect key={i} x={48+i*5} y={y} width={64-i*10} height={11} rx="2"
          fill="#1E3A5F" stroke="#60A5FA" strokeWidth="0.8"/>
      ))}
      <rect x="38" y="22" width="84" height="6" rx="2" fill="#1A336B" stroke="#60A5FA" strokeWidth="1"/>
      {/* バイザースリット（目） */}
      <rect x="50" y="44" width="22" height="7" rx="2" fill="#60A5FA" opacity="0.95">
        <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.95;0.3;0.95"/>
      </rect>
      <rect x="88" y="44" width="22" height="7" rx="2" fill="#60A5FA" opacity="0.95">
        <animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.95;0.2;0.95"/>
      </rect>
      <rect x="48" y="42" width="26" height="11" rx="3" fill="#60A5FA" opacity="0.15"/>
      <rect x="86" y="42" width="26" height="11" rx="3" fill="#60A5FA" opacity="0.15"/>
      {/* 剣状の左腕突起 */}
      <path d="M26,88 L8,54 L18,62 L12,38 L24,58 L20,66 L34,96Z" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="1.2"/>
      <path d="M18,62 L12,38 L24,58" fill="#60A5FA" opacity="0.55"/>
      <line x1="18" y1="62" x2="12" y2="38" stroke="#BFDBFE" strokeWidth="0.8" opacity="0.7"/>
      {/* 右腕突起 */}
      <path d="M134,88 L152,54 L142,62 L148,38 L136,58 L140,66 L126,96Z" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="1.2"/>
      <path d="M142,62 L148,38 L136,58" fill="#60A5FA" opacity="0.55"/>
      <line x1="142" y1="62" x2="148" y2="38" stroke="#BFDBFE" strokeWidth="0.8" opacity="0.7"/>
      {/* 胸の紋章 */}
      <rect x="62" y="100" width="36" height="20" rx="3" fill="#1A336B" stroke="#60A5FA" strokeWidth="1"/>
      <text x="80" y="114" textAnchor="middle" fill="#60A5FA" fontSize="9" fontWeight="900" fontFamily="monospace" opacity="0.9">WT</text>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 3. 高圧蒸気鬼 — 煙突の角・圧力ゲージ
  // ────────────────────────────────────────────────────────
  const steam = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="173" rx="37" ry="6" fill="#000" opacity="0.3"/>
      {/* 蒸気（背景エフェクト） */}
      {[38,62,88,112].map((x,i)=>(
        <ellipse key={i} cx={x} cy={30} rx="9" ry="14" fill="white" opacity="0.15">
          <animate attributeName="cy" dur={`${1.3+i*0.3}s`} repeatCount="indefinite" values={`${30};${-20};${30}`} begin={`${i*0.2}s`}/>
          <animate attributeName="opacity" dur={`${1.3+i*0.3}s`} repeatCount="indefinite" values="0.15;0;0.15" begin={`${i*0.2}s`}/>
          <animate attributeName="rx" dur={`${1.3+i*0.3}s`} repeatCount="indefinite" values="9;16;9" begin={`${i*0.2}s`}/>
        </ellipse>
      ))}
      {/* ボディ */}
      <rect x="28" y="68" width="104" height="105" rx="9" fill="#6B2410"/>
      <rect x="32" y="72" width="96" height="97" rx="7" fill="#8B3412"/>
      {/* ボディのリベット */}
      {[80,100,120,140,160].map(y=>(
        [35,123].map(x=>(
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#5A1E08" stroke="#FB923C" strokeWidth="0.8"/>
        ))
      ))}
      {/* 圧力ゲージ（中央） */}
      <circle cx="80" cy="118" r="20" fill="#4A1508" stroke="#FB923C" strokeWidth="2.5"/>
      <circle cx="80" cy="118" r="16" fill="#350E04"/>
      <circle cx="80" cy="118" r="12" fill="#2A0A02"/>
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <line key={i}
          x1={80+10*Math.cos(a*Math.PI/180)} y1={118+10*Math.sin(a*Math.PI/180)}
          x2={80+14*Math.cos(a*Math.PI/180)} y2={118+14*Math.sin(a*Math.PI/180)}
          stroke="#FB923C" strokeWidth={i%2===0?1.5:0.8}/>
      ))}
      {/* 針 */}
      <line x1="80" y1="118" x2="80" y2="107" stroke="#FB923C" strokeWidth="2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="-30 80 118" to="210 80 118" dur="3s" repeatCount="indefinite"/>
      </line>
      <circle cx="80" cy="118" r="2.5" fill="#FB923C"/>
      {/* 煙突の角（左） */}
      <rect x="38" y="18" width="18" height="55" rx="5" fill="#6B2410" stroke="#FB923C" strokeWidth="1.5"/>
      <rect x="34" y="14" width="26" height="9" rx="2" fill="#4A1508" stroke="#FB923C" strokeWidth="1.2"/>
      {/* 煙突の角（右） */}
      <rect x="104" y="12" width="18" height="60" rx="5" fill="#6B2410" stroke="#FB923C" strokeWidth="1.5"/>
      <rect x="100" y="8" width="26" height="9" rx="2" fill="#4A1508" stroke="#FB923C" strokeWidth="1.2"/>
      {/* 角から噴出蒸気 */}
      <ellipse cx="47" cy="8" rx="12" ry="7" fill="white" opacity="0.4">
        <animate attributeName="cy" dur="0.85s" repeatCount="indefinite" values="8;-16;8"/>
        <animate attributeName="opacity" dur="0.85s" repeatCount="indefinite" values="0.4;0;0.4"/>
        <animate attributeName="rx" dur="0.85s" repeatCount="indefinite" values="12;20;12"/>
      </ellipse>
      <ellipse cx="113" cy="3" rx="12" ry="7" fill="white" opacity="0.4">
        <animate attributeName="cy" dur="0.95s" repeatCount="indefinite" values="3;-18;3"/>
        <animate attributeName="opacity" dur="0.95s" repeatCount="indefinite" values="0.4;0;0.4"/>
        <animate attributeName="rx" dur="0.95s" repeatCount="indefinite" values="12;22;12"/>
      </ellipse>
      {/* 顔 */}
      <rect x="36" y="68" width="88" height="60" rx="6" fill="#8B3412"/>
      {/* 目 */}
      <ellipse cx="57" cy="92" rx="12" ry="12" fill="#FB923C" opacity="0.9">
        <animate attributeName="opacity" dur="3.5s" repeatCount="indefinite" values="0.9;0.5;0.9"/>
      </ellipse>
      <ellipse cx="57" cy="92" rx="7" ry="8" fill="#180800"/>
      <ellipse cx="55" cy="90" rx="2.5" ry="2.5" fill="white" opacity="0.9"/>
      <ellipse cx="103" cy="92" rx="12" ry="12" fill="#FB923C" opacity="0.9">
        <animate attributeName="opacity" dur="2.8s" repeatCount="indefinite" values="0.9;0.4;0.9"/>
      </ellipse>
      <ellipse cx="103" cy="92" rx="7" ry="8" fill="#180800"/>
      <ellipse cx="101" cy="90" rx="2.5" ry="2.5" fill="white" opacity="0.9"/>
      {/* 眉（逆ハの字） */}
      <path d="M44,80 Q57,75 68,80" stroke="#4A1508" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M92,80 Q103,75 116,80" stroke="#4A1508" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      {/* 口（牙あり） */}
      <path d="M54,112 Q80,126 106,112" stroke="#FB923C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {[60,68,76,84,92,100].map(x=>(
        <line key={x} x1={x} y1="114" x2={x+2} y2="122" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      ))}
      {/* 腕 */}
      <rect x="6" y="88" width="26" height="12" rx="5" fill="#6B2410"/>
      <circle cx="12" cy="94" r="12" fill="#8B3412" stroke="#FB923C" strokeWidth="1"/>
      <rect x="128" y="88" width="26" height="12" rx="5" fill="#6B2410"/>
      <circle cx="148" cy="94" r="12" fill="#8B3412" stroke="#FB923C" strokeWidth="1"/>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 4. 深海溶接怪人 — ダイバーヘルメット・気泡
  // ────────────────────────────────────────────────────────
  const diver = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="174" rx="38" ry="6" fill="#000" opacity="0.3"/>
      {/* 気泡 */}
      {[28,50,72,96,118,140].map((x,i)=>(
        <circle key={i} cx={x} cy={145} r={2.5+i%3} fill="none" stroke="#22D3EE" strokeWidth="1.2" opacity="0.65">
          <animate attributeName="cy" dur={`${2.2+i*0.35}s`} repeatCount="indefinite" values={`${145};${-10};${145}`} begin={`${i*0.45}s`}/>
          <animate attributeName="opacity" dur={`${2.2+i*0.35}s`} repeatCount="indefinite" values="0.65;0;0.65" begin={`${i*0.45}s`}/>
          <animate attributeName="r" dur={`${2.2+i*0.35}s`} repeatCount="indefinite" values={`${2.5+i%3};${5+i%3};${2.5+i%3}`} begin={`${i*0.45}s`}/>
        </circle>
      ))}
      {/* 海中フィルタ */}
      <rect x="0" y="0" width="160" height="180" fill="#0A3050" opacity="0.10" rx="8"/>
      {/* スーツ本体 */}
      <rect x="30" y="78" width="100" height="96" rx="10" fill="#0A4060"/>
      <rect x="34" y="82" width="92" height="88" rx="8" fill="#0D5272"/>
      {/* スーツ縫い目 */}
      <line x1="80" y1="82" x2="80" y2="170" stroke="#22D3EE" strokeWidth="1.5" opacity="0.35"/>
      <line x1="53" y1="82" x2="53" y2="170" stroke="#22D3EE" strokeWidth="0.7" opacity="0.18"/>
      <line x1="107" y1="82" x2="107" y2="170" stroke="#22D3EE" strokeWidth="0.7" opacity="0.18"/>
      {/* 酸素ボンベ（両脇） */}
      <rect x="18" y="90" width="14" height="55" rx="5" fill="#073A58" stroke="#22D3EE" strokeWidth="1.2"/>
      <rect x="20" y="88" width="10" height="6" rx="2" fill="#22D3EE" opacity="0.5"/>
      <rect x="128" y="90" width="14" height="55" rx="5" fill="#073A58" stroke="#22D3EE" strokeWidth="1.2"/>
      <rect x="130" y="88" width="10" height="6" rx="2" fill="#22D3EE" opacity="0.5"/>
      {/* ダイバーヘルメット */}
      <ellipse cx="80" cy="52" rx="40" ry="40" fill="#0A4060" stroke="#22D3EE" strokeWidth="2.2"/>
      <ellipse cx="80" cy="52" rx="36" ry="36" fill="#0D5272"/>
      {/* ヘルメットのバンド */}
      <rect x="40" y="70" width="80" height="8" rx="3" fill="#073A58" stroke="#22D3EE" strokeWidth="1"/>
      {/* フロントバイザー */}
      <ellipse cx="80" cy="50" rx="26" ry="24" fill="#001830" stroke="#22D3EE" strokeWidth="2"/>
      <ellipse cx="80" cy="50" rx="23" ry="21" fill="#00213E"/>
      {/* バイザー反射 */}
      <ellipse cx="69" cy="41" rx="9" ry="5" fill="white" opacity="0.08"/>
      <ellipse cx="87" cy="38" rx="5" ry="3" fill="white" opacity="0.06"/>
      {/* 目（バイザー越し） */}
      <ellipse cx="68" cy="52" rx="9" ry="9" fill="#22D3EE" opacity="0.85">
        <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.85;0.25;0.85"/>
      </ellipse>
      <ellipse cx="92" cy="52" rx="9" ry="9" fill="#22D3EE" opacity="0.85">
        <animate attributeName="opacity" dur="2.6s" repeatCount="indefinite" values="0.85;0.2;0.85"/>
      </ellipse>
      <ellipse cx="68" cy="52" rx="5" ry="6" fill="#000E1C"/>
      <ellipse cx="92" cy="52" rx="5" ry="6" fill="#000E1C"/>
      <ellipse cx="66" cy="49" rx="2" ry="2" fill="white" opacity="0.9"/>
      <ellipse cx="90" cy="49" rx="2" ry="2" fill="white" opacity="0.9"/>
      {/* ヘルメットボルト */}
      {[46,80,114].map((x,i)=>(
        <circle key={i} cx={x} cy={22} r="3.5" fill="#073A58" stroke="#22D3EE" strokeWidth="1.2"/>
      ))}
      {/* 水中溶接トーチ（左手） */}
      <rect x="6" y="102" width="28" height="8" rx="3" fill="#073A58" stroke="#22D3EE" strokeWidth="1"/>
      <rect x="3" y="98" width="10" height="16" rx="3" fill="#0A4060" stroke="#22D3EE" strokeWidth="1"/>
      {/* 水中アーク（水中独特の青白い色） */}
      {[8,14,20].map((x,i)=>(
        <circle key={i} cx={x} cy={100} r="2.5" fill="#00D4FF" opacity="0.9">
          <animate attributeName="opacity" dur={`${0.18+i*0.07}s`} repeatCount="indefinite" values="0.9;0;0.9"/>
        </circle>
      ))}
      {/* 腕パイプ */}
      <rect x="6" y="90" width="28" height="8" rx="4" fill="#0A4060" stroke="#22D3EE" strokeWidth="0.8"/>
      <rect x="126" y="90" width="28" height="8" rx="4" fill="#0A4060" stroke="#22D3EE" strokeWidth="0.8"/>
      {/* 足（フィン） */}
      <path d="M44,168 L38,178 L68,172 L62,162Z" fill="#073A58" stroke="#22D3EE" strokeWidth="1"/>
      <path d="M92,168 L98,178 L122,172 L116,162Z" fill="#073A58" stroke="#22D3EE" strokeWidth="1"/>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 5. ブローホール将軍 — 気孔だらけ・不気味オーラ
  // ────────────────────────────────────────────────────────
  const blowhole = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="173" rx="38" ry="6" fill="#000" opacity="0.38"/>
      {/* 不気味な外オーラ */}
      <ellipse cx="80" cy="115" rx="58" ry="50" fill="#5A2800" opacity="0.45">
        <animate attributeName="rx" dur="2.2s" repeatCount="indefinite" values="55;66;55"/>
        <animate attributeName="opacity" dur="2.2s" repeatCount="indefinite" values="0.45;0.15;0.45"/>
      </ellipse>
      {/* ボディ */}
      <rect x="26" y="68" width="108" height="106" rx="10" fill="#4A2000"/>
      <rect x="30" y="72" width="100" height="98" rx="8" fill="#6A3000"/>
      {/* 穴群（ボディ） */}
      {[
        [44,82,9],[66,78,7],[92,80,8],[112,85,6],
        [36,102,7],[58,108,10],[82,102,7],[104,100,9],[122,105,6],
        [42,128,7],[64,132,9],[84,125,7],[105,130,7],[120,127,5],
        [50,152,8],[76,148,6],[100,154,9],[116,150,5],
      ].map(([x,y,r],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#180800"/>
          <circle cx={x} cy={y} r={r-1.2} fill="#0A0400"/>
          <ellipse cx={x-r*0.35} cy={y-r*0.35} rx={r*0.45} ry={r*0.35} fill="#2A1000" opacity="0.5"/>
          {/* 穴の不気味な輝き */}
          <circle cx={x} cy={y} r={r*0.55} fill="#FF3300" opacity="0.12">
            <animate attributeName="opacity" dur={`${1.2+i*0.15}s`} repeatCount="indefinite" values="0.08;0.22;0.08"/>
          </circle>
        </g>
      ))}
      {/* 頭部 */}
      <rect x="32" y="22" width="96" height="62" rx="8" fill="#6A3000"/>
      {/* 頭部の穴 */}
      {[[48,34,7],[80,28,6],[112,36,8],[60,50,6],[96,48,7]].map(([x,y,r],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#180800"/>
          <circle cx={x} cy={y} r={r-1} fill="#0A0400"/>
          <circle cx={x} cy={y} r={r*0.5} fill="#FF3300" opacity="0.1">
            <animate attributeName="opacity" dur={`${1+i*0.2}s`} repeatCount="indefinite" values="0.06;0.18;0.06"/>
          </circle>
        </g>
      ))}
      {/* 兜の縁 */}
      <path d="M32,26 Q80,8 128,26" stroke="#FFB300" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* 目 */}
      <ellipse cx="60" cy="54" rx="15" ry="15" fill="#180800"/>
      <ellipse cx="100" cy="54" rx="15" ry="15" fill="#180800"/>
      <ellipse cx="60" cy="54" rx="9" ry="10" fill="#FF3300" opacity="0.95">
        <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.95;0.25;0.95"/>
      </ellipse>
      <ellipse cx="100" cy="54" rx="9" ry="10" fill="#FF3300" opacity="0.95">
        <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.95;0.15;0.95"/>
      </ellipse>
      <ellipse cx="60" cy="54" rx="5" ry="6" fill="#030000"/>
      <ellipse cx="100" cy="54" rx="5" ry="6" fill="#030000"/>
      <ellipse cx="58" cy="51" rx="2" ry="2" fill="white" opacity="0.55"/>
      <ellipse cx="98" cy="51" rx="2" ry="2" fill="white" opacity="0.55"/>
      {/* 口（穴あり歯茎） */}
      <path d="M50,70 Q80,84 110,70" stroke="#FFB300" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {[56,64,72,80,88,96,104].map(x=>(
        <circle key={x} cx={x} cy={74} r="3.5" fill="#180800"/>
      ))}
      {/* 腕 */}
      <rect x="4" y="90" width="26" height="12" rx="5" fill="#4A2000"/>
      <circle cx="10" cy="96" r="13" fill="#6A3000"/>
      <circle cx="10" cy="96" r="6" fill="#180800"/>
      <rect x="130" y="90" width="26" height="12" rx="5" fill="#4A2000"/>
      <circle cx="150" cy="96" r="13" fill="#6A3000"/>
      <circle cx="150" cy="96" r="6" fill="#180800"/>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 6. CWI検査鬼 — 厳格な検査官・眼鏡・クリップボード
  // ────────────────────────────────────────────────────────
  const cwi = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="173" rx="36" ry="6" fill="#000" opacity="0.3"/>
      {/* スーツ */}
      <rect x="28" y="70" width="104" height="105" rx="6" fill="#160404"/>
      <rect x="32" y="74" width="96" height="97" rx="5" fill="#1F0808"/>
      {/* スーツの縦ライン */}
      <line x1="80" y1="74" x2="80" y2="171" stroke="#F87171" strokeWidth="0.8" opacity="0.3"/>
      {/* ネクタイ */}
      <path d="M70,74 L80,106 L90,74Z" fill="#7F1D1D"/>
      <path d="M72,74 L80,92 L88,74Z" fill="#991B1B"/>
      <rect x="75" y="104" width="10" height="8" rx="1" fill="#7F1D1D"/>
      {/* ポケットチーフ */}
      <path d="M34,82 L42,86 L36,90Z" fill="#F87171" opacity="0.7"/>
      {/* クリップボード（右腕） */}
      <rect x="96" y="88" width="40" height="54" rx="3" fill="#F5F5DC" stroke="#B8860B" strokeWidth="1.5"/>
      <rect x="96" y="86" width="40" height="10" rx="2" fill="#B8860B"/>
      <circle cx="116" cy="91" r="3.5" fill="#8B6914"/>
      {/* チェック欄 */}
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="100" y={102+i*10} width="8" height="7" rx="1" fill="none" stroke="#888" strokeWidth="0.8"/>
          <line x1="112" y1={104+i*10} x2="130" y2={104+i*10} stroke="#888" strokeWidth="0.8"/>
          <line x1="112" y1={108+i*10} x2="126" y2={108+i*10} stroke="#888" strokeWidth="0.6"/>
        </g>
      ))}
      {/* NG スタンプ */}
      <text x="110" y="148" fill="#CC0000" fontSize="10" fontWeight="900" fontFamily="monospace">✗NG</text>
      {/* 右腕 */}
      <rect x="126" y="90" width="26" height="10" rx="4" fill="#160404"/>
      <circle cx="150" cy="95" r="11" fill="#1F0808" stroke="#F87171" strokeWidth="0.8"/>
      {/* 頭部 */}
      <rect x="36" y="18" width="88" height="62" rx="6" fill="#1F0808" stroke="#F87171" strokeWidth="1.2"/>
      <rect x="40" y="22" width="80" height="54" rx="5" fill="#260C0C"/>
      {/* 眼鏡 */}
      <rect x="46" y="38" width="26" height="18" rx="9" fill="none" stroke="#F87171" strokeWidth="2.8"/>
      <rect x="88" y="38" width="26" height="18" rx="9" fill="none" stroke="#F87171" strokeWidth="2.8"/>
      <line x1="72" y1="47" x2="88" y2="47" stroke="#F87171" strokeWidth="2.2"/>
      <path d="M72,46 Q80,52 88,46" stroke="#F87171" strokeWidth="1.5" fill="none"/>
      {/* 眼鏡の蔓 */}
      <line x1="46" y1="47" x2="38" y2="44" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
      <line x1="114" y1="47" x2="122" y2="44" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
      {/* 目 */}
      <ellipse cx="59" cy="47" rx="8" ry="8" fill="#F87171" opacity="0.95">
        <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0.95;0.5;0.95"/>
      </ellipse>
      <ellipse cx="101" cy="47" rx="8" ry="8" fill="#F87171" opacity="0.95">
        <animate attributeName="opacity" dur="3.5s" repeatCount="indefinite" values="0.95;0.4;0.95"/>
      </ellipse>
      <ellipse cx="59" cy="47" rx="4.5" ry="5" fill="#080000"/>
      <ellipse cx="101" cy="47" rx="4.5" ry="5" fill="#080000"/>
      <ellipse cx="57" cy="44" rx="2" ry="2" fill="white" opacity="0.9"/>
      <ellipse cx="99" cy="44" rx="2" ry="2" fill="white" opacity="0.9"/>
      {/* 眉（への字・厳格） */}
      <path d="M44,32 L72,28" stroke="#F87171" strokeWidth="3" strokeLinecap="round"/>
      <path d="M88,28 L116,32" stroke="#F87171" strokeWidth="3" strokeLinecap="round"/>
      {/* 口（へのじ） */}
      <path d="M54,62 Q80,56 106,62" stroke="#F87171" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 角 */}
      <path d="M52,22 L44,2 L58,16Z" fill="#7F1D1D" stroke="#F87171" strokeWidth="0.8"/>
      <path d="M108,22 L116,2 L102,16Z" fill="#7F1D1D" stroke="#F87171" strokeWidth="0.8"/>
      {/* 検査器具（左手） */}
      <rect x="20" y="100" width="20" height="10" rx="3" fill="#222" stroke="#F87171" strokeWidth="1"/>
      <rect x="12" y="96" width="10" height="18" rx="2.5" fill="#111" stroke="#F87171" strokeWidth="1"/>
      <line x1="22" y1="105" x2="40" y2="105" stroke="#F87171" strokeWidth="1.2">
        <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="1;0.3;1"/>
      </line>
      <rect x="10" y="90" width="26" height="10" rx="4" fill="#160404"/>
    </svg>
  );

  // ────────────────────────────────────────────────────────
  // 7. 溶接魔王IWE — 最終ボス・王冠・炎・電撃
  // ────────────────────────────────────────────────────────
  const iweBoss = (
    <svg width="160" height="180" viewBox="0 0 160 180" style={svgBase}>
      <ellipse cx="80" cy="174" rx="44" ry="8" fill="#000" opacity="0.4"/>
      {/* 大外オーラ */}
      <ellipse cx="80" cy="105" rx="78" ry="68" fill="#7C3AED" opacity="0.09">
        <animate attributeName="rx" dur="2s" repeatCount="indefinite" values="74;88;74"/>
        <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.09;0.18;0.09"/>
      </ellipse>
      {/* 電撃ボルト（四隅） */}
      {[
        {d:"M18,155 L26,135 L20,128 L30,108", c:"#CE93D8"},
        {d:"M142,155 L134,135 L140,128 L130,108", c:"#CE93D8"},
        {d:"M10,100 L22,80 L16,72 L28,52", c:"#A855F7"},
        {d:"M150,100 L138,80 L144,72 L132,52", c:"#A855F7"},
      ].map((l,i)=>(
        <path key={i} d={l.d} stroke={l.c} strokeWidth="1.8" fill="none" opacity="0.7">
          <animate attributeName="opacity" dur={`${0.25+i*0.08}s`} repeatCount="indefinite" values="0.7;0.05;0.7"/>
        </path>
      ))}
      {/* 足元の炎 */}
      {[42,56,68,80,92,104,118].map((x,i)=>(
        <ellipse key={i} cx={x} cy={164} rx={7+i%3} ry={13+i%4} fill={i%2===0?"#FF4400":"#FF6600"} opacity="0.55">
          <animate attributeName="ry" dur={`${0.38+i*0.09}s`} repeatCount="indefinite" values={`${13+i%4};${20+i%4};${13+i%4}`}/>
          <animate attributeName="opacity" dur={`${0.38+i*0.09}s`} repeatCount="indefinite" values="0.55;0.2;0.55"/>
          <animate attributeName="cy" dur={`${0.38+i*0.09}s`} repeatCount="indefinite" values="164;157;164"/>
        </ellipse>
      ))}
      {/* マント外側 */}
      <path d="M22,82 Q6,136 14,168 Q42,158 80,162 Q118,158 146,168 Q154,136 138,82Z" fill="#2D0452" opacity="0.95"/>
      <path d="M22,82 Q6,136 14,168 Q42,158 80,162 Q118,158 146,168 Q154,136 138,82Z" fill="none" stroke="#A855F7" strokeWidth="1.2" opacity="0.6"/>
      {/* マント内側 */}
      <path d="M30,82 Q16,130 22,162 Q46,154 80,158 Q114,154 138,162 Q144,130 130,82Z" fill="#1A0330" opacity="0.75"/>
      {/* ボディ鎧 */}
      <rect x="36" y="74" width="88" height="84" rx="9" fill="#2D0452"/>
      <rect x="40" y="78" width="80" height="76" rx="7" fill="#3D0764"/>
      {/* 鎧のライン装飾 */}
      <path d="M40,98 Q80,92 120,98" stroke="#A855F7" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M40,114 Q80,108 120,114" stroke="#A855F7" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* 胸のルーン紋章 */}
      <ellipse cx="80" cy="108" rx="22" ry="14" fill="none" stroke="#CE93D8" strokeWidth="1.5" opacity="0.8">
        <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.8;1;0.8"/>
      </ellipse>
      <text x="80" y="112" textAnchor="middle" fill="#CE93D8" fontSize="11" fontWeight="900" fontFamily="serif" opacity="0.9">IWE</text>
      {/* 頭部 */}
      <ellipse cx="80" cy="46" rx="38" ry="36" fill="#2D0452" stroke="#A855F7" strokeWidth="1.8"/>
      <ellipse cx="80" cy="46" rx="34" ry="32" fill="#3D0764"/>
      {/* 王冠 */}
      <path d="M42,22 L52,4 L62,18 L72,0 L80,14 L88,0 L98,18 L108,4 L118,22 L118,32 L42,32Z" fill="#FFD700" stroke="#FF8C00" strokeWidth="1.5"/>
      <path d="M42,28 L118,28 L118,32 L42,32Z" fill="#FFA500" opacity="0.5"/>
      {/* 宝石 */}
      <circle cx="52" cy="6" r="5" fill="#FF4500"/>
      <circle cx="52" cy="6" r="5" fill="#FF6600" opacity="0.6">
        <animate attributeName="opacity" dur="0.9s" repeatCount="indefinite" values="0.6;1;0.6"/>
      </circle>
      <circle cx="72" cy="2" r="4.5" fill="#00BFFF"/>
      <circle cx="80" cy="16" r="3.5" fill="#FF4500"/>
      <circle cx="88" cy="2" r="4.5" fill="#FF4500"/>
      <circle cx="88" cy="2" r="4.5" fill="#FF6600" opacity="0.6">
        <animate attributeName="opacity" dur="0.7s" repeatCount="indefinite" values="0.6;1;0.6"/>
      </circle>
      <circle cx="108" cy="6" r="5" fill="#00BFFF"/>
      {/* 目 */}
      <ellipse cx="64" cy="48" rx="13" ry="13" fill="#12002A"/>
      <ellipse cx="96" cy="48" rx="13" ry="13" fill="#12002A"/>
      <ellipse cx="64" cy="48" rx="9" ry="10" fill="#CE93D8" opacity="0.98">
        <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.98;0.35;0.98"/>
      </ellipse>
      <ellipse cx="96" cy="48" rx="9" ry="10" fill="#CE93D8" opacity="0.98">
        <animate attributeName="opacity" dur="1.7s" repeatCount="indefinite" values="0.98;0.25;0.98"/>
      </ellipse>
      <ellipse cx="64" cy="48" rx="5" ry="6" fill="#050008"/>
      <ellipse cx="96" cy="48" rx="5" ry="6" fill="#050008"/>
      <ellipse cx="61" cy="44" rx="2.5" ry="2.5" fill="white" opacity="0.95"/>
      <ellipse cx="93" cy="44" rx="2.5" ry="2.5" fill="white" opacity="0.95"/>
      {/* 眉 */}
      <path d="M52,36 Q64,30 76,36" stroke="#CE93D8" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M84,36 Q96,30 108,36" stroke="#CE93D8" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* 口（牙） */}
      <path d="M58,64 Q80,78 102,64" stroke="#CE93D8" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {[64,72,80,88,96].map(x=>(
        <line key={x} x1={x} y1="66" x2={x+2} y2="76" stroke="#CE93D8" strokeWidth="2" strokeLinecap="round"/>
      ))}
      {/* 溶接トーチ（右手武器） */}
      <g transform="rotate(28,128,120)">
        <rect x="118" y="92" width="9" height="60" rx="4" fill="#1C1C1C"/>
        <rect x="120" y="78" width="6" height="20" rx="2" fill="#2C2C2C"/>
        <rect x="122" y="66" width="18" height="8" rx="2" fill="#BDC3C7"/>
        <rect x="122" y="72" width="18" height="3" rx="1" fill="#D4AC0D"/>
        <rect x="136" y="62" width="6" height="14" rx="2" fill="#7F8C8D"/>
      </g>
      {/* トーチ火花群 */}
      {[
        {x:145,y:58,c:"#FFE500",d:"0.15s"},{x:150,y:52,c:"#00D4FF",d:"0.11s"},
        {x:142,y:64,c:"#FFE500",d:"0.18s"},{x:154,y:60,c:"#FFFFFF",d:"0.12s"},
        {x:148,y:68,c:"#FF6B00",d:"0.14s"},
      ].map((s,i)=>(
        <circle key={i} cx={s.x} cy={s.y} r="2.8" fill={s.c} opacity="0.95">
          <animate attributeName="opacity" dur={s.d} repeatCount="indefinite" values="0.95;0;0.95"/>
          <animate attributeName="cy" dur={s.d} repeatCount="indefinite" values={`${s.y};${s.y-10};${s.y}`}/>
        </circle>
      ))}
      {/* 電気アーク */}
      <path d="M146,60 L154,52 L148,46 L158,38" stroke="#00D4FF" strokeWidth="2.2" fill="none" opacity="0.85">
        <animate attributeName="opacity" dur="0.18s" repeatCount="indefinite" values="0.85;0.1;0.85"/>
      </path>
      {/* 左拳 */}
      <rect x="20" y="92" width="22" height="10" rx="4" fill="#2D0452" stroke="#A855F7" strokeWidth="0.8"/>
      <circle cx="18" cy="97" r="14" fill="#3D0764" stroke="#A855F7" strokeWidth="1.2"/>
      <ellipse cx="18" cy="97" rx="7" ry="8" fill="#CE93D8" opacity="0.15">
        <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.15;0.35;0.15"/>
      </ellipse>
    </svg>
  );

  const monsterMap = {"1":slag,"2A":lamellar,"2B":steam,"2C":diver,"6":steam,"3":blowhole,"4":cwi,"5":iweBoss};

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{
        background:`${ac}22`,border:`2px solid ${ac}`,
        borderRadius:8,padding:"5px 16px",
        color:ac,fontSize:13,fontWeight:900,
        fontFamily:"'Courier New',monospace",
        textShadow:`0 0 10px ${ac}`,
        letterSpacing:2,
      }}>{st?.enemy}</div>
      <div style={{width:180,background:"#1A1A2E",borderRadius:4,height:14,border:`1px solid ${ac}40`,overflow:"hidden",position:"relative"}}>
        <div style={{width:`${pct}%`,height:"100%",background:hc,transition:"width .4s ease"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:700,fontFamily:"monospace"}}>{Math.round(hp)} / {maxHP} HP</div>
      </div>
      <div style={{animation:wrapAnim}}>
        {monsterMap[id] || monsterMap["1"]}
      </div>
    </div>
  );
}

function HPBar({v, max}){
  const p = Math.min(100,(v/max)*100);
  const c = p>50?"linear-gradient(90deg,#22C55E,#86EFAC)":p>25?"linear-gradient(90deg,#F59E0B,#FDE68A)":"linear-gradient(90deg,#DC2626,#FCA5A5)";
  return <div style={{background:"#E2E8F0",borderRadius:4,height:11,border:"1px solid #CBD5E1",overflow:"hidden",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.15)"}}>
    <div style={{width:`${p}%`,height:"100%",background:c,transition:"width .4s ease",boxShadow:"0 0 6px rgba(255,255,255,0.6) inset"}}/>
  </div>;
}

const css=`
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes dmg{0%{opacity:1;transform:translateY(0) scale(1.3)}100%{opacity:0;transform:translateY(-40px) scale(0.8)}}
  @keyframes cursor{0%,40%{opacity:1}60%,100%{opacity:0}}
  @keyframes twinkle{0%,100%{opacity:0.2}50%{opacity:0.8}}
  @keyframes redflash{0%{background:rgba(220,38,38,0)}20%{background:rgba(220,38,38,0.55)}100%{background:rgba(220,38,38,0)}}
  @keyframes whiteflash{0%{background:rgba(255,255,255,0)}20%{background:rgba(255,255,255,0.7)}100%{background:rgba(255,255,255,0)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}
  @keyframes explode{0%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0.7}100%{transform:scale(3);opacity:0}}
  @keyframes victory{0%{transform:scale(0.5) rotate(-5deg);opacity:0}60%{transform:scale(1.2) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1}}
  @keyframes spark{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-60px) scale(0);opacity:0}}
  @keyframes gameover{0%{opacity:0;transform:scale(0.5)}60%{transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}
  @keyframes monFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-10px)}}
  @keyframes monSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
  @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(220px) rotate(360deg);opacity:0}}
  @keyframes resultSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
  @keyframes goldGlow{0%,100%{text-shadow:0 0 12px #FFE500,0 0 24px #FF8C00}50%{text-shadow:0 0 28px #FFE500,0 0 56px #FF6B00,0 0 80px #FFD700}}
  @keyframes clearPop{0%{transform:scale(0) rotate(-12deg);opacity:0}55%{transform:scale(1.25) rotate(4deg);opacity:1}75%{transform:scale(0.95) rotate(-2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
`;

// ============================================================
// メインApp
// ============================================================
export default function App(){
  const [sc,   setSc]   = useState("title");
  const [xp,   setXp]   = useState(()=>loadProgress().xp||0);
  const [tab,  setTab]  = useState("quiz");   // title画面のタブ
  const [selSt,setSelSt]= useState(null);
  const [qs,   setQs]   = useState([]);
  const [qi,   setQi]   = useState(0);
  const [sel,  setSel]  = useState(null);
  const [ans,  setAns]  = useState([]);
  const [earned,setEarned]=useState(0);
  const [score,setScore]= useState(0);
  const [mood, setMood] = useState("smile");
  const [bounce,setBounce]=useState(false);
  const [eHit, setEHit] = useState(false);
  const [wHit, setWHit] = useState(false);
  const [eHP,  setEHP]  = useState(0);
  const [pHP,  setPHP]  = useState(60);
  const [dmg,  setDmg]  = useState(null);
  const [prevLv,setPrevLv]=useState(null);
  const [msg,  setMsg]  = useState("");
  const [showMsg,setShowMsg]=useState(false);
  const [msgDone,setMsgDone]=useState(false);
  const [showOpts,setShowOpts]=useState(true);
  const [cur,  setCur]  = useState(0);
  // STAGE2分岐管理
  const [stage2Cleared,  setStage2Cleared]  = useState(()=>!!loadProgress().stage2Cleared);
  const [clearedBranch,  setClearedBranch]  = useState(()=>loadProgress().clearedBranch||null);
  // 演出state
  const [flash,    setFlash]    = useState(null);  // 'red'|'white'|null
  const [gameOver, setGameOver] = useState(false);
  const [victory,  setVictory]  = useState(false);
  const [exploding,setExploding]= useState(false);
  const [wrongAns, setWrongAns] = useState([]);    // 間違えた問題リスト

  useEffect(()=>{
    try { localStorage.setItem(PROG_KEY, JSON.stringify({xp, stage2Cleared, clearedBranch})); } catch(e) {}
  },[xp, stage2Cleared, clearedBranch]);

  const lv  = getLv(xp);
  const nxt = getNxt(xp);

  useEffect(()=>{
    if(sc==="battle"){
      const t=setInterval(()=>setCur(c=>c+1),1200);
      return()=>clearInterval(t);
    }
  },[sc]);

  // ── バトル開始 ──
  function startBattle(st){
    const pool = drawQuestions(getQuestions(st.qStageId), MAX_Q);
    if(pool.length===0){ alert("問題データが見つかりません（qStageId:"+st.qStageId+"）"); return; }
    setSelSt(st); setQs(pool); setQi(0); setSel(null); setAns([]);
    setEarned(0); setScore(0); setMood("smile");
    setEHP(100); setPHP(100);
    setShowOpts(true); setShowMsg(false);
    setGameOver(false); setVictory(false);
    setExploding(false); setFlash(null);
    setWrongAns([]);
    SFX.start(); setSc("battle");
  }

  // ── 弱点復習バトル(間違えた問題プールから出題) ──
  function startReviewBattle(pool){
    if(!pool||pool.length===0){ alert("復習できる問題がまだありません。まずクイズに挑戦しよう！"); return; }
    const rq = drawQuestions(pool, MAX_Q);
    setSelSt({label:"📊 弱点復習",color:"#E85D04",qStageId:-1,enemy:"苦手ポイント",badge:"苦手克服"});
    setQs(rq); setQi(0); setSel(null); setAns([]);
    setEarned(0); setScore(0); setMood("smile");
    setEHP(100); setPHP(100);
    setShowOpts(true); setShowMsg(false);
    setGameOver(false); setVictory(false);
    setExploding(false); setFlash(null);
    setWrongAns([]);
    SFX.start(); setSc("battle");
  }

  // ── 回答処理 ──
  function doAnswer(idx){
    if(sel!==null||gameOver||victory) return;
    setSel(idx);
    const q=qs[qi], ok=idx===q.a;
    setShowOpts(false);
    if(ok){
      // 正解：モンスターに10ダメージ
      setMood("happy"); setBounce(true); SFX.correct();
      setFlash("white");
      setTimeout(()=>setFlash(null),400);
      setTimeout(()=>{
        setEHit(true); SFX.attack();
        setDmg({val:"-10",t:"e"});
        setEHP(h=>{
          const next=Math.max(0,h-10);
          if(next<=0){
            // 勝利！
            setTimeout(()=>{
              setExploding(true);
              SFX.levelup();
              setTimeout(()=>setVictory(true),800);
            },200);
          }
          return next;
        });
        setTimeout(()=>{ setEHit(false); setDmg(null); },600);
      },200);
      setScore(s=>s+1); setEarned(v=>v+q.xp);
      setMsg("✅ 正解！ "+q.cat+"の知識でダメージ！\n\n"+q.exp);
    }else{
      // 不正解：プレイヤーに20ダメージ
      setMood("hurt"); SFX.wrong();
      setFlash("red");
      setTimeout(()=>setFlash(null),500);
      setTimeout(()=>{
        setWHit(true); SFX.hurt();
        setDmg({val:"-20",t:"p"});
        setPHP(h=>{
          const next=Math.max(0,h-20);
          if(next<=0){
            // GAME OVER
            setTimeout(()=>setGameOver(true),600);
          }
          return next;
        });
        setTimeout(()=>{ setWHit(false); setDmg(null); },600);
      },200);
      setWrongAns(p=>[...p,{q:q.q,correct:q.opts[q.a],exp:q.exp,cat:q.cat}]);
      setMsg("❌ 不正解！ 敵の攻撃を受けた！\n正解："+q.opts[q.a]+"\n\n"+q.exp);
    }
    setAns(p=>[...p,{ok,exp:q.exp,cat:q.cat,xp:q.xp}]);
    recordAnswer({id:q.id,cat:q.cat,ok});
    setTimeout(()=>{ setBounce(false); },500);
    setTimeout(()=>{ setShowMsg(true); setMsgDone(false); setTimeout(()=>setMsgDone(true),1000); },800);
  }

  // ── 次の問題 ──
  function nextQ(){
    if(!msgDone) return;
    setShowMsg(false);
    if(qi+1>=MAX_Q){
      // STAGE2分岐の合格判定（60%以上）
      const isBranch = STAGE2_BRANCHES.some(b=>b.id===selSt?.id);
      if(isBranch && !stage2Cleared){
        setStage2Cleared(true); setClearedBranch(selSt.id);
      }
      const pl=getLv(xp), nx=xp+earned, nl=getLv(nx);
      setXp(nx);
      if(nl.level>pl.level){ setPrevLv(pl); SFX.levelup(); SFX.evolve(); setTimeout(()=>setSc("lvlup"),200); }
      else setSc("result");
    }else{
      setQi(q=>q+1); setSel(null); setMood("smile"); setShowOpts(true);
    }
  }

  const q   = qs[qi];

  // ── GAME OVER画面 ──
  if(sc==="battle"&&gameOver) return(
    <div style={{minHeight:"100vh",background:"#0A0000",fontFamily:F,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
      <style>{css}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,#3D0000 0%,#0A0000 70%)"}}/>
      <div style={{animation:"gameover 0.8s cubic-bezier(.34,1.56,.64,1) forwards",textAlign:"center",zIndex:1}}>
        <div style={{fontSize:60,marginBottom:8}}>💀</div>
        <div style={{fontSize:42,fontWeight:900,color:"#DC2626",textShadow:"0 0 30px #DC2626,0 0 60px #991B1B",letterSpacing:4}}>GAME OVER</div>
        <div style={{color:"#F87171",fontSize:12,marginTop:8,marginBottom:16}}>プレイヤーのHPが0になった...</div>
        {/* WELDONの表情 */}
        <div style={{marginBottom:14}}><WeldonImg size={108} mood="neutral"/></div>
        {/* WELDONの励まし */}
        <div style={{background:"rgba(255,255,255,0.08)",border:"2px solid #DC2626",borderRadius:12,padding:"14px 18px",maxWidth:300,margin:"0 auto 20px"}}>
          <div style={{color:"#FFE500",fontSize:11,fontWeight:700,marginBottom:6}}>🔥 WELDONより</div>
          <div style={{color:"#F1F5F9",fontSize:13,lineHeight:1.8}}>心配するな！<br/>きっとうまく行く！<br/>もう一度挑戦しよう！</div>
        </div>
        {/* 間違えた問題おさらい */}
        {wrongAns.length>0&&(
          <div style={{background:"rgba(0,0,0,0.5)",border:"1px solid #475569",borderRadius:12,padding:12,maxWidth:320,margin:"0 auto 20px",maxHeight:220,overflowY:"auto"}}>
            <div style={{color:"#FFE500",fontSize:10,fontWeight:700,marginBottom:8}}>📖 間違えた問題のおさらい</div>
            {wrongAns.map((w,i)=>(
              <div key={i} style={{background:"rgba(220,38,38,0.1)",border:"1px solid #DC2626",borderRadius:8,padding:"8px 10px",marginBottom:6,textAlign:"left"}}>
                <div style={{color:"#FCA5A5",fontSize:9,marginBottom:3}}>{w.cat}</div>
                <div style={{color:"#F1F5F9",fontSize:10,marginBottom:3,lineHeight:1.5}}>{w.q}</div>
                <div style={{color:"#4ADE80",fontSize:10,fontWeight:700}}>✓ 正解：{w.correct}</div>
                <div style={{color:"#94A3B8",fontSize:9,marginTop:2,lineHeight:1.5}}>{w.exp}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>startBattle(selSt)} style={{background:"linear-gradient(135deg,#DC2626,#991B1B)",border:"none",borderRadius:12,padding:"13px 28px",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F,boxShadow:"0 4px 20px rgba(220,38,38,0.5)"}}>🔥 もう一度！</button>
          <button onClick={()=>{setGameOver(false);setSc("title");}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid #475569",borderRadius:12,padding:"13px 20px",color:"#94A3B8",fontSize:13,cursor:"pointer",fontFamily:F}}>🏠 タイトル</button>
        </div>
      </div>
    </div>
  );

  // ── 勝利画面 ──
  if(sc==="battle"&&victory) return(
    <div style={{minHeight:"100vh",background:"#0A1A0A",fontFamily:F,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,#14532D 0%,#0A1A0A 70%)"}}/>
      {/* 火花エフェクト */}
      {[...Array(8)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${10+i*12}%`,top:"60%",fontSize:16,animation:`spark ${0.6+i*0.15}s ${i*0.1}s ease forwards`}}>⚡</div>
      ))}
      <div style={{animation:"victory 0.9s cubic-bezier(.34,1.56,.64,1) forwards",textAlign:"center",zIndex:1}}>
        <div style={{fontSize:50,marginBottom:8}}>🎊</div>
        <div style={{position:"relative",display:"inline-block",marginBottom:8}}>
          <div style={{
            position:"absolute",inset:-30,borderRadius:"50%",
            background:"radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,229,0,0.25) 45%, transparent 75%)",
            animation:"float 2s ease-in-out infinite",zIndex:0,
          }}/>
          <div style={{position:"relative",zIndex:1,filter:"drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 34px rgba(255,229,0,0.6))"}}>
            <WeldonImg size={120} mood="happy" bounce/>
          </div>
        </div>
        <div style={{fontSize:38,fontWeight:900,color:"#FFE500",textShadow:"0 0 30px #FFE500,0 0 60px #D97706",letterSpacing:3}}>VICTORY!</div>
        <div style={{color:"#4ADE80",fontSize:13,marginTop:6,marginBottom:16}}>{selSt?.enemy}を撃破！！</div>
        <div style={{background:"rgba(255,229,0,0.1)",border:"2px solid #FFE500",borderRadius:12,padding:"12px 20px",marginBottom:20}}>
          <div style={{color:"#FFE500",fontSize:22,fontWeight:900}}>+{earned} XP 獲得！</div>
          <div style={{color:"#94A3B8",fontSize:10,marginTop:2}}>正解数：{score} / {qi+1}問</div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>{
            const pl=getLv(xp),nx=xp+earned,nl=getLv(nx);
            // STAGE2分岐クリア判定（先にstateを更新）
            const isBranch=STAGE2_BRANCHES.some(b=>b.id===selSt?.id);
            if(isBranch&&!stage2Cleared){
              setStage2Cleared(true);
              setClearedBranch(selSt.id);
            }
            setXp(nx);
            setVictory(false);
            if(nl.level>pl.level){
              setPrevLv(pl);
              SFX.levelup();
              SFX.evolve();
              setTimeout(()=>setSc("lvlup"),200);
            } else {
              setSc("result");
            }
          }} style={{background:"linear-gradient(135deg,#FFE500,#D97706)",border:"none",borderRadius:12,padding:"13px 28px",color:"#1E293B",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:F,boxShadow:"0 4px 20px rgba(255,229,0,0.4)"}}>🏆 結果を見る！</button>
          <button onClick={()=>{setVictory(false);setSc("title");}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid #475569",borderRadius:12,padding:"13px 20px",color:"#94A3B8",fontSize:13,cursor:"pointer",fontFamily:F}}>🏠 タイトル</button>
        </div>
      </div>
    </div>
  );
  const stC = selSt?.color||"#E85D04";

  // ============================================================
  // ── TITLE ──
  // ============================================================
  if(sc==="title") return(
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:F,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
      <style>{css}</style>

      {/* 背景の星（軽量） */}
      {[...Array(12)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${6+i*8}%`,top:`${5+((i*37)%88)}%`,width:2,height:2,background:"#94A3B8",borderRadius:"50%",opacity:.4,animation:`twinkle ${1.2+i*0.2}s ${i*0.1}s infinite`}}/>
      ))}

      {/* ヘッダー（暗め） */}
      <div style={{width:"100%",boxSizing:"border-box",background:"linear-gradient(135deg,#1E293B,#0F172A)",padding:"20px 16px 24px",textAlign:"center"}}>
        <div style={{animation:"bounce 1.5s ease-in-out infinite",display:"inline-block"}}>
          <WeldonImg size={132} mood="smile"/>
        </div>
        <div style={{marginTop:6}}>
          <div style={{fontSize:9,letterSpacing:6,color:"#E85D04"}}>WELDON'S</div>
          <div style={{fontSize:32,fontWeight:900,color:"#FFE500",letterSpacing:3}}>FORGE</div>
          <div style={{fontSize:8,color:"#94A3B8",letterSpacing:2}}>溶接キャリア・資格学習｜全{QUIZ_STAGES.reduce((n,s)=>n+s.questions.length,0)}問</div>
        </div>
        {/* XPバー */}
        <div style={{marginTop:10,background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 14px",maxWidth:280,margin:"10px auto 0"}}>
          <div style={{color:lv.color,fontSize:13,fontWeight:700}}>{lv.name}</div>
          <div style={{color:"#FFE500",fontSize:10,marginTop:2}}>XP: {xp}</div>
          <div style={{background:"rgba(255,255,255,0.1)",borderRadius:4,height:8,margin:"5px 0",overflow:"hidden"}}>
            <div style={{width:`${Math.min(100,((xp-lv.minXP)/((nxt?.minXP||lv.minXP+300)-lv.minXP))*100)}%`,height:"100%",background:lv.color,transition:"width .8s ease"}}/>
          </div>
          {nxt&&<div style={{color:"#94A3B8",fontSize:9}}>「{nxt.name}」まで {nxt.minXP-xp} XP</div>}
          {stage2Cleared&&<div style={{color:"#4CAF50",fontSize:9,marginTop:3}}>{STAGE2_BRANCHES.find(b=>b.id===clearedBranch)?.badge} ✓</div>}
        </div>
      </div>

      {/* タブ(グループ) */}
      <div style={{display:"flex",width:"100%",maxWidth:400,background:"white",borderBottom:"2px solid #E2E8F0"}}>
        {TAB_GROUPS.map(g=>{
          const on = groupOf(tab).id===g.id;
          return(
            <button key={g.id} onClick={()=>!on&&setTab(g.subs[0].id)} style={{flex:1,padding:"12px 0",border:"none",borderBottom:`3px solid ${on?"#E85D04":"transparent"}`,background:"white",color:on?"#1E293B":"#94A3B8",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>{g.l}</button>
          );
        })}
      </div>
      {/* サブタブ */}
      {groupOf(tab).subs.length>1&&(
        <div style={{display:"flex",gap:6,width:"100%",boxSizing:"border-box",maxWidth:400,padding:"10px 14px 0"}}>
          {groupOf(tab).subs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"7px 0",borderRadius:999,border:`1px solid ${tab===t.id?"#E85D04":"#CBD5E1"}`,background:tab===t.id?"#E85D04":"white",color:tab===t.id?"white":"#475569",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>{t.l}</button>
          ))}
        </div>
      )}

      <div style={{width:"100%",boxSizing:"border-box",maxWidth:400,padding:"12px 14px 40px",overflowY:"auto"}}>

        {/* ── クイズタブ ── */}
        {tab==="quiz"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* ── 学習の道しるべ（初見ガイド・各タブへジャンプ） ── */}
            <div style={{background:"linear-gradient(160deg,#0F172A,#1E293B)",borderRadius:10,padding:"11px 12px",marginBottom:2}}>
              <div style={{color:"#F8FAFC",fontSize:11,fontWeight:700}}>🧭 はじめての方へ — 学習の道しるべ</div>
              <div style={{color:"#94A3B8",fontSize:9,lineHeight:1.5,margin:"3px 0 8px"}}>どこから手を付ける？ タップでそのタブへ。</div>
              {[
                {t:"tree", n:"1", ic:"🗺️", l:"キャリアで全体像", d:"昇段ラダーで“今どこ→次どこ”を掴む"},
                {t:"quiz", n:"2", ic:"🎮", l:"クイズで知識", d:"RPG形式で基礎〜専門を身につける"},
                {t:"calc", n:"3", ic:"🔢", l:"計算ドリル", d:"入熱・Ceq・のど厚を反復特訓"},
                {t:"mock", n:"4", ic:"📝", l:"模試＆記述・口述", d:"本番形式＋WES管理2級/1級対策"},
                {t:"stats",n:"5", ic:"📊", l:"弱点で復習", d:"間違えた問題だけ再挑戦"},
              ].map((s,i)=>(
                <button key={i} onClick={()=>setTab(s.t)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1px solid #334155",borderRadius:8,padding:"7px 9px",marginBottom:5,cursor:"pointer",fontFamily:F,textAlign:"left"}}>
                  <span style={{width:18,height:18,borderRadius:"50%",background:"#E85D04",color:"white",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.n}</span>
                  <span style={{fontSize:13,flexShrink:0}}>{s.ic}</span>
                  <span style={{flex:1}}>
                    <span style={{display:"block",color:"#F1F5F9",fontSize:10,fontWeight:700}}>{s.l}</span>
                    <span style={{display:"block",color:"#94A3B8",fontSize:9,marginTop:1}}>{s.d}</span>
                  </span>
                  <span style={{color:"#64748B",fontSize:11,flexShrink:0}}>›</span>
                </button>
              ))}
            </div>

            {/* ── ゲームの進め方 ── */}
            <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:10,padding:"10px 12px",marginBottom:2}}>
              <div style={{color:"#C2410C",fontSize:11,fontWeight:700,marginBottom:5}}>🎮 ゲームの進め方</div>
              {[
                {icon:"⚡",text:"問題に正解するとXPがもらえる！"},
                {icon:"📈",text:"XPが貯まると次のSTAGEが解放される！"},
                {icon:"🔀",text:"STAGE2はAW・ボイラー・水中から1つクリアでOK！"},
                {icon:"🏆",text:"10問正解でモンスターを撃破→勝利！"},
                {icon:"💀",text:"5回間違えるとゲームオーバー。諦めないで！"},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:3,alignItems:"flex-start"}}>
                  <span style={{fontSize:11,flexShrink:0}}>{r.icon}</span>
                  <div style={{color:"#92400E",fontSize:10,lineHeight:1.5}}>{r.text}</div>
                </div>
              ))}
            </div>

            {/* ── WELDONのプッシュメッセージ ── */}
            {(()=>{
              const nxtLv=getNxt(xp);
              const remain=nxtLv?nxtLv.minXP-xp:0;
              const pct=nxtLv?Math.round(((xp-lv.minXP)/(nxtLv.minXP-lv.minXP))*100):100;
              let msg="",color="#16A34A",bg="#F0FDF4",border="#86EFAC";
              if(!nxtLv){
                msg="🏆 最高レベル到達！伝説の溶接エンジニア！";
              } else if(remain<=30){
                msg=`🔥 あと${remain}XPでレベルアップ！もう一息！`;
                color="#DC2626";bg="#FEF2F2";border="#FCA5A5";
              } else if(remain<=80){
                msg=`⚡ レベルアップまであと${remain}XP！もうすこし！`;
                color="#D97706";bg="#FFF7ED";border="#FED7AA";
              } else if(!stage2Cleared&&xp>=200){
                msg="🔀 STAGE2に挑もう！どれか1つクリアでSTAGE3へ！";
                color="#1D4ED8";bg="#EFF6FF";border="#BFDBFE";
              } else if(xp<200){
                msg=`📈 STAGE2解放まであと${200-xp}XP！STAGE1を繰り返そう！`;
                color="#7C3AED";bg="#F5F3FF";border="#DDD6FE";
              } else if(stage2Cleared&&xp<550){
                msg=`👑 STAGE3解放まであと${550-xp}XP！もう少し！`;
                color="#D97706";bg="#FFF7ED";border="#FED7AA";
              } else {
                msg=`💪 今のレベル：${lv.name}（XP:${xp}）調子いいぞ！`;
              }
              return(
                <div style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:"9px 12px",display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:28,flexShrink:0}}>
                    <svg width="36" height="40" viewBox="0 0 100 110" style={{imageRendering:"pixelated"}}>
                      <rect x="32" y="48" width="36" height="42" rx="3" fill={lv.wCol||"#E74C3C"}/>
                      <rect x="36" y="57" width="10" height="8" rx="1" fill="white"/>
                      <rect x="54" y="57" width="10" height="8" rx="1" fill="white"/>
                      <rect x="38" y="59" width="6" height="5" rx="1" fill="#5B7FDB"/>
                      <rect x="56" y="59" width="6" height="5" rx="1" fill="#5B7FDB"/>
                      <path d="M40,69 Q50,76 60,69" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color,fontSize:11,fontWeight:700,lineHeight:1.6}}>{msg}</div>
                    {nxtLv&&<div style={{marginTop:4,background:"rgba(0,0,0,0.08)",borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:color,transition:"width .8s ease"}}/>
                    </div>}
                    {nxtLv&&<div style={{color,fontSize:9,marginTop:2}}>次のLv「{nxtLv.name}」まで {remain} XP</div>}
                  </div>
                </div>
              );
            })()}

            {/* STAGE 1 */}
            {MAIN_STAGES.filter(s=>s.id===1).map(s=>{
              const ok=xp>=s.unlockXP;
              return(
                <button key={s.id} onClick={()=>ok&&startBattle(s)} style={{background:ok?`${s.color}10`:"#F8FAFC",border:`2px solid ${ok?s.color:"#E2E8F0"}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:ok?"pointer":"default",fontFamily:F,boxShadow:ok?"0 2px 8px rgba(0,0,0,0.08)":"none",opacity:ok?1:0.5}}>
                  <div style={{width:42,height:42,borderRadius:10,background:ok?`${s.color}15`:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{ok?s.icon:"🔒"}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{color:ok?s.color:"#94A3B8",fontSize:10,fontWeight:700}}>{s.label}</div>
                    <div style={{color:"#64748B",fontSize:9,marginTop:1}}>
                      {ok?`${s.enemy}に挑む！ 正解で+XP`:`XP ${s.unlockXP}以上で解放（あと${s.unlockXP-xp}XP）`}
                    </div>
                  </div>
                  {ok&&<span style={{color:s.color,fontSize:16,fontWeight:900}}>▶</span>}
                </button>
              );
            })}

            {/* STAGE 2 分岐ボックス */}
            <div style={{background:"#EFF6FF",border:"2px solid #1D4ED8",borderRadius:12,padding:"10px 12px"}}>
              <div style={{color:"#1D4ED8",fontSize:10,fontWeight:700,marginBottom:2}}>🔀 STAGE 2 — 専門ルート分岐</div>
              <div style={{color:"#64748B",fontSize:9,marginBottom:8}}>
                {stage2Cleared?"✅ クリア！→ STAGE 3解放済み":"どれか1つ60%以上合格でSTAGE 3へ進める"}
              </div>
              {STAGE2_BRANCHES.map(b=>{
                const ok=xp>=200;
                const isCleared=clearedBranch===b.id;
                return(
                  <button key={b.id} onClick={()=>ok&&startBattle(b)} style={{width:"100%",background:isCleared?`${b.color}15`:ok?`${b.color}08`:"#F8FAFC",border:`1px solid ${isCleared?b.color:ok?b.color+"40":"#E2E8F0"}`,borderRadius:8,padding:"9px 11px",display:"flex",alignItems:"center",gap:8,cursor:ok?"pointer":"default",fontFamily:F,marginBottom:5,opacity:ok?1:0.4}}>
                    <span style={{fontSize:16}}>{ok?b.icon:"🔒"}</span>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{color:ok?b.color:"#94A3B8",fontSize:10,fontWeight:700}}>{b.label}</div>
                      <div style={{color:"#64748B",fontSize:9,marginTop:1}}>
                        {isCleared?"✅ 合格済み！":ok?`${b.enemy}に挑む！`:xp>=200?`解放済み！`:`XP 200以上で解放（あと${200-xp}XP）`}
                      </div>
                    </div>
                    {ok&&<span style={{color:isCleared?"#16A34A":b.color,fontSize:13}}>{isCleared?"✓":"▶"}</span>}
                  </button>
                );
              })}
            </div>

            {/* 実技STAGE・STAGE 3〜5 */}
            {MAIN_STAGES.filter(s=>s.id!==1).map(s=>{
              const ok = s.id===3 ? (stage2Cleared&&xp>=s.unlockXP) : xp>=s.unlockXP;
              return(
                <button key={s.id} onClick={()=>ok&&startBattle(s)} style={{background:ok?`${s.color}10`:"#F8FAFC",border:`2px solid ${ok?s.color:"#E2E8F0"}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:ok?"pointer":"default",fontFamily:F,boxShadow:ok?"0 2px 8px rgba(0,0,0,0.08)":"none",opacity:ok?1:0.5}}>
                  <div style={{width:42,height:42,borderRadius:10,background:ok?`${s.color}15`:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{ok?s.icon:"🔒"}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{color:ok?s.color:"#94A3B8",fontSize:10,fontWeight:700}}>{s.label}</div>
                    <div style={{color:"#64748B",fontSize:9,marginTop:1,lineHeight:1.5}}>
                      {ok ? `${s.enemy}に挑む！ 正解で+XP` :
                       s.id===3 ? (
                         !stage2Cleared ? "🔒 先にSTAGE2をクリアしよう！" :
                         `✅ STAGE2クリア済み！あと${Math.max(0,s.unlockXP-xp)}XPで解放！`
                       ) : `🔒 あと${Math.max(0,s.unlockXP-xp)}XPで解放！`
                      }
                    </div>
                  </div>
                  {ok&&<span style={{color:s.color,fontSize:16,fontWeight:900}}>▶</span>}
                </button>
              );
            })}

            <a href={FB} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",border:"1px solid #CBD5E1",borderRadius:10,padding:"10px 0",color:"#64748B",fontSize:10,fontFamily:F,textDecoration:"none",background:"white",marginTop:4}}>📝 フィードバックを送る</a>
          </div>
        )}

        <Suspense fallback={<div style={{textAlign:"center",color:"#94A3B8",fontSize:11,padding:30}}>読み込み中…</div>}>
        {/* ── ツリータブ ── */}
        {tab==="tree"&&<TreeScreen/>}

        {/* ── コストタブ ── */}
        {tab==="cost"&&<CostScreen/>}

        {/* ── 記号タブ ── */}
        {tab==="symbol"&&<SymbolScreen/>}

        {/* ── 計算タブ ── */}
        {tab==="calc"&&<CalcScreen/>}
        {tab==="weave"&&<WeaveScreen/>}
        {tab==="stats"&&<StatsScreen onReview={startReviewBattle}/>}
        {tab==="mock"&&<MockScreen/>}
        </Suspense>

      </div>
    </div>
  );

  // ============================================================
  // ── BATTLE（ドラクエ風） ──
  // ============================================================
  if(sc==="battle"&&q) return(
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:F,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      {/* スキャンライン */}
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",pointerEvents:"none",zIndex:20}}/>
      {/* フラッシュオーバーレイ */}
      {flash==="red"&&<div style={{position:"fixed",inset:0,zIndex:50,pointerEvents:"none",animation:"redflash 0.5s ease forwards"}}/>}
      {flash==="white"&&<div style={{position:"fixed",inset:0,zIndex:50,pointerEvents:"none",animation:"whiteflash 0.4s ease forwards"}}/>}

      {/* ヘッダー */}
      <div style={{background:"#1E293B",borderBottom:"2px solid #334155",padding:"7px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setSc("title")} style={{background:"none",border:"1px solid #475569",borderRadius:6,color:"#94A3B8",padding:"4px 10px",cursor:"pointer",fontSize:10,fontFamily:F}}>← 逃げる</button>
        <div style={{color:stC,fontSize:9,fontWeight:700}}>{selSt?.label}</div>
        <div style={{color:"#FFE500",fontSize:10,fontWeight:700}}>XP:{xp+earned} | {qi+1}/20</div>
      </div>

      {/* バトルフィールド（暗め） */}
      <div style={{background:"linear-gradient(180deg,#1E293B 0%,#0F172A 60%,#1E293B 100%)",padding:"12px 10px",flex:1,display:"flex",flexDirection:"column"}}>

        {/* 敵 */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:7,minHeight:180,position:"relative"}}>
          <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <Enemy st={selSt} hit={eHit} hp={eHP} maxHP={100} exploding={exploding}/>
            {dmg?.t==="e"&&<div style={{position:"absolute",top:"15%",left:"50%",transform:"translateX(-50%)",color:"#FF6B00",fontSize:22,fontWeight:900,textShadow:"0 0 10px #FF6B00",animation:"dmg .8s ease forwards",zIndex:10}}>{dmg.val}</div>}
          </div>
        </div>

        {/* 問題ウィンドウ */}
        <div style={{background:"white",border:"3px solid #334155",borderRadius:6,padding:"10px 12px",marginBottom:7,position:"relative",minHeight:55,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
          <div style={{position:"absolute",top:-1,left:10,background:"white",padding:"0 6px",color:"#475569",fontSize:8,fontWeight:700}}>【質問】<span style={{color:stC,marginLeft:5}}>— {q.cat}</span></div>
          <div style={{color:"#1E293B",fontSize:12,lineHeight:1.85,marginTop:4}}>{q.q}</div>
        </div>

        {/* コマンド＋プレイヤー */}
        <div style={{display:"flex",gap:7,marginBottom:7}}>
          {/* コマンドウィンドウ */}
          <div style={{background:"white",border:"3px solid #334155",borderRadius:6,padding:"8px 10px",flex:1,minWidth:0,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
            <div style={{color:"#475569",fontSize:8,fontWeight:700,marginBottom:5}}>【こたえる】</div>
            {showOpts&&q.opts.map((o,i)=>{
              let c="#1E293B";
              if(sel!==null){ if(i===q.a)c="#16A34A"; else if(i===sel)c="#DC2626"; }
              return(
                <div key={i} onClick={()=>sel===null&&doAnswer(i)} style={{color:c,fontSize:10,padding:"4px 2px",cursor:sel===null?"pointer":"default",display:"flex",alignItems:"flex-start",gap:3,fontWeight:sel===null&&i===cur%4?"900":"400"}}>
                  <span style={{color:"#FFE500",background:"#1E293B",borderRadius:2,opacity:sel===null&&i===cur%4?1:0,fontSize:8,marginTop:1,flexShrink:0,padding:"0 2px"}}>▶</span>
                  <span style={{fontSize:8,color:"#94A3B8",marginRight:2,flexShrink:0}}>{["Ａ","Ｂ","Ｃ","Ｄ"][i]}.</span>
                  <span style={{fontSize:10,lineHeight:1.5}}>{o}</span>
                </div>
              );
            })}
            {!showOpts&&!showMsg&&<div style={{color:"#94A3B8",fontSize:10,padding:"8px 0"}}>...</div>}
          </div>

          {/* プレイヤーステータス */}
          <div style={{background:"white",border:"3px solid #334155",borderRadius:6,padding:"5px 6px",width:168,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
            <div style={{color:"#475569",fontSize:8,fontWeight:700,marginBottom:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{lv.name}</div>
            <div style={{position:"relative",display:"flex",justifyContent:"center"}}>
              <WeldonImg size={148} mood={mood} bounce={bounce} hit={wHit}/>
              {dmg?.t==="p"&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",color:"#DC2626",fontSize:18,fontWeight:900,animation:"dmg .8s ease forwards",zIndex:10}}>{dmg.val}</div>}
            </div>
            <div style={{marginTop:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{color:"#64748B",fontSize:9}}>HP</span>
                <span style={{color:"#16A34A",fontSize:9,fontWeight:700}}>{pHP}</span>
              </div>
              <HPBar v={pHP} max={lv.hp}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{color:"#64748B",fontSize:9}}>問</span>
                <span style={{color:"#FFE500",fontSize:9,fontWeight:700}}>{qi+1}/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* メッセージウィンドウ */}
        {showMsg&&(
          <div onClick={nextQ} style={{background:"white",border:"3px solid #334155",borderRadius:6,padding:"10px 12px",cursor:"pointer",position:"relative",minHeight:55,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
            <div style={{color:"#1E293B",fontSize:11,lineHeight:1.75,whiteSpace:"pre-line"}}>{msg}</div>
            {msgDone&&<div style={{position:"absolute",bottom:6,right:10,color:"#FFE500",fontSize:12,background:"#1E293B",padding:"1px 4px",borderRadius:3,animation:"cursor 2s infinite"}}>▼</div>}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // ── LEVEL UP（変身イベント） ──
  // ============================================================
  if(sc==="lvlup") return(
    <LevelUpEvent lv={lv} prevLv={prevLv} onNext={()=>setSc("result")}/>
  );

  // ============================================================
  // ── RESULT ──
  // ============================================================
  if(sc==="result") return(
    <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:F,padding:14,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      <style>{css}</style>

      {/* スコア */}
      <div style={{background:"linear-gradient(135deg,#1E293B,#0F172A)",borderRadius:14,padding:"16px",marginBottom:12,textAlign:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",position:"relative",overflow:"hidden"}}>

        {/* 勝利時：紙吹雪 */}
        {score>=MAX_Q*0.7 && Array.from({length:24}).map((_,i)=>{
          const left = Math.random()*100;
          const colors=["#FFE500","#FF6B00","#22C55E","#3B82F6","#EC4899","#FFFFFF"];
          return <div key={i} style={{
            position:"absolute",top:"-10%",left:`${left}%`,
            width:6,height:10,background:colors[i%colors.length],
            opacity:0.9,borderRadius:1,
            animation:`confettiFall ${1.4+Math.random()*1.2}s ${Math.random()*0.6}s ease-in infinite`,
            zIndex:1,
          }}/>;
        })}

        {score>=MAX_Q*0.7 ? (
          <div style={{fontSize:24,fontWeight:900,color:"#FFE500",letterSpacing:3,marginBottom:4,animation:"clearPop 0.8s cubic-bezier(.34,1.56,.64,1) forwards, goldGlow 1.6s ease-in-out infinite",position:"relative",zIndex:2}}>
            🏆 STAGE CLEAR! 🏆
          </div>
        ):(
          <div style={{fontSize:9,color:"#94A3B8",letterSpacing:4,marginBottom:4,position:"relative",zIndex:2}}>★ BATTLE RESULT ★</div>
        )}

        <div style={{fontSize:38,fontWeight:900,color:"#FFE500",position:"relative",zIndex:2}}>{score} / {MAX_Q}</div>
        <div style={{color:"#94A3B8",fontSize:11,marginTop:2,position:"relative",zIndex:2}}>+{earned} XP 獲得</div>
        {/* STAGE2分岐の合否 */}
        {STAGE2_BRANCHES.some(b=>b.id===selSt?.id)&&(
          <div style={{marginTop:8,padding:"7px 12px",background:score>=MAX_Q*0.6?"rgba(22,163,74,0.15)":"rgba(220,38,38,0.15)",border:"1px solid "+(score>=MAX_Q*0.6?"#16A34A":"#DC2626"),borderRadius:8,fontSize:11,color:score>=MAX_Q*0.6?"#4ADE80":"#F87171",position:"relative",zIndex:2}}>
            {selSt?.qStageId===-1 ? "📊 弱点克服バトル完了！ "+score+"/"+MAX_Q+" 正解" : (score>=MAX_Q*0.6 ? "🎉 合格！ "+selSt.badge+" → STAGE 3解放！" : "不合格（"+score+"/"+MAX_Q+"）60%以上で合格 → 再挑戦！")}
          </div>
        )}

        <div style={{display:"flex",justifyContent:"center",marginTop:10,position:"relative",zIndex:2}}>
          <div style={{position:"relative"}}>
            {/* 勝利時：白い光彩＋スパーク */}
            {score>=MAX_Q*0.7 && (
              <>
                <div style={{
                  position:"absolute",inset:-30,borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,229,0,0.2) 45%, transparent 75%)",
                  animation:"float 2s ease-in-out infinite",
                  zIndex:0,
                }}/>
                {Array.from({length:14}).map((_,i)=>{
                  const ang=(i/14)*Math.PI*2;
                  const dist=70+Math.random()*40;
                  return <div key={i} style={{
                    position:"absolute",left:"50%",top:"45%",
                    width:3,height:3,borderRadius:"50%",background:"#FFE500",
                    boxShadow:"0 0 6px 2px #FFA500",
                    "--dx":`${Math.cos(ang)*dist}px`,"--dy":`${Math.sin(ang)*dist}px`,
                    animation:`resultSpark ${0.6+Math.random()*0.6}s ${Math.random()*0.5}s ease-out infinite`,
                    zIndex:1,
                  }}/>;
                })}
              </>
            )}
            <div style={{position:"relative",zIndex:2,filter:"drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 34px rgba(255,229,0,0.6))"}}>
              <img src={score>=MAX_Q*0.7 ? "/weldon-smile.webp" : "/weldon-levelup-normal.webp"} alt="WELDON" width={280}/>
            </div>
          </div>
        </div>
      </div>

      {/* XPバー */}
      <div style={{background:"white",borderRadius:12,padding:"12px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #F1F5F9"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <span style={{color:lv.color,fontSize:12,fontWeight:700}}>{lv.name}</span>
          <span style={{color:"#1E293B",fontSize:11}}>XP: {xp}</span>
        </div>
        <div style={{background:"#E2E8F0",borderRadius:5,height:10,border:"1px solid #CBD5E1",overflow:"hidden"}}>
          <div style={{width:`${Math.min(100,((xp-lv.minXP)/((nxt?.minXP||lv.minXP+300)-lv.minXP))*100)}%`,height:"100%",background:lv.color,transition:"width .8s ease"}}/>
        </div>
        {nxt&&<div style={{color:"#94A3B8",fontSize:9,marginTop:3}}>「{nxt.name}」まで {nxt.minXP-xp} XP</div>}
      </div>

      {/* 答えの振り返り */}
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
        {ans.map((a,i)=>(
          <div key={i} style={{background:a.ok?"#F0FDF4":"#FEF2F2",border:"1px solid "+(a.ok?"#86EFAC":"#FCA5A5"),borderRadius:10,padding:"9px 11px"}}>
            <div style={{color:a.ok?"#166534":"#991B1B",fontSize:10,fontWeight:700,marginBottom:2}}>
              {a.ok?"✅ 正解":"❌ 不正解"} — {a.cat}
              {a.ok&&<span style={{color:"#D97706",marginLeft:5}}>+{a.xp}XP</span>}
            </div>
            <div style={{color:"#475569",fontSize:10,lineHeight:1.55}}>{a.exp}</div>
          </div>
        ))}
      </div>

      {/* ボタン */}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={()=>startBattle(selSt)} style={{flex:1,background:`linear-gradient(135deg,${stC},${stC}CC)`,border:"none",borderRadius:12,padding:"13px 0",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,boxShadow:`0 4px 14px ${stC}40`}}>🔥 もう一戦</button>
        <button onClick={()=>setSc("title")} style={{flex:1,background:"white",border:"2px solid #CBD5E1",borderRadius:12,padding:"13px 0",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:F}}>🏠 タイトル</button>
      </div>

      {/* 次のSTAGEへボタン */}
      <button onClick={()=>setSc("title")} style={{width:"100%",background:"linear-gradient(135deg,#059669,#047857)",border:"none",borderRadius:12,padding:"13px 0",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,boxShadow:"0 4px 14px rgba(5,150,105,0.4)",marginBottom:8}}>
        ⚔️ 次のステージへ
      </button>


      <a href={FB} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",border:"1px solid #CBD5E1",borderRadius:10,padding:"10px 0",color:"#64748B",fontSize:10,fontFamily:F,textDecoration:"none",background:"white"}}>📝 フィードバックを送る（アプリ改善にご協力ください）</a>
    </div>
  );

  return null;
}

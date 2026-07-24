// ============================================================
// WELDON'S FORGE - キャリアツリー＋コスト＋ロードマップ
// ============================================================
import { useState } from "react";

const F = "'Courier New',monospace";

// ── キャリアツリーデータ ──
const TREE = [
  {id:"s0", stage:"STAGE 0", label:"現場サポート資格", color:"#0F766E", icon:"🔧",
   merit:"現場で即戦力になるための基礎セット。ほぼ全現場で必須。",
   nodes:[
    {name:"自由研削といし特別教育",  type:"特別教育", income:"現場必須",    cost:"3,000〜5,000円",    period:"半日〜1日", req:"なし",         desc:"グラインダーの砥石取り替えに必須。溶接前後の研磨・バリ取りで毎日使う。"},
    {name:"低圧電気取扱業務特別教育",type:"特別教育", income:"現場必須",    cost:"6,000〜12,000円",   period:"1日",       req:"なし",         desc:"溶接機の接続・配線・ブレーカー操作に必要。600V以下の低圧電気の取扱に必須。"},
    {name:"フルハーネス特別教育",    type:"特別教育", income:"高所作業必須", cost:"5,000〜8,000円",    period:"半日〜1日", req:"なし",         desc:"高さ2m以上の高所作業でのフルハーネス使用に必須。2019年法改正で義務化。"},
    {name:"酸欠・硫化水素危険作業特別教育", type:"特別教育", income:"造船・プラント必須", cost:"6,000〜10,000円", period:"1日", req:"なし", desc:"タンク・船艙内での溶接作業に必須。密閉空間の溶接は酸欠リスクが高く死亡事故につながる。"},
    {name:"粉じん作業特別教育",      type:"特別教育", income:"現場必須",    cost:"3,000〜6,000円",    period:"半日",      req:"なし",         desc:"2021年法改正でアーク溶接が特定粉じん作業に追加。多くの現場で受講必須になった。"},
    {name:"ガス溶接技能講習",        type:"技能講習", income:"時給+100〜300円", cost:"13,000〜16,000円", period:"3日", req:"満15歳以上",  desc:"アセチレン等を使用した溶接・溶断・加熱作業に必要。ガス切断もこの資格。"},
  ]},
  {id:"s0b", stage:"STAGE 0-B", label:"重機・運搬・高所資格", color:"#B45309", icon:"🏗️",
   merit:"取るたびに単価が上がる。玉掛け+クレーンはセット取得がお得。",
   nodes:[
    {name:"玉掛け技能講習",         type:"技能講習", income:"時給+200〜500円",  cost:"18,000〜25,000円",  period:"3日",    req:"満18歳以上", desc:"つり上げ荷重1t以上のクレーン等の玉掛け作業に必須。鉄骨・造船で毎日使う。"},
    {name:"小型移動式クレーン",     type:"技能講習", income:"時給+300〜500円",  cost:"30,000〜35,000円",  period:"4〜5日", req:"満18歳以上", desc:"1t以上5t未満の移動式クレーン運転に必要。玉掛けと一緒に取ると費用と日数を節約できる。"},
    {name:"クレーン・デリック運転士免許", type:"国家免許", income:"時給+500〜1,000円", cost:"40,000〜150,000円", period:"教習所コース", req:"満18歳以上", desc:"つり上げ荷重5t以上の天井クレーン・橋形クレーンの運転に必要な国家免許。"},
    {name:"フォークリフト運転技能講習", type:"技能講習", income:"時給+200〜400円", cost:"30,000〜60,000円", period:"2〜5日", req:"満18歳以上", desc:"最大荷重1t以上のフォークリフト運転に必要。工場・造船所・建設現場でほぼ必須。"},
    {name:"高所作業車運転技能講習（10m以上）", type:"技能講習", income:"時給+200〜500円", cost:"40,000〜50,000円", period:"3〜4日", req:"満18歳以上", desc:"作業床高さ10m以上の高所作業車の運転に必要。橋梁・鉄骨・プラントの高所溶接で使用。"},
  ]},
  {id:"s1", stage:"STAGE 1", label:"JIS溶接技能者", color:"#78716C", icon:"⚡",
   merit:"溶接工の「名刺代わり」。JIS資格なしでは現場に入れない案件が多い。",
   nodes:[
    {name:"アーク溶接特別教育", type:"必須", income:"受講必須",       cost:"12,000〜16,000円", period:"2〜3日", req:"15歳以上",       desc:"労働安全衛生法に基づく安全資格。現場に立つための第一歩。"},
    {name:"JIS溶接技能者 基本級", type:"技能", income:"時給 1,200〜1,500円", cost:"23,000〜40,000円", period:"2日", req:"特別教育修了 / 実務1ヶ月", desc:"下向き溶接の技量評価試験。溶接工の名刺代わり。"},
    {name:"JIS溶接技能者 専門級", type:"技能", income:"時給 1,500〜2,000円", cost:"30,000〜50,000円", period:"半日", req:"基本級 / 実務3ヶ月", desc:"立向・横向・上向・管溶接。N-2P（パイプ全姿勢）合格率30%。"},
  ]},
  {id:"s2", stage:"STAGE 2", label:"専門ルート分岐", color:"#1D4ED8", icon:"🔀",
   merit:"専門性で単価が一気に上がる。3ルートのどれかを選んで差別化。",
   nodes:[
    {name:"AW検定",             type:"鉄骨",  income:"時給 2,000〜2,800円",  cost:"25〜30万円（会社負担が多い）", period:"年1回（6〜9月）", req:"JIS専門級保有", desc:"建築鉄骨溶接の品質保証資格。年1回のみ。ゼネコン案件に必須。"},
    {name:"ボイラー溶接士（普通→特別）", type:"プラント", income:"時給 2,200〜3,000円", cost:"学科6,800円 / 実技18,900円（普通）", period:"年2回", req:"溶接実務1年以上", desc:"普通（板厚25mm以下）→特別（全作業）の国家資格。プラント・圧力容器・発電設備に必須。"},
    {name:"潜水士免許",         type:"水中",  income:"時給 3,000〜4,000円+", cost:"学科8,800円〜",  period:"随時",       req:"JIS専門級 / 18歳以上", desc:"筆記のみ合格率80%。JIS専門級と組み合わせで水中溶接工へ。年収1,000万超も現実。"},
  ]},
  {id:"s3", stage:"STAGE 3", label:"現場リーダー職", color:"#D97706", icon:"👑",
   merit:"管理側へキャリアシフト。工場認定・官公庁工事の必須資格。",
   nodes:[
    {name:"溶接作業指導者",       type:"監督", income:"時給 2,500〜3,500円", cost:"約50,000円",         period:"年複数回", req:"JIS資格3年以上",          desc:"現場の職長・班長クラス。技能者と管理技術者の中間。"},
    {name:"溶接管理技術者 2級",   type:"管理", income:"時給 3,000〜4,000円", cost:"受験料54,000円+講習", period:"年2回",    req:"高卒+実務3年 / 大卒+実務1年", desc:"溶接作業の監督・指導・品質管理。工場認定・官公庁工事に必須。"},
    {name:"溶接管理技術者 1級",   type:"管理", income:"時給 4,000〜5,000円", cost:"受験料54,000円+講習", period:"年2回",    req:"WES管理2級+実務経験",      desc:"専門技術分野の職務担当。記述式試験。橋梁・造船・プラント全対応。"},
    {name:"溶接管理技術者 特別級",type:"管理", income:"年収 600〜900万円",   cost:"受験料54,000円",     period:"年1〜2回",  req:"WES管理1級+実務経験",      desc:"溶接全般の計画・監督・品質管理を統括。小論文＋口述試験。現場の最高責任者。"},
  ]},
  {id:"s4", stage:"STAGE 4", label:"AWS国際資格", color:"#DC2626", icon:"🇺🇸",
   merit:"海外・国際プロジェクトに参加できる。英語圏・アジア案件で強力。",
   nodes:[
    {name:"AWS CW（Certified Welder）",  type:"AWS技能", income:"時給 2,500〜3,500円", cost:"受験料20,000〜40,000円", period:"随時",   req:"JIS資格+実務",      desc:"特定の溶接プロセス・姿勢・材料における技能認定。海外プロジェクト参加の入口。"},
    {name:"AWS CWI（Certified Welding Inspector）", type:"AWS検査", income:"時給 4,000〜6,000円", cost:"受験料54,050円 / 講習15〜20万円", period:"年数回", req:"25歳以上+実務5年+", desc:"溶接品質・規格適合の検査官資格。全産業・全世界で通用する検査官証明。"},
    {name:"AWS SCWI（Senior CWI）",      type:"AWS上級", income:"年収 900万〜",        cost:"80,000〜100,000円",  period:"随時",   req:"CWI 6年以上",        desc:"AWS最高峰の検査官資格。4専門資格の積み上げ方式。"},
  ]},
  {id:"s5", stage:"STAGE 5", label:"IIW国際資格（最高峰）", color:"#7C3AED", icon:"🌍",
   merit:"世界中の案件に参加できる。設計・研究・品質管理の最高レベル。",
   nodes:[
    {name:"IIW IWS（国際溶接専門士）",    type:"IIW", income:"年収 600〜800万円",   cost:"20〜40万円+",   period:"J-ANB機関随時",    req:"所定訓練+実務",      desc:"現場の溶接施工・品質管理の実務資格。"},
    {name:"IIW IWT（国際溶接技術者）",    type:"IIW", income:"年収 800〜1,200万円", cost:"30〜50万円+",   period:"J-ANB機関年1〜2回", req:"IWS+技術面接合格",  desc:"現場の技術管理・品質保証レベル。"},
    {name:"IIW IWE（国際溶接エンジニア）",type:"IIW", income:"年収 1,200万〜",      cost:"40〜70万円+",   period:"J-ANB機関年1〜2回", req:"理工系学位+所定訓練", desc:"溶接の設計・研究・開発レベルの最上位資格。世界の溶接工の頂点。"},
  ]},
];

// ── コストデータ ──
const COST_GROUPS = [
  {l:"🔧 現場サポート資格",c:"#0F766E",items:[
    ["自由研削といし特別教育","3,000〜5,000円"],
    ["低圧電気取扱業務特別教育","6,000〜12,000円"],
    ["フルハーネス特別教育","5,000〜8,000円"],
    ["酸欠・硫化水素特別教育","6,000〜10,000円"],
    ["粉じん作業特別教育","3,000〜6,000円"],
    ["ガス溶接技能講習","13,000〜16,000円"],
  ]},
  {l:"🏗️ 重機・運搬・高所",c:"#B45309",items:[
    ["玉掛け技能講習","18,000〜25,000円"],
    ["小型移動式クレーン","30,000〜35,000円"],
    ["クレーン・デリック運転士免許","40,000〜150,000円"],
    ["フォークリフト技能講習","30,000〜60,000円"],
    ["高所作業車（10m以上）","40,000〜50,000円"],
  ]},
  {l:"⚡ JIS溶接技能者",c:"#78716C",items:[
    ["アーク溶接特別教育","12,000〜16,000円"],
    ["JIS基本級","23,000〜40,000円"],
    ["JIS専門級","30,000〜50,000円"],
  ]},
  {l:"🔀 STAGE 2 専門ルート",c:"#1D4ED8",items:[
    ["AW検定","250,000〜300,000円"],
    ["ボイラー溶接士（普通）","25,700円"],
    ["潜水士免許","8,800円〜"],
  ]},
  {l:"👑 WES管理技術者",c:"#D97706",items:[
    ["溶接作業指導者","約50,000円"],
    ["WES管理2級","84,000〜110,000円"],
    ["WES管理1級","100,000〜130,000円"],
    ["WES管理特別級","54,000円+口述試験"],
  ]},
  {l:"🇺🇸 AWS国際資格",c:"#DC2626",items:[
    ["AWS CW","20,000〜40,000円"],
    ["AWS CWI","200,000〜260,000円"],
    ["AWS SCWI","80,000〜100,000円"],
  ]},
  {l:"🌍 IIW国際資格",c:"#7C3AED",items:[
    ["IIW IWS","200,000〜400,000円+"],
    ["IIW IWT","300,000〜500,000円+"],
    ["IIW IWE","400,000〜700,000円+"],
  ]},
];

// ── 昇段ラダー（WELDON JPの主役：日本の溶接屋が上を目指す一本道）──
// rung=段位, form=試験形式, study=対応クイズ/ドリル, next=次の一手の指針
const LADDER = [
  {rung:"01", tier:"技能", color:"#78716C", icon:"⚡",
   name:"JIS溶接技能者 基本級", form:"実技（下向 SA-2F 等）＋学科", who:"溶接工の名刺代わり。まずここ。",
   subj:"溶接一般の基礎知識（安全・材料・記号）＋下向の技量試験", rate:"実技 目安70〜85%（種目・受験者の技量で変動）",
   study:"🎮 クイズ STAGE 1〜2（基礎・材料）", next:"下向が安定したら専門級（全姿勢）へ。"},
  {rung:"02", tier:"技能", color:"#57534E", icon:"🔩",
   name:"JIS溶接技能者 専門級", form:"実技（立向・横向・上向・管 N-2P 等）", who:"全姿勢・パイプ。単価が上がる分岐点。",
   subj:"各姿勢・管の技量試験（外観＋曲げ／RT）", rate:"種目差大。易しい姿勢で60%前後、N-2P等の管全姿勢は30%前後",
   study:"🎮 STAGE 3〜4 ＋ 🔥 運棒シミュ", next:"鉄骨ならAW、圧力容器ならボイラー、と専門を選ぶ。"},
  {rung:"03", tier:"専門", color:"#1D4ED8", icon:"🔀",
   name:"専門ルート（AW／ボイラー／水中）", form:"学科＋実技（AWは年1回）", who:"専門性で差別化。ゼネコン・プラント案件へ。",
   subj:"AW＝建築鉄骨の技量／ボイラー溶接士＝学科＋実技／潜水士＝学科", rate:"AWは種目により40〜70%程度、ボイラー溶接士（普通）は比較的高め",
   study:"🎮 STAGE 2A/2B/2C ＋ STAGE 6（実技・現代技術）", next:"現場を回せるようになったら管理側（WES）へ。"},
  {rung:"04", tier:"管理", color:"#D97706", icon:"👑",
   name:"溶接管理技術者 2級（WES 8103）", form:"筆記（正誤法＋多肢選択のマーク中心）＋口述", who:"監督・品質管理。工場認定・官公庁工事に必須。",
   subj:"溶接法・機器／材料・冶金／力学・設計／施工・管理／試験・検査／安全衛生", rate:"筆記 目安40〜50%前後（年度で変動）。要 事前講習の受講が有利",
   study:"📊 弱点分析で冶金を潰す ＋ 🧮 計算ドリル（入熱・Ceq）＋ 📖 記述対策(2級)", next:"実務を積み、記述式の1級へ。"},
  {rung:"05", tier:"管理", color:"#B45309", icon:"📐",
   name:"溶接管理技術者 1級（WES 8103）", form:"筆記（記述式が加わる）＋口述", who:"専門技術分野を担当。橋梁・造船・プラント全対応。",
   subj:"2級範囲を深く＋複数分野を横断する論述、溶接施工・品質保証の応用", rate:"目安20〜40%前後と難化（記述・口述の配点大）",
   study:"🧮 計算ドリル全種 ＋ 📖 記述対策(1級)・口述 ＋ STAGE 5〜6 反復", next:"設計・統括を目指すなら特別級／国際資格へ。"},
  {rung:"06", tier:"最高峰", color:"#7C3AED", icon:"🌍",
   name:"特別級 ／ IWE・IIW 国際資格", form:"小論文＋口述 ／ 国際規格に基づく試験", who:"溶接全般を統括。世界の案件に通用する頂点。",
   subj:"溶接の計画・監督・品質統括の総合力／国際規格（ISO 3834 等）の理解", rate:"特別級は難関（数％〜十数%目安）。実務経験と論述力が必須",
   study:"全ステージ＋模試＋記述・口述で総仕上げ", next:"—（頂点）"},
];

const ROADMAP = [
  {label:"最低限（現場に立つだけ）", cost:"〜5万円",  color:"#0F766E", period:"1〜2週間", merit:"現場入場が可能になる"},
  {label:"即戦力（サポート資格込み）",cost:"〜20万円", color:"#D97706", period:"1〜3ヶ月", merit:"どんな現場にも対応できる"},
  {label:"専門職（JIS+専門資格）",   cost:"〜60万円", color:"#1D4ED8", period:"1〜2年",   merit:"単価が大幅に上がる"},
  {label:"管理職（WES管理技術者）",  cost:"〜80万円", color:"#D97706", period:"3〜5年",   merit:"設計・監督・会社認定に必須"},
  {label:"国際資格（AWS/IIW）",      cost:"〜200万円+",color:"#7C3AED",period:"5〜10年",  merit:"世界中の案件に参加できる"},
];

// ============================================================
// 昇段ラダー（主役）— 日本の溶接屋が上を目指す一本道
// ============================================================
function ClimbLadder(){
  const [open, setOpen] = useState(null);
  return(
    <div style={{background:"linear-gradient(160deg,#0F172A,#1E293B)",borderRadius:12,padding:"14px 12px 10px",marginBottom:10,boxShadow:"0 3px 12px rgba(0,0,0,0.18)"}}>
      <div style={{color:"#F8FAFC",fontSize:13,fontWeight:700,letterSpacing:1}}>🏆 昇段ラダー</div>
      <div style={{color:"#94A3B8",fontSize:9,lineHeight:1.6,margin:"3px 0 12px"}}>
        JIS基本 → 専門 → AW/専門 → WES管理 → 国際。日本で上を目指すための一本道。段を押すと試験形式と「次の一手」が出る。
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        {LADDER.slice().reverse().map((r,idx,arr)=>{
          const isO = open===r.rung;
          return(
            <div key={r.rung} style={{display:"flex",gap:9}}>
              {/* 縦ライン＋ノード */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:26}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:r.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,boxShadow:`0 0 0 3px ${r.color}33`}}>{r.icon}</div>
                {idx<arr.length-1&&<div style={{width:2,flex:1,minHeight:14,background:"#334155"}}/>}
              </div>
              {/* カード */}
              <div onClick={()=>setOpen(isO?null:r.rung)} style={{flex:1,marginBottom:8,background:isO?"#1E293B":"rgba(255,255,255,0.04)",border:`1px solid ${isO?r.color:"#334155"}`,borderRadius:9,padding:"8px 10px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:r.color,fontSize:8,fontWeight:900,background:`${r.color}22`,border:`1px solid ${r.color}55`,borderRadius:4,padding:"1px 5px"}}>{r.tier}</span>
                  <span style={{color:"#F1F5F9",fontSize:11,fontWeight:700,flex:1}}>{r.name}</span>
                  <span style={{color:"#64748B",fontSize:9}}>{isO?"▲":"▼"}</span>
                </div>
                <div style={{color:"#94A3B8",fontSize:9,marginTop:3,lineHeight:1.5}}>{r.who}</div>
                {isO&&(
                  <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                    <LadderRow c="#38BDF8" k="📝 試験形式" v={r.form}/>
                    <LadderRow c="#A78BFA" k="📋 出題科目" v={r.subj}/>
                    <LadderRow c="#F87171" k="📊 合格率の目安" v={r.rate}/>
                    <LadderRow c="#34D399" k="📚 対応する勉強" v={r.study}/>
                    <LadderRow c="#FBBF24" k="➡️ 次の一手" v={r.next}/>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function LadderRow({c,k,v}){
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${c}33`,borderRadius:6,padding:"6px 8px"}}>
      <div style={{color:c,fontSize:8,fontWeight:700,marginBottom:2}}>{k}</div>
      <div style={{color:"#E2E8F0",fontSize:10,lineHeight:1.5}}>{v}</div>
    </div>
  );
}

// ============================================================
// ツリー画面コンポーネント
// ============================================================
export function TreeScreen(){
  const [openS, setOpenS] = useState(null);
  const [openN, setOpenN] = useState(null);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"4px 0"}}>
      <ClimbLadder/>

      <div style={{color:"#64748B",fontSize:10,fontWeight:700,padding:"2px 2px 0"}}>🗂️ 全資格の詳細（現場資格〜国際）</div>
      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:10,padding:"10px 14px",marginBottom:4}}>
        <div style={{color:"#166534",fontSize:10,fontWeight:700}}>💡 キャリアロードマップ</div>
        <div style={{color:"#166534",fontSize:9,lineHeight:1.6,marginTop:2}}>
          STAGE 0から取ろう。グラインダー・電気・玉掛けは溶接資格より先に取るべき。安くて早い。
        </div>
      </div>

      {TREE.map((s,si)=>{
        const isO = openS===s.id;
        return(
          <div key={s.id}>
            {si>0&&<div style={{display:"flex",justifyContent:"center",margin:"2px 0"}}>
              <div style={{width:2,height:12,background:`linear-gradient(${TREE[si-1].color},${s.color})`,borderRadius:2,opacity:.4}}/>
            </div>}

            {/* STAGEヘッダー */}
            <button onClick={()=>setOpenS(isO?null:s.id)} style={{
              width:"100%",background:isO?`${s.color}10`:"white",
              border:`2px solid ${isO?s.color:s.color+"40"}`,
              borderRadius:10,padding:"10px 12px",
              display:"flex",alignItems:"center",gap:8,
              cursor:"pointer",fontFamily:F,
              boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"all .2s",
            }}>
              <span style={{fontSize:16}}>{s.icon}</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{color:s.color,fontSize:9,letterSpacing:2,fontWeight:700}}>{s.stage}</div>
                <div style={{color:"#1E293B",fontSize:11,fontWeight:700}}>{s.label}</div>
                <div style={{color:"#64748B",fontSize:9,marginTop:1}}>{s.merit}</div>
              </div>
              <span style={{color:s.color,fontSize:9,background:`${s.color}15`,border:`1px solid ${s.color}30`,borderRadius:5,padding:"2px 6px"}}>{s.nodes.length}資格</span>
              <span style={{color:s.color,fontSize:10}}>{isO?"▲":"▼"}</span>
            </button>

            {/* 資格リスト */}
            {isO&&(
              <div style={{background:"#F8FAFC",border:`1px solid ${s.color}20`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"6px 5px 8px",display:"flex",flexDirection:"column",gap:4}}>
                {s.nodes.map((n,ni)=>{
                  const k=`${s.id}-${ni}`, isNO=openN===k;
                  return(
                    <div key={k} onClick={()=>setOpenN(isNO?null:k)} style={{
                      background:isNO?`${s.color}08`:"white",
                      border:`1px solid ${isNO?s.color:"#E2E8F0"}`,
                      borderRadius:8,padding:"9px 11px",cursor:"pointer",
                      transition:"all .2s",
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:4,marginBottom:3,flexWrap:"wrap"}}>
                            <span style={{background:`${s.color}15`,border:`1px solid ${s.color}40`,color:s.color,fontSize:8,padding:"1px 6px",borderRadius:20,fontWeight:700}}>{n.type}</span>
                          </div>
                          <div style={{color:"#1E293B",fontSize:11,fontWeight:700}}>{n.name}</div>
                          <div style={{color:s.color,fontSize:10,fontWeight:700,marginTop:1}}>{n.income}</div>
                        </div>
                        <span style={{color:s.color,fontSize:10,marginLeft:6}}>{isNO?"▲":"▼"}</span>
                      </div>
                      {isNO&&(
                        <div style={{marginTop:8,borderTop:`1px solid ${s.color}20`,paddingTop:8}}>
                          <p style={{color:"#475569",fontSize:11,lineHeight:1.8,margin:"0 0 8px"}}>{n.desc}</p>
                          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:7,padding:"7px 10px",marginBottom:5}}>
                            <div style={{color:"#166534",fontSize:9,fontWeight:700,marginBottom:1}}>💰 費用目安</div>
                            <div style={{color:"#1E293B",fontSize:11}}>{n.cost}</div>
                          </div>
                          <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:7,padding:"7px 10px",marginBottom:5}}>
                            <div style={{color:"#1D4ED8",fontSize:9,fontWeight:700,marginBottom:1}}>📅 取得期間</div>
                            <div style={{color:"#1E293B",fontSize:11}}>{n.period}</div>
                          </div>
                          <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:7,padding:"7px 10px"}}>
                            <div style={{color:"#C2410C",fontSize:9,fontWeight:700,marginBottom:1}}>📋 必要条件</div>
                            <div style={{color:"#1E293B",fontSize:11}}>{n.req}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// コスト画面コンポーネント
// ============================================================
export function CostScreen(){
  return(
    <div>
      {/* ロードマップ */}
      <div style={{background:"white",border:"2px solid #E85D04",borderRadius:12,padding:12,marginBottom:14,boxShadow:"0 2px 8px rgba(232,93,4,0.1)"}}>
        <div style={{color:"#E85D04",fontSize:11,fontWeight:700,textAlign:"center",marginBottom:8}}>🗺️ キャリアロードマップ</div>
        {ROADMAP.map((r,i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"flex-start",gap:10,
            padding:"8px 0",borderBottom:i<ROADMAP.length-1?"1px solid #F1F5F9":"none",
          }}>
            <div style={{
              width:24,height:24,borderRadius:"50%",
              background:r.color,color:"white",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontWeight:900,flexShrink:0,
            }}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{color:"#1E293B",fontSize:10,fontWeight:700}}>{r.label}</div>
              <div style={{color:"#64748B",fontSize:9,marginTop:1}}>⏱️ {r.period} | ✅ {r.merit}</div>
            </div>
            <div style={{color:r.color,fontSize:11,fontWeight:900,flexShrink:0}}>{r.cost}</div>
          </div>
        ))}
      </div>

      {/* 資格別コスト */}
      {COST_GROUPS.map((g,gi)=>(
        <div key={gi} style={{marginBottom:12}}>
          <div style={{color:g.c,fontSize:10,fontWeight:700,padding:"5px 10px",background:"white",border:`1px solid ${g.c}30`,borderRadius:7,marginBottom:5,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>{g.l}</div>
          {g.items.map(([name,cost],ii)=>(
            <div key={ii} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ii%2===0?"#F8FAFC":"white",borderRadius:6,marginBottom:2,border:"1px solid #F1F5F9"}}>
              <div style={{color:"#374151",fontSize:10}}>{name}</div>
              <div style={{color:g.c,fontSize:10,fontWeight:700}}>{cost}</div>
            </div>
          ))}
        </div>
      ))}

      {/* 投資総額 */}
      <div style={{background:"white",border:"2px solid #7C3AED",borderRadius:12,padding:12,marginTop:8,marginBottom:20}}>
        <div style={{color:"#7C3AED",fontSize:11,fontWeight:700,textAlign:"center",marginBottom:8}}>📊 投資総額の目安</div>
        {[
          ["最低限（現場に立つだけ）","〜5万円","#0F766E"],
          ["即戦力（サポート資格込み）","〜20万円","#D97706"],
          ["専門職（専門資格取得）","〜60万円","#1D4ED8"],
          ["管理職（WES管理）","〜80万円","#D97706"],
          ["最高峰（国際資格）","〜200万円+","#7C3AED"],
        ].map(([l,c,col],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{color:"#374151",fontSize:10}}><span style={{color:col,marginRight:5}}>●</span>{l}</div>
            <div style={{color:col,fontSize:11,fontWeight:700}}>{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

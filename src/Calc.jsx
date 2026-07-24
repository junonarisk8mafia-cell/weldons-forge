// ============================================================
// WELDON'S FORGE - 溶接計算ツール
// 入熱・炭素当量・予熱温度
// ============================================================
import { useState } from "react";
import { CalcDrill } from "./CalcDrill";

const F = "'Courier New',monospace";

// ============================================================
// 計算ツールデータ
// ============================================================

// 入熱計算
function HeatInputCalc(){
  const [I, setI] = useState("");   // 電流(A)
  const [V, setV] = useState("");   // 電圧(V)
  const [S, setS] = useState("");   // 速度(mm/min)
  const [eff, setEff] = useState("0.8"); // 熱効率

  const HI = (I && V && S && parseFloat(S)>0)
    ? ((parseFloat(I) * parseFloat(V) * 60) / parseFloat(S) * parseFloat(eff) / 1000).toFixed(2)
    : null;

  const judge = HI ? (
    parseFloat(HI) < 10 ? {label:"低入熱", color:"#1D4ED8", msg:"急冷リスクあり。予熱を検討してください。"}
    : parseFloat(HI) > 50 ? {label:"高入熱", color:"#DC2626", msg:"靭性低下・変形に注意。速度を上げるか電流を下げてください。"}
    : {label:"適正範囲", color:"#16A34A", msg:"一般的な炭素鋼に適した入熱量です。"}
  ) : null;

  const effOptions = [
    {label:"SMAW（被覆アーク）",    val:"0.8"},
    {label:"GMAW/MAG/MIG",         val:"0.85"},
    {label:"TIG（GTAW）",           val:"0.6"},
    {label:"SAW（サブマージ）",     val:"0.99"},
    {label:"FCAW（フラックス入り）",val:"0.85"},
  ];

  return(
    <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #E2E8F0",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{color:"#E85D04",fontSize:12,fontWeight:700,marginBottom:4}}>🌡️ 入熱計算（Heat Input）</div>
      <div style={{background:"#FFF7ED",borderRadius:8,padding:"8px 10px",marginBottom:12}}>
        <div style={{color:"#C2410C",fontSize:11,fontFamily:F,textAlign:"center",fontWeight:700}}>
          HI = (I × V × 60) / S × η ÷ 1000
        </div>
        <div style={{color:"#92400E",fontSize:9,textAlign:"center",marginTop:3}}>
          単位：kJ/mm　　η＝熱効率
        </div>
      </div>

      {/* 溶接法選択 */}
      <div style={{marginBottom:10}}>
        <div style={{color:"#475569",fontSize:10,fontWeight:700,marginBottom:5}}>溶接法（熱効率η）</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {effOptions.map(o=>(
            <button key={o.val} onClick={()=>setEff(o.val)} style={{
              padding:"5px 8px",borderRadius:6,border:`1px solid ${eff===o.val?"#E85D04":"#E2E8F0"}`,
              background:eff===o.val?"#FFF7ED":"white",
              color:eff===o.val?"#E85D04":"#64748B",
              fontSize:9,cursor:"pointer",fontFamily:F,
            }}>{o.label}（η={o.val}）</button>
          ))}
        </div>
      </div>

      {/* 入力フォーム */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {[
          {label:"電流 I（A）",    val:I,  set:setI,  placeholder:"例：200"},
          {label:"電圧 V（V）",    val:V,  set:setV,  placeholder:"例：26"},
          {label:"速度 S（mm/min）",val:S, set:setS,  placeholder:"例：300"},
        ].map(item=>(
          <div key={item.label} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#475569",fontSize:10,fontWeight:700,width:130,flexShrink:0}}>{item.label}</div>
            <input
              type="number"
              value={item.val}
              onChange={e=>item.set(e.target.value)}
              placeholder={item.placeholder}
              style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,fontFamily:F,outline:"none",color:"#1E293B"}}
            />
          </div>
        ))}
      </div>

      {/* 結果 */}
      {HI&&(
        <div style={{background:`${judge.color}10`,border:`2px solid ${judge.color}`,borderRadius:10,padding:12}}>
          <div style={{textAlign:"center"}}>
            <div style={{color:"#475569",fontSize:10,marginBottom:2}}>入熱量</div>
            <div style={{color:judge.color,fontSize:32,fontWeight:900,fontFamily:F}}>{HI}</div>
            <div style={{color:"#475569",fontSize:10}}>kJ/mm</div>
          </div>
          <div style={{marginTop:8,background:"white",borderRadius:8,padding:"8px 10px"}}>
            <div style={{color:judge.color,fontSize:11,fontWeight:700}}>{judge.label}</div>
            <div style={{color:"#475569",fontSize:10,marginTop:2,lineHeight:1.6}}>{judge.msg}</div>
          </div>
        </div>
      )}
      {!HI&&<div style={{color:"#94A3B8",fontSize:10,textAlign:"center",padding:"12px 0"}}>数値を入力すると結果が表示されます</div>}
    </div>
  );
}

// 炭素当量計算
function CeqCalc(){
  const [vals, setVals] = useState({C:"",Mn:"",Si:"",Ni:"",Cr:"",Mo:"",V:"",Cu:""});
  const set = (k,v) => setVals(p=>({...p,[k]:v}));
  const g = k => parseFloat(vals[k])||0;

  // JIS/IIW式: Ceq = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15
  const Ceq = (g("C") || g("Mn") || g("Cr") || g("Mo") || g("V") || g("Ni") || g("Cu"))
    ? (g("C") + g("Mn")/6 + (g("Cr")+g("Mo")+g("V"))/5 + (g("Ni")+g("Cu"))/15).toFixed(4)
    : null;

  // PCM式（低炭素鋼向け）: Pcm = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + Mo/15 + V/10
  const Pcm = (g("C") || g("Mn"))
    ? (g("C") + g("Si")/30 + (g("Mn")+g("Cu")+g("Cr"))/20 + g("Ni")/60 + g("Mo")/15 + g("V")/10).toFixed(4)
    : null;

  const ceqJudge = Ceq ? (
    parseFloat(Ceq) < 0.36 ? {label:"溶接性 良好", color:"#16A34A", msg:"予熱なしで溶接可能なことが多い。"}
    : parseFloat(Ceq) < 0.45 ? {label:"予熱推奨", color:"#D97706", msg:"50〜100℃の予熱を推奨。板厚・拘束度による。"}
    : {label:"予熱必須", color:"#DC2626", msg:"100℃以上の予熱が必要。低水素系溶接棒を使用すること。"}
  ) : null;

  const elements = [
    {key:"C",  label:"C（炭素）",    placeholder:"例：0.15"},
    {key:"Mn", label:"Mn（マンガン）", placeholder:"例：1.40"},
    {key:"Si", label:"Si（ケイ素）",   placeholder:"例：0.30"},
    {key:"Ni", label:"Ni（ニッケル）", placeholder:"例：0.00"},
    {key:"Cr", label:"Cr（クロム）",   placeholder:"例：0.00"},
    {key:"Mo", label:"Mo（モリブデン）",placeholder:"例：0.00"},
    {key:"V",  label:"V（バナジウム）", placeholder:"例：0.00"},
    {key:"Cu", label:"Cu（銅）",       placeholder:"例：0.00"},
  ];

  return(
    <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #E2E8F0",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{color:"#1D4ED8",fontSize:12,fontWeight:700,marginBottom:4}}>⚗️ 炭素当量（Ceq）計算</div>
      <div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 10px",marginBottom:12}}>
        <div style={{color:"#1D4ED8",fontSize:10,fontFamily:F,textAlign:"center",fontWeight:700,lineHeight:1.8}}>
          Ceq = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15
        </div>
        <div style={{color:"#1E40AF",fontSize:10,fontFamily:F,textAlign:"center",fontWeight:700,lineHeight:1.8}}>
          Pcm = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + Mo/15 + V/10
        </div>
        <div style={{color:"#3730A3",fontSize:9,textAlign:"center",marginTop:2}}>単位：全て質量%（wt%）</div>
      </div>

      {/* 入力 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        {elements.map(el=>(
          <div key={el.key}>
            <div style={{color:"#475569",fontSize:9,fontWeight:700,marginBottom:3}}>{el.label}</div>
            <input
              type="number"
              value={vals[el.key]}
              onChange={e=>set(el.key,e.target.value)}
              placeholder={el.placeholder}
              step="0.01"
              style={{width:"100%",padding:"7px 8px",border:"1px solid #CBD5E1",borderRadius:7,fontSize:11,fontFamily:F,outline:"none",color:"#1E293B",boxSizing:"border-box"}}
            />
          </div>
        ))}
      </div>

      {/* 結果 */}
      {Ceq&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* Ceq */}
          <div style={{background:`${ceqJudge.color}10`,border:`2px solid ${ceqJudge.color}`,borderRadius:10,padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{color:"#475569",fontSize:9}}>炭素当量 Ceq（JIS/IIW式）</div>
                <div style={{color:ceqJudge.color,fontSize:28,fontWeight:900,fontFamily:F}}>{Ceq}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:ceqJudge.color,fontSize:11,fontWeight:700}}>{ceqJudge.label}</div>
              </div>
            </div>
            <div style={{background:"white",borderRadius:8,padding:"7px 10px"}}>
              <div style={{color:"#475569",fontSize:10,lineHeight:1.6}}>{ceqJudge.msg}</div>
            </div>
          </div>
          {/* Pcm */}
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:12}}>
            <div style={{color:"#475569",fontSize:9}}>低温割れ感受性指数 Pcm</div>
            <div style={{color:"#7C3AED",fontSize:24,fontWeight:900,fontFamily:F}}>{Pcm}</div>
            <div style={{color:"#64748B",fontSize:10,marginTop:4,lineHeight:1.6}}>
              {parseFloat(Pcm)<0.20?"Pcm &lt; 0.20：低温割れのリスク低い":
               parseFloat(Pcm)<0.28?"Pcm 0.20〜0.28：予熱を検討":
               "Pcm &gt; 0.28：予熱必須。低水素系溶接棒を使用"}
            </div>
          </div>
        </div>
      )}
      {!Ceq&&<div style={{color:"#94A3B8",fontSize:10,textAlign:"center",padding:"12px 0"}}>成分値を入力すると結果が表示されます</div>}
    </div>
  );
}

// 予熱温度計算
function PreheatCalc(){
  const [Ceq, setCeq] = useState("");
  const [t,   setT]   = useState("");    // 板厚(mm)
  const [H,   setH]   = useState("5");   // 拡散性水素量(ml/100g)
  const [R,   setR]   = useState("medium"); // 拘束度

  const hOptions = [
    {val:"5",  label:"低水素系（D5016等）≦5ml"},
    {val:"10", label:"セルロース系　　　≦10ml"},
    {val:"15", label:"イルミナイト系　　≦15ml"},
    {val:"25", label:"高水素系（酸化鉄）≦25ml"},
  ];
  const rOptions = [
    {val:"low",    label:"低拘束（自由変形可）"},
    {val:"medium", label:"中拘束（一般構造）"},
    {val:"high",   label:"高拘束（厚板・剛構造）"},
  ];

  // 簡易予熱計算（Ito-Bessyo式ベース）
  // T0 = 1440×Pcm - 392  (Pcmが分からないのでCeqから近似)
  // 簡易：T0 = 350×√(Ceq - 0.25) + 80×log(t/25)
  const T0calc = () => {
    const ceq = parseFloat(Ceq);
    const th  = parseFloat(t);
    if(!ceq || !th || ceq<=0 || th<=0) return null;
    const rBonus = R==="high"?30:R==="low"?-20:0;
    const hBonus = parseFloat(H)>10?20:parseFloat(H)>5?10:0;
    let base = 350 * Math.sqrt(Math.max(0, ceq - 0.25)) + 80 * Math.log10(th/25);
    base = Math.max(0, base + rBonus + hBonus);
    return Math.ceil(base/5)*5; // 5℃単位に丸める
  };
  const T0 = T0calc();

  const judge = T0!=null ? (
    T0 === 0   ? {label:"予熱不要",   color:"#16A34A", msg:"室温（5℃以上）での溶接が可能です。"}
    : T0 <= 50  ? {label:"低温予熱",   color:"#D97706", msg:`最低${T0}℃以上に予熱してください。`}
    : T0 <= 100 ? {label:"中温予熱",   color:"#EA580C", msg:`${T0}℃以上の予熱が必要です。`}
    : {label:"高温予熱",   color:"#DC2626", msg:`${T0}℃以上の予熱が必要です。低水素系溶接棒必須！`}
  ) : null;

  return(
    <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #E2E8F0",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{color:"#D97706",fontSize:12,fontWeight:700,marginBottom:4}}>🔥 予熱温度計算（簡易計算）</div>
      <div style={{background:"#FFF7ED",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
        <div style={{color:"#C2410C",fontSize:10,fontFamily:F,textAlign:"center",fontWeight:700}}>
          T₀ ≈ 350×√(Ceq-0.25) + 80×log(t/25)
        </div>
        <div style={{color:"#92400E",fontSize:9,textAlign:"center",marginTop:2}}>
          ※簡易式です。重要構造物は規格値を必ず確認してください
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
        {/* Ceq入力 */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{color:"#475569",fontSize:10,fontWeight:700,width:130,flexShrink:0}}>炭素当量 Ceq</div>
          <input type="number" value={Ceq} onChange={e=>setCeq(e.target.value)} placeholder="例：0.42" step="0.01"
            style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,fontFamily:F,outline:"none",color:"#1E293B"}}/>
        </div>
        {/* 板厚入力 */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{color:"#475569",fontSize:10,fontWeight:700,width:130,flexShrink:0}}>板厚 t（mm）</div>
          <input type="number" value={t} onChange={e=>setT(e.target.value)} placeholder="例：25" step="1"
            style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,fontFamily:F,outline:"none",color:"#1E293B"}}/>
        </div>
      </div>

      {/* 拡散性水素 */}
      <div style={{marginBottom:10}}>
        <div style={{color:"#475569",fontSize:10,fontWeight:700,marginBottom:5}}>溶接棒の拡散性水素量</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {hOptions.map(o=>(
            <button key={o.val} onClick={()=>setH(o.val)} style={{
              padding:"7px 10px",borderRadius:7,border:`1px solid ${H===o.val?"#D97706":"#E2E8F0"}`,
              background:H===o.val?"#FFF7ED":"white",
              color:H===o.val?"#C2410C":"#64748B",
              fontSize:10,cursor:"pointer",fontFamily:F,textAlign:"left",
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* 拘束度 */}
      <div style={{marginBottom:12}}>
        <div style={{color:"#475569",fontSize:10,fontWeight:700,marginBottom:5}}>拘束度</div>
        <div style={{display:"flex",gap:4}}>
          {rOptions.map(o=>(
            <button key={o.val} onClick={()=>setR(o.val)} style={{
              flex:1,padding:"7px 4px",borderRadius:7,border:`1px solid ${R===o.val?"#D97706":"#E2E8F0"}`,
              background:R===o.val?"#FFF7ED":"white",
              color:R===o.val?"#C2410C":"#64748B",
              fontSize:8,cursor:"pointer",fontFamily:F,textAlign:"center",lineHeight:1.4,
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      {judge&&(
        <div style={{background:`${judge.color}10`,border:`2px solid ${judge.color}`,borderRadius:10,padding:12}}>
          <div style={{textAlign:"center",marginBottom:8}}>
            <div style={{color:"#475569",fontSize:10,marginBottom:2}}>推奨予熱温度</div>
            <div style={{color:judge.color,fontSize:36,fontWeight:900,fontFamily:F}}>
              {T0===0?"不要":`${T0}℃`}
            </div>
            <div style={{color:judge.color,fontSize:11,fontWeight:700,marginTop:2}}>{judge.label}</div>
          </div>
          <div style={{background:"white",borderRadius:8,padding:"8px 10px"}}>
            <div style={{color:"#475569",fontSize:10,lineHeight:1.6}}>{judge.msg}</div>
            {T0>0&&<div style={{color:"#94A3B8",fontSize:9,marginTop:4}}>
              パス間温度の上限：一般的に{Math.min(T0+150,350)}℃以下を維持してください。
            </div>}
          </div>
        </div>
      )}
      {!judge&&<div style={{color:"#94A3B8",fontSize:10,textAlign:"center",padding:"12px 0"}}>Ceqと板厚を入力すると結果が表示されます</div>}
    </div>
  );
}

// のど厚・脚長計算
function ThroatCalc(){
  const [type, setType] = useState("fillet"); // fillet / groove
  const [a,    setA]    = useState("");  // のど厚 or 開先深さ
  const [leg,  setLeg]  = useState("");  // 脚長

  // すみ肉溶接：のど厚 a = 脚長 × cos45° = 脚長 × 0.707
  const throatFromLeg = leg ? (parseFloat(leg) * 0.707).toFixed(2) : null;
  const legFromThroat = a   ? (parseFloat(a)   / 0.707).toFixed(2) : null;

  // 有効のど厚（すみ肉）= 理論のど厚
  // 許容応力計算（参考）
  const allowStress = 150; // MPa（一般的な許容せん断応力）
  const strength = (leg && throatFromLeg)
    ? (parseFloat(throatFromLeg) * allowStress).toFixed(0)
    : null;

  return(
    <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #E2E8F0",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{color:"#7C3AED",fontSize:12,fontWeight:700,marginBottom:4}}>📐 のど厚・脚長計算</div>
      <div style={{background:"#F5F3FF",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
        <div style={{color:"#7C3AED",fontSize:10,fontFamily:F,textAlign:"center",fontWeight:700,lineHeight:1.8}}>
          すみ肉：のど厚 a = 脚長 × 0.707
        </div>
        <div style={{color:"#6D28D9",fontSize:9,textAlign:"center",marginTop:2}}>
          （45°等脚すみ肉溶接の場合）
        </div>
      </div>

      {/* タブ */}
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        {[{id:"fillet",l:"すみ肉溶接"},{id:"groove",l:"突合せ溶接"}].map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{
            flex:1,padding:"8px 0",borderRadius:8,
            border:`1px solid ${type===t.id?"#7C3AED":"#E2E8F0"}`,
            background:type===t.id?"#F5F3FF":"white",
            color:type===t.id?"#7C3AED":"#64748B",
            fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F,
          }}>{t.l}</button>
        ))}
      </div>

      {type==="fillet"&&(
        <div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{color:"#475569",fontSize:10,fontWeight:700,width:110,flexShrink:0}}>脚長 S（mm）</div>
              <input type="number" value={leg} onChange={e=>setLeg(e.target.value)} placeholder="例：6"
                style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,fontFamily:F,outline:"none",color:"#1E293B"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{color:"#475569",fontSize:10,fontWeight:700,width:110,flexShrink:0}}>のど厚 a（mm）</div>
              <input type="number" value={a} onChange={e=>setA(e.target.value)} placeholder="例：4"
                style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,fontFamily:F,outline:"none",color:"#1E293B"}}/>
            </div>
          </div>

          {(throatFromLeg||legFromThroat)&&(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {throatFromLeg&&<div style={{background:"#F5F3FF",border:"1px solid #7C3AED",borderRadius:10,padding:10}}>
                <div style={{color:"#475569",fontSize:9}}>脚長 {leg}mm → のど厚</div>
                <div style={{color:"#7C3AED",fontSize:26,fontWeight:900,fontFamily:F}}>{throatFromLeg} mm</div>
                {strength&&<div style={{color:"#64748B",fontSize:9,marginTop:4}}>
                  単位長さあたりの許容せん断力（参考）：{strength} N/mm
                </div>}
              </div>}
              {legFromThroat&&<div style={{background:"#EFF6FF",border:"1px solid #1D4ED8",borderRadius:10,padding:10}}>
                <div style={{color:"#475569",fontSize:9}}>のど厚 {a}mm → 必要脚長</div>
                <div style={{color:"#1D4ED8",fontSize:26,fontWeight:900,fontFamily:F}}>{legFromThroat} mm</div>
              </div>}
            </div>
          )}
          {!throatFromLeg&&!legFromThroat&&<div style={{color:"#94A3B8",fontSize:10,textAlign:"center",padding:"12px 0"}}>脚長またはのど厚を入力してください</div>}
        </div>
      )}

      {type==="groove"&&(
        <div>
          <div style={{background:"#F8FAFC",borderRadius:10,padding:12}}>
            {[
              {label:"V形開先（60°）", throat:"板厚 × 1.0", note:"完全溶込み"},
              {label:"レ形開先（45°）",throat:"板厚 × 1.0", note:"完全溶込み（片側）"},
              {label:"X形開先（60°）", throat:"板厚 × 1.0", note:"両面完全溶込み"},
              {label:"I形開先",        throat:"板厚 × 1.0", note:"薄板・完全溶込み"},
              {label:"部分溶込み（PJP）",throat:"有効のど厚を設計で指定", note:"部分溶込み"},
            ].map((r,i)=>(
              <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{color:"#1E293B",fontSize:10,fontWeight:700}}>{r.label}</div>
                  <div style={{color:"#64748B",fontSize:9,marginTop:1}}>{r.note}</div>
                </div>
                <div style={{color:"#7C3AED",fontSize:10,fontWeight:700,flexShrink:0,marginLeft:8}}>{r.throat}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#FFF7ED",borderRadius:8,padding:"8px 10px",marginTop:8}}>
            <div style={{color:"#C2410C",fontSize:9,lineHeight:1.6}}>
              💡 突合せ溶接の有効のど厚は溶接金属が完全に溶け込んだ場合、板厚と同等。設計では安全率を考慮すること。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 計算ツール画面（メイン）
// ============================================================
export function CalcScreen(){
  const [tab, setTab] = useState("heat");

  const tabs = [
    {id:"heat",   l:"🌡️ 入熱"},
    {id:"ceq",    l:"⚗️ Ceq"},
    {id:"preheat",l:"🔥 予熱"},
    {id:"throat", l:"📐 のど厚"},
    {id:"drill",  l:"🧮 ドリル"},
  ];

  return(
    <div>
      {/* 注意書き */}
      <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,padding:"9px 12px",marginBottom:10}}>
        <div style={{color:"#991B1B",fontSize:10,fontWeight:700}}>⚠️ 注意</div>
        <div style={{color:"#7F1D1D",fontSize:9,lineHeight:1.6,marginTop:2}}>
          これは学習用の簡易計算ツールです。実際の施工では必ずJIS・AWS等の規格値と設計図書を確認してください。
        </div>
      </div>

      {/* タブ */}
      <div style={{display:"flex",gap:0,marginBottom:12,background:"white",borderRadius:8,overflow:"hidden",border:"1px solid #E2E8F0"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"9px 0",border:"none",
            borderBottom:`3px solid ${tab===t.id?"#E85D04":"transparent"}`,
            background:"white",color:tab===t.id?"#1E293B":"#94A3B8",
            fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:F,
          }}>{t.l}</button>
        ))}
      </div>

      {tab==="heat"   &&<HeatInputCalc/>}
      {tab==="ceq"    &&<CeqCalc/>}
      {tab==="preheat"&&<PreheatCalc/>}
      {tab==="throat" &&<ThroatCalc/>}
      {tab==="drill"  &&<CalcDrill/>}

      <div style={{height:20}}/>
    </div>
  );
}

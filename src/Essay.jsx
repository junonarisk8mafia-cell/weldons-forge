// ============================================================
// WELDON'S FORGE — 記述対策（WES溶接管理技術者 2級範囲）
// ※2級の筆記はマークシート中心。本問は「記述で説明できる＝本質理解」を
//   狙った想定問題で、1級の記述式への布石にもなる。
// 設問→自分で答えを考える→採点ポイント（必須キーワード）＋模範解答を確認。
// ============================================================
import { useState } from "react";

const F = "'Courier New',monospace";

const ESSAYS = [
  {
    id: "e1", cat: "溶接冶金",
    q: "溶接低温割れ（遅れ割れ）の発生機構を3つの要因から説明し、代表的な防止対策を4つ挙げよ。",
    points: [
      "3要因：①拡散性水素 ②硬化組織（マルテンサイト） ③引張残留応力（拘束）",
      "常温付近で時間をおいて発生する“遅れ割れ”であること",
      "予熱・パス間温度管理で冷却速度を下げHAZ硬化を抑える",
      "低水素系溶接棒の使用・適正乾燥・開先清浄で水素源を断つ",
      "直後熱／PWHTで拡散性水素を放出させる",
      "拘束を減らす継手設計・溶接順序（残留応力の低減）",
    ],
    model: "低温割れは溶接後、常温付近で時間をおいて発生する遅れ割れである。発生には①溶着金属中の拡散性水素、②急冷によって生じる硬化組織（マルテンサイト）、③溶接部の引張残留応力（拘束）の3要因が重なる必要がある。主な防止対策は、(1)予熱およびパス間温度管理で冷却速度を遅くしHAZの硬化を抑える、(2)低水素系溶接棒を適正に乾燥して使用し開先を清浄化して水素源を断つ、(3)溶接直後の後熱（直後熱）やPWHTで拡散性水素を放出させる、(4)拘束の小さい継手設計・溶接順序として残留応力を低減する、である。炭素当量の高い鋼ほど予熱温度を高くする。",
  },
  {
    id: "e2", cat: "溶接冶金（ステンレス）",
    q: "オーステナイト系ステンレス鋼の「鋭敏化（ウェルドディケイ）」の発生機構と、防止策を述べよ。",
    points: [
      "500〜800℃域でCr炭化物（Cr23C6）が結晶粒界に析出",
      "粒界近傍がCr欠乏（<12%）となり耐食性が低下",
      "HAZの当該温度域で粒界腐食が起こる",
      "防止：低炭素（L材, C≤0.03%）の使用",
      "防止：安定化材（Ti・Nbを添加した321/347）",
      "防止：溶体化処理（固溶化熱処理）、入熱低減で高温滞留時間を短縮",
    ],
    model: "鋭敏化は、オーステナイト系ステンレス鋼が約500〜800℃に加熱された際、Crと炭素が結合してCr炭化物（Cr23C6）が結晶粒界に析出し、その周囲がCr欠乏（約12%未満）となって耐食性を失う現象。溶接HAZのうちこの温度域を通った部分で起こり、粒界腐食（ウェルドディケイ）を招く。防止策は、(1)炭素量を下げた低炭素材（304L・316L等）の使用、(2)Ti・Nbを添加した安定化材（321・347）でCrより先に炭化物を作らせる、(3)溶接後に溶体化処理を行い炭化物を再固溶させる、(4)入熱を抑え危険温度域の滞留時間を短くする、である。",
  },
  {
    id: "e3", cat: "力学・設計",
    q: "すみ肉溶接継手の設計における「理論のど厚」「有効溶接長」の考え方を説明し、入熱過大が継手性能に及ぼす影響を述べよ。",
    points: [
      "理論のど厚 a = 0.7×脚長S（a = S/√2）",
      "有効溶接長 ＝ 溶接全長から始終端の不完全部（≒2a）を除く",
      "許容せん断力 F = a × 有効長 × 許容応力 で設計",
      "入熱過大→HAZの結晶粒粗大化・靭性低下",
      "入熱過大→軟化・強度低下、変形（ひずみ）増大",
    ],
    model: "すみ肉溶接では、荷重を伝える最小断面をのど厚で評価する。等脚すみ肉の理論のど厚は a=0.7S（S＝脚長、a=S/√2）。有効溶接長は、始端・終端のクレータやアーク不安定部（およそのど厚分ずつ）を除いた長さとし、許容せん断力は F＝のど厚×有効溶接長×許容せん断応力 で設計する。入熱が過大になると、HAZの結晶粒が粗大化して靭性が低下し、母材の軟化や強度低下、角変形・収縮などのひずみ増大を招くため、脚長を過大にせず適正入熱で施工することが重要である。",
  },
  {
    id: "e4", cat: "施工・変形",
    q: "溶接変形の主な種類を挙げ、それぞれを低減するための施工上の対策を述べよ。",
    points: [
      "種類：横収縮・縦収縮・角変形・回転変形・座屈（縦曲がり）変形",
      "逆ひずみ（あらかじめ逆方向に取り付ける）",
      "拘束治具・仮付けによる拘束",
      "対称溶接・溶接順序の工夫（ひずみの相殺）",
      "入熱低減・開先角度を小さく・脚長を過大にしない",
    ],
    model: "溶接変形には、溶接線に直角な横収縮、溶接線方向の縦収縮、開先形状に起因する角変形、板の回転変形、薄板で起こる座屈変形などがある。低減策は、(1)あらかじめ逆方向に部材を傾ける逆ひずみ法、(2)拘束治具や仮付けで動きを抑える、(3)溶接線の左右・表裏で対称に溶接し、溶接順序を工夫してひずみを相殺する、(4)入熱を抑え、開先角度を必要最小限にし脚長を過大にしないことで収縮量そのものを減らす、である。過度な拘束は残留応力・割れの原因になるため、拘束と入熱のバランスをとる。",
  },
  {
    id: "e5", cat: "検査（非破壊試験）",
    q: "非破壊試験のRT・UT・PT・MTについて、それぞれの原理と、検出に適する欠陥（内部／表面）を述べよ。",
    points: [
      "RT（放射線透過）：X線・γ線の透過差、内部の体積欠陥（ブローホール・スラグ巻込み）に強い",
      "UT（超音波）：反射エコー、内部の面状欠陥（割れ・融合不良）に強い",
      "PT（浸透探傷）：毛細管現象、材質問わず表面開口欠陥のみ",
      "MT（磁粉探傷）：漏洩磁束、強磁性体の表面〜ごく浅い表層欠陥",
      "RTは体積欠陥、UTは面状欠陥（割れ）に有利という使い分け",
    ],
    model: "RT（放射線透過試験）はX線・γ線の透過量の差をフィルム等で画像化し、ブローホールやスラグ巻込みなど内部の体積欠陥の検出に適する。UT（超音波探傷試験）は超音波の反射エコーで内部を調べ、割れや融合不良など面状欠陥の検出に優れ、板厚の大きい部材にも使える。PT（浸透探傷試験）は毛細管現象で表面開口欠陥に浸透液を染み込ませて検出し、材質を問わないが表面開口欠陥に限られる。MT（磁粉探傷試験）は磁化した強磁性体の欠陥部に生じる漏洩磁束に磁粉を付着させて検出し、表面〜ごく浅い表層の欠陥に有効。体積欠陥はRT、割れ等の面状欠陥はUT、と使い分ける。",
  },
  {
    id: "e6", cat: "溶接法",
    q: "マグ／マグ溶接（GMAW, CO2・混合ガス）とサブマージアーク溶接（SAW）について、能率・品質・適用姿勢の観点で特徴を比較せよ。",
    points: [
      "GMAW：半自動で汎用性高く全姿勢可、ヒューム多め、薄〜中板・現場向き",
      "SAW：フラックス下で大電流・多層厚板を高能率溶接、下向・水平限定",
      "SAWは深い溶込み・美麗ビード・高溶着で品質安定だが姿勢制約大",
      "SAWはアーク不可視で自動化前提、GMAWは可搬・現場適応",
    ],
    model: "GMAW（CO2・混合ガスのマグ溶接）は消耗電極とシールドガスを用いる半自動溶接で、全姿勢に対応でき汎用性が高く、薄板〜中板や現場作業に向く。一方でヒューム・スパッタが比較的多い。SAW（サブマージアーク溶接）は粒状フラックスの下で大電流を流す自動溶接で、深い溶込みと高い溶着速度が得られ、厚板の長い直線継手を高能率・高品質に溶接できる。ただしアークが見えず自動化前提で、施工姿勢は下向・水平すみ肉などに限られる。したがって現場・多姿勢はGMAW、工場での厚板大量溶接はSAW、と使い分ける。",
  },
  {
    id: "e7", cat: "材料・予熱",
    q: "炭素当量（Ceq）と予熱の関係を説明し、Ceqの高い鋼を溶接する際に管理すべき項目を挙げよ。",
    points: [
      "Ceq（IIW式）＝ C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15",
      "Ceqが高いほど焼入れ性が増しHAZが硬化、低温割れ感受性が上がる",
      "予熱温度を高くして冷却速度を下げHAZ硬化を抑える",
      "板厚・拘束度・拡散性水素量も予熱決定に考慮（薄物より厚物ほど予熱↑）",
      "溶接割れ感受性組成Pcmや必要予熱温度の推定式の活用",
    ],
    model: "炭素当量Ceqは合金元素の焼入れ性への寄与を炭素量に換算した指標で、IIW式では Ceq＝C+Mn/6+(Cr+Mo+V)/5+(Ni+Cu)/15。Ceqが高いほど焼入れ性が高く、溶接HAZが硬化して低温割れ感受性が増す。このためCeqの高い鋼では、予熱温度を高めに設定して冷却速度を遅くしHAZ硬化を抑えることが基本となる。予熱温度は Ceqだけでなく、板厚（厚いほど冷却が速く予熱を高く）、拘束度、拡散性水素量も考慮して決める。薄板向きにはPcm（溶接割れ感受性組成）を用いた必要予熱温度の推定も有効。あわせて低水素系溶接材料の乾燥・パス間温度管理も行う。",
  },
  {
    id: "e8", cat: "品質管理",
    q: "WPS（溶接施工要領書）とPQR（溶接施工法確認記録）の関係を説明し、溶接管理技術者の役割を述べよ。",
    points: [
      "WPS：溶接条件（材料・開先・電流電圧・予熱・PWHT等）を規定した要領書",
      "PQR：試験施工で得た裏付けデータ・確認試験結果の記録",
      "WPSはPQRによって妥当性が裏付けられる（PQRが根拠、WPSが指示書）",
      "管理技術者：WPS作成・承認、溶接士の技量認証管理、品質保証・記録管理",
      "施工前の要領確認〜施工中の管理〜検査・記録まで統括",
    ],
    model: "WPS（溶接施工要領書）は、母材・溶接材料・開先形状・溶接電流電圧・溶接速度・予熱／パス間温度・PWHTなど、実際の溶接条件を規定する指示文書。PQR（溶接施工法確認記録）は、その条件で試験施工を行い、機械試験・非破壊試験などで所定の性能が得られることを確認した裏付けデータの記録である。WPSはPQRによって妥当性が保証される関係にあり、PQRが根拠、WPSが現場への指示書となる。溶接管理技術者は、WPSの作成・承認、溶接士の技量認証と適正配置、施工中の条件管理、検査・記録の管理を通じて、溶接品質を計画・監督・保証する役割を担う。",
  },
];

export function EssayScreen() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const e = ESSAYS[i];

  function go(d) {
    const n = (i + d + ESSAYS.length) % ESSAYS.length;
    setI(n); setShow(false);
  }

  return (
    <div style={{ width: "100%", maxWidth: 400, padding: "4px 2px 20px", fontFamily: F }}>
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 9, padding: "9px 11px", marginBottom: 12 }}>
        <div style={{ color: "#C2410C", fontSize: 10, fontWeight: 700 }}>📖 記述対策（WES管理2級 範囲）</div>
        <div style={{ color: "#9A3412", fontSize: 9, lineHeight: 1.6, marginTop: 2 }}>
          2級の筆記はマークシート中心ですが、「記述で説明できる＝本質理解」。自分の言葉で答えを組み立ててから採点ポイントを確認しよう。1級の記述式への布石にもなります。
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>問 {i + 1} / {ESSAYS.length}</span>
        <span style={{ fontSize: 9, color: "#C2410C", fontWeight: 700, background: "#FEF3E2", border: "1px solid #FED7AA", borderRadius: 5, padding: "2px 7px" }}>{e.cat}</span>
      </div>

      {/* 設問 */}
      <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.7 }}>{e.q}</div>
      </div>

      {!show ? (
        <>
          <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "12px 14px", marginBottom: 12, color: "#64748B", fontSize: 10, lineHeight: 1.8 }}>
            ✍️ まず紙かメモに、要点を箇条書きで書き出してみよう。<br />
            書けたら下のボタンで採点ポイントと模範解答を確認。
          </div>
          <button onClick={() => setShow(true)} style={btn("#C2410C")}>採点ポイント・模範解答を見る</button>
        </>
      ) : (
        <>
          {/* 採点ポイント */}
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ color: "#166534", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>✅ 採点ポイント（これが書けていれば加点）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {e.points.map((p, k) => (
                <div key={k} style={{ display: "flex", gap: 6, fontSize: 10, color: "#334155", lineHeight: 1.5 }}>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>▸</span><span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 模範解答 */}
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 9, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ color: "#0891B2", fontSize: 10, fontWeight: 700, marginBottom: 5 }}>📝 模範解答</div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.85 }}>{e.model}</div>
          </div>
          <button onClick={() => setShow(false)} style={{ ...btn("white"), color: "#C2410C", border: "1px solid #FED7AA" }}>設問に戻る</button>
        </>
      )}

      {/* ナビ */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => go(-1)} style={navBtn()}>← 前の問題</button>
        <button onClick={() => go(1)} style={navBtn(true)}>次の問題 →</button>
      </div>
    </div>
  );
}

function btn(bg) {
  return { width: "100%", padding: "12px", border: "none", borderRadius: 8, background: bg, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F };
}
function navBtn(primary) {
  return { flex: 1, padding: "10px", borderRadius: 8, border: primary ? "none" : "1px solid #E2E8F0", background: primary ? "#E85D04" : "white", color: primary ? "white" : "#334155", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F };
}

import { useState } from "react";
import type { LabKind } from "@/lib/math/units";

export function LearningLab({kind}:{kind:LabKind}) {
  const [a,setA]=useState(kind === "clock" ? 8 : kind === "fraction" ? 8 : 6);
  const [b,setB]=useState(kind === "clock" ? 45 : kind === "fraction" ? 3 : 4);
  const [revealed,setRevealed]=useState(false);
  const control=(label:string,value:number,min:number,max:number,onChange:(n:number)=>void,step=1) => <label className="lab-control"><span>{label}<strong>{value}</strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>{onChange(Number(e.target.value));setRevealed(false);}} /></label>;
  return <section className="learning-lab" aria-label="动手理解小实验">
    <div className="lab-heading"><span>动手理解</span><small>拖一拖，先观察，再验证</small></div>
    {kind === "clock" ? <>
      <svg viewBox="0 0 240 230" className="clock-lab" role="img" aria-label={`钟面：时针指向 ${a+b/60} 时的位置，分针指向 ${b} 分的位置`}>
        <circle cx="120" cy="115" r="96" fill="#fffdf7" stroke="#d9e2cd" strokeWidth="2" />
        {Array.from({length:12},(_,i)=>{const angle=(i+1)*Math.PI/6;return <text key={i} x={120+78*Math.sin(angle)} y={120-78*Math.cos(angle)} textAnchor="middle" fill="#476247" fontSize="15">{i+1}</text>;})}
        <line x1="120" y1="115" x2={120+46*Math.sin((a%12+b/60)*Math.PI/6)} y2={115-46*Math.cos((a%12+b/60)*Math.PI/6)} stroke="#285847" strokeWidth="6" strokeLinecap="round" />
        <line x1="120" y1="115" x2={120+65*Math.sin(b*Math.PI/30)} y2={115-65*Math.cos(b*Math.PI/30)} stroke="#c09543" strokeWidth="4" strokeLinecap="round" />
        <circle cx="120" cy="115" r="5" fill="#285847" />
      </svg>
      <div className="lab-controls">{control("时",a,1,12,setA)}{control("分",b,0,55,setB,5)}</div>
      <p>分针转动时，看看时针有没有一起慢慢移动。</p>
    </> : kind === "fraction" ? <>
      <div className="fraction-strip" role="img" aria-label={`长条平均分成 ${a} 份，其中 ${b} 份涂色`} style={{gridTemplateColumns:`repeat(${a},1fr)`}}>{Array.from({length:a},(_,i)=><span key={i} className={i<b?"filled":""} />)}</div>
      <div className="lab-controls">{control("平均分成几份",a,2,10,n=>{setA(n);setB(Math.min(n,b));})}{control("涂色几份",b,0,a,setB)}</div>
      <p>整个长条不变。平均分的份数变多，每一份会怎样？</p>
    </> : <>
      <div className="area-lab-wrap"><div className="area-lab" role="img" aria-label={`方格图，${a} 列、${b} 行，每格边长 1 厘米`} style={{gridTemplateColumns:`repeat(${a},1fr)`,width:`${Math.min(200,200*a/b)}px`,aspectRatio:`${a}/${b}`}}>{Array.from({length:a*b},(_,i)=><span key={i}/>)}</div></div>
      <div className="lab-controls">{control("长（厘米）",a,1,10,setA)}{control("宽（厘米）",b,1,8,setB)}</div>
      <p>每个小格边长 1 厘米。分别想想：铺满是多少，绕一圈又是多少？</p>
    </>}
    <button className="lab-reveal" type="button" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{revealed?"收起结论":"我想好了，验证一下"}</button>
    {revealed ? <p className="lab-conclusion" role="status">{kind==="clock"?`现在是 ${a} 时 ${b} 分。分针每一大格是 5 分，时针的位置也跟着分钟变化。`:kind==="fraction"?`每份是 1/${a}，涂色 ${b} 份就是 ${b}/${a}${b===a?"，也就是完整的 1":""}。分母表示总份数，分子表示取出的份数。`:`面积：${a} × ${b} = ${a*b} 平方厘米；周长：(${a} + ${b}) × 2 = ${(a+b)*2} 厘米。一个看里面，一个看边界。`}</p> : null}
  </section>;
}

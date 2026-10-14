import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Download, FlaskConical, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEARNING_UNITS, TEXTBOOK_NOTE, unitById, type LearningUnit } from "@/lib/math/units";
import { makeQuestion } from "@/lib/math/generate";
import { mulberry32 } from "@/lib/math/rng";
import { todayStamp } from "@/lib/math/progress";
import { downloadText } from "@/lib/download";
import { useMath } from "@/store/math";
import { PageHeading } from "./shell";
import { LearningLab } from "./learning-lab";

export function Learning() {
  const [selected,setSelected]=useState<string|null>(null);
  const [theme,setTheme]=useState("全部");
  const [query,setQuery]=useState("");
  const s=useMath();
  const unit=selected ? unitById(selected) : undefined;
  function chooseUnit(id:string|null){setSelected(id);window.scrollTo({top:0,behavior:"instant"});}
  if(unit)return <UnitLesson unit={unit} onBack={()=>chooseUnit(null)}/>;
  const matches=LEARNING_UNITS.filter(u=>(theme==="全部"||u.theme===theme)&&`${u.title}${u.goal}`.includes(query.trim()));
  return <div className="page-enter">
    <PageHeading eyebrow="先理解 · 再练习 · 换个问题也会做" title="数学，自己想明白。" description="三年级原创知识单元。用一个问题、一段讲解和一次动手实验，把知识连起来。"/>
    <section className="learning-hero"><div><span className="soft-badge">开窍理解实验室</span><h2>不仅会算，<br/>还知道为什么。</h2><p>18 个知识单元 · 3 种互动实验<br/>分步讲解、单元自测、家长建议</p><Button onClick={()=>chooseUnit("u-frac")}><FlaskConical/>从分数小实验开始<ArrowRight/></Button></div><div className="learning-hero-art" aria-hidden="true"><div className="mini-fraction"><i/><i/><i/><i/><i/><i/><i/><i/></div><span>3 / 8</span><small>动手，看见理解</small></div></section>
    {s.selectedGrade!==3 ? <p className="gentle-note">你当前选择的是其他年级。这里展示三年级内容，开始单元练习时会切换到三年级。</p>:null}
    <div className="learning-toolbar"><div className="theme-tabs" aria-label="知识领域">{["全部","数与运算","图形与测量","生活与思考"].map(t=><button type="button" key={t} aria-pressed={theme===t} onClick={()=>setTheme(t)}>{t}</button>)}</div><label className="learning-search"><Search size={17}/><input aria-label="搜索知识单元" placeholder="搜分数、时间、面积…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <div className="unit-grid">{matches.map(u=>{const result=s.unitStats[u.id];return <button type="button" className="unit-card" key={u.id} onClick={()=>chooseUnit(u.id)}><div><span className="unit-number">{String(LEARNING_UNITS.indexOf(u)+1).padStart(2,"0")}</span><small>{u.theme}</small>{u.lab?<FlaskConical size={17}/>:null}</div><h2>{u.title}</h2><p>{u.goal}</p><footer><span>{result?`最近${result.mode==="check"?"自测":"练习"} ${result.correct}/${result.total}`:"从一个小问题开始"}</span><ArrowRight size={17}/></footer></button>;})}</div>
    {!matches.length?<p className="gentle-note">还没找到这个知识点，试试“分数”“长度”或清空搜索。</p>:null}
    <details className="textbook-note"><summary>教材对照与内容说明</summary><p>{TEXTBOOK_NOTE}</p><p>题目、情境和图解由开窍原创设计，不嵌入教材扫描件。请按学校实际进度选择相应知识点。</p><a href="https://basic.smartedu.cn/syncClassroom/auto" target="_blank" rel="noreferrer">前往国家中小学智慧教育平台核对教材 ↗</a></details>
  </div>;
}

export function UnitLesson({unit,onBack}:{unit:LearningUnit;onBack:()=>void}) {
  const s=useMath();
  function worksheet(id:string) {
    const selectedUnit=unitById(id); if(!selectedUnit)return;
    const rng=mulberry32(Date.now());
    const questions=Array.from({length:8},(_,i)=>makeQuestion(selectedUnit.chapterId,i+1,rng));
    downloadText(`开窍-${selectedUnit.title}-练习单.txt`,["开窍原创练习单",selectedUnit.title,`日期：${todayStamp()}`,"姓名：________  用时：________",...questions.map((q,i)=>`\n${i+1}. ${q.prompt}${q.choices?`\n${q.choices.map((c,j)=>`${String.fromCharCode(65+j)}. ${c}`).join("    ")}`:""}\n答：________________`),"\n\n—— 答案与思路（完成后再看）——",...questions.map((q,i)=>`\n${i+1}. ${q.answer}\n${q.explain}`)].join("\n"));
  }
  return <div className="page-enter learning-detail">
    <button type="button" className="back-button" onClick={onBack}><ArrowLeft size={17}/>全部知识单元</button>
    <PageHeading eyebrow={`${unit.theme} · 原创学习单元`} title={unit.title} description={unit.goal}/>
    <div className="lesson-layout"><div><section className="lesson-card"><span className="soft-badge">先想一想</span><h2>{unit.example}</h2><ol className="lesson-steps">{unit.steps.map((step,i)=><li key={step}><b>{i+1}</b><p>{step}</p></li>)}</ol><p className="lesson-pitfall"><strong>容易混淆的地方</strong>{unit.pitfall}</p></section>{unit.lab?<LearningLab key={unit.id} kind={unit.lab}/>:null}<section className="transfer-card"><span><FlaskConical size={18}/>换个情境想一想</span><p>{unit.transfer}</p><small>可以画一画、说给家长听。这里不计分。</small></section></div>
    <aside className="lesson-action-card"><BookOpen size={27}/><h2>想明白了，试一试。</h2><p>练习可以慢慢想。检测完成后，会生成这次单元的小结。</p><Button size="lg" onClick={()=>s.startUnit(unit.id)}>练一组 · 8 题<ArrowRight/></Button><Button variant="outline" size="lg" onClick={()=>s.startUnit(unit.id,true)}><Target/>单元自测 · 12 题</Button><button type="button" className="back-button" onClick={()=>worksheet(unit.id)}><Download size={16}/>下载原创练习单</button><small>练习答错后会增加同类巩固题；自测不加题。两种模式都在作答后讲解，自测用于自查。</small></aside></div>
  </div>;
}

export function UnitProgress() {
 const s=useMath();
 const completed=LEARNING_UNITS.filter(u=>s.unitStats[u.id]);
 const download=()=>downloadText(`开窍-单元学习建议-${todayStamp()}.txt`,["开窍 · 单元学习建议",`日期：${todayStamp()}`,"以下仅反映本浏览器最近完成的一组练习或自测，不代表全部掌握程度。",...completed.map(u=>{const r=s.unitStats[u.id];return `\n${u.title}：${r.mode==="check"?"自测":"练习"} ${r.correct}/${r.total}，完成 ${r.completed} 组。\n建议：${r.correct/r.total<.8?`再看“${u.example}”的分步讲解，留意：${u.pitfall}`:`请孩子解释：${u.transfer}`}\n最近完成：${new Date(r.at).toLocaleDateString("zh-CN")}`;}),"\n给家长：先让孩子说出思路，再决定是否加练；下一次用相似而不同的问题复习。"].join("\n"));
 return <section className="unit-progress"><div className="section-heading"><h2>知识单元学习记录</h2>{completed.length?<Button variant="outline" onClick={download}><Download/>导出家长建议</Button>:null}</div>{completed.length?<div className="unit-result-list">{completed.map(u=>{const r=s.unitStats[u.id];return <div key={u.id}><span><strong>{u.title}</strong><small>{r.correct/r.total<.8?"建议回看讲解，再练一次":"试试把解题过程说出来"}</small></span><b>{r.correct}/{r.total}<small>{r.mode==="check"?"自测":"练习"}</small></b><button type="button" onClick={()=>s.startUnit(u.id)}>再练</button></div>;})}</div>:<p className="muted-copy">完成一组单元练习后，这里会出现具体的学习建议。</p>}<p className="quiet-caption">展示最近完成的一组，练习可能包含加练题。可用于复习安排，不等同于学校考试成绩。</p></section>;
}

import assert from "node:assert/strict";
import { describe,it } from "node:test";
import { EXPANDED_CHAPTERS } from "./expanded-bank.ts";
import { CHAPTERS,chaptersOfGrade } from "./chapters.ts";
import { makeQuestion,makeSimilar } from "./generate.ts";
import { mulberry32 } from "./rng.ts";
import { isSkillId } from "./skills.ts";
import { emptyPersist,exportBackup,importBackup,parseSave } from "./save.ts";

const nums=(s:string)=>(s.match(/\d+(?:\.\d+)?/g)??[]).map(Number);
const frac=(s:string)=>s.includes('/')?Number(s.split('/')[0])/Number(s.split('/')[1]):Number(s);
const near=(actual:number,expected:number,why:string)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-8,`${why}: ${actual} != ${expected}`);
const divisors=(n:number)=>Array.from({length:n},(_,i)=>i+1).filter(i=>n%i===0);

describe("一二四五六年级原创扩展",()=>{
 it("每年级新增4模块，老模块标识仍有效，所有题目能被正确存档",()=>{
   assert.equal(CHAPTERS.length,52);
   assert.equal(new Set(CHAPTERS.map(c=>c.id)).size,52);
   for(const grade of [1,2,4,5,6]) assert.equal(EXPANDED_CHAPTERS.filter(c=>c.grade===grade).length,4);
   assert.deepEqual([1,2,3,4,5,6].map(g=>chaptersOfGrade(g).length),[6,6,21,6,7,6]);
   for(const c of EXPANDED_CHAPTERS) for(let level=1;level<=8;level++) {
     const q=makeQuestion(c.id,level,mulberry32(level));
     assert.ok(isSkillId(q.skill),c.id);
     const data={...emptyPersist(),selectedGrade:c.grade,wrong:[{...q,at:1,given:'错误'}]};
     assert.deepEqual(importBackup(exportBackup(data)),parseSave(data));
     const again=makeSimilar({chapterId:c.id,skill:q.skill},mulberry32(level));
     assert.equal(again.chapterId,c.id);assert.equal(again.skill,q.skill);
   }
 });
 it("新增数值题按题面独立复算，并校验数值等价选项唯一",()=>{
   for(let seed=0;seed<80;seed++) for(const chapter of EXPANDED_CHAPTERS) for(let level=1;level<=8;level++) {
     const q=makeQuestion(chapter.id,level,mulberry32(seed)), n=nums(q.prompt),v=(level-1)%4;
     let expected:number|undefined;
     switch(chapter.id) {
       case 'g1number':
         if(v===0)expected=n[0]*10+n[1];if(v===1)expected=Math.floor(n[0]/10);if(v===2)expected=n[0]+2;
         if(v===3)assert.equal(q.answer,n[0]===n[1]?'一样大':String(Math.max(n[0],n[1])));
         if(v!==3)assert.ok(Number(q.answer)<=99);break;
       case 'g1money':expected=[n[0]*10+n[1],n[0]*10,n[1]-n[0],n[0]+n[1]][v];break;
       case 'g1shape':if(v===0)assert.equal(q.answer,q.prompt.includes('三角形')?'3':'4');break;
       case 'g1story':expected=[n[0]+n[1],n[0]-n[1],n[0]-n[1],n[0]+n[1]][v];assert.ok(Number(q.answer)<=20);break;
       case 'g2place':
         if(v===0)expected=n[0]*1000+n[1]*100+n[2];if(v===1)expected=Math.floor(n[0]/100)%10;
         if(v===2)expected=n[1]+2*n[0];if(v===3)expected=Math.max(n[0],n[1]);break;
       case 'g2measure':
         if(v===0)expected=n[0]*100;if(v===1)expected=n[1]-n[0];if(v===3)expected=n[0]-n[1];
         if(v===2)assert.equal(q.answer,`${n[0]}时${n[2]*5}分`);break;
       case 'g2remainder':
         if(v===0) {const [a,r]=q.answer.split('余').map(Number);assert.equal(a*n[1]+r,n[0]);assert.ok(r>=0&&r<n[1]);}
         if(v===1)expected=Math.floor(n[0]/n[1]);if(v===2)expected=Math.ceil(n[0]/n[1]);if(v===3)expected=n[0]-1;break;
       case 'g2life':expected=[n[0]*n[1],n[0]/n[1],n[0]*n[1]+n[2],n[0]+n[1]+n[2]][v];break;
       case 'g4number':expected=[n[0]*10000+n[1],n[0]/10000,Math.floor((n[0]+5000)/10000),Math.floor(n[0]/10000)%10*10000][v];break;
       case 'g4geometry':
         if(v===0)expected=180-n[0]-n[1];if(v===1){expected=n[0]+n[1]-1;assert.ok(expected>Math.abs(n[0]-n[1]));}break;
       case 'g4units':expected=[n[0]*100,n[0]*10000,n[0]*100,n[0]*60+n[1]][v];break;
       case 'g4stats':expected=[(n[0]+n[1]+n[2])/3,n[0]*n[1],n[0]*n[1],Math.max(...n)-Math.min(...n)][v];break;
       case 'g5factor':
         if(v===0)expected=Math.max(...divisors(n[0]).filter(x=>n[1]%x===0));
         if(v===1){let x=Math.max(n[0],n[1]);while(x%n[0]||x%n[1])x++;expected=x;}
         if(v===2)assert.equal(q.answer,n[0]===1?'既不是质数，也不是合数':divisors(n[0]).length===2?'质数':'合数');
         if(v===3)assert.equal(q.answer,n[0]%5===0?'能':'不能');break;
       case 'g5decimal':expected=v%2===0?n[0]*n[1]:n[0]/n[1];break;
       case 'g5area':expected=[n[0]*n[1],n[0]*n[1]/2,(n[0]+n[1])*n[2]/2,n[0]*2/n[1]][v];break;
       case 'g5volume':expected=[n[0]*n[1]*n[2],6*n[0]**2,n[0]*1000+n[1],2*(n[0]*n[1]+n[0]*n[2]+n[1]*n[2])][v];break;
       case 'g6fraction':
         if(v===0)near(frac(q.answer),(n[0]/n[1])*(n[2]/n[3]),q.prompt);
         if(v===1)near(frac(q.answer),(n[0]/n[1])/(n[2]/n[3]),q.prompt);
         if(v===2)expected=n[0]*n[1]/n[2];if(v===3)expected=n[0]*n[2]/n[1];break;
       case 'g6percent':expected=[n[0]*n[1]/10,n[1]/n[0]*100,n[0]*(1+n[1]/100),n[0]/(n[1]/100)][v];break;
       case 'g6solid':expected=[3.14*n[0]**2*n[1],3.14*n[0]**2*n[1]/3,2*3.14*n[0]*n[1],n[0]/3][v];break;
       case 'g6scale':expected=[n[2]*n[1]/100,n[2]*100/n[1],n[0]*n[1],n[0]*n[1]/n[2]][v];break;
     }
     if(expected!==undefined)near(Number(q.answer),expected,q.prompt);
     assert.ok(!/NaN|undefined|Infinity/.test(q.answer+q.explain+q.prompt));
     if(q.choices&&Number.isFinite(frac(q.answer))) assert.equal(q.choices.filter(c=>Math.abs(frac(c)-frac(q.answer))<1e-10).length,1,q.prompt);
     if(q.mode==='keypad')assert.ok(q.keypad==='remainder'||Number.isFinite(Number(q.answer)));
   }
 });
 it("五年级分数加减有唯一等值选项，约分答案确为最简",()=>{
   for(let seed=0;seed<120;seed++)for(let level=1;level<=8;level++) {
     const q=makeQuestion('g5frac',level,mulberry32(seed));
     const f=[...q.prompt.matchAll(/(\d+)\/(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
     if(level===5||level===6) {
       near(frac(q.answer),f[0][0]/f[0][1],q.prompt);
       const [a,b]=q.answer.split('/').map(Number);assert.equal(divisors(a).filter(i=>b%i===0).length,1);
     } else {
       const expected=q.prompt.includes(' + ')?f[0][0]/f[0][1]+f[1][0]/f[1][1]:f[0][0]/f[0][1]-f[1][0]/f[1][1];
       near(frac(q.answer),expected,q.prompt);assert.equal(q.choices!.filter(c=>Math.abs(frac(c)-expected)<1e-10).length,1);
     }
   }
 });
 it("圆的半径直径与面积题分别使用正确公式和平方单位",()=>{
   for(let seed=0;seed<50;seed++)for(let level=1;level<=8;level++) {
     const q=makeQuestion('g6circle',level,mulberry32(seed)),n=nums(q.prompt),r=q.prompt.includes('半径')?n[0]:n[0]/2;
     const expected=level<=4?2*3.14*r:3.14*r*r;
     near(Number(q.answer),expected,q.prompt);assert.equal(q.keypad,'dec');
     if(level>4)assert.ok(q.prompt.includes('平方厘米'));
   }
 });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHAPTERS } from "./chapters.ts";
import { explainAdd, explainMultiply, explainSubtract } from "./explain.ts";
import { LEARNING_FACTORY, leapYear, monthDays } from "./learning-bank.ts";
import { makeQuestion } from "./generate.ts";
import { mulberry32 } from "./rng.ts";
import { emptyPersist, exportBackup, importBackup, parseSave } from "./save.ts";
import { LEARNING_UNITS } from "./units.ts";

const numbers = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const fraction = (text: string) => { const [a,b] = text.split("/").map(Number); return a/b; };

describe("原创内容与解析正确性", () => {
  it("讲解根据真实数位处理不进位、连续进位和三位数乘法", () => {
    assert.match(explainAdd(31,16), /个位：1 \+ 6 = 7，写 7，不用进位/);
    assert.doesNotMatch(explainAdd(31,16), /向前进 1/);
    assert.match(explainAdd(68,57), /十位：6 \+ 5 \+ 进来的 1 = 12/);
    assert.match(explainAdd(68,57), /125/);
    assert.match(explainMultiply(234,3), /200 × 3 = 600/);
    assert.match(explainMultiply(234,3), /600 \+ 90 \+ 12 = 702/);
    assert.match(explainSubtract(43,18), /33 − 8 = 25/);
  });
  it("所有学习单元均关联真实三年级模块，标识唯一", () => {
    assert.equal(new Set(LEARNING_UNITS.map(u=>u.id)).size,18);
    for(const unit of LEARNING_UNITS) {
      assert.equal(CHAPTERS.find(c=>c.id===unit.chapterId)?.grade,3,unit.id);
      assert.ok(unit.steps.length>=3 && unit.pitfall && unit.transfer);
    }
  });
  it("长度、质量、时间、小数、搭配与混合运算的随机答案独立复算", () => {
    for(let seed=0;seed<80;seed++) for(let level=1;level<=4;level++) {
      for(const id of Object.keys(LEARNING_FACTORY)) {
        const q=makeQuestion(id,level,mulberry32(seed)), n=numbers(q.prompt);
        let expected: number | undefined;
        if(id==='g3measure') {
          if(level===1) expected=n[0]*(q.prompt.includes('千米')?1000:q.prompt.includes(' 米等于')?100:10);
          if(level===2) expected=n[0]*100+n[1]*10;
          if(level===3) expected=n[0]*100-n[1];
        }
        if(id==='g3mass') expected=[n[0]*1000,n[0]*1000+n[1],n[0]*1000-n[1]*n[2],n[0]/1000][level-1];
        if(id==='g3clock') {
          if(level===1) assert.equal(q.answer,`${n[0]}时${n[2]*5}分`);
          if(level===2) expected=n[0]*60;
          if(level===3) expected=(n[2]-n[0])*60+n[3]-n[1];
          if(level===4) {const mins=n[0]*60+n[1]+n[2];assert.equal(q.answer,`${Math.floor(mins/60)}时${mins%60}分`);}
        }
        if(id==='g3calendar') {
          if(level===2) expected=new Date(Date.UTC(n[0],n[1],0)).getUTCDate();
          if(level===3) expected=(Date.UTC(n[0]+1,0,1)-Date.UTC(n[0],0,1))/86400000;
          if(level===4) expected=n[1]-n[0]+1;
        }
        if(id==='g3decimal') {
          if(level===1) expected=Math.round(n[0]*10);
          if(level===2) expected=(Math.round(n[0]*10)+Math.round(n[1]*10))/10;
          if(level===3) expected=(100-Math.round(n[1]*10))/10;
          if(level===4) assert.equal(parseFloat(q.answer),Math.max(n[0],n[1]));
        }
        if(id==='g3combine') {
          if(level===1||level===4) expected=n[0]*n[1];
          if(level===2) expected=n[0]+n[1]-n[2];
          if(level===3) expected=6;
        }
        if(id==='g3mixed') expected=[n[0]+n[1]*n[2],(n[0]+n[1])*n[2],n[0]/n[1]*n[2],n[0]*n[1]+n[2]][level-1];
        if(expected!==undefined) assert.equal(Number(q.answer),expected,JSON.stringify(q));
        assert.ok(!/NaN|undefined|Infinity/.test(q.prompt+q.explain+q.answer));
      }
    }
  });
  it("分数选择题没有数值相等的干扰项，答案符合平均分和加减含义", () => {
    for(let seed=0;seed<150;seed++) for(let level=1;level<=4;level++) {
      const q=makeQuestion('g3fraction',level,mulberry32(seed)),n=numbers(q.prompt);
      const expected=level===1?n[1]/n[0]:level===2?n[0]/n[1]+n[2]/n[3]:level===3?1-n[0]/n[1]:Math.max(n[0]/n[1],n[2]/n[3]);
      assert.ok(Math.abs(fraction(q.answer)-expected)<1e-10,q.prompt);
      assert.equal(q.choices!.filter(c=>Math.abs(fraction(c)-expected)<1e-10).length,1,q.prompt);
    }
  });
  it("世纪闰年与大小月边界正确", () => {
    assert.equal(leapYear(1900),false);assert.equal(leapYear(2000),true);assert.equal(leapYear(2100),false);
    assert.equal(monthDays(1900,2),28);assert.equal(monthDays(2000,2),29);
    assert.equal(monthDays(2026,4),30);assert.equal(monthDays(2026,8),31);
  });
});

describe("学习单元存档", () => {
  it("v1–v3 老存档在不含 unitStats 时保留进度和错题", () => {
    const {unitStats:_units,...legacy}=emptyPersist();
    const q=makeQuestion('warmup',1,mulberry32(9));
    for(const version of [1,2,3]) {
      const result=parseSave({...legacy,version,xp:150,stars:{'warmup:1':3},wrong:[{...q,given:'错误',at:1}]});
      assert.deepEqual(result.unitStats,{});assert.equal(result.xp,150);assert.equal(result.wrong[0].prompt,q.prompt);assert.equal(result.stars['warmup:1'],3);
    }
  });
  it("新学习记录完整备份，拒绝超出总数、负数与未知单元", () => {
    const result={completed:2,correct:9,total:12,at:1791849600000,mode:'check' as const};
    const data={...emptyPersist(),unitStats:{'u-frac':result}};
    assert.deepEqual(importBackup(exportBackup(data)),data);
    for(const patch of [{correct:13},{total:0},{completed:0},{at:-1},{mode:'exam'}]) assert.throws(()=>parseSave({...data,unitStats:{'u-frac':{...result,...patch}}}));
    assert.throws(()=>parseSave({...data,unitStats:{unknown:result}}));
  });
});

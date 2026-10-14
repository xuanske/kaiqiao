import type { Question } from "./types.ts";
import type { Rng } from "./rng.ts";

let serial = 0;
function numberQ(chapterId: string, prompt: string, answer: number, explain: string, skill: string, dec = false): Question {
  return { id:`learn-${++serial}`, chapterId, prompt, answer:String(answer), explain, skill, mode:"keypad", keypad:dec ? "dec" : "int" };
}
function choose(rng: Rng, chapterId: string, prompt: string, answer: string, alternatives: string[], explain: string, skill: string): Question {
  const choices = [...new Set([answer,...alternatives])].slice(0,4);
  return {id:`learn-${++serial}`,chapterId,prompt,answer,explain,skill,mode:"choice",choices:rng.shuffle(choices)};
}
export const leapYear = (year: number) => year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
export const monthDays = (year: number, month: number) => month === 2 ? leapYear(year) ? 29 : 28 : [4,6,9,11].includes(month) ? 30 : 31;
const variant = (level: number) => (level - 1) % 4;

function measure(level: number, rng: Rng): Question {
  const id="g3measure", n=rng.int(2,9), m=rng.int(1,8), kind=variant(level);
  if(kind===0){const [a,b,rate]=rng.pick([["厘米","毫米",10],["分米","厘米",10],["米","厘米",100],["千米","米",1000]] as const);return numberQ(id,`${n} ${a}等于多少${b}？`,n*rate,`1 ${a} = ${rate} ${b}。\n${n} × ${rate} = ${n*rate}，所以是 ${n*rate} ${b}。`,"measure");}
  if(kind===1)return numberQ(id,`${n} 米 ${m} 分米的彩带，一共是多少厘米？`,n*100+m*10,`先统一单位：${n} 米 = ${n*100} 厘米，${m} 分米 = ${m*10} 厘米。\n再相加：${n*100} + ${m*10} = ${n*100+m*10} 厘米。`,"measure");
  if(kind===2){const cut=rng.int(1,9)*10;return numberQ(id,`彩带长 ${n} 米，剪去 ${cut} 厘米，还剩多少厘米？`,n*100-cut,`先换算：${n} 米 = ${n*100} 厘米。\n剩下的长度 = 原长 − 剪去的长度：${n*100} − ${cut} = ${n*100-cut} 厘米。`,"measure");}
  return choose(rng,id,"校园到附近公园的路程约 2（ ），选哪个单位合适？","千米",["毫米","厘米","分米"],"先想实际长度：2 千米 = 2000 米，适合描述这段路程。\n毫米、厘米和分米通常描述更短的物体。","measure");
}
function mass(level: number,rng:Rng):Question{
 const id="g3mass",n=rng.int(2,8),m=rng.int(1,9)*100,kind=variant(level);
 if(kind===0)return numberQ(id,`${n} 千克等于多少克？`,n*1000,`1 千克 = 1000 克。\n${n} × 1000 = ${n*1000} 克。`,"mass");
 if(kind===1)return numberQ(id,`${n} 千克 ${m} 克豆子，一共是多少克？`,n*1000+m,`先把千克换成克：${n} × 1000 = ${n*1000}。\n${n*1000} + ${m} = ${n*1000+m} 克。`,"mass");
 if(kind===2){const bags=rng.int(2,5),kg=rng.int(10,40);return numberQ(id,`仓库有 ${n} 吨粮食，运走 ${bags} 袋，每袋 ${kg} 千克，还剩多少千克？`,n*1000-bags*kg,`原有 ${n*1000} 千克。\n运走 ${bags} × ${kg} = ${bags*kg} 千克。\n还剩 ${n*1000} − ${bags*kg} = ${n*1000-bags*kg} 千克。`,"mass");}
 return numberQ(id,`${n*1000} 千克等于多少吨？`,n,`1 吨 = 1000 千克。\n${n*1000} ÷ 1000 = ${n} 吨。`,"mass");
}
function clock(level:number,rng:Rng):Question{
 const id="g3clock",kind=variant(level),h=rng.int(1,10),m=rng.pick([5,10,15,20,25,30,35,40,45,50,55]);
 if(kind===0)return choose(rng,id,`时针在 ${h} 和 ${h+1} 之间，分针指向 ${m/5}。现在是几时几分？`,`${h}时${m}分`,[`${h}时${m/5}分`,`${h+1}时${m}分`,`${h}时0分`],`分针走一大格是 5 分：${m/5} × 5 = ${m} 分。\n时针已经过 ${h}，还没有到 ${h+1}，所以是 ${h} 时 ${m} 分。`,"time");
 if(kind===1){const n=rng.int(2,8);return numberQ(id,`${n} 分钟等于多少秒？`,n*60,`1 分钟 = 60 秒。\n${n} × 60 = ${n*60} 秒。`,"time");}
 if(kind===2){const dur=rng.int(15,80),end=h*60+m+dur;return numberQ(id,`阅读从 ${h}:${String(m).padStart(2,"0")} 开始，到 ${Math.floor(end/60)}:${String(end%60).padStart(2,"0")} 结束，经过多少分钟？`,dur,`开始时刻换成分钟：${h} × 60 + ${m} = ${h*60+m}。\n结束时刻换成分钟：${Math.floor(end/60)} × 60 + ${end%60} = ${end}。\n相减：${end} − ${h*60+m} = ${dur} 分钟。`,"time");}
 const dur=rng.int(20,70),end=h*60+m+dur;return choose(rng,id,`手工课 ${h}:${String(m).padStart(2,"0")} 开始，上 ${dur} 分钟后是几时几分？`,`${Math.floor(end/60)}时${end%60}分`,[`${h}时${(m+dur)%60}分`,`${h+2}时${end%60}分`,`${h}时${m}分`],`把时刻换成分钟后相加：${h*60+m} + ${dur} = ${end}。\n每 60 分换成 1 时，得到 ${Math.floor(end/60)} 时 ${end%60} 分。`,"time");
}
function calendar(level:number,rng:Rng):Question{
 const id="g3calendar",kind=variant(level),y=rng.pick([1900,2000,2023,2024,2025,2026,2028,2100]),m=rng.int(1,12);
 const why=y%100===0?`${y} 是整百年份，${y%400===0?"能":"不能"}被 400 整除。`:`${y} 不是整百年份，${y%4===0?"能":"不能"}被 4 整除。`;
 if(kind===0)return choose(rng,id,`${y} 年是平年还是闰年？`,leapYear(y)?"闰年":"平年",[leapYear(y)?"平年":"闰年"],`${why}\n所以是${leapYear(y)?"闰年，2 月有 29 天":"平年，2 月有 28 天"}。`,"calendar");
 if(kind===1)return numberQ(id,`${y} 年 ${m} 月有多少天？`,monthDays(y,m),m===2?`${why}\n${leapYear(y)?"闰年":"平年"} 2 月有 ${monthDays(y,m)} 天。`:`1、3、5、7、8、10、12 月是 31 天；4、6、9、11 月是 30 天。\n${m} 月有 ${monthDays(y,m)} 天。`,"calendar");
 if(kind===2)return numberQ(id,`${y} 年全年有多少天？`,leapYear(y)?366:365,`${why}\n${leapYear(y)?"闰年比平年多 1 天，365 + 1 = 366":"平年全年有 365 天"}。`,"calendar");
 const start=rng.int(1,20),end=rng.int(start+1,28);return numberQ(id,`本月 ${start} 日到 ${end} 日每天记录天气，首尾两天都算，一共记录几天？`,end-start+1,`日期相减算的是间隔：${end} − ${start} = ${end-start}。\n首尾都记录，还要加上第一天：${end-start} + 1 = ${end-start+1} 天。`,"calendar");
}
function fraction(level:number,rng:Rng):Question{
 const id="g3fraction",d=rng.int(3,9),a=rng.int(1,d-1),kind=variant(level);
 if(kind===0)return choose(rng,id,`一张纸平均分成 ${d} 份，涂色 ${a} 份。涂色部分占整张纸的几分之几？`,`${a}/${d}`,[`${d}/${a}`,`${d-a}/${d}`,`${a}/${d+1}`],`平均分成 ${d} 份，分母是 ${d}。\n涂了 ${a} 份，分子是 ${a}，所以是 ${a}/${d}。`,"frac");
 if(kind===1){const b=rng.int(1,d-a);return choose(rng,id,`${a}/${d} + ${b}/${d} = ?`,`${a+b}/${d}`,[`${a+b}/${d*2}`,`${Math.abs(a-b)}/${d}`,`${a}/${d+b}`],`每份都是 1/${d}，份的大小不变。\n${a} 份加 ${b} 份是 ${a+b} 份，所以是 ${a+b}/${d}${a+b===d?"，也就是 1":""}。`,"frac");}
 if(kind===2)return choose(rng,id,`一条彩带用去全长的 ${a}/${d}，还剩几分之几？`,`${d-a}/${d}`,[`${a}/${d}`,`${d-a}/${d-a}`,`1/${d}`],`把整条看成 ${d}/${d}。\n${d} 份减 ${a} 份剩 ${d-a} 份，还剩 ${d-a}/${d}。`,"frac");
 const other=d+1;return choose(rng,id,`同样大的两张纸，1/${d} 和 1/${other} 哪个更大？`,`1/${d}`,[`1/${other}`,"一样大"],`整体相同，平均分成的份数越多，每份越小。\n${d} 份比 ${other} 份少，因此 1/${d} 更大。`,"frac");
}
function decimal(level:number,rng:Rng):Question{
 const id="g3decimal",a=rng.int(12,65),b=rng.int(1,29),kind=variant(level),x=(a/10).toFixed(1),y=(b/10).toFixed(1);
 if(kind===0)return numberQ(id,`${x} 元等于多少角？`,a,`1 元 = 10 角。\n${x} 元 × 10 = ${a} 角。`,"dec");
 if(kind===1)return numberQ(id,`手账本 ${x} 元，贴纸 ${y} 元，一共多少元？`,(a+b)/10,`先按角计算：${a} + ${b} = ${a+b} 角。\n${a+b} 角 = ${((a+b)/10).toFixed(1)} 元；列式时小数点对齐。`,"dec",true);
 if(kind===2)return numberQ(id,`付 10 元，买一本 ${x} 元的本子，应找回多少元？`,(100-a)/10,`10 元 = 100 角，${x} 元 = ${a} 角。\n100 − ${a} = ${100-a} 角 = ${((100-a)/10).toFixed(1)} 元。`,"dec",true);
 const b2=a+rng.int(1,9);return choose(rng,id,`两张价签 ${x} 元与 ${(b2/10).toFixed(1)} 元，哪张更贵？`,`${(b2/10).toFixed(1)} 元`,[`${x} 元`,"一样贵"],`都换成角：${a} 角和 ${b2} 角。\n${b2} 大于 ${a}，所以 ${(b2/10).toFixed(1)} 元更贵。`,"dec");
}
function combine(level:number,rng:Rng):Question{
 const id="g3combine",a=rng.int(2,5),b=rng.int(2,5),kind=variant(level);
 if(kind===0)return numberQ(id,`有 ${a} 种上衣和 ${b} 种裤子，每次各选一种，有多少种搭配？`,a*b,`固定一种上衣，可以搭配 ${b} 种裤子。\n一共有 ${a} 种上衣，所以 ${a} × ${b} = ${a*b} 种。`,"combine");
 if(kind===1){const both=rng.int(1,Math.min(a,b));return numberQ(id,`读书组有 ${a} 人，绘画组有 ${b} 人，其中 ${both} 人两组都参加。参加至少一个组的共有几人？`,a+b-both,`直接相加会把两组都参加的 ${both} 人算两遍。\n${a} + ${b} − ${both} = ${a+b-both} 人。`,"combine");}
 if(kind===2)return numberQ(id,`用 1、2、3 三张数字卡，每次选两张，能摆出几个没有重复数字的两位数？`,6,"按十位有序列举：12、13；21、23；31、32。\n共有 3 × 2 = 6 个，不能重复使用同一张卡。","combine");
 return numberQ(id,`从家到书店有 ${a} 条路，书店到公园有 ${b} 条路。必须经过书店，有多少种去公园的路线？`,a*b,`每一条到书店的路，都能接上 ${b} 条去公园的路。\n一共有 ${a} × ${b} = ${a*b} 种路线。`,"combine");
}
function mixed(level:number,rng:Rng):Question{
 const id="g3mixed",a=rng.int(2,9),b=rng.int(2,9),c=rng.int(2,9),kind=variant(level);
 if(kind===0)return numberQ(id,`${a} + ${b} × ${c} = ?`,a+b*c,`先算乘法：${b} × ${c} = ${b*c}。\n再算加法：${a} + ${b*c} = ${a+b*c}。`,"mixed");
 if(kind===1)return numberQ(id,`(${a} + ${b}) × ${c} = ?`,(a+b)*c,`先算括号内：${a} + ${b} = ${a+b}。\n再乘：${a+b} × ${c} = ${(a+b)*c}。`,"mixed");
 if(kind===2)return numberQ(id,`${a*b} ÷ ${a} × ${c} = ?`,b*c,`乘除是同一级运算，从左往右算。\n${a*b} ÷ ${a} = ${b}，再算 ${b} × ${c} = ${b*c}。`,"mixed");
 return numberQ(id,`每袋 ${a} 枚徽章，买了 ${b} 袋，又买了 ${c} 枚散装徽章，一共有几枚？`,a*b+c,`先算袋装：${a} × ${b} = ${a*b} 枚。\n再加散装：${a*b} + ${c} = ${a*b+c} 枚。`,"mixed");
}
function angles(level:number,rng:Rng):Question{
 const id="g3angles",kind=variant(level);
 if(kind===0)return choose(rng,id,"一个角比直角小，它是什么角？","锐角",["直角","钝角"],"以直角为标准，张口比直角小的是锐角。\n比较时要让顶点和一条边重合。","geometry");
 if(kind===1)return choose(rng,id,"把一个角的两条边画长，张口不变，角的大小会怎样？","不变",["变大","变小"],"角的大小看两条边张开的程度。\n边画长了，张口没有变化，角就没有变大。","geometry");
 if(kind===2)return choose(rng,id,"有两个端点、可以量出长度的是？","线段",["直线","射线"],"线段有两个端点，长度有限。\n射线有一个端点，直线没有端点。","geometry");
 return choose(rng,id,"一个角比直角大、比平角小，它是什么角？","钝角",["锐角","直角"],"比直角大而又比平角小的角叫钝角。\n用直角作比较时，先对齐顶点和一条边。","geometry");
}
export const LEARNING_FACTORY: Record<string,(level:number,rng:Rng)=>Question> = {g3measure:measure,g3mass:mass,g3clock:clock,g3calendar:calendar,g3fraction:fraction,g3decimal:decimal,g3combine:combine,g3mixed:mixed,g3angles:angles};

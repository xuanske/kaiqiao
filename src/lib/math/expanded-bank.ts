import type { Question, Chapter } from "./types.ts";
import type { Rng } from "./rng.ts";

let sequence = 0;
const variant = (level: number) => (level - 1) % 4;
const rounded = (n: number) => Math.round(n * 100) / 100;
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
export const fractionText = (a: number, b: number) => {
  const g = gcd(Math.abs(a), b);
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
};
const valueOf = (s: string) => /^-?\d+\/\d+$/.test(s) ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s);
function number(id: string, prompt: string, answer: number | string, explain: string, skill: string, keypad: "int" | "dec" | "remainder" = "int"): Question {
  return { id: `expanded-${++sequence}`, chapterId: id, prompt, answer: String(answer), explain, skill, mode: "keypad", keypad };
}
function choose(rng: Rng, id: string, prompt: string, answer: string, alternatives: string[], explain: string, skill: string): Question {
  const choices = [answer];
  for (const candidate of alternatives) {
    if (!choices.some(c => c === candidate || (Number.isFinite(valueOf(c)) && Number.isFinite(valueOf(candidate)) && Math.abs(valueOf(c) - valueOf(candidate)) < 1e-10))) choices.push(candidate);
  }
  return { id: `expanded-${++sequence}`, chapterId: id, prompt, answer, choices: rng.shuffle(choices.slice(0,4)), explain, skill, mode: "choice" };
}
function fracChoice(rng: Rng, id: string, prompt: string, a: number, b: number, explain: string): Question {
  const answer = fractionText(a,b);
  return choose(rng,id,prompt,answer,[fractionText(a+1,b),fractionText(a,b+1),fractionText(a+2,b),String(valueOf(answer)+1)],`${explain}\n结果写成最简形式是 ${answer}。`,"frac");
}

function g1number(level:number,rng:Rng):Question {
  const id="g1number", tens=rng.int(1,level<=4?5:9), ones=rng.int(0,9), n=variant(level)===2?Math.min(96,tens*10+ones):tens*10+ones;
  switch(variant(level)) {
    case 0: return number(id,`${tens} 个十和 ${ones} 个一合起来是多少？`,n,`${tens} 个十是 ${tens*10}，再添 ${ones} 个一。\n${tens*10} + ${ones} = ${n}。`,"number");
    case 1: return number(id,`${n} 里面有几个十？`,tens,`${n} = ${tens*10} + ${ones}，十位上的 ${tens} 表示 ${tens} 个十。`,"number");
    case 2: return number(id,`按顺序数：${n}、${n+1}、□、${n+3}。□ 是多少？`,n+2,`每次增加 1。\n${n+1} 的下一个数是 ${n+2}。`,"number");
    default: {const b=rng.int(10,99),hi=Math.max(n,b);return choose(rng,id,`${n} 和 ${b}，哪个数更大？`,n===b?"一样大":String(hi),[String(Math.min(n,b)),"一样大"],`先比较十位，十位相同再比较个位。\n${n===b?"两个数相等。":`${hi} 更大。`}`,"number");}
  }
}
function g1money(level:number,rng:Rng):Question {
  const id="g1money",a=rng.int(1,level<=4?5:9),b=rng.int(1,9);
  switch(variant(level)) {
    case 0:return number(id,`${a} 元 ${b} 角一共是多少角？`,a*10+b,`1 元 = 10 角。\n${a} 元是 ${a*10} 角，加上 ${b} 角，共 ${a*10+b} 角。`,"money");
    case 1:return number(id,`${a} 角等于多少分？`,a*10,`1 角 = 10 分，${a} 个 10 分是 ${a*10} 分。`,"money");
    case 2:{const price=rng.int(2,9);return number(id,`贴纸 ${price} 元，付给店员 10 元，应找回多少元？`,10-price,`付出的钱 = 商品价格 + 找回的钱。\n10 − ${price} = ${10-price} 元。`,"money");}
    default:return number(id,`一支笔 ${a} 元，一块橡皮 ${b} 元，一共要付多少元？`,a+b,`把两样物品的价格相加。\n${a} + ${b} = ${a+b} 元。`,"money");
  }
}
function g1shape(level:number,rng:Rng):Question {
  const id="g1shape";
  switch(variant(level)) {
    case 0:{const item=rng.pick([["三角形",3],["正方形",4],["长方形",4]] as const);return number(id,`一个${item[0]}有几条边？`,item[1],`沿图形边界依次点数，不重复也不遗漏。\n${item[0]}有 ${item[1]} 条边。`,"shape");}
    case 1:return choose(rng,id,"一枚六个面都是正方形的骰子，形状最接近什么？","正方体",["长方形","圆柱","球"],"骰子占有空间，有六个正方形的面，形状是正方体。\n正方形描述的是平面图形。","shape");
    case 2:{const left=rng.pick(["红球","蓝球","黄球"]),right=rng.pick(["小车","积木","小熊"]);return choose(rng,id,`从左到右依次摆着${left}、${right}。${right}在${left}的哪边？`,"右边",["左边","上面"],`先看给定的从左到右顺序。\n${right}排在后面，在${left}右边。`,"shape");}
    default:{const a=rng.pick(["红","黄"]),b="蓝";return choose(rng,id,`颜色按“${a}、${b}、${a}、${b}、${a}、□”排列。□ 是什么颜色？`,b,[a,"绿"],`每一组是“${a}、${b}”，两种颜色交替出现。\n${a}后面应接${b}。`,"shape");}
  }
}
function g1story(level:number,rng:Rng):Question {
  const id="g1story",a=rng.int(5,10),b=rng.int(1,5),c=rng.int(1,4);
  switch(variant(level)) {
    case 0:return number(id,`书架上有 ${a} 本绘本，又放上 ${b} 本，现在有几本？`,a+b,`“又放上”表示增加，用加法。\n${a} + ${b} = ${a+b} 本。`,"add");
    case 1:return number(id,`有 ${a+b} 张卡片，送出 ${b} 张，还剩几张？`,a,`“送出”表示减少。\n${a+b} − ${b} = ${a} 张。`,"sub");
    case 2:return number(id,`小禾有 ${a+b} 颗棋子，小雨有 ${a} 颗。小禾比小雨多几颗？`,b,`比较相差多少，用较多的减较少的。\n${a+b} − ${a} = ${b} 颗。`,"sub");
    default:return number(id,`小禾排在从前往后第 ${a} 位，她后面还有 ${c} 人。这队一共有几人？`,a+c,`第 ${a} 位已经包括小禾自己和前面的人。\n再加后面的 ${c} 人：${a} + ${c} = ${a+c} 人。`,"number");
  }
}
function g2place(level:number,rng:Rng):Question {
  const id="g2place",a=rng.int(1,9),b=rng.int(1,9),c=rng.int(0,9),n=a*1000+b*100+c;
  switch(variant(level)) {
    case 0:return number(id,`${a} 个千、${b} 个百和 ${c} 个一组成多少？`,n,`按数位合成：${a*1000} + ${b*100} + ${c} = ${n}。\n没有十，十位写 0 占位。`,"number");
    case 1:return number(id,`数 ${n} 的百位上的数字是几？`,b,`从右往左是个、十、百、千位。\n百位数字是 ${b}，表示 ${b} 个百。`,"number");
    case 2:{const start=rng.int(10,80)*100;return number(id,`每次多 100：${start}、${start+100}、□。□ 是多少？`,start+200,`继续加 100：${start+100} + 100 = ${start+200}。`,"number");}
    default:{const m=n+rng.int(1,9)*10;return choose(rng,id,`${n} 和 ${m}，哪个数更大？`,String(m),[String(n),"一样大"],`先比高位，相同再往低位比较。\n${m} 比 ${n} 多 ${m-n}，所以 ${m} 更大。`,"number");}
  }
}
function g2measure(level:number,rng:Rng):Question {
  const id="g2measure",a=rng.int(1,8),b=rng.int(1,9);
  switch(variant(level)) {
    case 0:return number(id,`${a} 米等于多少厘米？`,a*100,`1 米 = 100 厘米。\n${a} 个 100 厘米是 ${a*100} 厘米。`,"measure");
    case 1:{const start=rng.int(1,8),len=rng.int(3,9);return number(id,`铅笔左端对着尺子的 ${start} 厘米刻度，右端对着 ${start+len} 厘米刻度。铅笔长几厘米？`,len,`长度是两个刻度之间的距离，不能只看右端。\n${start+len} − ${start} = ${len} 厘米。`,"measure");}
    case 2:{const h=rng.int(1,10),minute=rng.int(1,11)*5;return choose(rng,id,`时针在 ${h} 和 ${h+1} 之间，分针指 ${minute/5}。现在是什么时刻？`,`${h}时${minute}分`,[`${h}时${minute/5}分`,`${h+1}时${minute}分`,`${h}时0分`],`分针每大格是 5 分，${minute/5} × 5 = ${minute}。\n时针还没到 ${h+1}，所以是 ${h} 时 ${minute} 分。`,"time");}
    default:return number(id,`彩绳原来长 ${a*10+b} 厘米，剪下 ${a*10} 厘米，还剩多少厘米？`,b,`剩下 = 原来 − 剪下。\n${a*10+b} − ${a*10} = ${b} 厘米。`,"measure");
  }
}
function g2remainder(level:number,rng:Rng):Question {
  const id="g2remainder",d=rng.int(2,9),q=rng.int(2,level<=4?5:8),r=rng.int(1,d-1),n=d*q+r;
  switch(variant(level)) {
    case 0:return number(id,`${n} ÷ ${d} = ？写成 商余余数`,`${q}余${r}`,`先找不超过 ${n} 的整份：${d} × ${q} = ${d*q}。\n还剩 ${n} − ${d*q} = ${r}，余数 ${r} 小于除数 ${d}。`,"div-remain","remainder");
    case 1:return number(id,`${n} 枚贴纸，每人分 ${d} 枚，最多能分给几人？`,q,`能分成 ${q} 个完整的 ${d} 枚，还剩 ${r} 枚，不够再分一人。`,"div-remain");
    case 2:return number(id,`${n} 个球，每盒最多装 ${d} 个，全部装下至少要几个盒子？`,q+1,`${n} ÷ ${d} = ${q} 余 ${r}。\n剩下的 ${r} 个球也需要一个盒子，所以要 ${q} + 1 = ${q+1} 个。`,"div-remain");
    default:return number(id,`除数是 ${d}，余数最大可以是几？`,d-1,`余数必须小于除数。\n比 ${d} 小的最大整数是 ${d-1}。`,"div-remain");
  }
}
function g2life(level:number,rng:Rng):Question {
  const id="g2life",a=rng.int(2,8),b=rng.int(2,8),c=rng.int(1,8);
  switch(variant(level)) {
    case 0:return number(id,`每盘放 ${a} 个点心，摆了 ${b} 盘，一共有几个点心？`,a*b,`${b} 个 ${a} 相加，用乘法更简便。\n${a} × ${b} = ${a*b} 个。`,"times");
    case 1:return number(id,`${a*b} 张卡片平均分给 ${a} 人，每人得到几张？`,b,`想 ${a} 乘几等于 ${a*b}。\n${a*b} ÷ ${a} = ${b} 张。`,"times");
    case 2:return number(id,`买了 ${b} 包贴纸，每包 ${a} 张，又收到 ${c} 张。一共有几张？`,a*b+c,`先算买来的：${a} × ${b} = ${a*b}。\n再加收到的：${a*b} + ${c} = ${a*b+c} 张。`,"mixed");
    default:return number(id,`投票记录：苹果 ${a} 票，梨 ${b} 票，桃 ${c} 票。共收到几票？`,a+b+c,`每张票只计一次，把三类相加。\n${a} + ${b} + ${c} = ${a+b+c} 票。`,"stat");
  }
}
function g4number(level:number,rng:Rng):Question {
  const id="g4number",a=rng.int(12,88),b=rng.int(1000,9999),n=a*10000+b;
  switch(variant(level)) {
    case 0:return number(id,`${a} 个万和 ${b} 个一合起来是多少？`,n,`1 万 = 10000。\n${a} × 10000 + ${b} = ${n}。`,"number");
    case 1:return number(id,`${a*10000} 改写成以“万”为单位的数是多少万？`,a,`这是准确改写：${a*10000} ÷ 10000 = ${a} 万。`,"number");
    case 2:{const result=Math.round(n/10000);return number(id,`把 ${n} 四舍五入到万位，大约是多少万？`,result,`看千位数字 ${Math.floor(b/1000)}，${b>=5000?"满 5，万位进 1":"小于 5，舍去万位后面的数"}。\n约为 ${result} 万。`,"number");}
    default:return number(id,`数 ${n} 中，数字 ${Math.floor(n/10000)%10} 在万位上，表示几个一？`,Math.floor(n/10000)%10*10000,`万位上的 1 表示 10000。\n${Math.floor(n/10000)%10} 个万就是 ${Math.floor(n/10000)%10*10000} 个一。`,"number");
  }
}
function g4geometry(level:number,rng:Rng):Question {
  const id="g4geometry",a=rng.int(3,7)*10,b=rng.int(3,7)*10;
  switch(variant(level)) {
    case 0:return number(id,`一个三角形两个内角分别是 ${a}° 和 ${b}°，第三个角是多少度？`,180-a-b,`三角形内角和是 180°。\n180 − ${a} − ${b} = ${180-a-b}°。`,"geometry");
    case 1:{const x=rng.int(3,8),y=rng.int(3,8);return number(id,`三角形两边长 ${x} 厘米、${y} 厘米，第三边取整厘米数，最大能是几厘米？`,x+y-1,`第三边必须小于两边之和 ${x+y}，还要大于两边之差 ${Math.abs(x-y)}。\n满足条件的最大整数是 ${x+y-1}。`,"geometry");}
    case 2:return choose(rng,id,"在同一个平面内，两条直线相交成直角，它们是什么关系？","互相垂直",["互相平行","无法确定"],"垂直要满足相交，并且交角是直角。\n同一平面内平行的两条直线不相交。","geometry");
    default:return choose(rng,id,"两组对边分别平行的四边形，一定是什么图形？","平行四边形",["正方形","长方形","只有一组对边平行的梯形"],"两组对边分别平行是平行四边形的特征。\n没有给出边长或直角条件，不能断定是长方形、正方形。","shape");
  }
}
function g4units(level:number,rng:Rng):Question {
  const id="g4units",a=rng.int(2,9),b=rng.int(1,8);
  switch(variant(level)) {
    case 0:return number(id,`${a} 平方米等于多少平方分米？`,a*100,`1 米 = 10 分米，一平方米可铺 10 × 10 = 100 个平方分米。\n${a} × 100 = ${a*100} 平方分米。`,"area");
    case 1:return number(id,`${a} 公顷等于多少平方米？`,a*10000,`1 公顷 = 10000 平方米。\n${a} × 10000 = ${a*10000} 平方米。`,"area");
    case 2:return number(id,`${a} 平方千米等于多少公顷？`,a*100,`1 平方千米 = 100 公顷。\n${a} × 100 = ${a*100} 公顷。`,"area");
    default:return number(id,`${a} 小时 ${b*5} 分钟，一共是多少分钟？`,a*60+b*5,`先统一单位：${a} 小时 = ${a*60} 分。\n${a*60} + ${b*5} = ${a*60+b*5} 分钟。`,"time");
  }
}
function g4stats(level:number,rng:Rng):Question {
  const id="g4stats",avg=rng.int(8,25),d=rng.int(1,7),a=avg-d,b=avg+d;
  switch(variant(level)) {
    case 0:return number(id,`三天分别读了 ${a}、${avg}、${b} 页书，平均每天读多少页？`,avg,`平均数 = 总页数 ÷ 天数。\n(${a} + ${avg} + ${b}) ÷ 3 = ${avg*3} ÷ 3 = ${avg} 页。`,"stat");
    case 1:return number(id,`小组 ${d+2} 人，平均每人收集 ${avg} 张卡片，一共收集多少张？`,(d+2)*avg,`总数 = 平均数 × 人数。\n${avg} × ${d+2} = ${(d+2)*avg} 张。`,"stat");
    case 2:{const speed=rng.int(4,9)*10,h=rng.int(2,5);return number(id,`列车平均每小时行 ${speed} 千米，行驶 ${h} 小时，共行多少千米？`,speed*h,`路程 = 速度 × 时间。\n${speed} × ${h} = ${speed*h} 千米。`,"rate");}
    default:return number(id,`收集瓶子：一组 ${a} 个，二组 ${avg} 个，三组 ${b} 个。最多的一组比最少的一组多几个？`,b-a,`先找最多 ${b} 个、最少 ${a} 个，再求相差。\n${b} − ${a} = ${b-a} 个。`,"stat");
  }
}
function g5factor(level:number,rng:Rng):Question {
  const id="g5factor",a=rng.int(4,20),b=rng.int(3,18),g=gcd(a,b);
  switch(variant(level)) {
    case 0:return number(id,`${a} 和 ${b} 的最大公因数是多少？`,g,`分别找因数，再取最大的共同因数。\n${a} 的因数：${Array.from({length:a},(_,i)=>i+1).filter(n=>a%n===0).join('、')}。\n${b} 的因数：${Array.from({length:b},(_,i)=>i+1).filter(n=>b%n===0).join('、')}。\n最大公因数是 ${g}。`,"factor");
    case 1:return number(id,`${a} 和 ${b} 的最小公倍数是多少？`,a*b/g,`最大公因数是 ${g}。\n最小公倍数 = ${a} × ${b} ÷ ${g} = ${a*b/g}。`,"factor");
    case 2:{const n=rng.pick([1,2,3,4,5,9,11,15,17,21]);const ans=n===1?"既不是质数，也不是合数":[2,3,5,11,17].includes(n)?"质数":"合数";return choose(rng,id,`自然数 ${n} 属于哪一类？`,ans,["质数","合数","既不是质数，也不是合数"],n===1?"1 只有一个因数 1，不属于质数或合数。":`${n} 的因数有 ${Array.from({length:n},(_,i)=>i+1).filter(v=>n%v===0).join('、')}。\n只有两个因数的是质数，超过两个因数的是合数。`,"factor");}
    default:{const n=rng.int(10,499);return choose(rng,id,`${n} 能被 5 整除吗？`,n%5===0?"能":"不能",["能","不能"],`${n} 的个位是 ${n%10}。\n个位是 0 或 5 的整数能被 5 整除；其他个位不行。`,"factor");}
  }
}
function g5decimal(level:number,rng:Rng):Question {
  const id="g5decimal",a=rng.int(12,level<=4?45:85),b=rng.int(2,9),x=(a/10).toFixed(1);
  switch(variant(level)) {
    case 0:return number(id,`${x} × ${b} = ?`,rounded(a*b/10),`先按整数算：${a} × ${b} = ${a*b}。\n原数有一位小数，积也从右数出一位：${rounded(a*b/10)}。`,"dec","dec");
    case 1:return number(id,`${(a*b/10).toFixed(1)} ÷ ${b} = ?`,a/10,`把 ${ (a*b/10).toFixed(1)} 平均分成 ${b} 份。\n${a*b} ÷ ${b} = ${a}，再回到十分位，得 ${x}。\n验算：${x} × ${b} = ${(a*b/10).toFixed(1)}。`,"dec","dec");
    case 2:{const c=rng.int(2,9);return number(id,`${x} × ${(c/10).toFixed(1)} = ?`,rounded(a*c/100),`先算 ${a} × ${c} = ${a*c}。\n两个因数一共有两位小数，所以积是 ${rounded(a*c/100)}。`,"dec","dec");}
    default:return number(id,`${(a*b/10).toFixed(1)} ÷ ${(b/10).toFixed(1)} = ?`,a,`被除数和除数同时乘 10，商不变。\n变成 ${a*b} ÷ ${b} = ${a}。`,"dec","dec");
  }
}
function g5area(level:number,rng:Rng):Question {
  const id="g5area",a=rng.int(3,12)*2,h=rng.int(2,10),b=rng.int(2,8)*2;
  switch(variant(level)) {
    case 0:return number(id,`平行四边形底 ${a} 厘米，对应的高 ${h} 厘米，面积是多少平方厘米？`,a*h,`沿高剪拼成长方形，底和对应的高不变。\n面积 = 底 × 高 = ${a} × ${h} = ${a*h} 平方厘米。`,"area");
    case 1:return number(id,`三角形底 ${a} 厘米，对应的高 ${h} 厘米，面积是多少平方厘米？`,a*h/2,`两个相同三角形可拼成同底同高的平行四边形。\n面积 = ${a} × ${h} ÷ 2 = ${a*h/2} 平方厘米。`,"area");
    case 2:return number(id,`梯形上底 ${a} 厘米、下底 ${b} 厘米、高 ${h} 厘米，面积是多少平方厘米？`,(a+b)*h/2,`面积 = (上底 + 下底) × 高 ÷ 2。\n(${a} + ${b}) × ${h} ÷ 2 = ${(a+b)*h/2} 平方厘米。`,"area");
    default:return number(id,`三角形面积是 ${a*h/2} 平方厘米，底是 ${a} 厘米，对应的高是多少厘米？`,h,`面积乘 2 后是底 × 高。\n${a*h/2} × 2 ÷ ${a} = ${h} 厘米。`,"area");
  }
}
function g5volume(level:number,rng:Rng):Question {
  const id="g5volume",a=rng.int(3,9),b=rng.int(2,7),c=rng.int(2,6);
  switch(variant(level)) {
    case 0:return number(id,`长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少立方厘米？`,a*b*c,`一层有 ${a} × ${b} = ${a*b} 个单位小方块，共 ${c} 层。\n体积 = ${a} × ${b} × ${c} = ${a*b*c} 立方厘米。`,"volume");
    case 1:return number(id,`正方体棱长 ${a} 厘米，表面积是多少平方厘米？`,6*a*a,`每个面面积 ${a} × ${a} = ${a*a}，共有 6 个相同的面。\n表面积 = ${a*a} × 6 = ${6*a*a} 平方厘米。`,"surface");
    case 2:return number(id,`${a} 升 ${b*100} 毫升水，一共是多少毫升？`,a*1000+b*100,`1 升 = 1000 毫升。\n${a*1000} + ${b*100} = ${a*1000+b*100} 毫升。`,"volume");
    default:return number(id,`长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，表面积是多少平方厘米？`,2*(a*b+a*c+b*c),`相对的两个面面积相等。\n(${a} × ${b} + ${a} × ${c} + ${b} × ${c}) × 2 = ${2*(a*b+a*c+b*c)} 平方厘米。`,"surface");
  }
}
function g6fraction(level:number,rng:Rng):Question {
  const id="g6fraction",b=rng.int(3,9),a=rng.int(1,b-1),d=rng.int(3,9),c=rng.int(1,d-1);
  switch(variant(level)) {
    case 0:return fracChoice(rng,id,`${a}/${b} × ${c}/${d} = ?`,a*c,b*d,`分子相乘，分母相乘：(${a} × ${c}) / (${b} × ${d}) = ${a*c}/${b*d}。`);
    case 1:return fracChoice(rng,id,`${a}/${b} ÷ ${c}/${d} = ?`,a*d,b*c,`除以一个非零分数，乘它的倒数。\n${a}/${b} × ${d}/${c} = ${a*d}/${b*c}。`);
    case 2:{const n=b*rng.int(3,9);return number(id,`${n} 页的手账，已经写了全本的 ${a}/${b}，写了多少页？`,n*a/b,`先求每份：${n} ÷ ${b} = ${n/b} 页。\n再取 ${a} 份：${n/b} × ${a} = ${n*a/b} 页。`,"frac");}
    default:{const whole=b*rng.int(3,9),part=whole*a/b;return number(id,`一本书已经读了 ${part} 页，正好是全书的 ${a}/${b}，全书有多少页？`,whole,`把全书看成单位“1”。\n全书页数 × ${a}/${b} = ${part}。\n${part} ÷ ${a} × ${b} = ${whole} 页。`,"frac");}
  }
}
function g6percent(level:number,rng:Rng):Question {
  const id="g6percent",whole=rng.int(3,15)*20,pct=rng.int(1,9)*10;
  switch(variant(level)) {
    case 0:return number(id,`原价 ${whole} 元的书包打 ${pct/10} 折，现价是多少元？`,whole*pct/100,`${pct/10} 折就是按原价的 ${pct}% 付款。\n${whole} × ${pct}/100 = ${whole*pct/100} 元。`,"pct");
    case 1:{const part=whole*pct/100;return number(id,`共检查 ${whole} 件作品，合格 ${part} 件，合格率是多少？只填百分号前的数。`,pct,`合格率 = 合格数 ÷ 总数 × 100%。\n${part} ÷ ${whole} × 100% = ${pct}%。`,"pct");}
    case 2:return number(id,`去年种 ${whole} 棵树，今年比去年增加 ${pct}%，今年种多少棵？`,whole*(100+pct)/100,`增加了 ${whole} × ${pct}% = ${whole*pct/100} 棵。\n今年 = 去年 + 增加：${whole} + ${whole*pct/100} = ${whole*(100+pct)/100} 棵。`,"pct");
    default:return number(id,`活动价 ${whole*pct/100} 元，是原价的 ${pct}%，原价是多少元？`,whole,`原价 × ${pct}% = ${whole*pct/100}。\n原价 = ${whole*pct/100} ÷ (${pct}/100) = ${whole} 元。`,"pct");
  }
}
function g6solid(level:number,rng:Rng):Question {
  const id="g6solid",r=rng.int(2,8),h=rng.int(2,8)*3,pi=3.14;
  switch(variant(level)) {
    case 0:return number(id,`圆柱底面半径 ${r} 厘米、高 ${h} 厘米，π 取 3.14，体积是多少立方厘米？`,rounded(pi*r*r*h),`先求底面积：3.14 × ${r} × ${r} = ${rounded(pi*r*r)}。\n体积 = 底面积 × 高 = ${rounded(pi*r*r)} × ${h} = ${rounded(pi*r*r*h)} 立方厘米。`,"volume","dec");
    case 1:return number(id,`圆锥底面半径 ${r} 厘米、高 ${h} 厘米，π 取 3.14，体积是多少立方厘米？`,rounded(pi*r*r*h/3),`圆锥体积是等底等高圆柱的三分之一。\n3.14 × ${r} × ${r} × ${h} ÷ 3 = ${rounded(pi*r*r*h/3)} 立方厘米。`,"volume","dec");
    case 2:return number(id,`圆柱底面半径 ${r} 厘米、高 ${h} 厘米，π 取 3.14，只求侧面积是多少平方厘米？`,rounded(2*pi*r*h),`侧面展开成一个长方形，长是底面周长，宽是高。\n2 × 3.14 × ${r} × ${h} = ${rounded(2*pi*r*h)} 平方厘米。\n这里不包括两个底面。`,"surface","dec");
    default:{const v=rng.int(5,30)*3;return number(id,`圆柱体积 ${v} 立方厘米，与它等底等高的圆锥体积是多少立方厘米？`,v/3,`等底等高时，圆锥体积是圆柱的三分之一。\n${v} ÷ 3 = ${v/3} 立方厘米。`,"volume");}
  }
}
function g6scale(level:number,rng:Rng):Question {
  const id="g6scale",a=rng.int(2,9),b=rng.int(2,8);
  switch(variant(level)) {
    case 0:{const scale=rng.pick([10000,20000,50000]);return number(id,`地图比例尺 1:${scale}，图上距离 ${a} 厘米，实际距离是多少米？`,a*scale/100,`图上 1 厘米代表实际 ${scale} 厘米。\n${a} × ${scale} = ${a*scale} 厘米，再除以 100 得 ${a*scale/100} 米。`,"scale");}
    case 1:return number(id,`比例尺 1:10000，实际距离 ${a*100} 米，图上距离是多少厘米？`,a,`先统一单位：${a*100} 米 = ${a*10000} 厘米。\n${a*10000} ÷ 10000 = ${a} 厘米。`,"scale");
    case 2:return number(id,`每本笔记本 ${a} 元，${b} 本共多少元？`,a*b,`单价固定，总价与数量成正比例。\n${a} × ${b} = ${a*b} 元。`,"ratio");
    default:{const speed=a*10,h=b,newSpeed=speed*2;return number(id,`同一段路，以每小时 ${speed} 千米行驶需要 ${h} 小时。速度改成每小时 ${newSpeed} 千米，需要几小时？`,h/2,`路程固定，速度与时间成反比例。\n原路程 ${speed} × ${h} = ${speed*h} 千米。\n${speed*h} ÷ ${newSpeed} = ${h/2} 小时。`,"ratio","dec");}
  }
}

export const EXPANDED_FACTORY: Record<string,(level:number,rng:Rng)=>Question> = {
  g1number,g1money,g1shape,g1story,g2place,g2measure,g2remainder,g2life,
  g4number,g4geometry,g4units,g4stats,g5factor,g5decimal,g5area,g5volume,
  g6fraction,g6percent,g6solid,g6scale,
};
export const EXPANDED_CHAPTERS: Chapter[] = [
  {id:"g1number",name:"数与数位",blurb:"百以内数的组成、比较与顺序",grade:1,term:"知识练习"},
  {id:"g1money",name:"小小购物员",blurb:"元角分、合计与找零",grade:1,term:"知识练习"},
  {id:"g1shape",name:"图形与位置",blurb:"辨图形、分左右、找规律",grade:1,term:"知识练习"},
  {id:"g1story",name:"读懂生活题",blurb:"增加、减少、相差与排队",grade:1,term:"知识练习"},
  {id:"g2place",name:"万以内的数",blurb:"数位、组成、顺序与比较",grade:2,term:"知识练习"},
  {id:"g2measure",name:"测量与读钟",blurb:"米厘米、尺子刻度、时分",grade:2,term:"知识练习"},
  {id:"g2remainder",name:"余数的用处",blurb:"平均分、装盒、余数范围",grade:2,term:"知识练习"},
  {id:"g2life",name:"乘除与生活",blurb:"分组、两步应用、分类统计",grade:2,term:"知识练习"},
  {id:"g4number",name:"大数与近似数",blurb:"万的组成、改写和四舍五入",grade:4,term:"知识练习"},
  {id:"g4geometry",name:"三角形与四边形",blurb:"内角和、三边关系、平行垂直",grade:4,term:"知识练习"},
  {id:"g4units",name:"单位换算",blurb:"面积单位、公顷和时间",grade:4,term:"知识练习"},
  {id:"g4stats",name:"数据与行程",blurb:"平均数、比较、速度与路程",grade:4,term:"知识练习"},
  {id:"g5factor",name:"因数与倍数",blurb:"最大公因数、最小公倍数和质数",grade:5,term:"知识练习"},
  {id:"g5decimal",name:"小数乘除",blurb:"整数与小数乘除，商不变性质",grade:5,term:"知识练习"},
  {id:"g5area",name:"多边形面积",blurb:"平行四边形、三角形与梯形",grade:5,term:"知识练习"},
  {id:"g5volume",name:"体积与表面积",blurb:"长方体、正方体与容积",grade:5,term:"知识练习"},
  {id:"g6fraction",name:"分数乘除",blurb:"分数乘除、求部分与求整体",grade:6,term:"知识练习"},
  {id:"g6percent",name:"百分数与折扣",blurb:"折扣、合格率、增长和求原量",grade:6,term:"知识练习"},
  {id:"g6solid",name:"圆柱与圆锥",blurb:"体积、侧面积、等底等高关系",grade:6,term:"知识练习"},
  {id:"g6scale",name:"比例尺与比例",blurb:"地图距离、正比例与反比例",grade:6,term:"知识练习"},
];

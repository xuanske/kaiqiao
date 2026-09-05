import type { Question } from "./types.ts";
import { randomRng, type Rng } from "./rng.ts";

function qid(): string {
  return `g${Math.random().toString(36).slice(2, 8)}`;
}

function keypad(chapterId: string, prompt: string, answer: string | number, explain: string, keypad: "int" | "dec" | "remainder" = "int"): Question {
  return { id: qid(), chapterId, prompt, answer: String(answer), explain, mode: "keypad", keypad };
}

function choice(rng: Rng, chapterId: string, prompt: string, answer: string | number, explain: string, distractors: Array<string | number>): Question {
  const correct = String(answer);
  const uniq = [correct];
  for (const raw of rng.shuffle(distractors.map(String))) {
    if (raw !== correct && !uniq.includes(raw)) uniq.push(raw);
    if (uniq.length === 4) break;
  }
  return { id: qid(), chapterId, prompt, answer: correct, explain, mode: "choice", choices: rng.shuffle(uniq.slice(0, 4)) };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** 一年级：10 以内、20 以内进退位。 */
export function g1add(level: number, rng: Rng): Question {
  const id = "g1add";
  if (level <= 3) {
    const add = rng.chance(0.55);
    if (add) {
      const a = rng.int(0, 9);
      const b = rng.int(0, 10 - a);
      return keypad(id, `${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}`);
    }
    const a = rng.int(1, 10);
    const b = rng.int(0, a);
    return keypad(id, `${a} − ${b} = ?`, a - b, `${a} − ${b} = ${a - b}`);
  }
  const a = rng.int(9, 18);
  if (rng.chance(0.5)) {
    const b = rng.int(1, 20 - a);
    return keypad(id, `${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}。满十向前凑。`);
  }
  const b = rng.int(1, Math.min(9, a));
  return keypad(id, `${a} − ${b} = ?`, a - b, `${a} − ${b} = ${a - b}。个位不够就向十位借 1。`);
}

/** 一年级：整点与半点。 */
export function g1clock(level: number, rng: Rng): Question {
  const id = "g1clock";
  const h = rng.int(1, 12);
  if (level <= 4) {
    return choice(rng, id, `时钟指向 ${h} 点整。现在是几点？`, `${h} 点`, `时针指 ${h}，分针指 12，是 ${h} 点整。`, [`${h} 点半`, `${(h % 12) + 1} 点`, `${h} 点 1 分`]);
  }
  return choice(rng, id, `时针在 ${h} 和 ${(h % 12) + 1} 中间，分针指 6。是几点？`, `${h} 点半`, `分针指 6 是 30 分，所以是 ${h} 点半。`, [`${h} 点`, `${(h % 12) + 1} 点`, `${h} 点 6 分`]);
}

/** 二年级：百以内加减。 */
export function g2add(level: number, rng: Rng): Question {
  const id = "g2add";
  if (level <= 3) {
    const a = rng.int(10, 80);
    const b = rng.int(1, 99 - a);
    if (rng.chance(0.5)) return keypad(id, `${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}`);
    const x = Math.max(a, b);
    const y = Math.min(a, b);
    return keypad(id, `${x} − ${y} = ?`, x - y, `${x} − ${y} = ${x - y}`);
  }
  const a = rng.int(28, 76);
  const b = rng.int(15, 99 - a);
  return keypad(id, `${a} + ${b} = ?`, a + b, `个位满十进 1：${a} + ${b} = ${a + b}`);
}

/** 二年级：表内乘除。 */
export function g2times(level: number, rng: Rng): Question {
  const id = "g2times";
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  if (level <= 4 || rng.chance(0.55)) {
    return keypad(id, `${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}，用口诀。`);
  }
  return keypad(id, `${a * b} ÷ ${a} = ?`, b, `${a * b} ÷ ${a} = ${b}，因为 ${a} × ${b} = ${a * b}`);
}

/** 四年级：三位数与运算律。 */
export function g4ops(level: number, rng: Rng): Question {
  const id = "g4ops";
  if (level <= 3) {
    const a = rng.int(108, 486);
    const b = rng.int(2, 9);
    return keypad(id, `${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}。先乘个位，再乘十位。`);
  }
  if (level <= 6) {
    const a = rng.int(12, 48);
    const b = rng.int(6, 24);
    const c = rng.int(2, 9);
    return keypad(id, `${a} × ${c} + ${b} × ${c} = ?`, (a + b) * c, `提取公因数：(${a} + ${b}) × ${c} = ${(a + b) * c}`);
  }
  const a = rng.int(200, 800);
  const b = rng.int(12, 36);
  const q = Math.floor(a / b);
  const r = a % b;
  if (r === 0) return keypad(id, `${a} ÷ ${b} = ?`, q, `${a} ÷ ${b} = ${q}`);
  return keypad(id, `${a} ÷ ${b} = ？写成 商余余数`, `${q}余${r}`, `${b} × ${q} = ${b * q}，还余 ${r}。`, "remainder");
}

/** 四年级：小数加减。 */
export function g4dec(level: number, rng: Rng): Question {
  const id = "g4dec";
  const a = rng.int(12, 85) / 10;
  const b = rng.int(3, 40) / 10;
  const fa = a.toFixed(1);
  const fb = b.toFixed(1);
  if (level <= 4 || rng.chance(0.6)) {
    const s = (a + b).toFixed(1);
    return keypad(id, `${fa} + ${fb} = ?`, s, `小数点对齐：${fa} + ${fb} = ${s}`, "dec");
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const d = (hi - lo).toFixed(1);
  return keypad(id, `${hi.toFixed(1)} − ${lo.toFixed(1)} = ?`, d, `小数点对齐：${hi.toFixed(1)} − ${lo.toFixed(1)} = ${d}`, "dec");
}

/** 五年级：分数加减（同分母、简单通分）。 */
export function g5frac(level: number, rng: Rng): Question {
  const id = "g5frac";
  if (level <= 4) {
    const den = rng.int(4, 12);
    const a = rng.int(1, den - 2);
    const b = rng.int(1, den - a);
    return choice(
      rng,
      id,
      `${a}/${den} + ${b}/${den} = ?`,
      `${a + b}/${den}`,
      `同分母，分子相加：${a + b}/${den}`,
      [`${a + b}/${den * 2}`, `${a}/${den + b}`, `${Math.abs(a - b)}/${den}`],
    );
  }
  const den = rng.int(2, 6);
  const num = rng.int(1, den - 1);
  const g = gcd(num, den);
  const n2 = num / g;
  const d2 = den / g;
  return choice(rng, id, `把 ${num}/${den} 约分成最简分数`, `${n2}/${d2}`, `上下同除以 ${g}，得 ${n2}/${d2}。`, [`${num}/${den}`, `${den}/${num}`, `${n2}/${den}`]);
}

/** 五年级：简易方程。 */
export function g5eq(level: number, rng: Rng): Question {
  const id = "g5eq";
  const x = rng.int(3, 18);
  if (level <= 4) {
    const a = rng.int(2, 9);
    const b = a * x;
    return keypad(id, `${a}x = ${b}，x = ?`, x, `两边同除以 ${a}：x = ${x}`);
  }
  const a = rng.int(2, 8);
  const b = rng.int(1, 12);
  const right = a * x + b;
  return keypad(id, `${a}x + ${b} = ${right}，x = ?`, x, `先减 ${b} 得 ${a * x}，再除以 ${a}，x = ${x}`);
}

/** 五年级：百分数。 */
export function g5pct(level: number, rng: Rng): Question {
  const id = "g5pct";
  if (level <= 4) {
    const n = rng.int(1, 9) * 10;
    return choice(rng, id, `${n}% 等于多少？`, `${n / 100}`, `${n}% = ${n}/100 = ${n / 100}`, ["0." + n, String(n), String(n / 10)]);
  }
  const whole = rng.int(2, 9) * 10;
  const pct = rng.int(1, 5) * 10;
  const part = (whole * pct) / 100;
  return keypad(id, `${whole} 的 ${pct}% 是多少？`, part, `${whole} × ${pct / 100} = ${part}`);
}

/** 六年级：比和比例。 */
export function g6ratio(level: number, rng: Rng): Question {
  const id = "g6ratio";
  const a = rng.int(2, 8);
  const b = rng.int(2, 8);
  const k = rng.int(2, 5);
  if (level <= 4) {
    const g = gcd(a * k, b * k);
    return choice(rng, id, `${a * k}:${b * k} 化成最简比`, `${(a * k) / g}:${(b * k) / g}`, `上下同除以 ${g}。`, [`${a * k}:${b * k}`, `${b}:${a}`, `${a * k}:${b}`]);
  }
  const x = a * k;
  return keypad(id, `${a}:${b} = ${x}:□，□ 是多少？`, b * k, `内项积等于外项积：${a} × □ = ${b} × ${x}，□ = ${b * k}`);
}

/** 六年级：圆周长。 */
export function g6circle(level: number, rng: Rng): Question {
  const id = "g6circle";
  const r = rng.int(2, 12);
  if (level <= 4) {
    const c = 2 * 3 * r;
    return keypad(id, `半径 ${r} 厘米，π 取 3。周长多少厘米？`, c, `周长 = 2 × π × 半径 = 2 × 3 × ${r} = ${c}`);
  }
  const d = rng.int(4, 16);
  const c = 3 * d;
  return keypad(id, `直径 ${d} 厘米，π 取 3。周长多少厘米？`, c, `周长 = π × 直径 = 3 × ${d} = ${c}`);
}

export const GRADE_FACTORY = {
  g1add,
  g1clock,
  g2add,
  g2times,
  g4ops,
  g4dec,
  g5frac,
  g5eq,
  g5pct,
  g6ratio,
  g6circle,
};

export { randomRng };

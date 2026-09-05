import { hasBorrow, hasCarry, parseColumn } from "./column.ts";
import type { Question, SkillStat, WrongItem } from "./types.ts";

export type SkillId =
  | "add"
  | "add-carry"
  | "sub"
  | "sub-borrow"
  | "times"
  | "bei"
  | "mul"
  | "div"
  | "div-remain"
  | "peri"
  | "area"
  | "time"
  | "calendar"
  | "frac"
  | "dec"
  | "dir"
  | "stat"
  | "eq"
  | "pct"
  | "ratio"
  | "circle";

export const SKILL_LABEL: Record<SkillId, string> = {
  add: "加法",
  "add-carry": "进位加法",
  sub: "减法",
  "sub-borrow": "退位减法",
  times: "表内乘除",
  bei: "认识倍",
  mul: "多位数乘法",
  div: "除法",
  "div-remain": "有余数除法",
  peri: "周长",
  area: "面积",
  time: "时分秒",
  calendar: "年月日",
  frac: "分数",
  dec: "小数",
  dir: "位置方向",
  stat: "简单统计",
  eq: "简易方程",
  pct: "百分数",
  ratio: "比和比例",
  circle: "圆的周长",
};

export const SKILL_HINT: Record<SkillId, string> = {
  add: "对齐数位，从个位加起。",
  "add-carry": "满十向前进 1，进上来的 1 不能漏。",
  sub: "对齐数位，从个位减起。",
  "sub-borrow": "不够减就向前借 1，借走的那一位少 1。",
  times: "用口诀，不要把加减混进去。",
  bei: "几倍就是乘；问「多多少」要再减一次。",
  mul: "先乘个位，再乘十位，最后加起来。",
  div: "想乘法口诀：几乘除数最接近被除数。",
  "div-remain": "余数必须比除数小。写成 商余余数。",
  peri: "长方形周长 =（长 + 宽）× 2，正方形 × 4。",
  area: "面积是长 × 宽，单位是平方。",
  time: "1 时 = 60 分。跨天先算到午夜。",
  calendar: "平年 365，闰年二月 29。四年一闰。",
  frac: "平均分成几份，每份就是几分之一。",
  dec: "小数点对齐再加减。1 元 = 10 角。",
  dir: "面朝一个方向，右转顺时针一格。",
  stat: "一共用加法，相差用减法。",
  eq: "把已知数移到另一边，未知数单独留一边。",
  pct: "百分数就是分母是 100 的分数。",
  ratio: "比的前项后项同乘同除一个数，比值不变。",
  circle: "周长 = π × 直径。这里 π 取 3。",
};

export const SKILL_DRILL: Record<SkillId, { chapterId: string; level: number }> = {
  add: { chapterId: "warmup", level: 2 },
  "add-carry": { chapterId: "wan", level: 5 },
  sub: { chapterId: "warmup", level: 2 },
  "sub-borrow": { chapterId: "wan", level: 6 },
  times: { chapterId: "warmup", level: 4 },
  bei: { chapterId: "bei", level: 5 },
  mul: { chapterId: "mul1", level: 4 },
  div: { chapterId: "div1", level: 2 },
  "div-remain": { chapterId: "div1", level: 6 },
  peri: { chapterId: "peri", level: 3 },
  area: { chapterId: "area", level: 3 },
  time: { chapterId: "time", level: 4 },
  calendar: { chapterId: "time", level: 6 },
  frac: { chapterId: "frac", level: 2 },
  dec: { chapterId: "frac", level: 7 },
  dir: { chapterId: "dir", level: 3 },
  stat: { chapterId: "stat", level: 4 },
  eq: { chapterId: "g5eq", level: 3 },
  pct: { chapterId: "g5pct", level: 3 },
  ratio: { chapterId: "g6ratio", level: 3 },
  circle: { chapterId: "g6circle", level: 3 },
};

const SKILL_IDS = Object.keys(SKILL_LABEL) as SkillId[];

export function isSkillId(value: string | undefined): value is SkillId {
  return !!value && SKILL_IDS.includes(value as SkillId);
}

export function inferSkill(q: Pick<Question, "chapterId" | "prompt" | "answer" | "trap">): SkillId {
  const { chapterId, prompt, answer, trap } = q;
  if (trap?.includes("跨天")) return "time";
  if (trap?.includes("多多少") || (chapterId === "bei" && prompt.includes("多多少"))) return "bei";
  if (trap?.includes("连续进位")) return "add-carry";
  if (trap?.includes("连续退位")) return "sub-borrow";

  const col = parseColumn(prompt);
  if (col) {
    if (col.op === "+") return hasCarry(col.a, col.b) ? "add-carry" : "add";
    if (col.op === "−") return hasBorrow(col.a, col.b) ? "sub-borrow" : "sub";
    if (col.op === "×") {
      if (chapterId === "warmup" || (col.a <= 9 && col.b <= 9)) return "times";
      return "mul";
    }
  }

  if (prompt.includes("÷")) {
    if (answer.includes("余") || prompt.includes("余")) return "div-remain";
    return chapterId === "warmup" ? "times" : "div";
  }

  if (chapterId === "time") {
    if (/年|月|闰|平年/.test(prompt)) return "calendar";
    return "time";
  }
  if (chapterId === "frac") {
    if (/\d\.\d|元|角/.test(prompt)) return "dec";
    return "frac";
  }

  switch (chapterId) {
    case "bei":
      return "bei";
    case "mul1":
    case "mul2":
      return "mul";
    case "div1":
      return "div";
    case "peri":
      return "peri";
    case "area":
      return "area";
    case "dir":
      return "dir";
    case "stat":
      return "stat";
    case "g1add":
    case "g2add":
      return prompt.includes("−") ? "sub" : "add";
    case "g1clock":
      return "time";
    case "g2times":
      return "times";
    case "g4ops":
      return prompt.includes("÷") ? "div" : "mul";
    case "g4dec":
      return "dec";
    case "g5frac":
      return "frac";
    case "g5eq":
      return "eq";
    case "g5pct":
      return "pct";
    case "g6ratio":
      return "ratio";
    case "g6circle":
      return "circle";
    case "wan":
      return prompt.includes("−") ? "sub" : "add";
    default:
      return "add";
  }
}

export function emptySkillStat(): SkillStat {
  return { seen: 0, correct: 0, sumMs: 0 };
}

export function touchSkill(
  map: Record<string, SkillStat>,
  skill: string | undefined,
  ok: boolean,
  ms: number,
): Record<string, SkillStat> {
  if (!skill) return map;
  const prev = map[skill] ?? emptySkillStat();
  return {
    ...map,
    [skill]: {
      seen: prev.seen + 1,
      correct: prev.correct + (ok ? 1 : 0),
      sumMs: prev.sumMs + ms,
    },
  };
}

export type SkillRow = {
  id: SkillId;
  label: string;
  acc: number;
  seen: number;
  avgMs: number;
};

export function skillRows(map: Record<string, SkillStat>): SkillRow[] {
  return Object.entries(map)
    .filter((entry): entry is [SkillId, SkillStat] => isSkillId(entry[0]) && entry[1].seen > 0)
    .map(([id, s]) => ({
      id,
      label: SKILL_LABEL[id],
      acc: s.correct / s.seen,
      seen: s.seen,
      avgMs: s.sumMs / s.seen,
    }))
    .sort((a, b) => a.acc - b.acc || b.seen - a.seen);
}

export function weakSkills(map: Record<string, SkillStat>, minSeen = 3): SkillRow[] {
  return skillRows(map).filter((row) => row.seen >= minSeen && row.acc < 0.8);
}

export function tonightPlan(map: Record<string, SkillStat>, wrong: WrongItem[]): {
  line: string;
  skill?: SkillId;
} {
  const weak = weakSkills(map, 3);
  if (weak[0]) {
    const top = weak[0];
    return {
      skill: top.id,
      line: `今晚专攻${top.label}。${SKILL_HINT[top.id]}先做 8 题。`,
    };
  }
  if (wrong.length) {
    const skill = isSkillId(wrong[0]?.skill) ? wrong[0]!.skill : undefined;
    const label = skill ? SKILL_LABEL[skill] : "错题";
    return { skill, line: `错题本还有 ${wrong.length} 道。先回炉 ${label}。` };
  }
  return { line: "各章都还稳。今晚做一组口算冲刺，把速度练出来。" };
}

export function oralPace(map: Record<string, SkillStat>): { avgMs: number; line: string } | null {
  const ids: SkillId[] = ["add", "add-carry", "sub", "sub-borrow", "times"];
  let seen = 0;
  let sum = 0;
  for (const id of ids) {
    const s = map[id];
    if (!s) continue;
    seen += s.seen;
    sum += s.sumMs;
  }
  if (seen < 6) return null;
  const avgMs = sum / seen;
  const sec = (avgMs / 1000).toFixed(1);
  if (avgMs <= 5000) return { avgMs, line: `口算约 ${sec} 秒一题，已经很快。` };
  if (avgMs <= 9000) return { avgMs, line: `口算约 ${sec} 秒一题，再练冲刺会更稳。` };
  return { avgMs, line: `口算约 ${sec} 秒一题。先求对，再求快。` };
}

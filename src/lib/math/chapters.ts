import type { Chapter } from "./types.ts";

export const LEVELS_PER_CHAPTER = 8;
export const QUESTIONS_PER_LEVEL = 8;
export const DAILY_COUNT = 10;
export const DUEL_SECONDS = 60;
export const SPRINT_SECONDS = 90;
export const SPRINT_COUNT = 20;
export const DRILL_COUNT = 8;

export const CHAPTERS: Chapter[] = [
  { id: "g1add", name: "20 以内", blurb: "10 以内，再练进位退位", term: "上·下", grade: 1 },
  { id: "g1clock", name: "认识钟表", blurb: "整点、半点", term: "下册", grade: 1 },
  { id: "g2add", name: "百以内", blurb: "两位数加减", term: "上册", grade: 2 },
  { id: "g2times", name: "表内乘除", blurb: "口诀，九九表", term: "上·下", grade: 2 },
  { id: "warmup", name: "口算热身", blurb: "百以内加减，表内乘除", term: "准备", grade: 3 },
  { id: "wan", name: "万以内", blurb: "加、减，进位与退位", term: "上册", grade: 3 },
  { id: "bei", name: "认识倍", blurb: "几倍、求一个数的几倍", term: "上册", grade: 3 },
  { id: "mul1", name: "乘一位数", blurb: "多位数 × 一位数", term: "上册", grade: 3 },
  { id: "div1", name: "除一位数", blurb: "除数是一位数，含余数", term: "下册", grade: 3 },
  { id: "mul2", name: "乘两位数", blurb: "两位数 × 两位数", term: "下册", grade: 3 },
  { id: "peri", name: "周长", blurb: "长方形与正方形的周长", term: "上册", grade: 3 },
  { id: "area", name: "面积", blurb: "铺满，平方厘米与平方米", term: "下册", grade: 3 },
  { id: "time", name: "时间日历", blurb: "时分秒，年、月、日", term: "上·下", grade: 3 },
  { id: "frac", name: "分数小数", blurb: "初步认识分数与小数", term: "上·下", grade: 3 },
  { id: "dir", name: "位置方向", blurb: "东南西北，左转右转", term: "下册", grade: 3 },
  { id: "stat", name: "简单统计", blurb: "合计、比较、相差多少", term: "下册", grade: 3 },
  { id: "g4ops", name: "运算律", blurb: "三位数乘除，提取公因数", term: "上册", grade: 4 },
  { id: "g4dec", name: "小数加减", blurb: "小数点对齐", term: "下册", grade: 4 },
  { id: "g5frac", name: "分数运算", blurb: "同分母加减，约分", term: "上册", grade: 5 },
  { id: "g5eq", name: "简易方程", blurb: "求未知数 x", term: "上册", grade: 5 },
  { id: "g5pct", name: "百分数", blurb: "百分数与小数，求一个数的百分之几", term: "下册", grade: 5 },
  { id: "g6ratio", name: "比和比例", blurb: "化简比，解比例", term: "上册", grade: 6 },
  { id: "g6circle", name: "圆的周长", blurb: "π 取 3，半径与直径", term: "下册", grade: 6 },
];

export const GRADE_LABEL: Record<number, string> = {
  1: "一年级",
  2: "二年级",
  3: "三年级",
  4: "四年级",
  5: "五年级",
  6: "六年级",
};

export function chapterById(id: string): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS.find((c) => c.id === "warmup") ?? CHAPTERS[0]!;
}

export function chaptersOfGrade(grade: number): Chapter[] {
  return CHAPTERS.filter((c) => c.grade === grade);
}

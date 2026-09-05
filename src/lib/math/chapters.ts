import type { Chapter } from "./types.ts";

export const LEVELS_PER_CHAPTER = 8;
export const QUESTIONS_PER_LEVEL = 8;
export const DAILY_COUNT = 10;
export const DUEL_SECONDS = 60;

export const CHAPTERS: Chapter[] = [
  { id: "warmup", name: "口算热身", blurb: "百以内加减，表内乘除", term: "准备" },
  { id: "wan", name: "万以内", blurb: "加、减，进位与退位", term: "上册" },
  { id: "bei", name: "认识倍", blurb: "几倍、求一个数的几倍", term: "上册" },
  { id: "mul1", name: "乘一位数", blurb: "多位数 × 一位数", term: "上册" },
  { id: "div1", name: "除一位数", blurb: "除数是一位数，含余数", term: "下册" },
  { id: "mul2", name: "乘两位数", blurb: "两位数 × 两位数", term: "下册" },
  { id: "peri", name: "周长", blurb: "长方形与正方形的周长", term: "上册" },
  { id: "area", name: "面积", blurb: "铺满，平方厘米与平方米", term: "下册" },
  { id: "time", name: "时间日历", blurb: "时分秒，年、月、日", term: "上·下" },
  { id: "frac", name: "分数小数", blurb: "初步认识分数与小数", term: "上·下" },
  { id: "dir", name: "位置方向", blurb: "东南西北，左转右转", term: "下册" },
  { id: "stat", name: "简单统计", blurb: "合计、比较、相差多少", term: "下册" },
];

export function chapterById(id: string): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0]!;
}

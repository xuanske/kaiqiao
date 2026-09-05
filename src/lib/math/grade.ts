import type { Question } from "./types.ts";

const FW_DIGIT = /[\uFF10-\uFF19]/g;

export function normalizeAnswer(raw: string): string {
  let s = raw
    .replace(FW_DIGIT, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 48))
    .replace(/\s+/g, "")
    .replace(/余数/g, "余")
    .replace(/小时/g, "时")
    .replace(/分钟/g, "分")
    .replace(/秒钟/g, "秒")
    .replace(/：/g, ":");
  if (/^\d+:\d+$/.test(s)) {
    const [h, m] = s.split(":");
    s = `${Number(h)}时${Number(m)}分`;
  }
  s = s.replace(/^0+(\d)/, "$1");
  return s;
}

export function isCorrect(question: Question, input: string): boolean {
  const want = normalizeAnswer(question.answer);
  const got = normalizeAnswer(input);
  if (!got) return false;
  if (got === want) return true;
  const nw = Number(want);
  const ng = Number(got);
  if (Number.isFinite(nw) && Number.isFinite(ng) && nw === ng) return true;
  return false;
}

export function starsFor(correct: number, total: number, avgMs: number): number {
  if (total <= 0) return 0;
  const acc = correct / total;
  if (acc >= 1 && avgMs <= 12_000) return 3;
  if (acc >= 0.85) return 2;
  if (acc >= 0.6) return 1;
  return 0;
}

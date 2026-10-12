import { CHAPTERS } from "./chapters.ts";
import { isSkillId } from "./skills.ts";
import type { Grade, SkillStat, WrongItem } from "./types.ts";

export const SAVE_KEY = "kaiqiao.save.v1";
export const SAVE_VERSION = 3;
export const MAX_BACKUP_BYTES = 1_000_000;
export type PersistShape = {
  version: number;
  selectedGrade: Grade;
  dailyByGrade: Record<string, string>;
  stars: Record<string, number>;
  xp: number;
  streak: number;
  lastPlayDate: string;
  lastDaily: string;
  wrong: WrongItem[];
  stats: { answered: number; correct: number };
  muted: boolean;
  skillStats: Record<string, SkillStat>;
  sprintBest: number;
};

export const emptyPersist = (): PersistShape => ({
  version: SAVE_VERSION, selectedGrade: 3, dailyByGrade: {}, stars: {}, xp: 0,
  streak: 0, lastPlayDate: "", lastDaily: "", wrong: [],
  stats: { answered: 0, correct: 0 }, muted: false, skillStats: {}, sprintBest: 0,
});

function record(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function count(x: unknown, max = Number.MAX_SAFE_INTEGER): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x <= max;
}
function text(x: unknown, limit = 2000): x is string {
  return typeof x === "string" && x.length <= limit;
}
function stamp(x: unknown): x is string {
  if (x === "") return true;
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const date = new Date(`${x}T12:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === x;
}
function invalid(): never { throw new Error("存档格式不正确，原有记录未被替换。"); }

/** Validate before applying. v1/v2 saves retain all supported historical fields. */
export function parseSave(value: unknown): PersistShape {
  if (!record(value) || !count(value.version, SAVE_VERSION) || value.version < 1) return invalid();
  const out = emptyPersist();
  if (!record(value.stars) || !Array.isArray(value.wrong) || !record(value.stats)) return invalid();
  if (!count(value.xp) || !count(value.streak) || !stamp(value.lastPlayDate) || !stamp(value.lastDaily) || typeof value.muted !== "boolean") return invalid();
  out.xp = value.xp; out.streak = value.streak;
  out.lastPlayDate = value.lastPlayDate; out.lastDaily = value.lastDaily; out.muted = value.muted;
  const known = new Set(CHAPTERS.map((c) => c.id));
  for (const [key, n] of Object.entries(value.stars)) {
    const [chapter, level, extra] = key.split(":");
    if (!known.has(chapter) || !/^[1-8]$/.test(level ?? "") || extra !== undefined || !count(n, 3)) return invalid();
    out.stars[key] = n;
  }
  if (!count(value.stats.answered) || !count(value.stats.correct, value.stats.answered)) return invalid();
  out.stats = { answered: value.stats.answered, correct: value.stats.correct };
  if (value.wrong.length > 40) return invalid();
  for (const w of value.wrong) {
    if (!record(w) || !text(w.prompt) || !w.prompt.trim() || !text(w.answer, 100) || !w.answer.trim() || !text(w.explain) || !text(w.given, 100) || !text(w.chapterId, 30) || !known.has(w.chapterId) || !count(w.at)) return invalid();
    if (w.mode !== undefined && w.mode !== "keypad" && w.mode !== "choice") return invalid();
    if (w.keypad !== undefined && !["int", "dec", "remainder"].includes(String(w.keypad))) return invalid();
    if (w.trap !== undefined && !text(w.trap)) return invalid();
    if (w.skill !== undefined && (typeof w.skill !== "string" || !isSkillId(w.skill))) return invalid();
    if (w.choices !== undefined && (!Array.isArray(w.choices) || w.choices.length < 2 || w.choices.length > 4 || !w.choices.every((c) => text(c, 100)) || !w.choices.includes(w.answer))) return invalid();
    if (w.mode === "choice" && !w.choices) return invalid();
    out.wrong.push({ prompt: w.prompt, answer: w.answer, explain: w.explain, given: w.given, chapterId: w.chapterId, at: w.at,
      mode: w.mode as WrongItem["mode"], keypad: w.keypad as WrongItem["keypad"], choices: w.choices as string[] | undefined,
      skill: w.skill as string | undefined, trap: w.trap as string | undefined });
  }
  if (value.skillStats !== undefined) {
    if (!record(value.skillStats)) return invalid();
    for (const [id, s] of Object.entries(value.skillStats)) {
      if (!isSkillId(id) || !record(s) || !count(s.seen) || !count(s.correct, s.seen) || typeof s.sumMs !== "number" || !Number.isFinite(s.sumMs) || s.sumMs < 0) return invalid();
      out.skillStats[id] = { seen: s.seen, correct: s.correct, sumMs: s.sumMs };
    }
  }
  if (value.sprintBest !== undefined) {
    if (!count(value.sprintBest)) return invalid();
    out.sprintBest = value.sprintBest;
  }
  if (value.selectedGrade !== undefined) {
    if (!count(value.selectedGrade, 6) || value.selectedGrade < 1) return invalid();
    out.selectedGrade = value.selectedGrade as Grade;
  }
  if (value.dailyByGrade !== undefined) {
    if (!record(value.dailyByGrade)) return invalid();
    for (const [grade, date] of Object.entries(value.dailyByGrade)) {
      if (!/^[1-6]$/.test(grade) || !stamp(date)) return invalid();
      out.dailyByGrade[grade] = date;
    }
  }
  return out;
}

export function exportBackup(data: PersistShape): string {
  return JSON.stringify({ app: "kaiqiao", format: 1, exportedAt: new Date().toISOString(), data: parseSave(data) }, null, 2);
}
export function importBackup(raw: string): PersistShape {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error("备份超过 1 MB，请选择开窍导出的 JSON 文件。");
  let backup: unknown;
  try { backup = JSON.parse(raw); } catch { throw new Error("文件不是有效的 JSON 备份。"); }
  if (!record(backup) || backup.app !== "kaiqiao" || backup.format !== 1) throw new Error("请选择开窍导出的备份文件。");
  return parseSave(backup.data);
}

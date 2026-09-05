import { CHAPTERS, LEVELS_PER_CHAPTER } from "./chapters.ts";

export function starKey(chapterId: string, level: number): string {
  return `${chapterId}:${level}`;
}

export function totalStars(stars: Record<string, number>): number {
  return Object.values(stars).reduce((n, s) => n + s, 0);
}

export function chapterStarSum(stars: Record<string, number>, chapterId: string): number {
  let n = 0;
  for (let level = 1; level <= LEVELS_PER_CHAPTER; level += 1) {
    n += stars[starKey(chapterId, level)] ?? 0;
  }
  return n;
}

export function clearedLevels(stars: Record<string, number>, chapterId: string): number {
  let n = 0;
  for (let level = 1; level <= LEVELS_PER_CHAPTER; level += 1) {
    if ((stars[starKey(chapterId, level)] ?? 0) >= 1) n += 1;
  }
  return n;
}

export function isChapterUnlocked(stars: Record<string, number>, chapterId: string): boolean {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) return true;
  const same = CHAPTERS.filter((c) => c.grade === chapter.grade);
  const index = same.findIndex((c) => c.id === chapterId);
  if (index <= 0) return true;
  const prev = same[index - 1];
  if (!prev) return true;
  return clearedLevels(stars, prev.id) >= 3;
}

export function isLevelUnlocked(
  stars: Record<string, number>,
  chapterId: string,
  level: number,
): boolean {
  if (!isChapterUnlocked(stars, chapterId)) return false;
  if (level <= 1) return true;
  return (stars[starKey(chapterId, level - 1)] ?? 0) >= 1;
}

export function nextCampaign(stars: Record<string, number>): { chapterId: string; level: number } {
  const passes: Array<(c: (typeof CHAPTERS)[number]) => boolean> = [
    (c) => chapterStarSum(stars, c.id) > 0,
    () => true,
  ];
  for (const pred of passes) {
    for (const chapter of CHAPTERS) {
      if (!pred(chapter)) continue;
      if (!isChapterUnlocked(stars, chapter.id)) continue;
      for (let level = 1; level <= LEVELS_PER_CHAPTER; level += 1) {
        if ((stars[starKey(chapter.id, level)] ?? 0) < 1 && isLevelUnlocked(stars, chapter.id, level)) {
          return { chapterId: chapter.id, level };
        }
      }
    }
  }
  return { chapterId: CHAPTERS[0]!.id, level: 1 };
}

export function unlockedChapterIds(stars: Record<string, number>): string[] {
  return CHAPTERS.filter((c) => isChapterUnlocked(stars, c.id)).map((c) => c.id);
}

export function todayStamp(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftStamp(stamp: string, days: number): string {
  const [y, m, d] = stamp.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  return todayStamp(dt);
}

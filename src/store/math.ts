import { create } from "zustand";
import { DAILY_COUNT, DRILL_COUNT, QUESTIONS_PER_LEVEL, SPRINT_COUNT, SPRINT_SECONDS } from "@/lib/math/chapters";
import { isCorrect, starsFor } from "@/lib/math/grade";
import {
  makeDailySet,
  makeLevelSet,
  makeMixedSet,
  makeQuestion,
  makeReviewSet,
} from "@/lib/math/generate";
import {
  nextCampaign,
  shiftStamp,
  starKey,
  todayStamp,
  unlockedChapterIds,
} from "@/lib/math/progress";
import { randomRng } from "@/lib/math/rng";
import { SKILL_DRILL, inferSkill, isSkillId, touchSkill, type SkillId } from "@/lib/math/skills";
import type { AnswerLog, PlayKind, Question, Screen, SkillStat, WrongItem } from "@/lib/math/types";

const SAVE_KEY = "kaiqiao.save.v1";
const SAVE_VERSION = 2;

type PersistShape = {
  version: number;
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

type Session = {
  kind: PlayKind;
  chapterId?: string;
  level?: number;
  questions: Question[];
  index: number;
  combo: number;
  maxCombo: number;
  logs: AnswerLog[];
  shownAt: number;
  startedAt: number;
  feedback: null | { ok: boolean; given: string };
  retried: boolean;
  skill?: SkillId;
};

type Duel = {
  remain: number;
  npcScore: number;
  npcAcc: number;
  npcDelay: number;
};

type MathState = PersistShape & {
  screen: Screen;
  session: Session | null;
  duel: Duel | null;
  sprintRemain: number;
  lastStars: number;
  hydrate: () => void;
  persist: () => void;
  setMuted: (muted: boolean) => void;
  go: (screen: Screen) => void;
  startLevel: (chapterId: string, level: number) => void;
  startDaily: () => void;
  startReview: () => void;
  startDuel: () => void;
  startSprint: () => void;
  startDrill: (skill?: SkillId) => void;
  submit: (given: string) => boolean;
  advance: () => void;
  tickDuel: (dt: number) => void;
  tickSprint: (dt: number) => void;
  abandon: () => void;
  clearWrong: () => void;
};

const emptyPersist = (): PersistShape => ({
  version: SAVE_VERSION,
  stars: {},
  xp: 0,
  streak: 0,
  lastPlayDate: "",
  lastDaily: "",
  wrong: [],
  stats: { answered: 0, correct: 0 },
  muted: false,
  skillStats: {},
  sprintBest: 0,
});

function readSave(): PersistShape {
  if (typeof localStorage === "undefined") return emptyPersist();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptyPersist();
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    return { ...emptyPersist(), ...parsed, version: SAVE_VERSION };
  } catch {
    return emptyPersist();
  }
}

function writeSave(data: PersistShape) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    /* quota */
  }
}

function slicePersist(s: PersistShape): PersistShape {
  return {
    version: SAVE_VERSION,
    stars: s.stars,
    xp: s.xp,
    streak: s.streak,
    lastPlayDate: s.lastPlayDate,
    lastDaily: s.lastDaily,
    wrong: s.wrong,
    stats: s.stats,
    muted: s.muted,
    skillStats: s.skillStats,
    sprintBest: s.sprintBest,
  };
}

function touchStreak(s: PersistShape): PersistShape {
  const today = todayStamp();
  if (s.lastPlayDate === today) return s;
  const streak = s.lastPlayDate === shiftStamp(today, -1) ? s.streak + 1 : 1;
  return { ...s, lastPlayDate: today, streak };
}

function pushWrong(list: WrongItem[], item: WrongItem): WrongItem[] {
  const next = [item, ...list.filter((w) => w.prompt !== item.prompt)];
  return next.slice(0, 40);
}

function closeSession(s: MathState, session: Session): Partial<MathState> {
  const correct = session.logs.filter((l) => l.ok).length;
  const avg =
    session.logs.length === 0
      ? 0
      : session.logs.reduce((n, l) => n + l.ms, 0) / session.logs.length;
  const earned = session.kind === "campaign" ? starsFor(correct, session.logs.length, avg) : 0;
  let stars = s.stars;
  if (session.kind === "campaign" && session.chapterId && session.level) {
    const key = starKey(session.chapterId, session.level);
    const prev = stars[key] ?? 0;
    if (earned > prev) stars = { ...stars, [key]: earned };
  }
  let lastDaily = s.lastDaily;
  const sprintBest = session.kind === "sprint" ? Math.max(s.sprintBest, correct) : s.sprintBest;
  let next: PersistShape = {
    ...slicePersist(s),
    stars,
    sprintBest,
    xp: s.xp + correct * 10 + session.maxCombo * 2,
    stats: {
      answered: s.stats.answered + session.logs.length,
      correct: s.stats.correct + correct,
    },
  };
  if (session.kind === "daily") lastDaily = todayStamp();
  next = touchStreak({ ...next, lastDaily });
  return {
    ...next,
    lastStars: earned,
    screen: "result",
    session: { ...session, feedback: null },
    sprintRemain: 0,
  };
}

function newSession(kind: PlayKind, questions: Question[], extra?: Partial<Session>): Session {
  const now = performance.now();
  return {
    kind,
    questions,
    index: 0,
    combo: 0,
    maxCombo: 0,
    logs: [],
    shownAt: now,
    startedAt: now,
    feedback: null,
    retried: false,
    ...extra,
  };
}

export const useMath = create<MathState>((set, get) => ({
  ...emptyPersist(),
  screen: "home",
  session: null,
  duel: null,
  sprintRemain: 0,
  lastStars: 0,
  hydrate: () => set(readSave()),
  persist: () => writeSave(slicePersist(get())),
  setMuted: (muted) => {
    set({ muted });
    get().persist();
  },
  go: (screen) => set({ screen }),
  startLevel: (chapterId, level) => {
    const questions = makeLevelSet(chapterId, level, QUESTIONS_PER_LEVEL, randomRng());
    set({
      screen: "play",
      lastStars: 0,
      session: newSession("campaign", questions, { chapterId, level }),
      duel: null,
      sprintRemain: 0,
    });
  },
  startDaily: () => {
    const ids = unlockedChapterIds(get().stars);
    const stats = get().stats;
    const acc = stats.answered ? stats.correct / stats.answered : 0.5;
    set({
      screen: "play",
      lastStars: 0,
      session: newSession("daily", makeDailySet(ids, get().wrong, DAILY_COUNT, randomRng(), acc)),
      duel: null,
      sprintRemain: 0,
    });
  },
  startReview: () => {
    const wrong = get().wrong;
    if (!wrong.length) {
      set({ screen: "review" });
      return;
    }
    set({
      screen: "play",
      lastStars: 0,
      session: newSession("review", makeReviewSet(wrong, randomRng())),
      duel: null,
      sprintRemain: 0,
    });
  },
  startDuel: () => {
    const ids = unlockedChapterIds(get().stars);
    const q = makeMixedSet(ids, 40, randomRng());
    set({
      screen: "duel",
      lastStars: 0,
      session: newSession("duel", q),
      duel: { remain: 60, npcScore: 0, npcAcc: 0, npcDelay: 2.6 },
      sprintRemain: 0,
    });
  },
  startSprint: () => {
    const q = makeMixedSet(["warmup", "wan"], SPRINT_COUNT, randomRng());
    set({
      screen: "play",
      lastStars: 0,
      session: newSession("sprint", q),
      duel: null,
      sprintRemain: SPRINT_SECONDS,
    });
  },
  startDrill: (skill) => {
    const rows = get().skillStats;
    const picked =
      skill ??
      (Object.entries(rows)
        .filter((e) => isSkillId(e[0]) && e[1].seen >= 3)
        .sort((a, b) => a[1].correct / a[1].seen - b[1].correct / b[1].seen)[0]?.[0] as SkillId | undefined);
    const target = picked && SKILL_DRILL[picked] ? SKILL_DRILL[picked] : { chapterId: "wan", level: 4 };
    const questions = makeLevelSet(target.chapterId, target.level, DRILL_COUNT, randomRng());
    set({
      screen: "play",
      lastStars: 0,
      session: newSession("drill", questions, { chapterId: target.chapterId, level: target.level, skill: picked }),
      duel: null,
      sprintRemain: 0,
    });
  },
  submit: (given) => {
    const session = get().session;
    if (!session || session.feedback) return false;
    const q = session.questions[session.index];
    if (!q) return false;
    const ok = isCorrect(q, given);
    const ms = Math.max(200, performance.now() - session.shownAt);
    const combo = ok ? session.combo + 1 : 0;
    const skill = q.skill ?? inferSkill(q);
    const logs = [...session.logs, { prompt: q.prompt, given, ok, ms, skill }];
    let wrong = get().wrong;
    if (!ok) {
      wrong = pushWrong(wrong, {
        prompt: q.prompt,
        answer: q.answer,
        explain: q.explain,
        chapterId: q.chapterId,
        given,
        at: Date.now(),
        trap: q.trap,
        skill,
        mode: q.mode,
        choices: q.choices,
        keypad: q.keypad,
      });
    } else {
      wrong = wrong.filter((w) => w.prompt !== q.prompt);
    }
    const skillStats = touchSkill(get().skillStats, skill, ok, ms);
    set({
      wrong,
      skillStats,
      session: {
        ...session,
        combo,
        maxCombo: Math.max(session.maxCombo, combo),
        logs,
        feedback: { ok, given },
      },
    });
    get().persist();
    return ok;
  },
  advance: () => {
    const s = get();
    const session = s.session;
    if (!session) return;
    const nextIndex = session.index + 1;
    if (session.kind === "duel") {
      if (!s.duel || s.duel.remain <= 0) {
        set({ screen: "result", session: { ...session, feedback: null } });
        return;
      }
      set({
        session: {
          ...session,
          index: nextIndex % session.questions.length,
          shownAt: performance.now(),
          feedback: null,
        },
      });
      return;
    }
    if (session.kind === "sprint") {
      if (s.sprintRemain <= 0 || nextIndex >= session.questions.length) {
        const patch = closeSession(s, session);
        set(patch);
        get().persist();
        return;
      }
      set({
        session: {
          ...session,
          index: nextIndex,
          shownAt: performance.now(),
          feedback: null,
        },
      });
      return;
    }
    if (nextIndex >= session.questions.length) {
      if (!session.retried) {
        const missed = session.logs.filter((l) => !l.ok);
        const extras = missed.map((m) => {
          const src = session.questions.find((q) => q.prompt === m.prompt);
          return makeQuestion(src?.chapterId ?? "warmup", session.level ?? 4, randomRng());
        });
        if (extras.length > 0) {
          set({
            session: {
              ...session,
              questions: [...session.questions, ...extras],
              index: nextIndex,
              shownAt: performance.now(),
              feedback: null,
              retried: true,
            },
          });
          return;
        }
      }
      const patch = closeSession(s, session);
      set(patch);
      get().persist();
      return;
    }
    set({
      session: {
        ...session,
        index: nextIndex,
        shownAt: performance.now(),
        feedback: null,
      },
    });
  },
  tickDuel: (dt) => {
    const s = get();
    if (!s.duel || !s.session || s.screen !== "duel") return;
    const remain = Math.max(0, s.duel.remain - dt);
    let npcScore = s.duel.npcScore;
    let npcAcc = s.duel.npcAcc + dt;
    let npcDelay = s.duel.npcDelay;
    if (remain > 0 && npcAcc >= npcDelay) {
      npcAcc = 0;
      npcDelay = 2.1 + Math.random() * 1.4;
      if (Math.random() < 0.78) npcScore += 1;
    }
    if (remain <= 0) {
      const session = s.session;
      const patch = closeSession(
        { ...s, duel: { ...s.duel, remain: 0, npcScore } },
        session,
      );
      set({
        ...patch,
        duel: { remain: 0, npcScore, npcAcc: 0, npcDelay },
      });
      get().persist();
      return;
    }
    set({ duel: { remain, npcScore, npcAcc, npcDelay } });
  },
  tickSprint: (dt) => {
    const s = get();
    if (!s.session || s.session.kind !== "sprint" || s.screen !== "play") return;
    const remain = Math.max(0, s.sprintRemain - dt);
    if (remain <= 0) {
      const patch = closeSession({ ...s, sprintRemain: 0 }, s.session);
      set(patch);
      get().persist();
      return;
    }
    set({ sprintRemain: remain });
  },
  abandon: () => {
    set({ screen: "home", session: null, duel: null, sprintRemain: 0 });
    get().persist();
  },
  clearWrong: () => {
    set({ wrong: [] });
    get().persist();
  },
}));

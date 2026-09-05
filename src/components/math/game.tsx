import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  Lock,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnMath } from "@/components/math/column";
import {
  CHAPTERS,
  DUEL_SECONDS,
  LEVELS_PER_CHAPTER,
  SPRINT_SECONDS,
  chapterById,
} from "@/lib/math/chapters";
import { parseColumn } from "@/lib/math/column";
import { unlockAudio, playBad, playCombo, playOk, playTap, playWin } from "@/lib/math/audio";
import {
  chapterStarSum,
  clearedLevels,
  isChapterUnlocked,
  isLevelUnlocked,
  nextCampaign,
  starKey,
  totalStars,
} from "@/lib/math/progress";
import { SKILL_HINT, SKILL_LABEL, isSkillId, oralPace, tonightPlan, weakSkills } from "@/lib/math/skills";
import { hushSpeak, speakPrompt } from "@/lib/math/speak";
import { cn } from "@/lib/utils";
import { useMath } from "@/store/math";
import { Keypad } from "./keypad";
import { Mascot, type Mood } from "./mascot";

export function Game() {
  const screen = useMath((s) => s.screen);
  const hydrate = useMath((s) => s.hydrate);
  const persist = useMath((s) => s.persist);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [persist]);

  useEffect(() => () => hushSpeak(), []);

  return (
    <div className="flex min-h-dvh justify-center bg-background text-foreground">
      <div className="flex min-h-dvh w-full max-w-sm flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {screen === "home" ? <Home /> : null}
        {screen === "map" ? <Map /> : null}
        {screen === "play" ? <Play /> : null}
        {screen === "duel" ? <Duel /> : null}
        {screen === "result" ? <Result /> : null}
        {screen === "review" ? <Review /> : null}
        {screen === "report" ? <Report /> : null}
      </div>
    </div>
  );
}

function Home() {
  const stars = useMath((s) => s.stars);
  const streak = useMath((s) => s.streak);
  const xp = useMath((s) => s.xp);
  const muted = useMath((s) => s.muted);
  const setMuted = useMath((s) => s.setMuted);
  const go = useMath((s) => s.go);
  const startDaily = useMath((s) => s.startDaily);
  const startDuel = useMath((s) => s.startDuel);
  const startReview = useMath((s) => s.startReview);
  const startSprint = useMath((s) => s.startSprint);
  const wrong = useMath((s) => s.wrong);
  const next = nextCampaign(stars);
  const hasProgress = totalStars(stars) > 0;

  const tap = () => {
    unlockAudio();
    if (!muted) playTap();
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <div className="font-display text-sm tracking-widest">开窍</div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "打开声音" : "关闭声音"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </header>

      <div className="mt-6 kai-rise">
        <Mascot mood="idle" />
        <h1 className="mt-3 text-center font-display text-4xl tracking-tight">开窍</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">错了讲清为什么，再出同类题</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="打卡" value={`${streak} 天`} />
        <Stat label="星" value={String(totalStars(stars))} />
        <Stat label="悟性" value={String(xp)} />
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-end gap-2">
        <Button
          size="lg"
          className="h-14 rounded-2xl bg-primary text-primary-foreground"
          onClick={() => {
            tap();
            go("map");
          }}
        >
          {hasProgress ? `继续 · ${chapterById(next.chapterId).name} ${next.level} 关` : "开始闯关"}
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            className="h-12 rounded-2xl px-2"
            onClick={() => {
              tap();
              startSprint();
            }}
          >
            <Timer className="size-4" />
            冲刺
          </Button>
          <Button
            variant="secondary"
            className="h-12 rounded-2xl px-2"
            onClick={() => {
              tap();
              startDaily();
            }}
          >
            每日
          </Button>
          <Button
            variant="secondary"
            className="h-12 rounded-2xl px-2"
            onClick={() => {
              tap();
              startDuel();
            }}
          >
            <Zap className="size-4" />
            对决
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            className="rounded-2xl text-muted-foreground"
            onClick={() => {
              tap();
              if (wrong.length) startReview();
              else go("review");
            }}
          >
            <BookOpen className="size-4" />
            错题 {wrong.length ? wrong.length : ""}
          </Button>
          <Button
            variant="ghost"
            className="rounded-2xl text-muted-foreground"
            onClick={() => {
              tap();
              go("report");
            }}
          >
            <BarChart3 className="size-4" />
            学情
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-3 py-3 text-center">
      <div className="font-display text-xl tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1 text-sm text-muted-foreground"
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  );
}

function Map() {
  const stars = useMath((s) => s.stars);
  const go = useMath((s) => s.go);
  const startLevel = useMath((s) => s.startLevel);
  const muted = useMath((s) => s.muted);
  const next = nextCampaign(stars);

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="开窍" />
      <h2 className="font-display text-2xl tracking-tight">闯关地图</h2>
      <p className="mt-1 text-sm text-muted-foreground">过三关再开下一章。每关八题。</p>
      <ol className="mt-4 flex flex-col gap-3 pb-4">
        {CHAPTERS.map((chapter, index) => {
          const open = isChapterUnlocked(stars, chapter.id);
          const sum = chapterStarSum(stars, chapter.id);
          const done = clearedLevels(stars, chapter.id);
          return (
            <li key={chapter.id} className="rounded-2xl bg-secondary p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")} · {chapter.term}
                  </div>
                  <div className="font-display text-lg leading-tight">{chapter.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{chapter.blurb}</div>
                </div>
                {open ? (
                  <div className="text-xs tabular-nums text-accent">{done}/{LEVELS_PER_CHAPTER}</div>
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => {
                  const level = i + 1;
                  const got = stars[starKey(chapter.id, level)] ?? 0;
                  const unlocked = open && isLevelUnlocked(stars, chapter.id, level);
                  const current = next.chapterId === chapter.id && next.level === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        if (!muted) playTap();
                        startLevel(chapter.id, level);
                      }}
                      className={cn(
                        "flex h-9 w-9 flex-col items-center justify-center rounded-xl text-xs tabular-nums transition-[transform,background-color] duration-150 active:not-disabled:scale-95 disabled:opacity-35",
                        current ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
                      )}
                    >
                      <span>{level}</span>
                      <span className="h-1 w-5 overflow-hidden rounded-full bg-background/30">
                        <span
                          className="block h-full bg-accent"
                          style={{ width: `${(got / 3) * 100}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="sr-only">本章 {sum} 星</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function playTitle(kind: string, chapterId?: string, level?: number, skill?: string): string {
  if (kind === "daily") return "每日一练";
  if (kind === "review") return "错题回炉";
  if (kind === "sprint") return "口算冲刺";
  if (kind === "drill") return skill && isSkillId(skill) ? `对症 · ${SKILL_LABEL[skill]}` : "对症练";
  return `${chapterById(chapterId ?? "warmup").name} · ${level ?? 1} 关`;
}

function Play() {
  const session = useMath((s) => s.session);
  const submit = useMath((s) => s.submit);
  const advance = useMath((s) => s.advance);
  const go = useMath((s) => s.go);
  const muted = useMath((s) => s.muted);
  const sprintRemain = useMath((s) => s.sprintRemain);
  const tickSprint = useMath((s) => s.tickSprint);
  const [draft, setDraft] = useState("");
  const [countIn, setCountIn] = useState(3);

  const q = session?.questions[session.index];
  const feedback = session?.feedback ?? null;
  const isSprint = session?.kind === "sprint";

  useEffect(() => {
    setCountIn(isSprint ? 0 : 3);
  }, [session?.startedAt, isSprint]);

  useEffect(() => {
    if (countIn <= 0) return;
    const t = window.setTimeout(() => setCountIn((n) => n - 1), 650);
    return () => window.clearTimeout(t);
  }, [countIn]);

  useEffect(() => {
    if (countIn !== 0) return;
    const cur = useMath.getState().session;
    if (cur && cur.index === 0 && !cur.feedback) {
      useMath.setState({ session: { ...cur, shownAt: performance.now() } });
    }
  }, [countIn]);

  useEffect(() => {
    setDraft("");
    hushSpeak();
  }, [session?.index, session?.questions]);

  useEffect(() => {
    if (!feedback) return;
    const wait = feedback.ok ? 900 : 2200;
    const t = window.setTimeout(() => advance(), wait);
    return () => window.clearTimeout(t);
  }, [feedback, advance]);

  useEffect(() => {
    if (!isSprint) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      tickSprint(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isSprint, tickSprint]);

  if (!session || !q) return null;

  if (countIn > 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 kai-pop">
        <Mascot mood="idle" />
        <p className="text-sm text-muted-foreground">准备</p>
        <p className="font-display text-6xl tabular-nums">{countIn}</p>
      </div>
    );
  }

  const onSubmit = (given: string) => {
    unlockAudio();
    const ok = submit(given);
    if (muted) return;
    if (ok) {
      const combo = useMath.getState().session?.combo ?? 0;
      if (combo >= 3) playCombo(combo);
      else playOk();
    } else playBad();
  };

  const mood: Mood = feedback ? (feedback.ok ? "happy" : "sad") : "think";
  const total = session.questions.length;
  const remain = Math.ceil(sprintRemain);

  return (
    <AskShell
      mood={mood}
      title={playTitle(session.kind, session.chapterId, session.level, session.skill)}
      onBack={() => (session.kind === "sprint" || session.kind === "drill" || session.kind === "daily" ? go("home") : go("map"))}
      progress={isSprint ? `${remain}s` : `${session.index + 1} / ${total}`}
      combo={session.combo}
      qPrompt={q.prompt}
      feedback={feedback}
      explain={q.explain}
      answer={q.answer}
      trap={q.trap}
      skill={q.skill}
      fromWrong={q.fromWrong}
      onSkip={advance}
      extra={
        isSprint ? (
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
            <div
              className="h-full bg-accent transition-[width] duration-100"
              style={{ width: `${(sprintRemain / SPRINT_SECONDS) * 100}%` }}
            />
          </div>
        ) : null
      }
    >
      {q.mode === "choice" ? (
        <div className={cn("grid gap-2", (q.choices?.length ?? 0) > 2 ? "grid-cols-2" : "grid-cols-1")}>
          {(q.choices ?? []).map((c) => {
            const picked = feedback?.given === c;
            return (
              <button
                key={c}
                type="button"
                disabled={!!feedback}
                onClick={() => onSubmit(c)}
                className={cn(
                  "min-h-12 rounded-2xl bg-secondary px-3 py-3 text-sm font-medium leading-snug transition-[transform,background-color] duration-150 active:not-disabled:scale-[0.98] disabled:opacity-100",
                  picked && feedback?.ok && "bg-ok text-paper",
                  picked && feedback && !feedback.ok && "bg-destructive text-destructive-foreground",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex h-12 items-center justify-end rounded-2xl bg-secondary px-4 font-display text-2xl tabular-nums">
            {draft || <span className="text-muted-foreground">?</span>}
          </div>
          <Keypad
            value={draft}
            kind={q.keypad ?? "int"}
            disabled={!!feedback}
            onChange={setDraft}
            onSubmit={() => onSubmit(draft)}
          />
        </div>
      )}
    </AskShell>
  );
}

function Duel() {
  const session = useMath((s) => s.session);
  const duel = useMath((s) => s.duel);
  const submit = useMath((s) => s.submit);
  const advance = useMath((s) => s.advance);
  const tickDuel = useMath((s) => s.tickDuel);
  const go = useMath((s) => s.go);
  const muted = useMath((s) => s.muted);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      tickDuel(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tickDuel]);

  const q = session?.questions[session.index];
  const feedback = session?.feedback ?? null;

  useEffect(() => {
    setDraft("");
  }, [session?.index]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => advance(), feedback.ok ? 420 : 700);
    return () => window.clearTimeout(t);
  }, [feedback, advance]);

  if (!session || !q || !duel) return null;
  const you = session.logs.filter((l) => l.ok).length;
  const remain = Math.ceil(duel.remain);

  const onSubmit = (given: string) => {
    unlockAudio();
    const ok = submit(given);
    if (!muted) {
      if (ok) playOk();
      else playBad();
    }
  };

  return (
    <AskShell
      mood={feedback ? (feedback.ok ? "happy" : "sad") : "think"}
      title="闪电对决"
      onBack={() => go("home")}
      progress={`${remain}s`}
      combo={session.combo}
      qPrompt={q.prompt}
      feedback={feedback}
      explain={q.explain}
      answer={q.answer}
      onSkip={advance}
      extra={
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-secondary px-3 py-2">
            <div className="text-xs text-muted-foreground">你</div>
            <div className="font-display text-xl tabular-nums">{you}</div>
          </div>
          <div className="rounded-xl bg-secondary px-3 py-2 text-right">
            <div className="text-xs text-muted-foreground">窍窍</div>
            <div className="font-display text-xl tabular-nums">{duel.npcScore}</div>
          </div>
        </div>
      }
    >
      <div
        className="mb-3 h-1 overflow-hidden rounded-full bg-secondary"
        aria-hidden
      >
        <div
          className="h-full bg-accent transition-[width] duration-100"
          style={{ width: `${(duel.remain / DUEL_SECONDS) * 100}%` }}
        />
      </div>
      {q.mode === "choice" ? (
        <div className={cn("grid gap-2", (q.choices?.length ?? 0) > 2 ? "grid-cols-2" : "grid-cols-1")}>
          {(q.choices ?? []).map((c) => (
            <button
              key={c}
              type="button"
              disabled={!!feedback}
              onClick={() => onSubmit(c)}
              className="min-h-12 rounded-2xl bg-secondary px-3 py-3 text-sm font-medium"
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex h-12 items-center justify-end rounded-2xl bg-secondary px-4 font-display text-2xl tabular-nums">
            {draft || <span className="text-muted-foreground">?</span>}
          </div>
          <Keypad
            value={draft}
            kind={q.keypad ?? "int"}
            disabled={!!feedback}
            onChange={setDraft}
            onSubmit={() => onSubmit(draft)}
          />
        </div>
      )}
    </AskShell>
  );
}

function AskShell({
  mood,
  title,
  onBack,
  progress,
  combo,
  qPrompt,
  feedback,
  explain,
  answer,
  trap,
  skill,
  fromWrong,
  onSkip,
  extra,
  children,
}: {
  mood: Mood;
  title: string;
  onBack: () => void;
  progress: string;
  combo: number;
  qPrompt: string;
  feedback: null | { ok: boolean; given: string };
  explain: string;
  answer: string;
  trap?: string;
  skill?: string;
  fromWrong?: boolean;
  onSkip: () => void;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const work = !feedback || feedback.ok ? null : parseColumn(qPrompt);
  const skillLabel = isSkillId(skill) ? SKILL_LABEL[skill] : null;
  const hint = isSkillId(skill) ? SKILL_HINT[skill] : null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2">
        <Back onClick={onBack} label={title} />
        <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
          {combo >= 2 ? <span className="text-accent">连击 {combo}</span> : null}
          <span>{progress}</span>
        </div>
      </div>
      <Mascot mood={mood} className="h-24 w-20" />
      {extra ? <div className="mt-1">{extra}</div> : null}
      <div
        className={cn(
          "relative mt-2 rounded-3xl bg-card p-5 text-card-foreground",
          feedback && !feedback.ok && "kai-shake",
          feedback?.ok && "kai-pop",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-xl leading-snug">{qPrompt}</p>
          <button
            type="button"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-card-foreground/50"
            onClick={() => speakPrompt(qPrompt)}
            aria-label="读题"
          >
            <Volume2 className="size-4" />
          </button>
        </div>
        {fromWrong && !feedback ? (
          <p className="mt-2 text-xs text-lantern">上次错过的原题</p>
        ) : null}
        {feedback ? (
          <div className="mt-3">
            <button type="button" onClick={onSkip} className="w-full text-left">
              <p className={cn("text-sm font-medium", feedback.ok ? "text-ok" : "text-destructive")}>
                {feedback.ok ? "答对了" : `正确答案 ${answer}`}
              </p>
              {!feedback.ok && trap ? <p className="mt-1 text-sm text-destructive/80">{trap}</p> : null}
              {!feedback.ok && !trap && hint ? <p className="mt-1 text-sm text-destructive/80">{hint}</p> : null}
              <p className="mt-1 text-sm leading-relaxed text-card-foreground/70">{explain}</p>
              {skillLabel && !feedback.ok ? (
                <p className="mt-1 text-xs text-card-foreground/50">考点 · {skillLabel}</p>
              ) : null}
            </button>
            {work ? <ColumnMath work={work} wrong /> : null}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  );
}

function Result() {
  const session = useMath((s) => s.session);
  const lastStars = useMath((s) => s.lastStars);
  const duel = useMath((s) => s.duel);
  const go = useMath((s) => s.go);
  const startLevel = useMath((s) => s.startLevel);
  const startDaily = useMath((s) => s.startDaily);
  const startDuel = useMath((s) => s.startDuel);
  const startSprint = useMath((s) => s.startSprint);
  const startDrill = useMath((s) => s.startDrill);
  const muted = useMath((s) => s.muted);
  const stars = useMath((s) => s.stars);
  const sprintBest = useMath((s) => s.sprintBest);

  useEffect(() => {
    if (!muted) playWin();
  }, [muted]);

  if (!session) return null;
  const correct = session.logs.filter((l) => l.ok).length;
  const total = session.logs.length;
  const you = correct;
  const npc = duel?.npcScore ?? 0;
  const duelEnd = session.kind === "duel";
  const sprintEnd = session.kind === "sprint";
  const outcome = duelEnd ? (you > npc ? "你赢了" : you < npc ? "窍窍赢了" : "平手") : null;
  const next = nextCampaign(stars);
  const headline = outcome
    ?? (sprintEnd ? (correct >= (sprintBest || correct) && correct > 0 ? "新纪录" : "时间到")
    : lastStars >= 2 ? "开窍了" : lastStars === 1 ? "过关" : total ? "再练一遍" : "时间到");

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="回家" />
      <Mascot mood={duelEnd && you < npc ? "sad" : "happy"} />
      <h2 className="mt-2 text-center font-display text-3xl tracking-tight">{headline}</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {duelEnd ? `你 ${you} · 窍窍 ${npc}` : sprintEnd ? `答对 ${correct} 题 · 最好 ${sprintBest}` : `答对 ${correct} / ${total}`}
      </p>
      {!duelEnd && !sprintEnd && session.kind === "campaign" ? (
        <div className="mt-4 flex justify-center gap-1 text-accent">
          {[1, 2, 3].map((n) => (
            <span key={n} className={cn("inline-block size-3 rounded-full", n > lastStars ? "bg-secondary" : "bg-accent")} />
          ))}
        </div>
      ) : null}
      {session.maxCombo >= 3 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">最高连击 {session.maxCombo}</p>
      ) : null}
      <div className="mt-auto flex flex-col gap-2">
        {session.kind === "campaign" && session.chapterId && session.level ? (
          <Button
            size="lg"
            className="rounded-2xl"
            onClick={() => startLevel(next.chapterId, next.level)}
          >
            下一关
          </Button>
        ) : null}
        {session.kind === "daily" ? (
          <Button size="lg" className="rounded-2xl" onClick={startDaily}>
            再练一组
          </Button>
        ) : null}
        {session.kind === "drill" ? (
          <Button size="lg" className="rounded-2xl" onClick={() => startDrill(session.skill)}>
            再练这组
          </Button>
        ) : null}
        {sprintEnd ? (
          <Button size="lg" className="rounded-2xl" onClick={startSprint}>
            再冲一次
          </Button>
        ) : null}
        {duelEnd ? (
          <Button size="lg" className="rounded-2xl" onClick={startDuel}>
            再对决
          </Button>
        ) : null}
        <Button variant="secondary" className="rounded-2xl" onClick={() => go("map")}>
          回地图
        </Button>
      </div>
    </div>
  );
}

function Review() {
  const wrong = useMath((s) => s.wrong);
  const go = useMath((s) => s.go);
  const startReview = useMath((s) => s.startReview);
  const clearWrong = useMath((s) => s.clearWrong);

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="错题本" />
      <h2 className="font-display text-2xl tracking-tight">错题本</h2>
      <p className="mt-1 text-sm text-muted-foreground">先重做原题，再出同类新题。做对就揭掉。</p>
      {!wrong.length ? (
        <p className="mt-10 text-sm text-muted-foreground">还没有错题。先去闯关。</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {wrong.slice(0, 12).map((w) => (
              <li key={w.at + w.prompt} className="rounded-2xl bg-secondary px-3 py-3">
                <div className="text-sm leading-snug">{w.prompt}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  你写 {w.given} · 应是 {w.answer}
                  {w.skill && isSkillId(w.skill) ? ` · ${SKILL_LABEL[w.skill]}` : ""}
                </div>
                {w.trap ? <div className="mt-1 text-xs text-lantern">{w.trap}</div> : null}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button className="rounded-2xl" onClick={startReview}>
              回炉重做
            </Button>
            <Button variant="ghost" className="rounded-2xl text-muted-foreground" onClick={clearWrong}>
              清空错题
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Report() {
  const stars = useMath((s) => s.stars);
  const stats = useMath((s) => s.stats);
  const streak = useMath((s) => s.streak);
  const xp = useMath((s) => s.xp);
  const go = useMath((s) => s.go);
  const skillStats = useMath((s) => s.skillStats);
  const wrong = useMath((s) => s.wrong);
  const sprintBest = useMath((s) => s.sprintBest);
  const startDrill = useMath((s) => s.startDrill);
  const startSprint = useMath((s) => s.startSprint);
  const startReview = useMath((s) => s.startReview);
  const acc = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const plan = tonightPlan(skillStats, wrong);
  const pace = oralPace(skillStats);
  const weak = weakSkills(skillStats);

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="学情" />
      <h2 className="font-display text-2xl tracking-tight">学情</h2>
      <p className="mt-1 text-sm text-muted-foreground">只存在这台设备上。不比较别人，只看自己哪里还没开窍。</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="累计答题" value={String(stats.answered)} />
        <Stat label="正确率" value={`${acc}%`} />
        <Stat label="打卡" value={`${streak} 天`} />
        <Stat label="悟性" value={String(xp)} />
      </div>
      <div className="mt-4 rounded-2xl bg-secondary px-3 py-3">
        <div className="text-xs text-muted-foreground">今晚怎么练</div>
        <p className="mt-1 text-sm leading-relaxed">{plan.line}</p>
        {sprintBest ? <p className="mt-1 text-xs text-muted-foreground">口算冲刺最好 {sprintBest} 题</p> : null}
        {pace ? <p className="mt-1 text-xs text-muted-foreground">{pace.line}</p> : null}
        <div className="mt-3 flex gap-2">
          {plan.skill ? (
            <Button className="flex-1 rounded-2xl" onClick={() => startDrill(plan.skill)}>
              对症 8 题
            </Button>
          ) : wrong.length ? (
            <Button className="flex-1 rounded-2xl" onClick={startReview}>
              回炉错题
            </Button>
          ) : (
            <Button className="flex-1 rounded-2xl" onClick={startSprint}>
              去冲刺
            </Button>
          )}
        </div>
      </div>
      {weak.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {weak.slice(0, 4).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl bg-secondary px-3 py-2.5 text-left"
                onClick={() => startDrill(row.id)}
              >
                <span className="text-sm">{row.label}</span>
                <span className="text-xs tabular-nums text-lantern">
                  {Math.round(row.acc * 100)}% · {row.seen} 题
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-4 flex flex-col gap-2 pb-4">
        {CHAPTERS.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2.5">
            <span className="text-sm">{c.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {clearedLevels(stars, c.id)}/{LEVELS_PER_CHAPTER} 关 · {chapterStarSum(stars, c.id)} 星
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

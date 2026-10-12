import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { useMath } from "./math.ts";
import { CHAPTERS } from "../lib/math/chapters.ts";
import { makeQuestion } from "../lib/math/generate.ts";
import { mulberry32 } from "../lib/math/rng.ts";
import { emptyPersist, SAVE_KEY } from "../lib/math/save.ts";
import type { Grade } from "../lib/math/types.ts";

let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  useMath.setState({ ...useMath.getInitialState(), ...emptyPersist() }, true);
});
const state = () => useMath.getState();
function answer(ok = true) {
  const s = state().session!;
  state().submit(ok ? s.questions[s.index].answer : "错误答案");
}
function finish() {
  let guard = 100;
  while (state().screen === "play" && guard-- > 0) { answer(); state().advance(); }
  assert.ok(guard > 0);
}

describe("练习状态与计分", () => {
  it("每日、限时、对决、对症练都使用所选年级", () => {
    for (const grade of [1, 2, 3, 4, 5, 6] as Grade[]) {
      state().setGrade(grade);
      for (const start of [state().startDaily, state().startSprint, state().startDuel, () => state().startDrill("add-carry")]) {
        start();
        assert.ok(state().session!.questions.length > 0);
        assert.ok(state().session!.questions.every((q) => CHAPTERS.find((c) => c.id === q.chapterId)?.grade === grade));
      }
    }
  });
  it("不能跳过未作答题、提交空白或重复提交", () => {
    state().startDaily();
    state().advance();
    assert.equal(state().session!.index, 0);
    assert.equal(state().submit("  "), false);
    assert.equal(state().stats.answered, 0);
    answer(); answer();
    assert.equal(state().stats.answered, 1);
  });
  it("中途退出保留已答记录，但不计通关、经验、打卡", () => {
    state().startLevel("warmup", 1);
    answer(false);
    state().go("home");
    assert.equal(state().stats.answered, 1);
    assert.equal(state().wrong.length, 1);
    assert.equal(state().session, null);
    assert.equal(state().streak, 0);
    assert.equal(state().xp, 0);
    assert.deepEqual(state().stars, {});
    state().hydrate();
    assert.equal(state().stats.answered, 1);
  });
  it("通关仅结算一次，成绩页不能继续提交或推进", () => {
    state().startLevel("warmup", 1); finish();
    assert.equal(state().stats.answered, 8);
    assert.equal(state().streak, 1);
    assert.ok(state().stars["warmup:1"] > 0);
    const xp = state().xp;
    state().advance(); state().advance(); answer();
    assert.equal(state().xp, xp);
    assert.equal(state().stats.answered, 8);
  });
  it("每日完成按年级记录，换年级不会冒充完成", () => {
    state().setGrade(1); state().startDaily(); finish();
    assert.ok(state().dailyByGrade["1"]);
    state().setGrade(5);
    assert.equal(state().dailyByGrade["5"], undefined);
  });
  it("空白限时结束不计打卡，大时间间隔立即结算且不重复", () => {
    state().startSprint(); state().tickSprint(500);
    assert.equal(state().screen, "result");
    assert.equal(state().streak, 0);
    state().startSprint(); answer(); state().tickSprint(500);
    const xp = state().xp;
    state().tickSprint(500); state().advance();
    assert.equal(state().stats.answered, 1);
    assert.equal(state().xp, xp);
    assert.equal(state().streak, 1);
  });
  it("锁住的章节不会被直接启动", () => {
    state().startLevel("wan", 8);
    assert.equal(state().session, null);
  });
  it("清错题和回炉只处理当前年级", () => {
    const q1 = makeQuestion("g1add", 1, mulberry32(1));
    const q5 = makeQuestion("g5pct", 1, mulberry32(2));
    useMath.setState({ wrong: [{ ...q1, given: "x", at: 1 }, { ...q5, given: "x", at: 2 }], selectedGrade: 5 });
    state().startReview();
    assert.ok(state().session!.questions.every((q) => CHAPTERS.find((c) => c.id === q.chapterId)?.grade === 5));
    state().go("home"); state().clearWrong();
    assert.equal(state().wrong.length, 1);
    assert.equal(state().wrong[0].chapterId, "g1add");
  });
});

describe("存储故障保护", () => {
  it("损坏原存档不会被自动覆盖", () => {
    storage.set(SAVE_KEY, "broken-data"); state().hydrate();
    assert.equal(state().storageBlocked, true);
    state().setGrade(4);
    assert.equal(storage.get(SAVE_KEY), "broken-data");
  });
  it("写入失败会提示，恢复失败保持内存原进度", () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      setItem: () => { throw new Error("QuotaExceededError"); }, getItem: () => null,
    } });
    useMath.setState({ xp: 90 }); state().persist();
    assert.ok(state().storageError);
    assert.equal(state().restore(emptyPersist()), false);
    assert.equal(state().xp, 90);
  });
  it("恢复会取消当前练习，并存入校验后的数据", () => {
    state().startDaily();
    assert.equal(state().restore({ ...emptyPersist(), selectedGrade: 6, xp: 100 }), true);
    assert.equal(state().session, null);
    assert.equal(state().screen, "report");
    state().hydrate();
    assert.equal(state().xp, 100);
    assert.equal(state().selectedGrade, 6);
  });
});

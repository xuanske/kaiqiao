import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHAPTERS, QUESTIONS_PER_LEVEL } from "./chapters.ts";
import { hasBorrow, hasCarry, parseColumn } from "./column.ts";
import { isCorrect, normalizeAnswer, starsFor } from "./grade.ts";
import { makeDailySet, makeLevelSet, makeQuestion, makeReviewSet } from "./generate.ts";
import { mulberry32 } from "./rng.ts";
import { inferSkill, tonightPlan, touchSkill } from "./skills.ts";
import { isChapterUnlocked, isLevelUnlocked, nextCampaign, starKey } from "./progress.ts";

describe("三年级题库", () => {
  it("每个章节每个关卡都能出题，且选项含正确答案", () => {
    const rng = mulberry32(20260904);
    for (const chapter of CHAPTERS) {
      for (let level = 1; level <= 8; level += 1) {
        const set = makeLevelSet(chapter.id, level, QUESTIONS_PER_LEVEL, rng);
        assert.equal(set.length, QUESTIONS_PER_LEVEL);
        for (const q of set) {
          assert.ok(q.prompt.length > 2, q.prompt);
          assert.ok(q.answer.length > 0, q.prompt);
          assert.ok(q.explain.length > 2, q.prompt);
          assert.ok(q.skill, q.prompt);
          if (q.mode === "choice") {
            assert.ok(q.choices?.includes(q.answer), `${q.prompt} missing ${q.answer}`);
            assert.ok((q.choices?.length ?? 0) >= 2 && (q.choices?.length ?? 0) <= 4);
          }
        }
      }
    }
  });

  it("加减乘除与倍、周长、面积、余数算对", () => {
    const add = makeQuestion("warmup", 1, mulberry32(1));
    assert.ok(isCorrect(add, add.answer));
    assert.equal(isCorrect(add, "zzz"), false);

    const mul = makeQuestion("mul1", 2, mulberry32(11));
    const n = mul.prompt.match(/(\d+)\s*×\s*(\d+)/);
    if (n) {
      const a = Number(n[1]);
      const b = Number(n[2]);
      assert.equal(Number(mul.answer), a * b);
    }

    const peri = makeQuestion("peri", 1, mulberry32(3));
    if (peri.prompt.includes("正方形") && peri.prompt.includes("边长") && peri.mode === "keypad") {
      const side = Number(peri.prompt.match(/边长 (\d+)/)?.[1]);
      assert.equal(Number(peri.answer), 4 * side);
    }
  });

  it("余数满足 0 < r < d 且 n = q*d+r", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 40; i += 1) {
      const q = makeQuestion("div1", 6, rng);
      if (!q.answer.includes("余")) continue;
      const n = Number(q.prompt.match(/^(\d+)/)?.[1]);
      const d = Number(q.prompt.match(/÷ (\d+)/)?.[1]);
      const [qs, rs] = q.answer.split("余");
      const quot = Number(qs);
      const rem = Number(rs);
      assert.ok(rem > 0 && rem < d, q.answer);
      assert.equal(n, quot * d + rem);
      assert.equal(q.skill, "div-remain");
    }
  });

  it("方位左转右转与对面关系正确", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 24; i += 1) {
      const q = makeQuestion("dir", 2, rng);
      assert.ok(["东", "南", "西", "北"].includes(q.answer), q.prompt);
      assert.equal(q.mode, "choice");
      assert.ok(q.choices?.includes(q.answer));
      assert.equal(q.skill, "dir");
    }
  });

  it("统计合计等于两班人数之和", () => {
    const q = makeQuestion("stat", 1, mulberry32(4));
    const nums = [...q.prompt.matchAll(/(\d+)/g)].map((m) => Number(m[1]));
    assert.ok(nums.length >= 2);
    assert.equal(Number(q.answer), nums[0]! + nums[1]!);
    assert.equal(q.skill, "stat");
  });

  it("连续进位、倍差、跨天时间都带错因", () => {
    const rng = mulberry32(42);
    let carry = false;
    for (let i = 0; i < 48; i += 1) {
      const q = makeQuestion("wan", 5, rng);
      if (q.trap && /连续(进位|退位)/.test(q.trap)) carry = true;
    }
    assert.equal(carry, true);

    let beiGap = false;
    for (let i = 0; i < 40; i += 1) {
      const q = makeQuestion("bei", 5, rng);
      if (q.prompt.includes("多多少")) {
        beiGap = true;
        const nums = [...q.prompt.matchAll(/(\d+)/g)].map((m) => Number(m[1]));
        assert.equal(Number(q.answer), nums[0]! * (nums[1]! - 1));
        assert.equal(q.skill, "bei");
      }
    }
    assert.equal(beiGap, true);

    let overnight = false;
    for (let i = 0; i < 48; i += 1) {
      const q = makeQuestion("time", 6, rng);
      if (q.prompt.includes("次日")) {
        overnight = true;
        assert.ok(q.trap?.includes("跨天"));
        assert.ok(q.choices?.includes(q.answer));
        assert.equal(q.skill, "time");
      }
    }
    assert.equal(overnight, true);
  });

  it("每日一练用同类新题，不把原错题原样塞回去", () => {
    const wrong = [
      {
        prompt: "柳树 12 棵，杨树是柳树的 3 倍。杨树比柳树多多少棵？",
        answer: "24",
        explain: "",
        chapterId: "bei",
        given: "36",
        at: 1,
        skill: "bei",
        mode: "keypad" as const,
      },
    ];
    const set = makeDailySet(["warmup", "wan", "bei"], wrong, 10, mulberry32(8), 0.9);
    assert.equal(set.length, 10);
    assert.equal(set.some((q) => q.prompt === wrong[0]!.prompt), false);
    assert.ok(set.some((q) => q.chapterId === "bei"));
  });

  it("错题回炉先重做原题，再出同类新题", () => {
    const wrong = [
      {
        prompt: "586 + 247 = ?",
        answer: "833",
        explain: "连续进位",
        chapterId: "wan",
        given: "823",
        at: 1,
        skill: "add-carry",
        mode: "keypad" as const,
        keypad: "int" as const,
      },
    ];
    const set = makeReviewSet(wrong, mulberry32(3));
    assert.ok(set.some((q) => q.prompt === "586 + 247 = ?" && q.fromWrong));
    assert.ok(set.length >= 2);
  });

  it("竖式能拆进位和退位", () => {
    assert.equal(hasCarry(586, 247), true);
    assert.equal(hasCarry(12, 34), false);
    assert.equal(hasBorrow(1000, 1), true);
    assert.equal(hasBorrow(88, 12), false);
    const col = parseColumn("586 + 247 = ?");
    assert.ok(col);
    assert.equal(col.result, 833);
    assert.ok(col.marks.includes("1"));
    const sub = parseColumn("500 − 128 = ?");
    assert.ok(sub);
    assert.equal(sub.result, 372);
  });

  it("错因技能：进位、余数、倍差", () => {
    assert.equal(inferSkill({ chapterId: "wan", prompt: "586 + 247 = ?", answer: "833" }), "add-carry");
    assert.equal(inferSkill({ chapterId: "div1", prompt: "29 ÷ 4，商是几、余数是几？", answer: "7余1" }), "div-remain");
    assert.equal(
      inferSkill({
        chapterId: "bei",
        prompt: "柳树 12 棵，杨树是柳树的 3 倍。杨树比柳树多多少棵？",
        answer: "24",
        trap: "问的是「多多少」，不是杨树有多少。",
      }),
      "bei",
    );
  });

  it("学情会指出薄弱技能", () => {
    let map = {};
    for (let i = 0; i < 6; i += 1) map = touchSkill(map, "add-carry", i === 0, 8000);
    for (let i = 0; i < 6; i += 1) map = touchSkill(map, "times", true, 3000);
    const plan = tonightPlan(map, []);
    assert.equal(plan.skill, "add-carry");
    assert.ok(plan.line.includes("进位"));
  });

  it("答案规范化接受全角数字和余数写法", () => {
    assert.equal(normalizeAnswer("７余２"), "7余2");
    assert.equal(normalizeAnswer("7 余数 2"), "7余2");
    assert.equal(isCorrect({ id: "1", chapterId: "div1", prompt: "", explain: "", answer: "7余2", mode: "keypad" }, "7余数2"), true);
    assert.equal(starsFor(8, 8, 8000), 3);
    assert.equal(starsFor(7, 8, 9000), 2);
    assert.equal(starsFor(5, 8, 9000), 1);
    assert.equal(starsFor(3, 8, 9000), 0);
  });

  it("关卡解锁：先过前一关，章节要攒满三关", () => {
    const stars: Record<string, number> = {};
    assert.equal(isChapterUnlocked(stars, "warmup"), true);
    assert.equal(isChapterUnlocked(stars, "wan"), false);
    assert.equal(isLevelUnlocked(stars, "warmup", 1), true);
    assert.equal(isLevelUnlocked(stars, "warmup", 2), false);
    stars[starKey("warmup", 1)] = 2;
    assert.equal(isLevelUnlocked(stars, "warmup", 2), true);
    stars[starKey("warmup", 2)] = 1;
    stars[starKey("warmup", 3)] = 1;
    assert.equal(isChapterUnlocked(stars, "wan"), true);
    const next = nextCampaign(stars);
    assert.equal(next.chapterId, "warmup");
    assert.equal(next.level, 4);
  });
});

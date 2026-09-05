import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeQuestion } from "./generate.ts";
import { CHAPTERS } from "./chapters.ts";
import { mulberry32 } from "./rng.ts";

describe("小学全年级题库", () => {
  it("一到六年级每章都能出题且答案非空", () => {
    const rng = mulberry32(20260905);
    for (const chapter of CHAPTERS) {
      const q = makeQuestion(chapter.id, 3, rng);
      assert.ok(q.prompt.length > 2, chapter.id);
      assert.ok(String(q.answer).length > 0, chapter.id);
      assert.equal(q.chapterId, chapter.id);
    }
  });

  it("六年级圆周长 π 取 3", () => {
    const rng = mulberry32(7);
    let saw = false;
    for (let i = 0; i < 20; i += 1) {
      const q = makeQuestion("g6circle", 2, rng);
      if (q.prompt.includes("半径")) {
        const m = q.prompt.match(/半径 (\d+)/);
        assert.ok(m);
        assert.equal(q.answer, String(2 * 3 * Number(m![1])));
        saw = true;
        break;
      }
    }
    assert.equal(saw, true);
  });
});

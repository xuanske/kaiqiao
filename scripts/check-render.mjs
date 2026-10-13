import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { Game } = await server.ssrLoadModule('/src/components/math/game.tsx');
  const { useMath } = await server.ssrLoadModule('/src/store/math.ts');
  // Render the selected store state on the server; effects and browser behavior
  // are deliberately outside this smoke test.
  const initial = useMath.getInitialState();
  const render = (expected) => {
    Object.assign(initial, useMath.getState());
    const html = renderToString(createElement(Game));
    assert.ok(html.includes(expected), expected);
    return html;
  };
  render('练习年级');
  useMath.getState().go('map'); render('闯关地图');
  useMath.getState().go('review'); render('还没有错题');
  useMath.getState().go('report'); render('备份与恢复');
  useMath.getState().startDaily(); render('准备');
  useMath.getState().startDuel(); render('和电脑练一练');
  useMath.getState().tickDuel(60); render('平手');
  // The redesign must not hide older wrong items or imply a perfect empty report.
  useMath.setState({ selectedGrade: 3, stats: { answered: 0, correct: 0 }, wrong: Array.from({ length: 14 }, (_, i) => ({ chapterId: 'warmup', prompt: `待复习题目 ${i + 1}`, given: '0', answer: '1', explain: '先想清楚题意', at: i + 1 })) });
  useMath.getState().go('review');
  const review = render('待复习题目 14');
  assert.equal((review.match(/class="wrong-card"/g) ?? []).length, 14);
  useMath.getState().setGrade(1);
  useMath.getState().go('review'); render('还没有错题');
  useMath.getState().go('report');
  const report = render('等待第一次练习');
  assert.ok(report.includes('练一组一年级'));
  assert.ok(!report.includes('重做本年级错题'));
  const { Keypad } = await server.ssrLoadModule('/src/components/math/keypad.tsx');
  for (const [kind, value, enabled] of [['int', '', false], ['int', '0', true], ['dec', '0.5', true], ['remainder', '7余', false], ['remainder', '7余2', true]]) {
    const html = renderToString(createElement(Keypad, { kind, value, onChange() {}, onSubmit() {} }));
    const submit = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find((m) => m[2].includes('确定'));
    assert.ok(submit);
    assert.equal(!submit[1].includes('disabled'), enabled, `${kind}: ${value}`);
  }
  console.log('10 screen/state render checks and 5 input-state checks passed (not browser interaction tests)');
} finally {
  await server.close();
}

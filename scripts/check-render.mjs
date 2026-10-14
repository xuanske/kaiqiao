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
  useMath.getState().go('map'); render('题库与闯关');
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
  useMath.getState().go('learn'); render('数学，自己想明白。');
  const { UnitLesson, UnitProgress } = await server.ssrLoadModule('/src/components/math/learning.tsx');
  const { LEARNING_UNITS } = await server.ssrLoadModule('/src/lib/math/units.ts');
  for (const unit of LEARNING_UNITS) {
    const html = renderToString(createElement(UnitLesson, { unit, onBack() {} }));
    assert.ok(html.includes(unit.title) && html.includes(unit.example), unit.id);
    assert.ok(html.includes('单元自测') && html.includes('下载原创练习单'));
    if (unit.lab) assert.ok(html.includes('动手理解小实验'));
  }
  useMath.getState().startUnit('u-clock', true); render('准备');
  let guard=30;
  while (useMath.getState().screen==='play' && guard-->0) {
    const state=useMath.getState();
    state.submit(state.session.questions[state.session.index].answer); state.advance();
  }
  render('这次记录已写入学情');
  useMath.getState().go('report'); render('知识单元学习记录');
  Object.assign(initial,useMath.getState());
  assert.ok(renderToString(createElement(UnitProgress)).includes('导出家长建议'));
  const { chaptersOfGrade } = await server.ssrLoadModule('/src/lib/math/chapters.ts');
  for (const grade of [1,2,4,5,6]) {
    useMath.getState().setGrade(grade); useMath.getState().go('map');
    const html=render('按知识点练');
    for (const chapter of chaptersOfGrade(grade)) assert.ok(html.includes(chapter.name), chapter.id);
    assert.equal((html.match(/class="unit-card"/g)??[]).length,chaptersOfGrade(grade).length);
  }
  const { Keypad } = await server.ssrLoadModule('/src/components/math/keypad.tsx');
  for (const [kind, value, enabled] of [['int', '', false], ['int', '0', true], ['dec', '0.5', true], ['remainder', '7余', false], ['remainder', '7余2', true]]) {
    const html = renderToString(createElement(Keypad, { kind, value, onChange() {}, onSubmit() {} }));
    const submit = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find((m) => m[2].includes('确定'));
    assert.ok(submit);
    assert.equal(!submit[1].includes('disabled'), enabled, `${kind}: ${value}`);
  }
  console.log('Existing screens, 18 unit lessons, 3 lab types, unit completion/report and 5 input-state render checks passed (not browser interaction tests)');
} finally {
  await server.close();
}

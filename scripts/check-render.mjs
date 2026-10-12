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
    assert.ok(renderToString(createElement(Game)).includes(expected), expected);
  };
  render('练习年级');
  useMath.getState().go('map'); render('闯关地图');
  useMath.getState().go('review'); render('还没有错题');
  useMath.getState().go('report'); render('备份与恢复');
  useMath.getState().startDaily(); render('准备');
  useMath.getState().startDuel(); render('和电脑练一练');
  useMath.getState().tickDuel(60); render('平手');
  console.log('7 screen render checks passed (not browser interaction tests)');
} finally {
  await server.close();
}

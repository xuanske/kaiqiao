# 开窍

小学三年级数学闯关小游戏（网页版）。

## 直接打开（国内）

浏览器打开：[https://cdn.jsdelivr.net/gh/xuanske/kaiqiao@main/docs/index.html](https://cdn.jsdelivr.net/gh/xuanske/kaiqiao@main/docs/index.html)

打不开就下载 Releases 里的 zip，解压后打开 `index.html`。

## 怎么用

需要 [Node.js 20](https://nodejs.org/) 或以上。

```bash
git clone https://github.com/xuanske/kaiqiao.git
cd kaiqiao
npm install
npm run dev
```

终端会给出本地地址，用浏览器打开即可玩。进度存在这台设备，没有账号。

国内克隆：

```bash
git clone https://ghproxy.net/https://github.com/xuanske/kaiqiao.git
```

小学三年级数学闯关小游戏（网页版）。

微信小程序/小游戏的工具链没法在这个预览里跑，所以做成可点可玩的网页，竖屏、闯关、口算键盘、闪电对决。题型按三年级上/下册：

- 口算热身（百以内加减、表内乘除）
- 万以内加减
- 认识倍
- 多位数乘一位数
- 除数是一位数（含余数）
- 两位数乘两位数
- 周长、面积
- 时分秒 / 年月日
- 分数与小数初步认识
- 位置与方向（东南西北、左转右转）
- 简单统计（合计、比较、相差）

答错会标出考点（进位、退位、余数、倍差等），加减题弹出竖式。错题本先重做原题，再出同类新题。学情按技能统计薄弱点，给出「今晚练什么」。口算冲刺 90 秒，只跟自己的最好成绩比。题目可点喇叭朗读。进度只存在这台设备，没有账号、没有广告、不拿孩子跟别人比。

## 源码

`src/components/math` 界面，`src/lib/math` 出题与判分，`src/store/math.ts` 存档。

姊妹项目：[拂尘](https://github.com/xuanske/fuchen) · [筹算](https://github.com/xuanske/chousuan)

## 和同类不同

小猿口算已经做成大而全的作业 App。开窍只做三年级计算，而且不拿孩子跟别人比。

- 答错标考点，加减弹出竖式
- 错题本先重做原题，再出同类
- 学情可导出，没有排行榜、没有广告
- 不做假 OCR、不假装能拍整页作业


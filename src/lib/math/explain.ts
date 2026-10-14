/** Original, concrete explanations based on the actual operands. */
export function explainAdd(a: number, b: number): string {
  const sum = a + b;
  const digits = Math.max(String(a).length, String(b).length);
  const names = ["个", "十", "百", "千", "万"];
  let carry = 0;
  const lines: string[] = [];
  for (let i = 0; i < digits; i++) {
    const x = Math.floor(a / 10 ** i) % 10, y = Math.floor(b / 10 ** i) % 10;
    const n = x + y + carry;
    lines.push(`${names[i]}位：${x} + ${y}${carry ? " + 进来的 1" : ""} = ${n}，${n >= 10 ? `写 ${n % 10}，向前进 1` : `写 ${n}，不用进位`}。`);
    carry = n >= 10 ? 1 : 0;
  }
  if (carry) lines.push("最高位前再写进来的 1。");
  return [...lines, `合起来：${a} + ${b} = ${sum}。`].join("\n");
}

export function explainSubtract(a: number, b: number): string {
  // Count backwards via a neighbouring ten, so a false borrowing hint is impossible.
  const tens = Math.floor(b / 10) * 10, ones = b % 10;
  const first = a - tens;
  return `${b} 可以拆成 ${tens} 和 ${ones}。\n先减 ${tens}：${a} − ${tens} = ${first}。\n再减 ${ones}：${first} − ${ones} = ${a - b}。`;
}

export function explainMultiply(a: number, b: number): string {
  const parts = [1000, 100, 10, 1].map(place => Math.floor(a / place) % 10 * place).filter(Boolean);
  const lines = parts.map(n => `${n} × ${b} = ${n * b}`);
  return `把 ${a} 按数位拆成 ${parts.join(" + ")}。\n分别计算：${lines.join("；")}。\n再合起来：${parts.map(n => n * b).join(" + ")} = ${a * b}。`;
}

export type ColumnOp = "+" | "−" | "×";

export type ColumnWork = {
  op: ColumnOp;
  a: number;
  b: number;
  result: number;
  width: number;
  digitsA: string[];
  digitsB: string[];
  digitsR: string[];
  marks: string[];
};

export function hasCarry(a: number, b: number): boolean {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) >= 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

export function hasBorrow(minuend: number, subtrahend: number): boolean {
  let x = Math.abs(Math.trunc(minuend));
  let y = Math.abs(Math.trunc(subtrahend));
  if (x < y) return true;
  while (x > 0 || y > 0) {
    if (x % 10 < y % 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

function digitsOf(n: number, width: number): string[] {
  const raw = String(Math.abs(Math.trunc(n))).padStart(width, " ");
  return raw.split("");
}

function additionMarks(a: number, b: number, width: number): string[] {
  const marks = Array.from({ length: width }, () => " ");
  let carry = 0;
  for (let i = 0; i < width; i += 1) {
    const place = width - 1 - i;
    const da = Math.floor(Math.abs(a) / 10 ** i) % 10;
    const db = Math.floor(Math.abs(b) / 10 ** i) % 10;
    const sum = da + db + carry;
    carry = Math.floor(sum / 10);
    if (carry && place - 1 >= 0) marks[place - 1] = "1";
  }
  return marks;
}

function subtractionMarks(a: number, b: number, width: number): string[] {
  const marks = Array.from({ length: width }, () => " ");
  let aa = Math.abs(a);
  let bb = Math.abs(b);
  for (let i = 0; i < width; i += 1) {
    const place = width - 1 - i;
    const da = aa % 10;
    const db = bb % 10;
    if (da < db) marks[place] = "·";
    let top = da;
    if (top < db) top += 10;
    aa = Math.floor(aa / 10);
    bb = Math.floor(bb / 10);
    if (da < db) aa -= 1;
  }
  return marks;
}

export function parseColumn(prompt: string): ColumnWork | null {
  const m = prompt.match(/^(\d+)\s*([+\-−×x*])\s*(\d+)\s*=/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const raw = m[2]!;
  const op: ColumnOp = raw === "+" ? "+" : raw === "×" || raw === "x" || raw === "*" ? "×" : "−";
  if (op === "×" && (a > 99 || b > 9)) return null;
  const result = op === "+" ? a + b : op === "×" ? a * b : a - b;
  if (result < 0) return null;
  const width = Math.max(String(a).length, String(b).length, String(result).length);
  const marks =
    op === "+" ? additionMarks(a, b, width) : op === "−" ? subtractionMarks(a, b, width) : Array.from({ length: width }, () => " ");
  return {
    op,
    a,
    b,
    result,
    width,
    digitsA: digitsOf(a, width),
    digitsB: digitsOf(b, width),
    digitsR: digitsOf(result, width),
    marks,
  };
}

// おバカ電卓のロジック本体。純粋関数だけを置いておく。

export type Op = '+' | '-' | '*' | '/'

/** 正しい答えを返す確率。残りはでたらめ。 */
export const CORRECT_RATE = 0.3

/** でたらめな数の桁数レンジ（両端含む）。 */
export const BOGUS_MIN_DIGITS = 3
export const BOGUS_MAX_DIGITS = 8

/** 実際の四則演算。÷0 は Infinity になる（呼び出し側で表示を整える）。 */
export function computeReal(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return a / b
  }
}

/** [min, max] の整数乱数。 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 3〜8桁の完全ランダムな整数文字列を返す。先頭は 0 にしない。 */
export function makeBogus(): string {
  const digits = randInt(BOGUS_MIN_DIGITS, BOGUS_MAX_DIGITS)
  let out = String(randInt(1, 9)) // 先頭桁は 1〜9
  for (let i = 1; i < digits; i++) {
    out += String(randInt(0, 9))
  }
  return out
}

/**
 * 実際の答えを受け取り、CORRECT_RATE の確率でそれを、
 * それ以外はでたらめな数を「文字列」で返す。
 * 一桁ずつ表示するので数値ではなく文字列で扱う。
 */
export function rollResult(real: number): string {
  if (Math.random() < CORRECT_RATE) {
    return formatReal(real)
  }
  return makeBogus()
}

/** 実際の答えを表示用の文字列に整える。 */
export function formatReal(real: number): string {
  if (!Number.isFinite(real)) {
    return 'ERROR'
  }
  // 小数の桁が暴れないよう程よく丸める
  const rounded = Math.round(real * 1e8) / 1e8
  return String(rounded)
}

/** 演算子の記号表示（画面用）。 */
export function opSymbol(op: Op): string {
  switch (op) {
    case '+':
      return '+'
    case '-':
      return '−'
    case '*':
      return '×'
    case '/':
      return '÷'
  }
}

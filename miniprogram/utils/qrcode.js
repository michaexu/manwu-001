/**
 * 极速二维码生成器 — Canvas 2D 版本
 * 固定 Version 1 (21×21)，M 级纠错，字母数字编码
 */
const EXP_TABLE = [];
const LOG_TABLE = [];
(function init() {
  for (let i = 0, x = 1; i < 256; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
})();

function gfMul(a, b) {
  if (!a || !b) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function polyMul(p1, p2) {
  const out = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++)
    for (let j = 0; j < p2.length; j++)
      out[i + j] ^= gfMul(p1[i], p2[j]);
  return out;
}

function makeEC(data, ecCount) {
  let gen = [1];
  for (let i = 0; i < ecCount; i++) gen = polyMul(gen, [1, EXP_TABLE[i]]);
  const padded = [...data, ...Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const c = padded[i];
    if (c) for (let j = 0; j < gen.length; j++) padded[i + j] ^= gfMul(gen[j], c);
  }
  return padded.slice(data.length);
}

function charVal(ch) {
  const c = ch.charCodeAt(0);
  if (c >= 48 && c <= 57) return c - 48;
  if (c >= 65 && c <= 90) return c - 55;
  if (c === 32) return 36; if (c === 36) return 37; if (c === 37) return 38;
  if (c === 42) return 39; if (c === 43) return 40; if (c === 45) return 41;
  if (c === 46) return 42; if (c === 47) return 43; if (c === 58) return 44;
  return -1;
}

function buildMatrix(text) {
  const SIZE = 21;
  const TOTAL = 26;
  const EC = 7;

  const chars = text.toUpperCase().split('');
  const bits = [0, 0, 1, 0];
  const len = chars.length;
  for (let i = 8; i >= 0; i--) bits.push((len >> i) & 1);
  for (let i = 0; i < chars.length; i += 2) {
    const v1 = charVal(chars[i]);
    if (i + 1 < chars.length) {
      const v = v1 * 45 + charVal(chars[i + 1]);
      for (let j = 10; j >= 0; j--) bits.push((v >> j) & 1);
    } else {
      for (let j = 5; j >= 0; j--) bits.push((v1 >> j) & 1);
    }
  }
  bits.push(0, 0, 0, 0);
  while (bits.length % 8) bits.push(0);
  while (bits.length < TOTAL * 8) bits.push(0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11);

  const bytes = [];
  for (let i = 0; i < TOTAL; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    bytes.push(b);
  }
  const ec = makeEC(bytes, EC);
  const all = [...bytes, ...ec];

  const m = Array.from({ length: SIZE }, () => Array(SIZE).fill(-1));

  function placeFinder(r, c) {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++)
        m[r + i][c + j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) ? 1 : 0;
  }
  placeFinder(0, 0);
  placeFinder(0, SIZE - 7);
  placeFinder(SIZE - 7, 0);

  for (let i = 8; i < SIZE - 8; i++) m[6][i] = m[i][6] = i & 1;
  m[SIZE - 8][8] = 1;

  let col = SIZE - 1, up = true, bi = 0;
  while (col >= 0) {
    if (col === 6) col--;
    const rows = up ? [...Array(SIZE)].map((_, i) => SIZE - 1 - i) : [...Array(SIZE)].map((_, i) => i);
    for (const row of rows) {
      for (let c = col; c > col - 2 && c >= 0; c--) {
        if (m[row][c] !== -1) continue;
        if (bi < all.length * 8) {
          const byteIdx = bi >> 3;
          m[row][c] = ((all[byteIdx] >> (7 - (bi & 7))) & 1) ^ 1;
          bi++;
        }
      }
    }
    col -= 2;
    up = !up;
  }

  const mask = (i, j) => (i & 1) === 0;
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE; j++)
      if (m[i][j] === 1 || m[i][j] === 0)
        m[i][j] ^= mask(i, j) ? 1 : 0;

  const fb = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1];
  const fp = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];
  for (let k = 0; k < 15; k++) m[fp[k][0]][fp[k][1]] = fb[k];
  m[SIZE - 8][8] = 1;

  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE; j++)
      if (m[i][j] < 0) m[i][j] = 0;

  return m;
}

/**
 * 在 Canvas 2D 上绘制二维码
 * @param {string} text - 编码内容
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} canvasSize - canvas 物理尺寸（px）
 */
function drawQR(text, ctx, canvasSize) {
  const matrix = buildMatrix(text);
  const SIZE = 21;
  const border = 2;
  const moduleSize = Math.floor(canvasSize / (SIZE + border * 2));

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = '#000000';
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (matrix[i][j]) {
        ctx.fillRect(
          (j + border) * moduleSize,
          (i + border) * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
}

module.exports = { drawQR, buildMatrix };

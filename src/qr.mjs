// QR Code Model 2, version 1, error correction L, byte mode, mask 0.
// The encoded value is only the demo pickup code, never a payment credential.
export function qrPath(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 17 || /[^\x00-\x7f]/.test(value)) {
    throw new Error('Pickup QR codes support 1–17 ASCII characters.');
  }
  const bits = [];
  const append = (number, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((number >>> i) & 1);
  };
  append(0b0100, 4); // Byte mode indicator.
  append(value.length, 8);
  for (let i = 0; i < value.length; i++) append(value.charCodeAt(i), 8);
  append(0, Math.min(4, 152 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0; data.length < 19; pad++) data.push(pad % 2 ? 0x11 : 0xec);

  // GF(256), primitive polynomial x^8 + x^4 + x^3 + x^2 + 1.
  const multiply = (left, right) => {
    let result = 0;
    for (let i = 7; i >= 0; i--) {
      result = (result << 1) ^ ((result >>> 7) * 0x11d);
      result ^= ((right >>> i) & 1) * left;
    }
    return result;
  };
  // Generator coefficients omit their leading coefficient (always 1).
  const generator = new Array(7).fill(0);
  generator[6] = 1;
  let root = 1;
  for (let degree = 0; degree < 7; degree++) {
    for (let i = 0; i < generator.length; i++) {
      generator[i] = multiply(generator[i], root);
      if (i + 1 < generator.length) generator[i] ^= generator[i + 1];
    }
    root = multiply(root, 2);
  }
  const remainder = new Array(7).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder.shift();
    remainder.push(0);
    for (let i = 0; i < remainder.length; i++) remainder[i] ^= multiply(generator[i], factor);
  }
  const codewords = [...data, ...remainder];
  const side = 21;
  const modules = Array.from({ length: side }, () => new Array(side).fill(false));
  const fixed = Array.from({ length: side }, () => new Array(side).fill(false));
  const set = (x, y, dark) => {
    modules[y][x] = Boolean(dark);
    fixed[y][x] = true;
  };
  // Timing patterns are overwritten where finder patterns overlap them.
  for (let i = 0; i < side; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  const finder = (centerX, centerY) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < side && y >= 0 && y < side) {
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          set(x, y, distance !== 2 && distance !== 4);
        }
      }
    }
  };
  finder(3, 3);
  finder(side - 4, 3);
  finder(3, side - 4);

  // Error correction L = 01, mask = 000. BCH format protection and XOR mask.
  const formatData = 0b01000;
  let formatRemainder = formatData;
  for (let i = 0; i < 10; i++) formatRemainder = (formatRemainder << 1) ^ ((formatRemainder >>> 9) * 0x537);
  const format = ((formatData << 10) | formatRemainder) ^ 0x5412;
  const formatBit = i => (format >>> i) & 1;
  for (let i = 0; i <= 5; i++) set(8, i, formatBit(i));
  set(8, 7, formatBit(6));
  set(8, 8, formatBit(7));
  set(7, 8, formatBit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, formatBit(i));
  for (let i = 0; i < 8; i++) set(side - 1 - i, 8, formatBit(i));
  for (let i = 8; i < 15; i++) set(8, side - 15 + i, formatBit(i));
  set(8, side - 8, true); // Fixed dark module.

  let bitIndex = 0;
  for (let right = side - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < side; vertical++) {
      const upwards = ((right + 1) & 2) === 0;
      const y = upwards ? side - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset++) {
        const x = right - offset;
        if (fixed[y][x]) continue;
        const bit = (codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1;
        modules[y][x] = Boolean(bit ^ ((x + y) % 2 === 0 ? 1 : 0));
        bitIndex++;
      }
    }
  }
  const path = modules.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x + 4},${y + 4}h1v1h-1z`] : [])).join('');
  return { path, size: side + 8 };
}

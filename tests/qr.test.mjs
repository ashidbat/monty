import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { qrPath } from '../src/qr.mjs';

function matrixFromPath(path) {
  const matrix = Array.from({ length: 21 }, () => new Array(21).fill('0'));
  for (const [, x, y] of path.matchAll(/M(\d+),(\d+)h1v1h-1z/g)) {
    assert.ok(Number(x) >= 4 && Number(x) <= 24);
    assert.ok(Number(y) >= 4 && Number(y) <= 24);
    matrix[Number(y) - 4][Number(x) - 4] = '1';
  }
  return matrix;
}

// Independent reference: reportlab.graphics.barcode.qrencoder.QRCode(1, L),
// forced QR8bitByte input and makeImpl(False, 0). These cover a normal pickup
// code, one byte, the 17-byte capacity boundary, and lowercase byte content.
const referenceHashes = {
  MONTY2: '5e78e29d18efe231b0c8218503cfc42486d58df2d8b8ee02c28e150599960ae9',
  A: 'c70a942b285013ce4027462da7f97dc513d00d26993a78f263b6ca02f4d7ac09',
  '0123456789abcdefg': '4f88d54ca5cf0909cafb8228782f39025b9edeb034e38dc0bd4ca2b7563a2de6',
  abc123: 'dc98ff87cc8b249ff346cdf9876b9dfeb44e20843fb4f6e1a9fd9d73d1e0a8d8',
};

test('complete QR matrices match an independent established encoder', () => {
  for (const [value, expected] of Object.entries(referenceHashes)) {
    const { path, size } = qrPath(value);
    assert.equal(size, 29);
    const content = matrixFromPath(path).flat().join('');
    assert.equal(createHash('sha256').update(content).digest('hex'), expected, value);
  }
});

test('quiet zone, finder shapes and fixed dark module are present', () => {
  const { path } = qrPath('MONTY2');
  const rows = matrixFromPath(path).map(row => row.join(''));
  assert.equal(rows[0].slice(0, 8), '11111110');
  assert.equal(rows[1].slice(0, 8), '10000010');
  assert.equal(rows[2].slice(0, 8), '10111010');
  assert.equal(rows[7].slice(0, 8), '00000000');
  assert.equal(rows[13][8], '1');
  assert.equal(qrPath('MONTY2').path, path);
  assert.notEqual(qrPath('MONTY3').path, path);
});

test('values that cannot fit the declared QR mode are rejected', () => {
  for (const value of ['', '123456789012345678', 'MÖNTY2', '🥐', null, 123456]) {
    assert.throws(() => qrPath(value), /1–17 ASCII/);
  }
});

/* The PNG app icons, drawn from the one mark in public/assets/monty.svg.

   A home screen, a web app manifest and a shared link all want PNGs at fixed
   sizes, and none of them will take the SVG the browser tab uses. They are
   generated rather than drawn by hand so there is still only one Monty:
   change the loaf in monty.svg and every icon follows on the next build.

   Nothing in this toolchain can rasterise an SVG — that is normally the
   browser's job — so what follows is a small renderer for the handful of path
   commands the mark uses. Every outline is flattened to line segments and each
   pixel takes its coverage from its distance to them, which is what gives the
   curves a smooth edge without drawing the picture many times over. */
import { readFile, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'public/assets');

/* The mark's own plate colour, used where a platform wants the icon to reach
   the edges, and the light theme's --bg-app for the shared-link card. */
const PLATE = '#e6ddf3';
const CARD = '#e1f4f1';

/* Every icon a phone, a manifest or a link preview asks Monty for.
   `mark` is the fraction of the canvas the 100-unit artwork covers: 1 keeps
   the mark's own rounded corners, anything less centres it on a full-bleed
   plate, which is what the maskable and iOS shapes need. */
const ICONS = [
  { file: 'icon-192.png', width: 192, height: 192, mark: 1 },
  { file: 'icon-512.png', width: 512, height: 512, mark: 1 },
  // Android crops a maskable icon to its own shape — a circle, a squircle, a
  // teardrop — and only the middle 80% is guaranteed to survive.
  { file: 'icon-maskable-512.png', width: 512, height: 512, mark: 0.6, plate: PLATE },
  // iOS rounds the home screen icon itself and composites anything transparent
  // onto black, so this one is square and opaque.
  { file: 'apple-touch-icon.png', width: 180, height: 180, mark: 0.84, plate: PLATE },
  // What a phone shows when the link is pasted into a chat.
  { file: 'monty-card.png', width: 1200, height: 630, mark: 0.52, plate: CARD },
];

const SAMPLES = 2;       // the canvas is drawn at 2× and averaged down
const CURVE_STEPS = 24;  // line segments per curve; far more than an icon shows

// ---- Reading the mark -------------------------------------------------------

const attributesOf = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));

const PARAMETERS = { m: 2, l: 2, h: 1, v: 1, c: 6, q: 4, z: 0 };

/* Turns a path's `d` into closed and open polylines. Relative commands, the
   implicit repeat ("c" followed by two sets of six numbers) and the implicit
   lineto after a moveto are all part of the spec and all used by the mark. */
function flattenPath(d) {
  const subpaths = [];
  let here = [0, 0];
  let start = [0, 0];
  let subpath = null;
  const push = point => { here = point; subpath.points.push(point); };
  const curve = (points, at) => {
    for (let step = 1; step <= CURVE_STEPS; step += 1) push(at(step / CURVE_STEPS, points));
  };

  for (const [, letter, body] of d.matchAll(/([a-z])([^a-z]*)/gi)) {
    const command = letter.toLowerCase();
    const relative = letter === command;
    const size = PARAMETERS[command];
    if (size === undefined) throw new Error(`monty.svg uses a path command this renderer does not know: ${letter}`);
    if (command === 'z') { subpath.closed = true; here = start; continue; }

    const numbers = (body.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (!numbers.length || numbers.length % size) throw new Error(`monty.svg has a "${letter}" with ${numbers.length} numbers.`);

    for (let index = 0; index < numbers.length; index += size) {
      const args = numbers.slice(index, index + size);
      const [ox, oy] = relative ? here : [0, 0];
      const point = offset => [ox + args[offset], oy + args[offset + 1]];

      if (command === 'm' && index === 0) {
        here = start = point(0);
        subpath = { points: [here], closed: false };
        subpaths.push(subpath);
      } else if (command === 'm' || command === 'l') push(point(0));
      else if (command === 'h') push([ox + args[0], here[1]]);
      else if (command === 'v') push([here[0], oy + args[0]]);
      else if (command === 'c') {
        const [p0, p1, p2, p3] = [here, point(0), point(2), point(4)];
        curve([p0, p1, p2, p3], (t, [a, b, c, e]) => {
          const u = 1 - t;
          return [0, 1].map(axis => u * u * u * a[axis] + 3 * u * u * t * b[axis] + 3 * u * t * t * c[axis] + t * t * t * e[axis]);
        });
      } else {
        const [p0, p1, p2] = [here, point(0), point(2)];
        curve([p0, p1, p2], (t, [a, b, c]) => {
          const u = 1 - t;
          return [0, 1].map(axis => u * u * a[axis] + 2 * u * t * b[axis] + t * t * c[axis]);
        });
      }
    }
  }
  return subpaths;
}

/* The rounded plate stays an analytic rounded box rather than a polygon: it
   covers the whole canvas, so measuring it against fifty segments per pixel is
   the one cost worth avoiding. */
function readMark(svg) {
  const [, , viewWidth, viewHeight] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/).map(Number);
  if (viewWidth !== viewHeight) throw new Error('The Monty mark is expected to be square.');
  const shapes = [];
  for (const [, element, body] of svg.matchAll(/<(rect|path)\b([^>]*?)\/?>/g)) {
    const attributes = attributesOf(body);
    const paint = {
      fill: attributes.fill && attributes.fill !== 'none' ? attributes.fill : null,
      stroke: attributes.stroke && attributes.stroke !== 'none' ? attributes.stroke : null,
      strokeWidth: Number(attributes['stroke-width'] ?? 1),
    };
    if (element === 'rect') {
      const size = [Number(attributes.width), Number(attributes.height)];
      shapes.push({ kind: 'box', x: Number(attributes.x ?? 0), y: Number(attributes.y ?? 0), size, radius: Number(attributes.rx ?? 0), ...paint });
    } else shapes.push({ kind: 'path', subpaths: flattenPath(attributes.d), ...paint });
  }
  if (!shapes.length) throw new Error('No shapes found in monty.svg.');
  return { shapes, viewSize: viewWidth };
}

// ---- Drawing ----------------------------------------------------------------

const channelsOf = colour => [1, 3, 5].map(at => parseInt(colour.slice(at, at + 2), 16) / 255);

const clamp = value => (value < 0 ? 0 : value > 1 ? 1 : value);

function distanceToSegments(segments, x, y) {
  let best = Infinity;
  for (let index = 0; index < segments.length; index += 4) {
    const ax = segments[index];
    const ay = segments[index + 1];
    const dx = segments[index + 2] - ax;
    const dy = segments[index + 3] - ay;
    const length = dx * dx + dy * dy;
    let t = length ? ((x - ax) * dx + (y - ay) * dy) / length : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ox = x - (ax + t * dx);
    const oy = y - (ay + t * dy);
    const distance = ox * ox + oy * oy;
    if (distance < best) best = distance;
  }
  return Math.sqrt(best);
}

/* Even-odd crossing count. Every closed outline in the mark is a simple loop,
   so this agrees with the non-zero rule the SVG would be filled under. */
function isInside(loops, x, y) {
  let inside = false;
  for (const loop of loops) {
    for (let index = 0, last = loop.length - 2; index < loop.length; last = index, index += 2) {
      const ay = loop[index + 1];
      const by = loop[last + 1];
      if ((ay > y) === (by > y)) continue;
      const ax = loop[index];
      const bx = loop[last];
      if (x < ax + ((y - ay) / (by - ay)) * (bx - ax)) inside = !inside;
    }
  }
  return inside;
}

/* Source-over, straight alpha. The plate is either opaque or absent, so this
   only ever blends a handful of layers. */
function paint(canvas, offset, [r, g, b], alpha) {
  if (alpha <= 0) return;
  const behind = canvas[offset + 3] * (1 - alpha);
  const total = alpha + behind;
  canvas[offset] = (r * alpha + canvas[offset] * behind) / total;
  canvas[offset + 1] = (g * alpha + canvas[offset + 1] * behind) / total;
  canvas[offset + 2] = (b * alpha + canvas[offset + 2] * behind) / total;
  canvas[offset + 3] = total;
}

function render({ shapes, viewSize }, { width, height, mark, plate }) {
  const [canvasWidth, canvasHeight] = [width * SAMPLES, height * SAMPLES];
  const canvas = new Float32Array(canvasWidth * canvasHeight * 4);
  if (plate) {
    const [r, g, b] = channelsOf(plate);
    for (let offset = 0; offset < canvas.length; offset += 4) { canvas[offset] = r; canvas[offset + 1] = g; canvas[offset + 2] = b; canvas[offset + 3] = 1; }
  }

  // The artwork is centred, and squarely so on a card that is not square.
  const unit = (Math.min(canvasWidth, canvasHeight) * mark) / viewSize;
  const left = (canvasWidth - viewSize * unit) / 2;
  const top = (canvasHeight - viewSize * unit) / 2;
  const toX = value => left + value * unit;
  const toY = value => top + value * unit;

  for (const shape of shapes) {
    const half = (shape.strokeWidth * unit) / 2;
    const fill = shape.fill && channelsOf(shape.fill);
    const stroke = shape.stroke && channelsOf(shape.stroke);
    const edge = (shape.stroke ? half : 0) + 1;

    let bounds;
    let signedDistance;
    if (shape.kind === 'box') {
      const [boxWidth, boxHeight] = shape.size.map(value => (value * unit) / 2);
      const centreX = toX(shape.x) + boxWidth;
      const centreY = toY(shape.y) + boxHeight;
      const radius = shape.radius * unit;
      bounds = [centreX - boxWidth - edge, centreY - boxHeight - edge, centreX + boxWidth + edge, centreY + boxHeight + edge];
      signedDistance = (x, y) => {
        const qx = Math.abs(x - centreX) - (boxWidth - radius);
        const qy = Math.abs(y - centreY) - (boxHeight - radius);
        const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        return outside + Math.min(Math.max(qx, qy), 0) - radius;
      };
    } else {
      const segments = [];
      const loops = [];
      bounds = [Infinity, Infinity, -Infinity, -Infinity];
      for (const { points, closed } of shape.subpaths) {
        const flat = [];
        for (const [x, y] of points) {
          const [px, py] = [toX(x), toY(y)];
          flat.push(px, py);
          bounds = [Math.min(bounds[0], px - edge), Math.min(bounds[1], py - edge), Math.max(bounds[2], px + edge), Math.max(bounds[3], py + edge)];
        }
        for (let index = 0; index + 3 < flat.length; index += 2) segments.push(flat[index], flat[index + 1], flat[index + 2], flat[index + 3]);
        if (closed) {
          segments.push(flat[flat.length - 2], flat[flat.length - 1], flat[0], flat[1]);
          loops.push(flat);
        }
      }
      const packed = Float64Array.from(segments);
      signedDistance = (x, y) => {
        const distance = distanceToSegments(packed, x, y);
        return loops.length && isInside(loops, x, y) ? -distance : distance;
      };
    }

    const [minX, minY, maxX, maxY] = bounds;
    for (let py = Math.max(0, Math.floor(minY)); py < Math.min(canvasHeight, Math.ceil(maxY)); py += 1) {
      for (let px = Math.max(0, Math.floor(minX)); px < Math.min(canvasWidth, Math.ceil(maxX)); px += 1) {
        const distance = signedDistance(px + 0.5, py + 0.5);
        const offset = (py * canvasWidth + px) * 4;
        // Half a pixel either side of the outline is the antialiased band.
        if (fill) paint(canvas, offset, fill, clamp(0.5 - distance));
        if (stroke) paint(canvas, offset, stroke, clamp(half - Math.abs(distance) + 0.5));
      }
    }
  }

  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const target = (y * width + x) * 4;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const source = ((y * SAMPLES + sy) * canvasWidth + x * SAMPLES + sx) * 4;
          // Averaged through premultiplied alpha, or a transparent corner
          // would drag its colour into the edge beside it.
          const alpha = canvas[source + 3];
          for (let channel = 0; channel < 3; channel += 1) pixels[target + channel] += canvas[source + channel] * alpha;
          pixels[target + 3] += alpha;
        }
      }
      const total = pixels[target + 3];
      for (let channel = 0; channel < 3; channel += 1) pixels[target + channel] = total ? pixels[target + channel] / total : 0;
      pixels[target + 3] = total / (SAMPLES * SAMPLES);
    }
  }
  return pixels;
}

// ---- Writing the file -------------------------------------------------------

const CRC_TABLE = Uint32Array.from({ length: 256 }, (unused, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 'latin1');
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])), 0);
  return Buffer.concat([header, data, checksum]);
}

function encodePng(width, height, pixels, opaque) {
  const channels = opaque ? 3 : 4;
  const stride = width * channels + 1;
  const raw = Buffer.alloc(stride * height);          // filter byte 0 per row
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const target = y * stride + 1 + x * channels;
      for (let channel = 0; channel < channels; channel += 1) raw[target + channel] = Math.round(pixels[source + channel] * 255);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;                                       // bits per channel
  header[9] = opaque ? 2 : 6;                          // truecolour, with alpha unless opaque
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mark = readMark(await readFile(path.join(assets, 'monty.svg'), 'utf8'));
for (const icon of ICONS) {
  const file = path.join(assets, icon.file);
  const png = encodePng(icon.width, icon.height, render(mark, icon), Boolean(icon.plate));
  await writeFile(file, png);
  console.log(`${icon.file.padEnd(24)} ${icon.width}×${icon.height}  ${Math.round(png.length / 1024)} KB`);
}

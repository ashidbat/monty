import React from 'react';
import './identity.css';

/* Monty's companions, drawn as 28×28 pixel sprites with anime faces.

   Each one is a grid of characters and a palette that says what colour each
   character is. Runs of the same colour in a row become one rectangle, and
   every rectangle of one colour becomes one path, so a companion reaches the
   screen as about eight paths rather than six hundred squares.
   `shape-rendering: crispEdges` keeps the squares square however far up the
   sprite is scaled.

   A sprite is assembled in layers, back to front: what belongs behind the body
   (ears at the side, humps), then the body, then what belongs in front (the
   markings, and the ears that should overlap the head), then the face for the
   mood. Sharing one body and one pair of eyes is what makes the six read as
   one cast; ears, tails, palette and markings are what tell them apart.

   Movement is frame swapping, the way a sprite should move: a one-pixel idle
   bob, a two-frame blink, a two-frame tail. Nothing interpolates, so nothing
   ever lands between two pixels. identity.css owns all of it. */

const SIZE = 28;
const BLANK = '.';

/* ---- The shared body -----------------------------------------------------
   o body, f the fill behind the face, m light markings, s/t the neckerchief,
   K outline, z the ground shadow. Rows 0–2 are left clear for ears. */
const BODY = [
  '............................',
  '............................',
  '............................',
  '........KKKKKKKKKKKK........',
  '......KKffffffffffffKK......',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '.....KffffffffffffffffK.....',
  '......KffffffffffffffK......',
  '.......KKffffffffffKK.......',
  '.......KssssssssssssK.......',
  '.......KttttttttttttK.......',
  '.......KooooooooooooK.......',
  '.......KooooommoooooK.......',
  '.......KoooommmmoooooK......',
  '.......KoooommmmoooooK......',
  '.......KooooommoooooK.......',
  '........KooooooooooK........',
  '........KmmK....KmmK........',
  '.......zzzzzzzzzzzzzz.......',
  '............................',
];

/* ---- The face ------------------------------------------------------------
   One pair of anime eyes for the whole cast: a dark lash line across the top,
   a two-pixel white highlight in the corner and a coloured iris under it. The
   iris is what makes an eye this big read as anime rather than as a blob, and
   it is the one part of the face each companion colours for itself. Stamped at
   column 6, row 9, so the eyes land either side of the centre line. */
const FACE_AT = {x: 6, y: 9};
const FACES = {
  hello: [
    '..EEEE....EEEE..',
    '..WWjE....WWjE..',
    '..jjjE....jjjE..',
    '..jjjE....jjjE..',
    'BB.EE......EE.BB',
    '.......nn.......',
    '......K..K......',
    '.......KK.......',
  ],
  // Eyes shut and turned up, mouth open: the pass screen and the chosen card
  // in the picker both use this, so it has to read as delight at 62px.
  success: [
    '................',
    '...EE......EE...',
    '..E..E....E..E..',
    '................',
    'BB..........BB..',
    '.......nn.......',
    '.....KKKKKK.....',
    '......KrrK......',
  ],
  // Lower, softer eyes and a level mouth for a screen with nothing on it.
  empty: [
    '................',
    '..EEEE....EEEE..',
    '..WWjE....WWjE..',
    '..jjjE....jjjE..',
    'BB.EE......EE.BB',
    '.......nn.......',
    '......KKKK......',
    '................',
  ],
};

/* The blink is a second frame, not a squash: fill over the eyes, and one line
   where they close. */
const BLINK_AT = {x: 8, y: 9};
const BLINK = [
  'ffff....ffff',
  'ffff....ffff',
  'KKKK....KKKK',
  'ffff....ffff',
  '.ff......ff.',
];

/* ---- The cast ----------------------------------------------------------- */
const PETS = {
  loaf: {
    palette: {o: '#E0A765', f: '#FBE7BE', m: '#F7D9A2', d: '#C08850', n: '#E08A87', j: '#A6703F'},
    /* Monty is not built like the animals, so he keeps a body of his own: the
       crust ring, the crumb it is cut to show, and the same neckerchief at the
       same height as everybody else's. */
    body: [
      '............................',
      '............................',
      '............................',
      '........KKKKKKKKKKKK........',
      '......KKooooooooooooKK......',
      '.....KooooooooooooooooK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '.....KoffffffffffffffoK.....',
      '......KoffffffffffffoK......',
      '.......KKffffffffffKK.......',
      '.......KssssssssssssK.......',
      '.......KttttttttttttK.......',
      '.......KooooooooooooK.......',
      '.......KooooommoooooK.......',
      '.......KoooommmmoooooK......',
      '.......KoooommmmoooooK......',
      '.......KooooommoooooK.......',
      '........KooooooooooK........',
      '........KmmK....KmmK........',
      '.......zzzzzzzzzzzzzz.......',
      '............................',
    ],
    front: [{x: 8, y: 4, rows: ['dd..dd..dd..']}],
  },

  cat: {
    palette: {o: '#F3C68C', f: '#FBDCAC', m: '#FFF3DC', d: '#DCA468', p: '#F0A9A2', n: '#E08A87', j: '#6FA36B'},
    behind: [
      {x: 5, y: 0, rows: ['..KK.', '.KppK', 'KoppK', 'KoopK']},
      {x: 18, y: 0, rows: ['.KK..', 'KppK.', 'KppoK', 'KpooK']},
    ],
    front: [
      // Tabby stripes on the brow, and whiskers either side of the muzzle.
      {x: 9, y: 5, rows: ['.d..d..d.', '.d..d..d.']},
      {x: 3, y: 13, rows: ['dd.', '...', 'dd.']},
      {x: 23, y: 13, rows: ['.dd', '...', '.dd']},
    ],
    tail: {
      x: 20, y: 16,
      a: ['.....', '..KKK', '.KddK', '.KdK.', 'KddK.', 'KddK.', 'KKKK.'],
      b: ['..KKK', '.KddK', '.KdK.', 'KddK.', 'KddK.', 'KKKK.', '.....'],
    },
  },

  dog: {
    palette: {o: '#7E5F78', f: '#8C6A85', m: '#E8AE6E', d: '#5E4560', n: '#33223C', j: '#C18A45'},
    // Ears hanging down the sides of the head, as a bankhar's do.
    behind: [
      {x: 1, y: 5, rows: ['.KKK.', 'KdddK', 'KdddK', 'KdddK', 'KdddK', 'KdddK', '.KdK.', '..K..']},
      {x: 22, y: 5, rows: ['.KKK.', 'KdddK', 'KdddK', 'KdddK', 'KdddK', 'KdddK', '.KdK.', '..K..']},
    ],
    front: [
      // The tan brow marks a bankhar is named for: dörvön nüd, four eyes.
      {x: 8, y: 7, rows: ['mm......mm']},
      // A tan muzzle under the eyes, and tan front paws.
      {x: 11, y: 13, rows: ['.mmmmmm.', 'mmmmmmmm', 'mmmmmmmm']},
      {x: 8, y: 24, rows: ['mmmm..mmmm']},
    ],
    tail: {
      x: 20, y: 17,
      a: ['.....', '...KK', '..KmK', '.KmmK', 'KmmK.', 'KKK..'],
      b: ['...KK', '..KmK', '..KmK', '.KmmK', 'KmmK.', 'KKK..'],
    },
  },

  bunny: {
    palette: {o: '#EFDCC0', f: '#FBF1E0', m: '#FFFBF2', d: '#DCC5A4', p: '#F2B3B0', n: '#E29A9A', j: '#B76E7E'},
    // Long ears, in front of the head so they can be as long as a bunny's.
    front: [
      {x: 7, y: 0, rows: ['.KK.', 'KppK', 'KppK', 'KppK', 'KppK', 'KooK', 'KooK']},
      {x: 17, y: 0, rows: ['.KK.', 'KppK', 'KppK', 'KppK', 'KppK', 'KooK', 'KooK']},
    ],
    tail: {
      x: 20, y: 21,
      a: ['.KKK', 'KmmK', 'KmmK', '.KK.'],
      b: ['.KK.', 'KmmK', 'KmmK', '.KKK'],
    },
  },

  lamb: {
    palette: {o: '#EADCC0', f: '#DCB58C', m: '#FDF6E8', d: '#CBA37C', n: '#8C6249', j: '#6B7FA8'},
    // Ears out to the side; the fleece goes on in front, over brow and body.
    behind: [
      {x: 1, y: 12, rows: ['.KKK.', 'KoooK', 'KdddK', '.KKK.']},
      {x: 22, y: 12, rows: ['.KKK.', 'KoooK', 'KdddK', '.KKK.']},
    ],
    front: [
      {x: 5, y: 3, rows: ['..KKmmmmmmmmKK..', '.KmmmmmmmmmmmmK.', '.KmKmmKmmKmmKmK.']},
      {x: 6, y: 19, rows: ['KmKmmKmmKmmKmK', 'KmmmmmmmmmmmmK', 'KmmmmmmmmmmmmK', 'KmmmmmmmmmmmmK', '.KmmmmmmmmmmK.']},
    ],
  },

  camel: {
    palette: {o: '#DCAF7C', f: '#EDC896', m: '#F8E2C0', d: '#C08B58', n: '#9C6F4C', j: '#8A6240'},
    /* A camel needs a neck, and the neck is what makes the humps read as humps
       rather than as ears, so Botgo is built differently from the rest: head up
       top, a long neck wearing the neckerchief, a hump either side of it, and
       the body under all of it. His face sits higher than everyone else's,
       which is what faceAt is for. */
    body: [
      '............................',
      '..........KKKKKKKK..........',
      '........KKffffffffKK........',
      '.......KffffffffffffK.......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '......KffffffffffffffK......',
      '.......KffffffffffffK.......',
      '........KKffffffffKK........',
      '..........KooooooK..........',
      '..........KooooooK..........',
      '..........KssssssK..........',
      '..........KttttttK..........',
      '..........KooooooK..........',
      '.....KooooooooooooooooK.....',
      '.....KooooooooooooooooK.....',
      '.....KoooooommmmooooooK.....',
      '.....KoooooommmmooooooK.....',
      '.....KooooooommmoooooooK....',
      '.....KooooooooooooooooK.....',
      '......KooooooooooooooK......',
      '......KooooooooooooooK......',
      '......KmmK......KmmK........',
      '.....zzzzzzzzzzzzzzzzzz.....',
    ],
    faceAt: {x: 6, y: 4},
    blinkAt: {x: 8, y: 4},
    behind: [
      {x: 3, y: 11, rows: ['..KKKK..', '.KooooK.', 'KooooooK', 'KooooooK', 'KooooooK', 'KddddddK', 'KddddddK']},
      {x: 17, y: 11, rows: ['..KKKK..', '.KooooK.', 'KooooooK', 'KooooooK', 'KooooooK', 'KddddddK', 'KddddddK']},
      {x: 4, y: 3, rows: ['KoK', 'KoK']},
      {x: 21, y: 3, rows: ['KoK', 'KoK']},
    ],
    // The tuft a young camel carries on his crown.
    front: [{x: 12, y: 1, rows: ['dddd']}],
    tail: {
      x: 2, y: 20,
      a: ['..KK', '.KdK', '.KdK', '..KK'],
      b: ['.KK.', 'KdK.', '.KdK', '..KK'],
    },
  },
};

const COMMON = {
  K: '#3B2A44',
  E: '#3B2A44',
  W: '#FFFFFF',
  B: '#EC9A9A',
  r: '#D06E72',
  s: '#D5C3E8',
  t: '#A78BC2',
  z: '#78578326',
};

/* ---- Grid plumbing ------------------------------------------------------- */

const emptyGrid = () => Array.from({length: SIZE}, () => Array(SIZE).fill(BLANK));

function stamp(grid, rows, atX, atY) {
  rows.forEach((row, y) => {
    [...row].forEach((character, x) => {
      if (character === BLANK) return;
      const gridY = atY + y;
      const gridX = atX + x;
      if (grid[gridY] && gridX >= 0 && gridX < SIZE) grid[gridY][gridX] = character;
    });
  });
}

/* One path per colour: each run of pixels becomes `M x y h w v 1 h -w z`,
   which the browser draws as fast as a rectangle and keeps out of the DOM. */
function pathsFor(grid, palette) {
  const runs = new Map();
  grid.forEach((row, y) => {
    let x = 0;
    while (x < SIZE) {
      const character = row[x];
      if (character === BLANK) { x += 1; continue; }
      let width = 1;
      while (x + width < SIZE && row[x + width] === character) width += 1;
      const colour = palette[character] || COMMON[character];
      if (colour) runs.set(colour, (runs.get(colour) || '') + `M${x} ${y}h${width}v1h-${width}z`);
      x += width;
    }
  });
  return [...runs];
}

// Sprites never change once built, so each is assembled once for the session.
const cache = new Map();

function spriteFor(id, mood) {
  const key = `${id}-${mood}`;
  if (cache.has(key)) return cache.get(key);
  const pet = PETS[id] || PETS.loaf;
  const grid = emptyGrid();
  for (const layer of pet.behind || []) stamp(grid, layer.rows, layer.x, layer.y);
  stamp(grid, pet.body || BODY, 0, 0);
  for (const layer of pet.front || []) stamp(grid, layer.rows, layer.x, layer.y);
  const faceAt = pet.faceAt || FACE_AT;
  stamp(grid, FACES[mood] || FACES.hello, faceAt.x, faceAt.y);

  const blink = emptyGrid();
  const blinkAt = pet.blinkAt || BLINK_AT;
  stamp(blink, BLINK, blinkAt.x, blinkAt.y);

  const built = {
    body: pathsFor(grid, pet.palette),
    blink: pathsFor(blink, pet.palette),
    tails: pet.tail ? ['a', 'b'].map(frame => {
      const tailGrid = emptyGrid();
      stamp(tailGrid, pet.tail[frame], pet.tail.x, pet.tail.y);
      return pathsFor(tailGrid, pet.palette);
    }) : null,
  };
  cache.set(key, built);
  return built;
}

const Paths = ({paths}) => paths.map(([colour, d]) => <path key={colour} d={d} fill={colour} shapeRendering="crispEdges"/>);

export default function Pet({id = 'loaf', mood = 'hello', className = '', size = 150}) {
  const sprite = spriteFor(PETS[id] ? id : 'loaf', mood);
  return <svg className={`monty-mascot pet-${id} ${className}`.trim()} width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} fill="none" aria-hidden="true" focusable="false">
    <g className="pet-bob">
      {sprite.tails && <>
        <g className="pet-frame-a"><Paths paths={sprite.tails[0]}/></g>
        <g className="pet-frame-b"><Paths paths={sprite.tails[1]}/></g>
      </>}
      <Paths paths={sprite.body}/>
      {mood !== 'success' && <g className="pet-blink-shut"><Paths paths={sprite.blink}/></g>}
    </g>
  </svg>;
}

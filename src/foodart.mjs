/* Drawings for the items that have no photograph.

   A hundred and twenty listings and five photographs is the honest ratio for a
   marketplace this young: a few shops send pictures, the rest need something on
   the card until they do. Repeating those five photographs would be worse than
   a drawing, because a reader learns within a screen that the picture is not of
   the food. A drawing never makes that promise, and the detail screen says so
   in words as well.

   Each drawing is built from a shared vocabulary — a bowl, a cup, a slice, a
   loaf — recoloured per item, so ninety of them still read as one family and
   the whole set costs a few kilobytes rather than a few megabytes. They are
   returned as data URIs, which means they work in an <img>, survive the offline
   snapshot with no build step, and need no network. */

const INK = '#5a4436';
const LINE = '#00000018';

const C = {
  crust: '#c4823f', crustDeep: '#a1642c', dough: '#edc182', doughPale: '#f7dfb4',
  cream: '#fff2dd', white: '#fdf7ec', milk: '#f3e7cf', sugar: '#ffffffcc',
  choc: '#6d4229', chocMid: '#8f5c39', cocoa: '#4e2f1f',
  berry: '#b8446b', rose: '#e79ab0', red: '#c5503c', tomato: '#d2543f',
  orange: '#e08a3c', amber: '#d9a13f', yellow: '#eac34e', butter: '#f2d271',
  green: '#6f9b5c', greenDeep: '#4e7742', leaf: '#8fb673', matcha: '#8aae5a',
  coffee: '#5d3c2b', tea: '#c39150', plum: '#7f5e93', slate: '#6f8bb0',
  stone: '#cdc0ad', ash: '#b7a894', night: '#3f3630',
};

const BG = {
  warm: '#f5e5c6', rose: '#f7dfdf', sage: '#e5ecd6', lilac: '#e8e1f3',
  mint: '#dceae3', sky: '#dee7f1', sand: '#f0e3cf',
};

const shadow = '<ellipse cx="150" cy="140" rx="52" ry="7" fill="#00000012"/>';

/* Every drawing sits on the same disc, which is what stops a bowl and a bottle
   from looking like they came from different sets. */
const plate = tint => `<circle cx="150" cy="94" r="62" fill="${tint}" opacity=".55"/>`;

const g = (fill, extra = '') => `fill="${fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" ${extra}`;
const line = (d, colour = INK, width = 2.4) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>`;
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

/* ---- The vocabulary -----------------------------------------------------
   Each takes the recipe's colours and draws inside x 88–212, y 44–136, with
   the baseline at 132 so everything in the set sits on the same table. */
const SHAPES = {
  crescent: (a, b) => `
    <path d="M100 122a52 52 0 0 1 100 0l-17 5a36 36 0 0 0-66 0z" ${g(a)}/>
    ${line('M124 94v18')}${line('M150 87v16')}${line('M176 94v18')}
    <path d="M100 122q-6 6-2 10 6 4 10-4z" ${g(b)}/>
    <path d="M200 122q6 6 2 10-6 4-10-4z" ${g(b)}/>`,

  baton: (a, b) => `
    <g transform="rotate(-11 150 108)">
      <rect x="86" y="90" width="128" height="36" rx="18" ${g(a)}/>
      ${line('M112 100l-8 14', b, 3.4)}${line('M136 99l-8 15', b, 3.4)}
      ${line('M160 99l-8 15', b, 3.4)}${line('M184 100l-8 14', b, 3.4)}
    </g>`,

  loafSliced: (a, b) => `
    <path d="M104 132V96a46 30 0 0 1 92 0v36z" ${g(a)}/>
    <path d="M104 118h92" fill="none" stroke="${b}" stroke-width="2.4"/>
    ${line('M126 132V118', b)}${line('M150 132v-14', b)}${line('M174 132v-14', b)}`,

  roundLoaf: (a, b) => `
    <path d="M102 132a48 42 0 0 1 96 0z" ${g(a)}/>
    ${line('M120 104l16-12', b, 3.6)}${line('M142 98l16-12', b, 3.6)}${line('M164 100l14-10', b, 3.6)}`,

  ring: (a, b, c) => `
    <circle cx="150" cy="96" r="46" ${g(a)}/>
    <circle cx="150" cy="96" r="15" ${g(b)}/>
    ${c ? `<path d="M104 96a46 46 0 0 1 92 0 46 22 0 0 0-92 0z" fill="${c}" opacity=".9"/>` : ''}
    ${dot(124, 74, 3, b)}${dot(176, 74, 3, b)}${dot(150, 62, 3, b)}${dot(116, 108, 3, b)}${dot(184, 108, 3, b)}`,

  dome: (a, b) => `
    <path d="M104 132a46 44 0 0 1 92 0z" ${g(a)}/>
    <path d="M104 132h92" fill="none" stroke="${INK}" stroke-width="2.4"/>
    ${dot(134, 104, 4, b)}${dot(164, 98, 4, b)}${dot(150, 118, 4, b)}`,

  muffin: (a, b) => `
    <path d="M112 132l-6-38h88l-6 38z" ${g(b)}/>
    <path d="M100 94a50 34 0 0 1 100 0z" ${g(a)}/>
    ${line('M124 94l4-34', '#00000022', 3)}${line('M150 94V58', '#00000022', 3)}${line('M176 94l-4-34', '#00000022', 3)}`,

  slice: (a, b, c) => `
    <path d="M110 132V88l40-24 40 24v44z" ${g(a)}/>
    <path d="M110 104h80" fill="none" stroke="${b}" stroke-width="7"/>
    <path d="M110 120h80" fill="none" stroke="${b}" stroke-width="5" opacity=".7"/>
    ${dot(150, 76, 7, c)}`,

  bar: (a, b) => `
    <rect x="102" y="86" width="96" height="46" rx="8" ${g(a)}/>
    <rect x="102" y="86" width="96" height="14" rx="7" fill="${b}"/>
    ${dot(124, 116, 4, b)}${dot(152, 122, 4, b)}${dot(178, 114, 4, b)}`,

  pastryBar: (a, b) => `
    <rect x="98" y="88" width="104" height="42" rx="15" ${g(a)}/>
    <path d="M98 100a15 15 0 0 1 15-12h74a15 15 0 0 1 15 12z" fill="${b}"/>
    ${line('M124 130v-42', '#00000018', 3)}${line('M176 130v-42', '#00000018', 3)}`,

  disc: (a, b) => `
    <circle cx="150" cy="98" r="44" ${g(a)}/>
    ${dot(132, 84, 6, b)}${dot(166, 92, 6, b)}${dot(142, 116, 6, b)}${dot(172, 120, 5, b)}${dot(118, 106, 5, b)}`,

  discStack: (a, b) => `
    <ellipse cx="150" cy="126" rx="52" ry="14" ${g(a)}/>
    <ellipse cx="150" cy="110" rx="52" ry="14" ${g(a)}/>
    <ellipse cx="150" cy="94" rx="52" ry="14" ${g(a)}/>
    <path d="M124 90q14 10 30 2 14-8 22 2-10 10-26 8-18-2-26-12z" fill="${b}"/>`,

  macaron: (a, b) => `
    <path d="M104 96a46 30 0 0 1 92 0z" ${g(a)}/>
    <rect x="104" y="96" width="92" height="16" rx="6" ${g(b)}/>
    <path d="M104 112a46 28 0 0 0 92 0z" ${g(a)}/>`,

  roll: (a, b) => `
    <circle cx="150" cy="96" r="46" ${g(a)}/>
    <path d="M150 96a20 20 0 0 1 20-20 40 40 0 0 1-40 40 30 30 0 0 1 30-30" fill="none" stroke="${b}" stroke-width="9" stroke-linecap="round"/>`,

  sushiRoll: (a, b, c) => `
    <circle cx="150" cy="96" r="46" ${g(a)}/>
    <circle cx="150" cy="96" r="34" fill="${b}"/>
    ${dot(150, 96, 11, c)}${dot(136, 82, 5, C.green)}${dot(166, 84, 5, C.orange)}`,

  wrapRoll: (a, b) => `
    <path d="M118 132V78a32 18 0 0 1 64 0v54z" ${g(a)}/>
    <ellipse cx="150" cy="78" rx="32" ry="18" ${g(b)}/>
    ${line('M126 96q24 10 48 0', '#00000022', 3)}`,

  foldedPastry: (a, b) => `
    <path d="M96 122a54 46 0 0 1 108 0z" ${g(a)}/>
    <path d="M96 122h108" fill="none" stroke="${INK}" stroke-width="2.4"/>
    ${line('M112 122q6-10 0-18', b, 3)}${line('M132 122q6-12 0-22', b, 3)}
    ${line('M168 122q-6-12 0-22', b, 3)}${line('M188 122q-6-10 0-18', b, 3)}`,

  dumplings: (a, b) => `
    <path d="M118 108a32 30 0 0 1 64 0 32 12 0 0 1-64 0z" ${g(a)}/>
    ${line('M134 94q8-10 16 0', b, 2.6)}${line('M150 92q8-10 16 2', b, 2.6)}
    ${dot(150, 79, 5, b)}
    <path d="M100 130a26 24 0 0 1 52 0z" ${g(a)}/>
    <path d="M148 130a26 24 0 0 1 52 0z" ${g(a)}/>
    ${line('M114 128q6-10 12-14', b, 2.4)}${line('M174 128q6-10 12-14', b, 2.4)}`,

  bowl: (a, b, c) => `
    <ellipse cx="150" cy="96" rx="58" ry="17" ${g(b)}/>
    <path d="M92 96a58 42 0 0 0 116 0z" ${g(a)}/>
    ${c ? `${dot(132, 92, 7, c)}${dot(160, 88, 7, c)}${dot(172, 98, 6, c)}${dot(142, 100, 6, c)}` : ''}`,

  noodleBowl: (a, b) => `
    <ellipse cx="150" cy="96" rx="58" ry="17" ${g(b)}/>
    <path d="M92 96a58 42 0 0 0 116 0z" ${g(a)}/>
    ${line('M112 94q12-12 24 0t24 0 24 0', INK, 3)}
    ${line('M118 86q12-10 22 0t22-2', INK, 3)}
    <path d="M176 60l22 8-4 6-22-8z" ${g(C.doughPale)}/>
    <path d="M180 52l22 8-4 6-22-8z" ${g(C.doughPale)}/>`,

  plate: (a, b) => `
    <ellipse cx="150" cy="114" rx="66" ry="22" ${g(C.white)}/>
    <ellipse cx="150" cy="112" rx="50" ry="15" fill="#00000010"/>
    <path d="M118 110a32 22 0 0 1 64 0z" ${g(a)}/>
    ${dot(124, 116, 6, b)}${dot(178, 116, 6, b)}`,

  sandwich: (a, b, c) => `
    <path d="M100 130l50-46 50 46z" ${g(a)}/>
    <path d="M114 118h72" fill="none" stroke="${b}" stroke-width="7" stroke-linecap="round"/>
    <path d="M122 110h56" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,

  toast: (a, b) => `
    <path d="M106 130V88a22 22 0 0 1 22-22h44a22 22 0 0 1 22 22v42z" ${g(a)}/>
    <ellipse cx="136" cy="96" rx="14" ry="10" fill="${b}"/>
    <ellipse cx="166" cy="102" rx="14" ry="10" fill="${b}"/>
    <ellipse cx="150" cy="116" rx="14" ry="9" fill="${b}"/>`,

  tartlet: (a, b) => `
    <path d="M100 104h100l-8 26H108z" ${g(C.crust)}/>
    <ellipse cx="150" cy="104" rx="50" ry="14" ${g(a)}/>
    ${dot(130, 102, 7, b)}${dot(152, 100, 7, b)}${dot(172, 104, 7, b)}`,

  cup: (a, b) => `
    <path d="M118 78h64l-7 54a8 8 0 0 1-8 7h-34a8 8 0 0 1-8-7z" ${g(C.white)}/>
    <rect x="112" y="62" width="76" height="18" rx="7" ${g(b)}/>
    <rect x="122" y="96" width="56" height="20" rx="4" fill="${a}" opacity=".9"/>
    ${line('M150 56v-8', b, 3)}`,

  glassCup: (a, b) => `
    <path d="M118 66h64l-8 66a6 6 0 0 1-6 5h-36a6 6 0 0 1-6-5z" ${g(C.white)}/>
    <path d="M122 96h56l-5 36a6 6 0 0 1-6 5h-34a6 6 0 0 1-6-5z" fill="${a}"/>
    <path d="M120 82h60l-1 14h-58z" fill="${b}"/>`,

  bottle: (a, b) => `
    <path d="M139 48h22v14l11 14v56a10 10 0 0 1-10 10h-24a10 10 0 0 1-10-10V76l11-14z" ${g(C.white)}/>
    <path d="M129 92h42v40a10 10 0 0 1-10 10h-22a10 10 0 0 1-10-10z" fill="${a}"/>
    <rect x="137" y="42" width="26" height="12" rx="4" ${g(b)}/>`,

  jar: (a, b) => `
    <rect x="112" y="72" width="76" height="62" rx="12" ${g(C.white)}/>
    <rect x="118" y="92" width="64" height="38" rx="8" fill="${a}"/>
    <rect x="116" y="58" width="68" height="16" rx="6" ${g(b)}/>`,

  block: (a, b) => `
    <path d="M104 96l32-18 60 10-32 18z" ${g(b)}/>
    <path d="M104 96v26l60 10V106z" ${g(a)}/>
    <path d="M164 106l32-18v26l-32 18z" ${g(b)}/>`,

  box: (a, b, c) => `
    ${dot(124, 78, 14, c)}${dot(150, 70, 16, C.leaf)}${dot(176, 78, 14, c)}
    <path d="M94 82h112v16H94z" ${g(b)}/>
    <path d="M100 98h100v32a6 6 0 0 1-6 6H106a6 6 0 0 1-6-6z" ${g(a)}/>`,

  paperBag: (a, b) => `
    <path d="M110 132V84l12-12h56l12 12v48z" ${g(a)}/>
    <path d="M110 84h80" fill="none" stroke="${INK}" stroke-width="2.4"/>
    <path d="M128 72a22 22 0 0 1 44 0z" ${g(b)}/>`,

  coffeeBag: (a, b) => `
    <path d="M112 132V72l10-10h56l10 10v60z" ${g(a)}/>
    <rect x="118" y="56" width="64" height="12" rx="4" ${g(b)}/>
    <ellipse cx="150" cy="100" rx="17" ry="24" transform="rotate(-24 150 100)" ${g(C.cream)}/>
    ${line('M142 116q10-16 16-32', INK, 2.6)}`,

  eggs: (a, b) => `
    <ellipse cx="122" cy="104" rx="19" ry="24" ${g(a)}/>
    <ellipse cx="150" cy="98" rx="19" ry="24" ${g(a)}/>
    <ellipse cx="178" cy="104" rx="19" ry="24" ${g(a)}/>
    <rect x="94" y="114" width="112" height="24" rx="9" ${g(b)}/>
    ${line('M136 122v8', '#00000022', 3)}${line('M164 122v8', '#00000022', 3)}`,

  apple: a => `
    <path d="M150 74c14-16 44-10 44 22 0 26-20 40-30 40-6 0-8-3-14-3s-8 3-14 3c-10 0-30-14-30-40 0-32 30-38 44-22z" ${g(a)}/>
    ${line('M150 74V56', C.greenDeep, 4)}
    <path d="M150 62c10-14 26-12 26-12s-2 16-16 16z" ${g(C.leaf)}/>`,

  banana: a => `
    <path d="M104 78c4 36 30 56 62 54 20-2 32-12 34-22-14 8-30 8-44 0-18-10-26-22-30-38z" ${g(a)}/>
    <path d="M104 78l-6-8 10-2z" ${g(C.greenDeep)}/>`,

  tomato: a => `
    <circle cx="150" cy="104" r="40" ${g(a)}/>
    <path d="M150 68l-18-10 14 12-20 2 20 8 24-8-20-2 14-12z" ${g(C.greenDeep)}/>
    <path d="M132 86a26 26 0 0 0-6 16" fill="none" stroke="${C.sugar}" stroke-width="5" stroke-linecap="round"/>`,

  carrot: a => `
    <path d="M150 136l-24-58 48 0z" ${g(a)}/>
    ${line('M138 96h18', '#ffffff55', 3)}${line('M144 112h14', '#ffffff55', 3)}
    <path d="M150 78c-16-6-22-22-22-22s18-2 26 10c2-14 16-20 16-20s6 18-6 28z" ${g(C.greenDeep)}/>`,

  cabbage: a => `
    <circle cx="150" cy="100" r="42" ${g(a)}/>
    ${line('M120 88q30 18 60 0', C.greenDeep, 3)}${line('M124 108q26 16 52 0', C.greenDeep, 3)}
    ${line('M150 58v20', C.greenDeep, 3)}`,

  onion: a => `
    <path d="M150 140c-24 0-38-16-38-34s16-30 38-30 38 12 38 30-14 34-38 34z" ${g(a)}/>
    ${line('M150 78v56', '#00000022', 3)}${line('M130 84q-6 26 4 48', '#00000022', 3)}${line('M170 84q6 26-4 48', '#00000022', 3)}
    ${line('M150 76l-10-20', C.greenDeep, 4)}${line('M150 76l10-22', C.greenDeep, 4)}`,

  cucumber: a => `
    <rect x="94" y="84" width="112" height="36" rx="18" transform="rotate(-8 150 102)" ${g(a)}/>
    ${dot(124, 98, 4, C.greenDeep)}${dot(150, 104, 4, C.greenDeep)}${dot(176, 98, 4, C.greenDeep)}`,

  potato: a => `
    <path d="M106 108c-6-22 14-38 40-38s54 12 50 34-28 32-52 32-32-6-38-28z" ${g(a)}/>
    ${dot(128, 96, 4, C.crustDeep)}${dot(158, 88, 4, C.crustDeep)}${dot(170, 110, 4, C.crustDeep)}${dot(138, 116, 4, C.crustDeep)}`,
};

/* ---- The menu -----------------------------------------------------------
   Every `art` name in catalogue.mjs appears here exactly once. A name with no
   recipe would silently draw nothing, so the catalogue test asserts the two
   lists match. */
const RECIPES = {
  croissant: ['crescent', BG.warm, C.dough, C.crust],
  painauchocolat: ['pastryBar', BG.warm, C.dough, C.choc],
  eclair: ['pastryBar', BG.rose, C.doughPale, C.choc],
  ulboov: ['pastryBar', BG.sand, C.dough, C.crustDeep],
  baguette: ['baton', BG.warm, C.dough, C.crustDeep],
  loaf: ['loafSliced', BG.warm, C.doughPale, C.crust],
  rye: ['roundLoaf', BG.sand, C.chocMid, C.cocoa],
  boortsog: ['baton', BG.sand, C.doughPale, C.crust],
  mantuu: ['dome', BG.warm, C.white, C.stone],
  redbean: ['dome', BG.rose, C.white, C.berry],
  bun: ['dome', BG.warm, C.dough, C.butter],
  scone: ['dome', BG.sand, C.doughPale, C.chocMid],
  bagel: ['ring', BG.warm, C.dough, C.crustDeep],
  doughnut: ['ring', BG.rose, C.dough, C.berry, C.rose],
  knot: ['ring', BG.warm, C.dough, C.sugar],
  muffin: ['muffin', BG.rose, C.chocMid, C.doughPale],
  cake: ['slice', BG.rose, C.cream, C.rose, C.berry],
  cheesecake: ['slice', BG.sand, C.cream, C.butter, C.orange],
  pie: ['slice', BG.warm, C.dough, C.crust, C.red],
  bananabread: ['slice', BG.sand, C.chocMid, C.doughPale, C.butter],
  quiche: ['slice', BG.sage, C.butter, C.dough, C.green],
  tiramisu: ['glassCup', BG.lilac, C.cream, C.cocoa],
  granola: ['glassCup', BG.sand, C.white, C.chocMid],
  brownie: ['bar', BG.sand, C.choc, C.cocoa],
  babka: ['roll', BG.sand, C.dough, C.choc],
  poppy: ['roll', BG.lilac, C.doughPale, C.night],
  cookie: ['disc', BG.warm, C.dough, C.choc],
  ricecake: ['disc', BG.mint, C.white, C.amber],
  pancake: ['discStack', BG.sand, C.dough, C.crustDeep],
  macaron: ['macaron', BG.rose, C.rose, C.cream],
  turnover: ['foldedPastry', BG.warm, C.dough, C.crustDeep],
  khuushuur: ['foldedPastry', BG.sand, C.doughPale, C.crust],
  kimbap: ['sushiRoll', BG.mint, C.night, C.white, C.red],
  wrap: ['wrapRoll', BG.sage, C.doughPale, C.leaf],
  buuz: ['dumplings', BG.sand, C.white, C.stone],
  dumpling: ['dumplings', BG.mint, C.white, C.stone],
  bansh: ['bowl', BG.sand, C.white, C.milk, C.doughPale],
  soup: ['bowl', BG.sand, C.white, C.orange, C.butter],
  stew: ['bowl', BG.rose, C.white, C.red, C.tomato],
  goulash: ['plate', BG.sand, C.chocMid, C.butter],
  ricebowl: ['bowl', BG.mint, C.white, C.milk, C.green],
  potatosalad: ['bowl', BG.sand, C.white, C.cream, C.butter],
  salad: ['bowl', BG.sage, C.white, C.leaf, C.greenDeep],
  yoghurt: ['jar', BG.mint, C.white, C.slate],
  kimchi: ['jar', BG.rose, C.red, C.stone],
  noodles: ['noodleBowl', BG.sage, C.plum, C.milk],
  noodlesoup: ['noodleBowl', BG.sand, C.crust, C.milk],
  coldnoodles: ['noodleBowl', BG.sky, C.slate, C.white],
  tsuivan: ['noodleBowl', BG.sand, C.chocMid, C.doughPale],
  tteok: ['bowl', BG.rose, C.white, C.red, C.white],
  cutlet: ['plate', BG.sand, C.crust, C.green],
  chicken: ['plate', BG.warm, C.crustDeep, C.butter],
  khorkhog: ['plate', BG.sand, C.chocMid, C.stone],
  sandwich: ['sandwich', BG.sage, C.doughPale, C.leaf, C.tomato],
  toastie: ['sandwich', BG.warm, C.dough, C.butter, C.crustDeep],
  toast: ['toast', BG.sage, C.dough, C.matcha],
  tart: ['tartlet', BG.sand, C.butter, C.amber],
  fruittart: ['tartlet', BG.rose, C.cream, C.berry],
  coffee: ['cup', BG.sand, C.coffee, C.crustDeep],
  latte: ['cup', BG.sand, C.milk, C.crust],
  mocha: ['cup', BG.sand, C.choc, C.cocoa],
  matcha: ['cup', BG.sage, C.matcha, C.greenDeep],
  chai: ['cup', BG.warm, C.tea, C.crustDeep],
  chocolate: ['cup', BG.rose, C.cocoa, C.choc],
  tea: ['cup', BG.warm, C.tea, C.amber],
  milktea: ['cup', BG.sand, C.milk, C.tea],
  coldbrew: ['bottle', BG.sand, C.coffee, C.crustDeep],
  icedcoffee: ['bottle', BG.sky, C.chocMid, C.crustDeep],
  juice: ['bottle', BG.warm, C.orange, C.green],
  smoothie: ['bottle', BG.rose, C.berry, C.rose],
  milk: ['bottle', BG.sky, C.white, C.slate],
  tarag: ['bottle', BG.mint, C.white, C.leaf],
  beans: ['coffeeBag', BG.sand, C.chocMid, C.cocoa],
  butter: ['block', BG.warm, C.butter, C.yellow],
  cheese: ['block', BG.warm, C.yellow, C.butter],
  curd: ['block', BG.mint, C.white, C.milk],
  aaruul: ['block', BG.sand, C.milk, C.doughPale],
  eggs: ['eggs', BG.sand, C.doughPale, C.ash],
  box: ['box', BG.warm, C.crust, C.dough, C.rose],
  fruitbox: ['box', BG.rose, C.crust, C.dough, C.red],
  vegbox: ['box', BG.sage, C.crust, C.dough, C.orange],
  breadbag: ['paperBag', BG.warm, C.doughPale, C.crust],
  apple: ['apple', BG.rose, C.red],
  banana: ['banana', BG.warm, C.yellow],
  tomato: ['tomato', BG.rose, C.tomato],
  carrot: ['carrot', BG.warm, C.orange],
  cabbage: ['cabbage', BG.sage, C.leaf],
  onion: ['onion', BG.lilac, C.doughPale],
  cucumber: ['cucumber', BG.sage, C.green],
  potato: ['potato', BG.sand, C.dough],
};

export const ART_NAMES = Object.keys(RECIPES);

/* Three crumbs placed from the name, so two cards drawn from the same recipe
   are not pixel-identical and the grid stops looking printed. */
function crumbs(name) {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  return [0, 1, 2].map(index => {
    const seed = (hash >> (index * 5)) & 31;
    const x = 44 + ((seed * 37) % 212);
    const y = 26 + (((seed * 53) >> 2) % 120);
    return dot(x, y, 2.6 + (seed % 3), '#00000012');
  }).join('');
}

const svg = name => {
  const [shape, background, ...colours] = RECIPES[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180" preserveAspectRatio="xMidYMid slice" role="presentation">`
    + `<rect width="300" height="180" fill="${background}"/>${crumbs(name)}${plate('#ffffff')}`
    + `${shadow}${SHAPES[shape](...colours)}<rect width="300" height="180" fill="none" stroke="${LINE}" stroke-width="2"/></svg>`;
};

/* Built once per name and kept: the same drawing goes on a card, a bag row and
   a merchant list, and re-encoding it each render is work for nothing. */
const cache = new Map();

export function foodArt(name) {
  if (!RECIPES[name]) return null;
  if (!cache.has(name)) cache.set(name, `data:image/svg+xml,${encodeURIComponent(svg(name))}`);
  return cache.get(name);
}

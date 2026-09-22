# Monty prototype asset credits

Real food photography is used for fictional demonstration offers; these photographs do not depict actual participating Ulaanbaatar merchants or establish the listed recipes, ingredients, or allergens. Replace them with each merchant's actual photographs before launch.

All five sample photographs are stored locally in `public/assets/` as 800-pixel-wide JPEGs. All three font families are stored locally as WOFF2 files. `npm run build` copies the assets into `dist/` and embeds the photographs, fonts and favicon into `Open Monty.html`. Reviewing the supplied demo needs no internet connection. Merchant-entered external photo links still need internet access.

The catalogue now holds six contracted shops and around twenty items each, so five photographs cannot cover it. Five listings keep a photograph and the rest carry a drawing; see **Food drawings** below.

## Food photographs

| Item | Photographer | Source | License |
| --- | --- | --- | --- |
| Croissant | Kyle Hinkson | [Unsplash photo](https://unsplash.com/photos/8aSR_-CHjPo) | [Unsplash License](https://unsplash.com/license) |
| Cinnamon bun on a plate | Phil Hearing | [Unsplash photo](https://unsplash.com/photos/a-close-up-of-a-sweet-cinnamon-bun-on-a-plate-i5XTK_FE6qo) | [Unsplash License](https://unsplash.com/license) |
| Kimbap roll with vegetables, egg and crab sticks | Devi Puspita Amartha Yahya | [Unsplash photo](https://unsplash.com/photos/sushi-rolls-on-white-ceramic-plate-0SMrPL058eU) | [Unsplash License](https://unsplash.com/license) |
| Berry cake slice | Diliara Garifullina | [Unsplash photo](https://unsplash.com/photos/sliced-of-strawberry-cake-on-plate-I48gnI1Qs5o) | [Unsplash License](https://unsplash.com/license) |
| Sourdough loaf | Kate Tepla | [Unsplash photo](https://unsplash.com/photos/a-freshly-baked-sourdough-bread-loaf-with-a-leaf-design-3BTqX4NJqXg) | [Unsplash License](https://unsplash.com/license) |

Source download URLs are recorded in `public/assets/photo-sources.json`; the application reads local paths from `public/assets/photos.json`. The downloaded photographs are resized and compressed by the source image service. Display cropping is applied by the interface.

## Food drawings

The ninety listings without a photograph carry an original flat-vector drawing from `src/foodart.mjs`. Each is built from a shared vocabulary — a bowl, a cup, a slice, a loaf, a block, a bottle — recoloured per item, so the whole catalogue reads as one set and the entire collection costs a few kilobytes rather than a few megabytes. They are generated as `data:` URIs at runtime, so they need no build step, no network and no extra files in `dist/`.

They are drawings and never claim otherwise: the item page says "Drawing, not a photograph: this shop has not sent one yet" wherever one is used. No generated, stock or third-party food imagery is involved, and no drawing is presented as a photograph of a real dish. `src/photos.js` resolves the three kinds of picture — a bundled photograph, a drawing name, and a link a merchant typed, which is never rewritten.

## Map and location

`src/geo.mjs` holds the shop coordinates and the named places a reader can stand on. They are real locations in Ulaanbaatar, recorded by hand for this prototype; no map data, tiles or geocoding service is used or redistributed. Distances are computed with the haversine formula against those coordinates, so "550 m" is arithmetic rather than a string somebody typed.

`src/components/MiniMap.jsx` draws the map. It is schematic on purpose: the street grid is decoration and is labelled as such in the caption, because real streets would mean licensed tiles and a network. The pins, the compass, the scale bar and the radius ring are all derived from the coordinates and are correct in direction and relative distance.

Nothing reads `navigator.geolocation`. The reader's own position is simulated, which the interface states on the map, in the location sheet and in the header. A production build replaces `locate()` in `src/geo.mjs` with the real permission flow and changes nothing else.

## Typography

Fraunces is used for the Monty wordmark and short display headlines, Nunito Sans for navigation, prices and body text. Both the customer app and the merchant/operations workspaces use this pairing. The families and type scale are declared in `src/tokens.css`, and the local font faces in `src/fonts.css`.

The Latin and Latin Extended subsets were downloaded from the Google Fonts CSS endpoint on 2026-09-21. Fraunces supports weights 400–700 with optical sizing and the SOFT 70 / WONK 1 settings; Nunito Sans supports weights 400–900. Local system fonts provide a fallback for unsupported characters.

### Cyrillic

Fraunces has no Cyrillic glyphs in any published subset, so it cannot set Mongolian. Literata sets the Mongolian display headings and is listed after Fraunces in `--font-display`: the browser resolves the family per character, so Latin headings still get Fraunces. Nunito Sans has its own Cyrillic subsets and keeps body text in the same typeface across both languages.

Mongolian uses Ө (U+04E8) and Ү (U+04AE), which sit in the `cyrillic-ext` range rather than the basic `cyrillic` one, so both subsets are bundled for each family. The four Cyrillic WOFF2 files were downloaded from the Google Fonts CSS endpoint on 2026-09-21 and total roughly 100 KB.

All three families are redistributed under SIL Open Font License 1.1. Complete copyright and license notices are included in `public/assets/fonts/Fraunces-OFL.txt`, `public/assets/fonts/NunitoSans-OFL.txt` and `public/assets/fonts/Literata-OFL.txt`, copied into `dist/`, and embedded in the standalone HTML source. Google Fonts family records: [Fraunces](https://github.com/google/fonts/tree/main/ofl/fraunces), [Nunito Sans](https://github.com/google/fonts/tree/main/ofl/nunitosans), [Literata](https://github.com/google/fonts/tree/main/ofl/literata).

## Monty identity

The companions and the coordinated interface icons are original artwork in `src/components/`. No 3D runtime, sprite sheet, animation library or external artwork service is required. Decorative illustrations do not represent purchasable food.

A reader picks a companion in the profile: Monty the loaf, a cat, a bankhar dog, a bunny, a lamb or a young bactrian camel. Each is a 28×28 pixel sprite with an anime face, written in `src/components/Pets.jsx` as a grid of characters and a palette that says what colour each character is; the code turns each colour into one SVG path, so a companion arrives as about a dozen paths and stays crisp at any size. They share one body, one pair of eyes and one neckerchief, and differ by ears, tail, markings and palette. Their movement is frame swapping rather than tweening — a one-pixel bob, a two-frame blink, a two-frame tail — defined in `src/components/identity.css`, and it stops entirely for a reader whose device asks for reduced motion. Tapping one shows a line of encouragement from the string catalogue. The animals are illustrations, not photographs of any animal, and no live animal is involved in the service.

`src/components/Mascot.jsx` holds the earlier hand-drawn vector loaf. Nothing imports it; it is kept because this handoff has no version control and the artwork would otherwise be lost. Delete it if the pixel cast is the final direction.

import { createWitnessTownLibrary } from "../utils/witnessKit";
import { createPaganNetworkKit } from "../utils/networkKit";
import { createParishKit } from "../utils/parishKit";
import { createCityKit } from "../utils/cityKit";

export const asciiToPixels = (
  ascii: string,
  palette: Record<string, string>,
): string[] => {
  const lines = ascii
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const pixels: string[] = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const char = lines[y]?.[x] || ".";
      pixels.push(palette[char] || "transparent");
    }
  }
  return pixels;
};

export const asciiToPixelsWH = (
  ascii: string,
  palette: Record<string, string>,
  width: number,
  height: number,
): string[] => {
  const lines = ascii
    .trim()
    .split("\n")
    .map((l) => l.trimEnd());
  const pixels: string[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = lines[y]?.[x] || ".";
      pixels.push(palette[char] || "transparent");
    }
  }
  return pixels;
};

// Shared palette for the Town of the Witness sprites: warm linen, marble,
// bronze and terracotta under the night, with star-glass cyan kept rare.
const familiarSpritePalette = {
  K: "#1A1410", // warm outline black
  k: "#2E2218", // deep shadow / eyes
  D: "#15121A", // void black (mouthstone, glass cores)
  d: "#2A2438", // dusk shadow
  N: "#4A4350", // ash stone
  S: "#D9A47E", // skin
  s: "#B5805C", // skin shade
  W: "#EDE4CE", // linen
  w: "#C7B999", // linen shade
  M: "#E5DFCE", // marble
  m: "#B4AC95", // marble shade
  H: "#4A3526", // dark hair
  h: "#948B78", // grey hair
  B: "#8A6B3C", // bronze
  b: "#5E4825", // bronze dark
  G: "#D9A648", // votive gold
  g: "#A87A2C", // gold dark
  T: "#B26A4B", // terracotta
  t: "#8A4D36", // terracotta dark
  O: "#74815B", // olive cloth
  o: "#4F5A3C", // olive dark
  I: "#3D4666", // indigo
  i: "#2A3050", // indigo dark
  P: "#C8B47A", // straw
  p: "#9C8A55", // straw dark
  C: "#A7D9DC", // star glass
  c: "#5FA3AC", // glass deep
  F: "#E8F7F5", // glass pale
  R: "#6E1320", // witness blood
  r: "#A32433", // blood bright
  Y: "#FFC46B", // flame
  y: "#FFF0CE", // flame core
  E: "#E2773C", // ember
};

// Brother Aldric: dark-haired churchman in his prime, short beard,
// cream chiton, olive stole.
const aldricPattern = `
................
......KKKK......
.....KHHHHK.....
....KHHHHHHK....
....KHSSSSHK....
....KSkSSkSK....
....KSSSSSSK....
....KHSssSHK....
.....KHSSHK.....
....KWWBWWWK....
...KWOWWWWOWK...
..KWWOWWWWOWWK..
..KsWOWWWWOWsK..
...KWWWWWWWWK...
....KwwKKwwK....
...KKK....KKK...
`;

// Acolyte Nessa: dark bob, undyed acolyte linen, indigo sash, a glass bead.
const nessaPattern = `
................
.....KHHHHK.....
....KHHHHHHK....
...KHHHHHHHHK...
...KHSSSSSSHK...
...KHSkSSkSHK...
...KHSSSSSSHK...
....KHSssSHK....
.....KSSSSK.....
....KWWWWWWK....
...KWWWCWWWWK...
..KWIIIIIIIIWK..
..KsWWWWWWWWsK..
...KWWWWWWWWK...
....KwwKKwwK....
...KKK....KKK...
`;

// The Provisioner: straw petasos hat, terracotta chiton, linen apron.
const merchantPattern = `
................
......PPPP......
....PPppppPP....
..PPPPPPPPPPPP..
...KSSSSSSSSK...
...KSkSSSSkSK...
....KSSssSSK....
.....KSSSSK.....
....KTTTTTTK....
...KTTWWWWTTK...
..KTsWWWWWWsTK..
..KTTWWWWWWTTK..
...KTTWWWWTTK...
....KTTTTTTK....
....KttKKttK....
...KKK....KKK...
`;

// Cyberghost: a star-glass wisp, conscious and unresolved.
const ghostPattern = `
................
......KCCK......
.....KCFFCK.....
....KCFFFFCK....
...KCFDFFDFCK...
...KCFFFFFFCK...
...KcCFFFFCcK...
....KcCFFCcK....
...KCCFFFFCCK...
..KCFFFCCFFFCK..
..KCFFCKKCFFCK..
...KcC.KK.CcK...
....Kc....cK....
.....K....K.....
................
................
`;

// The Mouthstone: a split black monolith, star-glass breathing in the seam.
const mouthstonePattern = `
....KKK..KKK....
...KDDK..KDDK...
...KDDKCCKDDK...
..KDDDKCCKDDDK..
..KDDDKCcKDDDK..
..KDdDKCCKDdDK..
..KDDDKcCKDDDK..
..KDDDKCCKDDDK..
.KDDDDKCKDDDDK..
.KDDDDKCKDDDDK..
.KDDDDDKDDDDDK..
.KNDDDDDDDDDNK..
KNNKDDDDDDKNNK..
.KK..KKKK...KK..
................
................
`;

// The Bleeding Witness: hooded marble votary, gold halo, weeping blood.
const witnessPattern = `
.....GGGGG......
....G.....G.....
....G.KMK.G.....
....KMMMMMK.....
....KMmmmMK.....
.....KMMMK......
....KMMMMMK.....
...KMMRMMMMK....
...KMMRMMMMK....
..KMMMRMMMMMK...
..KMMMRMMMMMK...
.KMMMMRMMMMMMK..
.KmmmmRmmmmmmK..
KMMMMMMMMMMMMMK.
KmmmmmmmmmmmmmK.
................
`;

// The wayside candle: votive flame on a marble dish.
const candlePattern = `
................
................
.......yy.......
......yYYy......
......YYYY......
.......YE.......
.......KK.......
......KWWK......
......KWwK......
......KWWK......
.....KMMMMK.....
....KMMMMMMK....
.....KmmmmK.....
................
................
................
`;

// Rite remnant: an ash-grey hooded residue with ember eyes, half-melted.
const riteRemnantPattern = `
.....KKKKK......
....KNNNNNK.....
...KNNNNNNNK....
...KNdddddNK....
...KNdEdEdNK....
...KNdddddNK....
....KNNNNNK.....
...KNNRNNNNK....
..KNNNRNNNNNK...
..KNdNRNNdNNK...
.KNNNNRNNNNNNK..
.KNNNNRNNNNNNK..
.KdNNNNNNNNdNK..
.KdddKKKKKdddK..
..KKK.....KKK...
................
`;

// Glass remnant: a partial conversion — jagged star-glass over a void core.
const glassRemnantPattern = `
.......KC.......
......KCFK......
..K..KCFFCK..K..
.KCK.KCFFCK.KCK.
.KCCKCFFFFCKCCK.
..KCCFFDDFFCCK..
..KCFFDDDDFFCK..
.KCFFFDDDDFFFCK.
.KCFFFFDDFFFFCK.
..KCCFFFFFFCCK..
...KCcFFFFcCK...
....KCcFFcCK....
.....KCccCK.....
......KCCK......
.......KK.......
................
`;

// Drowned echo: river dead, hair plastered down, glass flecks in wet cloth.
const drownedEchoPattern = `
....KHHHHHK.....
...KHHHHHHK.....
...KHSHSSHK.....
...KHkSSkHK.....
...KHSSsSHK.....
....KSSSSK......
...KIIIIIIK.....
..KIICIIICIIK...
..KsIIIIIIIsK...
...KIIIIIIIK....
...KiIIIIIiK....
....cKiIiKc.....
....c..c..c.....
....C..c..C.....
................
................
`;





// The Intercessor — the player. One who stands between: white
// knee-length chiton for the road, crimson himation draped from
// the left shoulder to the right hip (the threshold color), gold
// fillet band in dark auburn hair, bronze pendant of the office,
// road sandals.
const hero48Pattern = `
................................................
................................................
.....................OOOOOO.....................
...................OOHHHHHHOO...................
..................OHHHHHHHHHHO..................
.................OHHHHHHHHHHHhO.................
.................OHFFFFFFFFFFhO.................
.................OHSSSSSSSSSShO.................
..................OSSSSSSSSSsO..................
..................OSESSSSESSsO..................
..................OSSSSSSSSSsO..................
..................OSSSooSSSSsO..................
..................OsSSSSSSSsO...................
...................OsSSSSSsO....................
....................OSSSSO......................
.................OOOOSSSSOOOO...................
...............OORRRRRSSSSWWWOO.................
..............ORRRRRRROBBOWWWWO.................
.............ORRRRRRRRWBBWWWWWWO................
.............ORRrRRRRRRRWWWWWOSsO...............
.............ORRrWRRRRRRRWWWWOSsO...............
.............ORRrWWRRRRRRRWWWOSsO...............
.............ORRrWWWRRRRRRRWWOSsO...............
.............ORRrWWWWRRRRRRRWOSsO...............
.............ORRrWWWWWRRRRRRROSsO...............
.............ORRrWWWWWWRRRRRROSsO...............
.............ORRrWWWWWWWRRRRROSSO...............
.............ORRrWWWWWWWWrrrrOssO...............
.............ORRrWWWWWWWWWWWWOOO................
.............ORRrWWWWWWWWWWWWwO.................
.............OrrrWWWWWWWWWWWWwO.................
..............OWWWWWWWWWWWWWwO..................
..............OWWWWWWWWWWWWWwO..................
..............OwWWWWWWWWWWWwwO..................
..............OOOOOOOOOOOOOOOO..................
..................OSSOOSSO......................
..................OSSOOSSO......................
..................OLSOOSLO......................
..................OSSOOSSO......................
..................OSLOOLSO......................
..................OSSOOSSO......................
.................OOSSOOSSOO.....................
.................OLLSOOSLLO.....................
.................OOOOOOOOOO.....................
................................................
................................................
................................................
`;

const hero48Palette: Record<string, string> = {
  ".": "transparent",
  "O": "#1A1410", // warm outline
  "H": "#4A3526", // dark auburn hair
  "h": "#33241A", // hair shadow
  "F": "#D9A648", // gold fillet band
  "S": "#D9A47E", // skin
  "s": "#B5805C", // skin shadow
  "o": "#B5805C", // nose
  "E": "#2E2218", // eyes
  "W": "#EDE4CE", // white chiton
  "w": "#C7B999", // chiton shadow
  "R": "#7A1B26", // crimson himation
  "r": "#5A121B", // himation shadow
  "B": "#8A6B3C", // bronze pendant
  "L": "#5E4825", // sandal leather
};

// Brother Aldric — Nessa's familiar and mentor, a man in his
// prime, not an elder: dark chestnut hair, short beard, broad
// build. Ankle-length cream chiton, olive stole bearing
// votive-gold dark-light marks, bronze corded belt, sandals.
const aldric48Pattern = `
................................................
................................................
....................OOOOOOO.....................
..................OOHHHHHHHOO...................
.................OHHHHHHHHHHHO..................
.................OHHHHHHHHHHhO..................
.................OHSSSSSSSSShO..................
.................OHSSSSSSSSShO..................
.................OSSESSSSESSsO..................
.................OSSSSSSSSSSsO..................
.................OSSSSooSSSSsO..................
.................OHSSSSSSSSHhO..................
.................OHHsSSSSsHHhO..................
..................OHHSSSSHHhO...................
..................OOHhSShHOO....................
.................OOOOSSSSOOOO...................
..............OOVVVWOSSOWVVVOO..................
............OOWVVVVWWWWWWVVVVWOO................
...........OWWWVgVVWWWWWWVVgVWWWO...............
..........OWWWWVVVVWWWWWWVVVVWWWWO..............
..........OWWWWVVVVWWWWWWVVVVWWWwO..............
..........OWWWWVgVVWWWWWWVVgVWWWwO..............
..........OWwWWVVVVWWWWWWVVVVWWWwO..............
..........OWwWWVVVVWWWWWWVVVVWWWwO..............
..........OWwWWVgVVWWWWWWVVgVWWWwO..............
..........OWwWWVVVVWWWWWWVVVVWWWwO..............
..........OWwWWBBBBBBBBBBBBBBWWwO...............
..........OWwWWWBbBBbBBbBBbBWWWwO...............
...........OWwWVVVVWWWWWWVVVVWWwO...............
...........OWwWVgVVWWWWWWVVgVWWwO...............
...........OWwWVVVVWWWWWWVVVVWWwO...............
...........OWwWVVVVWWWWWWVVVVWwO................
...........OWwWVgVVWWWWWWVVgVWwO................
...........OWwWVVVVWWWWWWVVVVWwO................
...........OWwWVVVVWWWWWWVVVVWwO................
...........OWwWVVVVWWWWWWVVVVWwO................
...........OWwWVgVVWWWWWWVVgVWwO................
...........OWwWVVVVWWWWWWVVVVWwO................
...........OwwWVVVVWWWWWWVVVVwwO................
...........OOOOOOOOOOOOOOOOOOOO.................
...............OSSSSO..OSSSSO...................
..............OLSSSSO..OSSSSLO..................
..............OOOOOOO..OOOOOOO..................
................................................
................................................
................................................
................................................
`;

const aldric48Palette: Record<string, string> = {
  ".": "transparent",
  "O": "#1A1410", // warm outline
  "H": "#3B2A1A", // dark chestnut hair + beard
  "h": "#2A1D11", // hair shadow
  "S": "#D9A47E", // skin
  "s": "#B5805C", // skin shadow
  "o": "#B5805C", // nose
  "E": "#2E2218", // eyes
  "W": "#EDE4CE", // cream chiton
  "w": "#C7B999", // chiton shadow
  "V": "#74815B", // olive stole
  "v": "#4F5A3C", // stole shadow
  "g": "#D9A648", // votive gold marks
  "B": "#8A6B3C", // bronze corded belt
  "b": "#5E4825", // cord dark
  "L": "#5E4825", // sandal leather
};

// Acolyte Nessa — slight frame, black bob with a straight
// fringe, undyed prisoner's linen chiton, indigo acolyte sash,
// Mara's star-glass bead at her throat, barefoot in the gaol.
const nessa48Pattern = `
................................................
................................................
................................................
.....................OOOOOO.....................
....................OHHHHHHO....................
...................OHHHHHHHHO...................
...................OHHHHHHHHO...................
...................OHhhhhhhHO...................
...................OHSSSSSSHO...................
...................OHSESSESHO...................
...................OHSSSSSSHO...................
...................OHSSooSSHO...................
...................OhSSSSSShO...................
....................OsSSSSsO....................
.....................OSSSSO.....................
....................OOSSSSOO....................
...................OWWWCCWWWO...................
..................OWWWWWWWWWwO..................
.................OSOWWWWWWWWwOSO................
.................OSOWWWWWWWWwOsO................
.................OSOWWWWWWWWwOsO................
.................OSOWWWWWWWWwOsO................
.................OSOWWWWWWWWwOsO................
.................OSOIIIIIIIIiOsO................
.................OSOIiIIIIIiiOsO................
.................OSSOWWWWWWwOssO................
.................OsSOWWWWWWwOssO................
..................OOOWWWWWWwOO..................
..................OWwWWWWWWWwO..................
..................OWwWWWWWWWwO..................
..................OWwWWWWWWWwO..................
.................OWWwWWWWWWWwwO.................
.................OWWwWWWWWWWwwO.................
.................OWWwWWWWWWWwwO.................
................OWWWwWWWWWWWwwwO................
................OWWWwWWWWWWWwwwO................
................OWWWwWWWWWWWwwwO................
...............OWWWWwWWWWWWWwwwwO...............
...............OWWWWwWWWWWWWwwwwO...............
...............OOOOOOOOOOOOOOOOO................
..................OSSSO.OSSSO...................
..................OSSSO.OSSSO...................
..................OSSSO.OSSSO...................
.................OOSSSO.OSSSOO..................
.................OSSSSO.OSSSSO..................
.................OOOOO...OOOOO..................
................................................
................................................
`;

const nessa48Palette: Record<string, string> = {
  ".": "transparent",
  "O": "#1A1410", // warm outline
  "H": "#241D20", // black bob
  "h": "#3A3036", // hair sheen
  "S": "#E8C49C", // pale skin
  "s": "#C49872", // skin shadow
  "o": "#C49872", // nose
  "E": "#2E2218", // eyes
  "W": "#DCD3BD", // undyed linen
  "w": "#B3A88C", // linen shadow
  "I": "#3D4666", // indigo sash
  "i": "#2A3050", // indigo shadow
  "C": "#A7D9DC", // star-glass bead
};
// Town guard: bronze helm, pale tunic, spear at rest.
const guardPattern = `
................
.....KBBBBK.....
....KBbBBbBK....
....KBBBBBBK..G.
....KSSSSSSK..K.
....KSkSSkSK..K.
.....KSssSK...K.
....KWWWWWWK..K.
...KWWBBBBWWK.K.
..KWsWBBBBWsKKK.
..KWWWWWWWWWK.K.
...KWWWWWWWK..K.
....KwwKKwwK..K.
...KKK....KKK.K.
................
................
`;

// Warden Sefa: worn leather, ring of keys, tired eyes.
const gaolerPattern = `
................
.....KHHHHK.....
....KHhHHhHK....
....KSSSSSSK....
....KSkSSkSK....
....KSsSSsSK....
.....KSssSK.....
....KTTTTTTK....
...KTtTTTTtTK...
..KTsTTTTTTsTK..
..KTTTGKGTTTTK..
...KTTTTTTTTK...
....KttKKttK....
...KKK....KKK...
................
................
`;

// Father Imre: white vestments, gold stole, thinning grey hair.
const priestPattern = `
................
......KhhK......
.....KhhhhK.....
....KSSSSSSK....
....KSkSSkSK....
....KSSssSSK....
.....KSSSSK.....
....KWWWWWWK....
...KWGWWWWGWK...
..KWWGWWWWGWWK..
..KsWGWWWWGWsK..
...KWWWWWWWWK...
....KwwKKwwK....
...KKK....KKK...
................
................
`;

// Maro the innkeep: rolled sleeves, terracotta apron, flour on one cheek.
const innkeepPattern = `
................
.....KHHHHK.....
....KHHHHHHK....
....KSSSSSWK....
....KSkSSkSK....
....KSSssSSK....
.....KSSSSK.....
....KWWWWWWK....
...KsWTTTTWsK...
..KSWTTtTTTWSK..
..KSWTTTTTTWSK..
...KWTTttTTWK...
....KwwKKwwK....
...KKK....KKK...
................
................
`;

// Sela: grey shawl drawn up, river-worn, eyes that count you kindly.
const elderPattern = `
................
.....KhhhhK.....
....KhhhhhhK....
...KhhSSSShhK...
...KhSkSSkShK...
...KhSSssSShK...
....KhSSSShK....
...KhhhhhhhhK...
..KhhWWWWWWhhK..
..KshWWWWWWhsK..
...KhWWWWWWhK...
...KhhWWWWhhK...
....KwwKKwwK....
...KKK....KKK...
................
................
`;

// Petra the stonecutter: terracotta work-tunic, marble dust on the shoulders.
const masonPattern = `
................
.....KHHHHK.....
....KHHhHHHK....
....KSSSSSSK....
....KSkSSkSK....
....KSSssSSK....
.....KSSSSK.....
...KMTTTTTTMK...
...KTTTTTTTTK...
..KTsTTtTTTsTK..
..KTTTTTTTTTTK..
...KTTttTTTTK...
....KttKKttK....
...KKK....KKK...
................
................
`;

// Liss: olive dress, hands that are never still, grief held properly.
const motherPattern = `
................
.....KHHHHK.....
....KHHHHHHK....
....KSSSSSSK....
....KSkSSkSK....
....KSSssSSK....
.....KSSSSK.....
....KOOOOOOK....
...KOOoOOoOOK...
..KOsOOOOOOsOK..
..KOOOOOOOOOOK..
...KOOooOOOOK...
....KooKKooK....
...KKK....KKK...
................
................
`;

// Cosmas the pilgrim: road-dust hood, a staff taller than his patience.
const pilgrimPattern = `
..............P.
.....KIIIIK...P.
....KIIIIIIK..P.
...KIiSSSSiIK.P.
...KISkSSkSIK.P.
...KISSssSSIK.P.
....KISSSSIK..P.
....KIIIIIIK..P.
...KIIiIIiIIK.P.
..KIsIIIIIIsKPP.
..KIIIIIIIIIK.P.
...KIIiiIIIK..P.
....KiiKKiiK..P.
...KKK....KKK.P.
................
................
`;

// The Riverman: low hood, dark river coat, face mostly suggestion.
const ferrymanPattern = `
................
.....KiiiiK.....
....KiiiiiiK....
...KiidddiiiK...
...KidSSSdiiK...
...KidkSkdiiK...
....KdsssdiK....
....KIIIIIIK....
...KIiIIIIiIK...
..KIsIIIIIIsIK..
..KIIiIIIIiIIK..
...KIIIIIIIIK...
....KiiKKiiK....
...KKK....KKK...
................
................
`;

const stonePattern = `
................
................
......DDDD......
.....DDLLDD.....
....DDLLLLDD....
....DDLLLLDD....
.....DDDDDD.....
......DDDD......
................
................
................
................
................
................
................
................
`;

const potionPattern = `
................
.......RR.......
......RRRR......
.......RR.......
......WGGW......
.....WGGGGW.....
....WGGGGGGW....
....WGGGGGGW....
....WGGGGGGW....
.....WGGGGW.....
......WWWW......
................
................
................
................
................
`;

const shardPattern = `
................
........L.......
.......LCL......
......LCCCL.....
.....LCCCCCL....
....LCCCCCL.....
...LCCCL........
..LCL...........
.L..............
................
................
................
................
................
................
................
`;

const keyPattern = `
................
................
....YYYY........
...Y....Y.......
...Y....Y.......
....YYYYYYYYY...
.......Y...Y.Y..
................
................
................
................
................
................
................
................
................
`;

const votivePattern = `
................
................
.......Y........
......YOY.......
.......Y........
......WWWW......
......WWWW......
......WWWW......
......WWWW......
......WWWW......
.......WW.......
................
................
................
................
................
`;

const baseSpriteLibraryPresets = [
  {
    id: "spr_itm_carried_stone",
    display_name: "Carried Stone",
    width: 16,
    height: 16,
    pixels: asciiToPixelsWH(stonePattern, familiarSpritePalette, 16, 16),
  },
  {
    id: "spr_itm_health_potion",
    display_name: "Health Potion",
    width: 16,
    height: 16,
    pixels: asciiToPixelsWH(potionPattern, familiarSpritePalette, 16, 16),
  },
  {
    id: "spr_itm_glass_shard",
    display_name: "Glass Shard",
    width: 16,
    height: 16,
    pixels: asciiToPixelsWH(shardPattern, familiarSpritePalette, 16, 16),
  },
  {
    id: "spr_itm_archive_key",
    display_name: "Archive Key",
    width: 16,
    height: 16,
    pixels: asciiToPixelsWH(keyPattern, familiarSpritePalette, 16, 16),
  },
  {
    id: "spr_itm_votive",
    display_name: "Votive Candle",
    width: 16,
    height: 16,
    pixels: asciiToPixelsWH(votivePattern, familiarSpritePalette, 16, 16),
  },
  {
    id: "spr_hero",
    display_name: "Player Intercessor",
    width: 22,
    height: 44,
    data_url: "data:image/png;base64,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",
  },
  {
    id: "spr_nessa",
    display_name: "Acolyte Nessa",
    width: 24,
    height: 44,
    data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAsCAYAAAB/nHhDAAAITElEQVR4AcyWa2xcxRXHf/fevft+2btrx7FjJ06w48TG0CQUkgAqEKCoUAnUUqEilLYfItGqLaKCtEVIFaUFSmkFbYVoKR8qQYuglVAiilKjKCGhqZwoifPCdhy/n5t9eu/u3ldn7WxsN1mnXyp1NGee55z/zJwzZ0bmf5z+PwDq3XVW29od9s0bnrfXd75sf2Gzbe/YMk+3db5kd6y4y96yfpt9tcO45g7qqzbboRWqVBvcjWR/jHn6p0xOP4Jtf4bMJB7ntwlFmhkdHmHrxoeuAFkWYE1TzA4E+qny3YWlHGA268ez+X2K+iTnzt5DPL1tbtE+74uEogWmEum5/uJiWYAoTiJVzzOWGGA8+QtSU4eJ5EdZs/J3rFm7k0ymmVTu69i4CPu3kZv+dLHuufayACgFZH8bxdQg6YvrmLV0XN4HkZUULvUO6mt3ER88KlZegyRFcFZ3zildXCwLkImvQtP2C2EZtXoADROxXCRrC8mJF1Cc7YTqZxm4YDE7+z4h3wk2Nj+4xA7LAqStPGOjB3BHNrPa9zR1rhDgFhgp8J3BLJ5DUW7GH+4gV9yGJ/gStq4JnoW8LEA0NoCVn4LMGXK2QsPGXwrJPJZYY9j3CphHmIpn8YXPUB3owe1oxc4OCp6FvCyAotQgy04K1VNM9L1GdvYF7MlmJFygehiYPkIheRI8u5DUNhJ2gbRts7X9HrGEeRB5vrp6aRS2kcz1M34hybg2Qu+0k7z/uxTMt+g7/iha/iJVbc+RGniHnp4PGex9gmQ+TiKrXla4LEDRNigWs9iWJIxrkRZueqLvN0zGu3C1vUnI38T46aeQDQ3FWy944xTEkc5MHL42wN1bDtgTo3twOsME3RHWdr6IU1YJhTeTz42hnfkW6dwA1294ko3t7/H5DR9wY+vT+F01tLavvTbA6PR9qIFmGlflwdSIWaOsWnEHaXOa61repKWjn/Y1f0V13I4imcgOkOxR0feQzdRRTnK5cUUtuTCtAoHIXhzuGNOJs8TCEayZo+i5T4SyIVQ1L3bYgUO9HUsfx6ncTTR6C6nszGV1FQFUZRVSfpxcvotwbBBtphvZ/U2itbcylfq7UNoibNOCaYQECRNRJ+7EFjzuHjRt+r8AcGwS0VJm8txvmTlvi6Mpkpz5CuEVu8gnepg18wiPnFNk2v/CMI9jWAfJ6BMC3DM3Xioq7sDlepi66GYaGj04Gr5M43U3kxgr4LByGKqfI8dqOXI0wMmeBg4du4ORvmeZHHiGXKKJ6mB9SfccVQQw9G5MxS0uFdTI+6nz7gZ3lFxqF5GmnyDLDjytXyPc9g6yswqqNhFr/B6hYD+ypFJOlQHMYWzJIQzWTiDQiiStZ3XjWgaHbNB7qRfGTJz+I6nUQ2JOQS/GcTibcDlj5PXZsn4qAlj6IZyuQ3htk9mUn+GhR+kdHsYKNtN34Q080R1UiSOMD2qoYqeynsbmBiRCeD0hyqkigNf/OlauA1cwTXT1y2QVVYSAYbTkWWwjzsW+V3EXMvjEioOBdfhUL7ZDeJR4M46efk9c/XmIigAHT9wk6Q4PespDov/7SEaOQHUnLv86cVurqV/fRX3LW6xr+z3Z5HEmtSlhsyEK+vC85ktlRYDSvI8gtc2PU92wh2h1FUbqpLjUYyJUjJM5/0UYfwZt7EXEyyNcVkGyTuFUIyXRy7QsQFXsCVSzHtk4SMS3m42f+zNbOz/gpk3vsrK1G1fDh4SqOgk7a5BsjUz8qyJsiFB+WT2VjVzicYgzRe5AdW7HtlLEux8mp72AwywI0LeRrX043Q+JB6dbsMtohXvFhesT7YW87A6gBctyC6OCLSkMywozKQNJvlucyk6hZTuS1IhpBilYpggrU+SL94nxhVwR4Mb6B4TDC8ZSKYFpnCMiAqA29U8MPY8pSBLSslQgaznRC5MgqyiKUwgtZMGy0FnckoQypIUR3TyPryFF2L8aXRa7olc8MG/z2dQPmBkvootHR7IMVHX/gpBoVQSw9QQinFJOFzNDqPr9nLp4TBrsvYGRk3cxPPgaMa+H6uYtOEGsXkFOt4nWQpYXmktbJroYSAkS5y+OKZs6w6mhd6XSgBLppXbjIE1rugh6HqfJ8xhFEZv6R7uk49NdczwlvhJVBLDzQrkIASUmyxrCryyEYKlwv/CW19GK96JZr9Lf/xxueal7luRKVBFAdUWEt5RYIJHdSTI/Md8plble4tpu+kcKnB8+y6rVPyYa21aauYIqAiQlm4nJ9WTzT9Jf/JRC6dt4SdznCBL17mfDmndY3/gHXFKWoG+pcS+xVr5osmmQ0W7gRN9fsEY8BMUHoCxU8JxiLPlzegYe4MK5HWR7fwR6oDy9pK64A6fDT23gNja17GN1Uy1+b/iy4KmBack2Z1lVU0Nj6wV8goKhP12eX9yoDICNo3YdwapPcHquR3E4FsvhNbwiqj4G1hsiDv2aQFBfMl/uVARAeIVfn8LI7BQ/5ghu976yzHztyhCOriAS+w6x0FNIyp3z4/9RVgQoSqqILR9hlrxa3APDvHeJqOI4TXz6Z+TSCEcQlHQvmS93KgJI6kfiqsXn+Cyr9CwenGuXC0W+k9liHbr1MYaxh4whYlF5clF9VYDtN07YmviKG8V+SvHIEjtQHLexONmsZGq4i+EzOxk9/0Pxw76VmBIQnIu5uNJNt7Z/wx67cA8UviQek1swzL+RIkIht/BbK6lIzJzEim3CsfJZXJFHcKx4GCXUTkdd5xIQucRcpu2dv7JHJvqE/8QIid8EyigpvVs8nOvoPvcPqcxXqgfieyXScS4mX2FQ2ksuc5hY9Tgnx48v4fs3AAAA//8X6doBAAAABklEQVQDAFRMQI8G81aLAAAAAElFTkSuQmCC",
  },
  {
    id: "spr_aldric",
    display_name: "Brother Aldric",
    width: 26,
    height: 47,
    data_url: "data:image/png;base64,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",
  },
  {
    id: "spr_merchant",
    display_name: "Supply Provisioner",
    width: 16,
    height: 16,
    pixels: asciiToPixels(merchantPattern, familiarSpritePalette),
  },
  {
    id: "spr_ghost",
    display_name: "Cyberghost",
    width: 16,
    height: 16,
    pixels: asciiToPixels(ghostPattern, familiarSpritePalette),
  },
  {
    id: "spr_mouthstone",
    display_name: "Mouthstone Gate",
    width: 16,
    height: 16,
    pixels: asciiToPixels(mouthstonePattern, familiarSpritePalette),
  },
  {
    id: "spr_witness",
    display_name: "Bleeding Witness",
    width: 16,
    height: 16,
    pixels: asciiToPixels(witnessPattern, familiarSpritePalette),
  },
  {
    id: "spr_candle",
    display_name: "Save Candle",
    width: 16,
    height: 16,
    pixels: asciiToPixels(candlePattern, familiarSpritePalette),
  },
  {
    id: "spr_rite_remnant",
    display_name: "Rite Remnant",
    width: 16,
    height: 16,
    pixels: asciiToPixels(riteRemnantPattern, familiarSpritePalette),
  },
  {
    id: "spr_glass_remnant",
    display_name: "Glass Remnant",
    width: 16,
    height: 16,
    pixels: asciiToPixels(glassRemnantPattern, familiarSpritePalette),
  },
  {
    id: "spr_drowned_echo",
    display_name: "Drowned Echo",
    width: 16,
    height: 16,
    pixels: asciiToPixels(drownedEchoPattern, familiarSpritePalette),
  },
  {
    id: "spr_guard",
    display_name: "Town Guard",
    width: 16,
    height: 16,
    pixels: asciiToPixels(guardPattern, familiarSpritePalette),
  },
  {
    id: "spr_gaoler",
    display_name: "Warden Sefa",
    width: 16,
    height: 16,
    pixels: asciiToPixels(gaolerPattern, familiarSpritePalette),
  },
  {
    id: "spr_priest",
    display_name: "Father Imre",
    width: 16,
    height: 16,
    pixels: asciiToPixels(priestPattern, familiarSpritePalette),
  },
  {
    id: "spr_innkeep",
    display_name: "Maro the Innkeep",
    width: 16,
    height: 16,
    pixels: asciiToPixels(innkeepPattern, familiarSpritePalette),
  },
  {
    id: "spr_elder",
    display_name: "Sela",
    width: 16,
    height: 16,
    pixels: asciiToPixels(elderPattern, familiarSpritePalette),
  },
  {
    id: "spr_mason",
    display_name: "Petra the Stonecutter",
    width: 16,
    height: 16,
    pixels: asciiToPixels(masonPattern, familiarSpritePalette),
  },
  {
    id: "spr_mother",
    display_name: "Liss",
    width: 16,
    height: 16,
    pixels: asciiToPixels(motherPattern, familiarSpritePalette),
  },
  {
    id: "spr_pilgrim",
    display_name: "Cosmas the Pilgrim",
    width: 16,
    height: 16,
    pixels: asciiToPixels(pilgrimPattern, familiarSpritePalette),
  },
  {
    id: "spr_ferryman",
    display_name: "The Riverman",
    width: 16,
    height: 16,
    pixels: asciiToPixels(ferrymanPattern, familiarSpritePalette),
  },
];

type IllustratedSpriteDefinition = {
  display_name: string;
  width: number;
  height: number;
  data_url: string;
  pixels: string[];
};

const characterSpriteOverrides: Record<string, IllustratedSpriteDefinition> = {
  spr_hero: {
    display_name: "Player Pilgrim",
    width: 384,
    height: 512,
    data_url: "/sprites/player-pilgrim.png",
    pixels: [],
  },
  spr_nessa: {
    display_name: "Acolyte Nessa",
    width: 401,
    height: 512,
    data_url: "/sprites/acolyte-nessa.png",
    pixels: [],
  },
  spr_aldric: {
    display_name: "Brother Aldric",
    width: 341,
    height: 512,
    data_url: "/sprites/brother-aldric.png",
    pixels: [],
  },
  spr_high_clerk: {
    display_name: "High Clerk",
    width: 267,
    height: 512,
    data_url: "/sprites/npcs/high-clerk.png",
    pixels: [],
  },
  spr_warden_sefa: {
    display_name: "Warden Sefa",
    width: 226,
    height: 512,
    data_url: "/sprites/npcs/warden-sefa.png",
    pixels: [],
  },
  spr_guard_bren: {
    display_name: "Cordon Guard Bren",
    width: 317,
    height: 512,
    data_url: "/sprites/npcs/cordon-guard-bren.png",
    pixels: [],
  },
  spr_guard_holt: {
    display_name: "Gate Guard Holt",
    width: 253,
    height: 512,
    data_url: "/sprites/npcs/gate-guard-holt.png",
    pixels: [],
  },
  spr_father_imre: {
    display_name: "Father Imre",
    width: 243,
    height: 512,
    data_url: "/sprites/npcs/father-imre.png",
    pixels: [],
  },
  spr_maro_counted_cup: {
    display_name: "Maro of the Counted Cup",
    width: 260,
    height: 512,
    data_url: "/sprites/npcs/maro-counted-cup.png",
    pixels: [],
  },
  spr_sela: {
    display_name: "Sela, the Widow's Cousin",
    width: 290,
    height: 512,
    data_url: "/sprites/npcs/sela.png",
    pixels: [],
  },
  spr_petra_stonecutter: {
    display_name: "Petra the Stonecutter",
    width: 240,
    height: 512,
    data_url: "/sprites/npcs/petra-stonecutter.png",
    pixels: [],
  },
  spr_liss: {
    display_name: "Liss",
    width: 204,
    height: 512,
    data_url: "/sprites/npcs/liss.png",
    pixels: [],
  },
  spr_cosmas_pilgrim: {
    display_name: "Cosmas the Pilgrim",
    width: 239,
    height: 512,
    data_url: "/sprites/npcs/cosmas-pilgrim.png",
    pixels: [],
  },
  spr_riverman: {
    display_name: "The Riverman",
    width: 247,
    height: 512,
    data_url: "/sprites/npcs/riverman.png",
    pixels: [],
  },
  spr_provisioner_dimos: {
    display_name: "Provisioner Dimos",
    width: 306,
    height: 512,
    data_url: "/sprites/npcs/provisioner-dimos.png",
    pixels: [],
  },
  spr_cyberghost: {
    display_name: "Cyberghost",
    width: 392,
    height: 512,
    data_url: "/sprites/npcs/cyberghost.png",
    pixels: [],
  },
  spr_wayside_candle: {
    display_name: "Wayside Candle",
    width: 379,
    height: 512,
    data_url: "/sprites/npcs/wayside-candle.png",
    pixels: [],
  },
  spr_lazare_vampire: {
    display_name: "Lazare Behind the Shutters",
    width: 450,
    height: 512,
    data_url: "/sprites/npcs/the lonely vampire.png",
    pixels: [],
  },
};

const baseSpritePresetIds = new Set(baseSpriteLibraryPresets.map((sprite) => sprite.id));

export const spriteLibraryPresets = [
  ...baseSpriteLibraryPresets.map((sprite) => {
    const override = characterSpriteOverrides[sprite.id];
    return override ? { ...sprite, ...override } : sprite;
  }),
  ...Object.entries(characterSpriteOverrides)
    .filter(([id]) => !baseSpritePresetIds.has(id))
    .map(([id, sprite]) => ({ id, ...sprite })),
];

const legacyObjectLibraryPresets = [
  {
    id: "obj_wall_brick",
    display_name: "Black-Star Church Wall",
    category: "structure",
    tags: ["tile", "wall"],
    origin: "center_floor",
    bounds: [1, 2.4, 1],
    materials: ["#241D20", "#4D382D", "#8A3A22", "#CFCFCF"],
    parts: [
      {
        shape: "box",
        name: "dark_stone_core",
        position: [0, 1.1, 0],
        size: [1, 2.2, 1],
        rotation: [0, 0, 0],
        material: "#241D20",
      },
      {
        shape: "box",
        name: "front_blood_brick",
        position: [-0.24, 1.55, 0.51],
        size: [0.38, 0.18, 0.04],
        rotation: [0, 0, 0],
        material: "#8A3A22",
      },
      {
        shape: "box",
        name: "front_old_brick",
        position: [0.28, 0.85, 0.51],
        size: [0.42, 0.18, 0.04],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "left_buttress",
        position: [-0.44, 1.05, 0],
        size: [0.12, 2.1, 1.08],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "right_buttress",
        position: [0.44, 1.05, 0],
        size: [0.12, 2.1, 1.08],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "pale_lintel",
        position: [0, 2.23, 0],
        size: [1.08, 0.12, 1.08],
        rotation: [0, 0, 0],
        material: "#CFCFCF",
      },
      {
        shape: "box",
        name: "black_star_cap",
        position: [0, 2.34, 0],
        size: [0.82, 0.08, 0.82],
        rotation: [0, 0, 0],
        material: "#110E13",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_floor_stone",
    display_name: "Veined Marble Pathway",
    category: "structure",
    tags: ["tile", "floor"],
    origin: "center_floor",
    bounds: [1, 0.1, 1],
    materials: ["#D8D1C8", "#F4EFE7", "#A89F97", "#70E8FF", "#8A0006"],
    parts: [
      {
        shape: "box",
        name: "marble_base",
        position: [0, 0.025, 0],
        size: [1, 0.05, 1],
        rotation: [0, 0, 0],
        material: "#D8D1C8",
      },
      {
        shape: "box",
        name: "polished_center",
        position: [-0.08, 0.06, -0.04],
        size: [0.78, 0.018, 0.72],
        rotation: [0, 0.03, 0],
        material: "#F4EFE7",
      },
      {
        shape: "box",
        name: "grey_vein_long",
        position: [-0.22, 0.075, 0.04],
        size: [0.7, 0.012, 0.045],
        rotation: [0, 0.48, 0],
        material: "#A89F97",
      },
      {
        shape: "box",
        name: "grey_vein_short",
        position: [0.28, 0.08, -0.22],
        size: [0.35, 0.012, 0.035],
        rotation: [0, -0.36, 0],
        material: "#A89F97",
      },
      {
        shape: "box",
        name: "glass_inlay",
        position: [0.32, 0.09, 0.28],
        size: [0.12, 0.012, 0.36],
        rotation: [0, -0.42, 0],
        material: "#70E8FF",
      },
      {
        shape: "box",
        name: "blood_hairline",
        position: [-0.34, 0.092, -0.3],
        size: [0.2, 0.01, 0.025],
        rotation: [0, 0.2, 0],
        material: "#8A0006",
      },
    ],
    collision: { profile: "none", footprint: [[0, 0]] },
    is_walkable: true,
  },
  {
    id: "obj_floor_dirt",
    display_name: "Black Soil Floor",
    category: "structure",
    tags: ["tile", "floor"],
    origin: "center_floor",
    bounds: [1, 0.1, 1],
    materials: ["#1F1815", "#4D382D", "#34251E"],
    parts: [
      {
        shape: "box",
        name: "soil_base",
        position: [0, 0.02, 0],
        size: [1, 0.04, 1],
        rotation: [0, 0, 0],
        material: "#1F1815",
      },
      {
        shape: "box",
        name: "burial_pebble",
        position: [0.3, 0.05, -0.28],
        size: [0.14, 0.02, 0.12],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "root_mark",
        position: [-0.2, 0.055, 0.25],
        size: [0.42, 0.018, 0.08],
        rotation: [0, 0.45, 0],
        material: "#34251E",
      },
    ],
    collision: { profile: "none", footprint: [[0, 0]] },
    is_walkable: true,
  },
  {
    id: "obj_wall_stone",
    display_name: "Old Stone Wall",
    category: "structure",
    tags: ["tile", "wall"],
    origin: "center_floor",
    bounds: [1, 1.8, 1],
    materials: ["#2E2F37", "#4D382D", "#70E8FF"],
    parts: [
      {
        shape: "box",
        name: "rough_core",
        position: [0, 0.9, 0],
        size: [1, 1.8, 1],
        rotation: [0, 0, 0],
        material: "#2E2F37",
      },
      {
        shape: "box",
        name: "mortar_gash",
        position: [0, 1.2, 0.51],
        size: [0.7, 0.08, 0.03],
        rotation: [0, 0.2, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "glass_vein",
        position: [-0.32, 0.65, 0.52],
        size: [0.08, 0.55, 0.03],
        rotation: [0, 0, 0.2],
        material: "#70E8FF",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_floor_wood",
    display_name: "Dark Wooden Floor",
    category: "structure",
    tags: ["tile", "floor"],
    origin: "center_floor",
    bounds: [1, 0.1, 1],
    materials: ["#3B2117", "#5A3320"],
    parts: [
      {
        shape: "box",
        name: "board_left",
        position: [-0.26, 0.025, 0],
        size: [0.48, 0.05, 1],
        rotation: [0, 0, 0],
        material: "#3B2117",
      },
      {
        shape: "box",
        name: "board_right",
        position: [0.25, 0.025, 0],
        size: [0.48, 0.05, 1],
        rotation: [0, 0, 0],
        material: "#5A3320",
      },
    ],
    collision: { profile: "none", footprint: [[0, 0]] },
    is_walkable: true,
  },
  {
    id: "obj_water",
    display_name: "Black River Water",
    category: "structure",
    tags: ["tile", "water"],
    origin: "center_floor",
    bounds: [1, 0.1, 1],
    materials: ["#07141C", "#237C86", "#8A0006"],
    parts: [
      {
        shape: "box",
        name: "dark_surface",
        position: [0, 0.01, 0],
        size: [1, 0.02, 1],
        rotation: [0, 0, 0],
        material: "#07141C",
      },
      {
        shape: "box",
        name: "river_sheen",
        position: [-0.16, 0.03, 0.12],
        size: [0.72, 0.01, 0.08],
        rotation: [0, 0.3, 0],
        material: "#237C86",
      },
      {
        shape: "box",
        name: "blood_thread",
        position: [0.24, 0.035, -0.22],
        size: [0.34, 0.01, 0.05],
        rotation: [0, -0.35, 0],
        material: "#8A0006",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_mouthstone_gate",
    display_name: "Mouthstone Exile Gate",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    origin: "center_floor",
    bounds: [3, 4.2, 3],
    materials: ["#100D14", "#1A1620", "#4D382D", "#4100C2", "#70E8FF"],
    parts: [
      {
        shape: "box",
        name: "buried_base",
        position: [0, 0.12, 0],
        size: [3.2, 0.24, 2.1],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "left_black_slab",
        position: [-0.62, 2.05, 0],
        size: [0.9, 4.1, 0.72],
        rotation: [0, 0, -0.04],
        material: "#100D14",
      },
      {
        shape: "box",
        name: "right_black_slab",
        position: [0.62, 2.05, 0],
        size: [0.9, 4.1, 0.72],
        rotation: [0, 0, 0.04],
        material: "#100D14",
      },
      {
        shape: "box",
        name: "inner_split",
        position: [0, 2.1, 0.39],
        size: [0.18, 3.55, 0.06],
        rotation: [0, 0, 0],
        material: "#4100C2",
      },
      {
        shape: "box",
        name: "cold_edge",
        position: [0.03, 2.4, 0.43],
        size: [0.05, 2.4, 0.04],
        rotation: [0, 0, 0.08],
        material: "#70E8FF",
      },
      {
        shape: "box",
        name: "left_foot",
        position: [-1.25, 0.35, 0.2],
        size: [0.75, 0.42, 1.2],
        rotation: [0, 0.14, 0],
        material: "#1A1620",
      },
      {
        shape: "box",
        name: "right_foot",
        position: [1.25, 0.35, -0.15],
        size: [0.75, 0.42, 1.2],
        rotation: [0, -0.14, 0],
        material: "#1A1620",
      },
    ],
    collision: {
      profile: "custom_footprint",
      footprint: [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ],
    },
    is_walkable: false,
  },
  {
    id: "obj_bleeding_witness",
    display_name: "Bleeding Witness Statue",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    origin: "center_floor",
    bounds: [3, 3.2, 2],
    materials: ["#CFCFCF", "#8A0006", "#4D382D", "#100D14"],
    parts: [
      {
        shape: "box",
        name: "lower_plinth",
        position: [0, 0.16, 0],
        size: [2.8, 0.32, 1.6],
        rotation: [0, 0, 0],
        material: "#4D382D",
      },
      {
        shape: "box",
        name: "upper_plinth",
        position: [0, 0.48, 0],
        size: [2.0, 0.3, 1.15],
        rotation: [0, 0, 0],
        material: "#CFCFCF",
      },
      {
        shape: "box",
        name: "robe_mass",
        position: [0, 1.35, 0],
        size: [0.72, 1.45, 0.45],
        rotation: [0, 0, 0],
        material: "#CFCFCF",
      },
      {
        shape: "sphere",
        name: "head",
        position: [0, 2.2, 0],
        size: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],
        material: "#CFCFCF",
      },
      {
        shape: "box",
        name: "left_arm",
        position: [-0.55, 1.65, 0.02],
        size: [0.72, 0.18, 0.22],
        rotation: [0, 0, -0.3],
        material: "#CFCFCF",
      },
      {
        shape: "box",
        name: "right_arm",
        position: [0.55, 1.65, 0.02],
        size: [0.72, 0.18, 0.22],
        rotation: [0, 0, 0.3],
        material: "#CFCFCF",
      },
      {
        shape: "box",
        name: "blood_from_face",
        position: [0.08, 1.86, 0.25],
        size: [0.08, 0.82, 0.05],
        rotation: [0, 0, -0.08],
        material: "#8A0006",
      },
      {
        shape: "box",
        name: "blood_on_plinth",
        position: [0.35, 0.68, 0.58],
        size: [0.62, 0.08, 0.08],
        rotation: [0, -0.2, 0],
        material: "#8A0006",
      },
      {
        shape: "ring",
        name: "dark_halo",
        position: [0, 2.2, -0.12],
        size: [1.0, 0.04, 1.0],
        segments: 18,
        rotation: [0, 0, 0],
        material: "#100D14",
      },
    ],
    collision: {
      profile: "custom_footprint",
      footprint: [
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ],
    },
    is_walkable: false,
  },
  {
    id: "obj_tree",
    display_name: "Pine Tree",
    category: "nature",
    tags: ["prop", "nature"],
    origin: "center_floor",
    bounds: [0.8, 1.4, 0.8],
    materials: ["#4a3c31", "#2d5a27"],
    parts: [
      {
        shape: "box",
        name: "trunk",
        position: [0, -0.25, 0],
        size: [0.3, 0.5, 0.3],
        rotation: [0, 0, 0],
        material: "#4a3c31",
      },
      {
        shape: "box",
        name: "leaves1",
        position: [0, 0.25, 0],
        size: [0.8, 0.5, 0.8],
        rotation: [0, 0, 0],
        material: "#2d5a27",
      },
      {
        shape: "box",
        name: "leaves2",
        position: [0, 0.75, 0],
        size: [0.6, 0.5, 0.6],
        rotation: [0, 0, 0],
        material: "#2d5a27",
      },
      {
        shape: "box",
        name: "leaves3",
        position: [0, 1.15, 0],
        size: [0.4, 0.5, 0.4],
        rotation: [0, 0, 0],
        material: "#2d5a27",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_bush",
    display_name: "Thick Bush",
    category: "nature",
    tags: ["prop", "nature"],
    origin: "center_floor",
    bounds: [0.6, 0.6, 0.6],
    materials: ["#2d5a27"],
    parts: [
      {
        shape: "box",
        name: "leaves1",
        position: [0, 0.3, 0],
        size: [0.6, 0.6, 0.6],
        rotation: [0, 0, 0],
        material: "#2d5a27",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_pew",
    display_name: "Wooden Pew",
    category: "prop",
    tags: ["prop", "furniture"],
    origin: "center_floor",
    bounds: [1, 0.7, 0.6],
    materials: ["#3d2817"],
    parts: [
      {
        shape: "box",
        name: "seat",
        position: [0, 0.25, -0.05],
        size: [0.95, 0.1, 0.4],
        rotation: [0, 0, 0],
        material: "#3d2817",
      },
      {
        shape: "box",
        name: "backrest",
        position: [0, 0.45, -0.2],
        size: [0.95, 0.4, 0.1],
        rotation: [0, 0, 0],
        material: "#3d2817",
      },
      {
        shape: "box",
        name: "leg1",
        position: [-0.4, 0.1, 0],
        size: [0.1, 0.2, 0.5],
        rotation: [0, 0, 0],
        material: "#3d2817",
      },
      {
        shape: "box",
        name: "leg2",
        position: [0.4, 0.1, 0],
        size: [0.1, 0.2, 0.5],
        rotation: [0, 0, 0],
        material: "#3d2817",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_podium",
    display_name: "Reading Podium",
    category: "prop",
    tags: ["prop", "furniture"],
    origin: "center_floor",
    bounds: [0.6, 1.2, 0.6],
    materials: ["#543b23", "#ffffff"],
    parts: [
      {
        shape: "cylinder",
        name: "base",
        position: [0, 0.5, 0],
        size: [0.2, 1.0],
        rotation: [0, 0, 0],
        material: "#543b23",
      },
      {
        shape: "box",
        name: "foot",
        position: [0, 0.05, 0],
        size: [0.5, 0.1, 0.5],
        rotation: [0, 0, 0],
        material: "#543b23",
      },
      {
        shape: "box",
        name: "top",
        position: [0, 1.05, 0],
        size: [0.6, 0.1, 0.4],
        rotation: [0.3, 0, 0],
        material: "#543b23",
      },
      {
        shape: "box",
        name: "book",
        position: [0, 1.12, 0],
        size: [0.4, 0.05, 0.3],
        rotation: [0.3, 0, 0],
        material: "#ffffff",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_chest",
    display_name: "Treasure Chest",
    category: "prop",
    tags: ["prop", "container"],
    origin: "center_floor",
    bounds: [0.6, 0.5, 0.4],
    materials: ["#8b5a2b", "#4a3c31"],
    parts: [
      {
        shape: "box",
        name: "base",
        position: [0, -0.2, 0],
        size: [0.6, 0.4, 0.4],
        rotation: [0, 0, 0],
        material: "#8b5a2b",
      },
      {
        shape: "box",
        name: "lid",
        position: [0, 0.05, 0],
        size: [0.62, 0.1, 0.42],
        rotation: [0, 0, 0],
        material: "#4a3c31",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_barrel",
    display_name: "Wooden Barrel",
    category: "prop",
    tags: ["prop", "container"],
    origin: "center_floor",
    bounds: [0.42, 0.6, 0.42],
    materials: ["#8b5a2b", "#222222"],
    parts: [
      {
        shape: "box",
        name: "base",
        position: [0, -0.2, 0],
        size: [0.4, 0.6, 0.4],
        rotation: [0, 0, 0],
        material: "#8b5a2b",
      },
      {
        shape: "box",
        name: "ring1",
        position: [0, 0.0, 0],
        size: [0.42, 0.05, 0.42],
        rotation: [0, 0, 0],
        material: "#222222",
      },
      {
        shape: "box",
        name: "ring2",
        position: [0, -0.4, 0],
        size: [0.42, 0.05, 0.42],
        rotation: [0, 0, 0],
        material: "#222222",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_table",
    display_name: "Wooden Table",
    category: "prop",
    tags: ["prop", "furniture"],
    origin: "center_floor",
    bounds: [0.8, 0.6, 0.6],
    materials: ["#6b4423"],
    parts: [
      {
        shape: "box",
        name: "top",
        position: [0, 0.2, 0],
        size: [0.8, 0.1, 0.6],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "leg1",
        position: [-0.35, -0.15, -0.25],
        size: [0.1, 0.6, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "leg2",
        position: [0.35, -0.15, -0.25],
        size: [0.1, 0.6, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "leg3",
        position: [-0.35, -0.15, 0.25],
        size: [0.1, 0.6, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "leg4",
        position: [0.35, -0.15, 0.25],
        size: [0.1, 0.6, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_grass_tuft",
    display_name: "Grass Tuft",
    category: "nature",
    tags: ["prop", "nature", "grass"],
    origin: "center_floor",
    bounds: [0.6, 0.4, 0.6],
    materials: ["#2d5a27", "#3c7a33"],
    parts: [
      {
        shape: "box",
        name: "blade1",
        position: [-0.1, -0.4, 0],
        size: [0.05, 0.3, 0.05],
        rotation: [0, 0, 0.2],
        material: "#2d5a27",
      },
      {
        shape: "box",
        name: "blade2",
        position: [0.1, -0.35, 0.1],
        size: [0.05, 0.4, 0.05],
        rotation: [0, 0, -0.1],
        material: "#3c7a33",
      },
      {
        shape: "box",
        name: "blade3",
        position: [0, -0.3, -0.1],
        size: [0.05, 0.5, 0.05],
        rotation: [0.1, 0, 0],
        material: "#2d5a27",
      },
    ],
    collision: { profile: "none", footprint: [[0, 0]] },
    is_walkable: true,
  },
  {
    id: "obj_dead_tree",
    display_name: "Dead Tree",
    category: "nature",
    tags: ["prop", "nature"],
    origin: "center_floor",
    bounds: [0.8, 1.4, 0.8],
    materials: ["#3a332d", "#4f453c"],
    parts: [
      {
        shape: "box",
        name: "trunk",
        position: [0, -0.25, 0],
        size: [0.2, 0.8, 0.2],
        rotation: [0, 0, 0],
        material: "#3a332d",
      },
      {
        shape: "box",
        name: "branch1",
        position: [0.2, 0.2, 0],
        size: [0.4, 0.1, 0.1],
        rotation: [0, 0, 0.5],
        material: "#4f453c",
      },
      {
        shape: "box",
        name: "branch2",
        position: [-0.15, 0.4, 0.15],
        size: [0.3, 0.1, 0.1],
        rotation: [0.3, -0.5, -0.3],
        material: "#4f453c",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_fence_stone",
    display_name: "Stone Fence",
    category: "structure",
    tags: ["prop", "fence"],
    origin: "center_floor",
    bounds: [1, 0.6, 0.4],
    materials: ["#545454", "#666666"],
    parts: [
      {
        shape: "box",
        name: "base",
        position: [0, -0.2, 0],
        size: [1, 0.6, 0.25],
        rotation: [0, 0, 0],
        material: "#545454",
      },
      {
        shape: "box",
        name: "cap",
        position: [0, 0.15, 0],
        size: [1, 0.1, 0.35],
        rotation: [0, 0, 0],
        material: "#666666",
      },
      {
        shape: "box",
        name: "pillar1",
        position: [-0.4, 0, 0],
        size: [0.2, 0.8, 0.3],
        rotation: [0, 0, 0],
        material: "#666666",
      },
      {
        shape: "box",
        name: "pillar2",
        position: [0.4, 0, 0],
        size: [0.2, 0.8, 0.3],
        rotation: [0, 0, 0],
        material: "#666666",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_lantern_post",
    display_name: "Lantern Post",
    category: "prop",
    tags: ["prop", "light"],
    origin: "center_floor",
    bounds: [0.4, 1.5, 0.4],
    materials: ["#2d2d2d", "#ffdd77"],
    parts: [
      {
        shape: "box",
        name: "pole",
        position: [0, 0, 0],
        size: [0.1, 1.2, 0.1],
        rotation: [0, 0, 0],
        material: "#2d2d2d",
      },
      {
        shape: "box",
        name: "base",
        position: [0, -0.45, 0],
        size: [0.3, 0.1, 0.3],
        rotation: [0, 0, 0],
        material: "#2d2d2d",
      },
      {
        shape: "box",
        name: "lantern",
        position: [0, 0.7, 0],
        size: [0.25, 0.35, 0.25],
        rotation: [0, 0, 0],
        material: "#ffdd77", // Emissive color basically
      },
      {
        shape: "box",
        name: "roof",
        position: [0, 0.9, 0],
        size: [0.35, 0.1, 0.35],
        rotation: [0, 0, 0],
        material: "#2d2d2d",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
  {
    id: "obj_well",
    display_name: "Stone Well",
    category: "prop",
    tags: ["prop", "structure"],
    origin: "center_floor",
    bounds: [0.8, 1, 0.8],
    materials: ["#4a4a4a", "#6b4423", "#1e1e1e"],
    parts: [
      {
        shape: "cylinder",
        name: "base",
        position: [0, -0.2, 0],
        size: [0.4, 0.6],
        rotation: [0, 0, 0],
        material: "#4a4a4a",
      },
      {
        shape: "cylinder",
        name: "hole",
        position: [0, 0.05, 0],
        size: [0.3, 0.1],
        rotation: [0, 0, 0],
        material: "#1e1e1e",
      },
      {
        shape: "box",
        name: "post1",
        position: [0.35, 0.2, 0],
        size: [0.1, 1.0, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "post2",
        position: [-0.35, 0.2, 0],
        size: [0.1, 1.0, 0.1],
        rotation: [0, 0, 0],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "roof1",
        position: [0.2, 0.8, 0],
        size: [0.5, 0.1, 0.6],
        rotation: [0, 0, 0.4],
        material: "#6b4423",
      },
      {
        shape: "box",
        name: "roof2",
        position: [-0.2, 0.8, 0],
        size: [0.5, 0.1, 0.6],
        rotation: [0, 0, -0.4],
        material: "#6b4423",
      },
    ],
    collision: { profile: "single", footprint: [[0, 0]] },
    is_walkable: false,
  },
];

const witnessStatueAssetPreset = {
  id: "obj_bleeding_witness",
  display_name: "Witness of the Dark Lights",
  category: "setpiece",
  tags: ["prop", "setpiece", "interactable", "statue", "glb", "nine_tile"],
  origin: "center_floor",
  bounds: [2.85, 3.721, 2.827],
  materials: ["asset_material_1"],
  material_settings: [],
  model_kind: "asset",
  parts: [],
  decals: [],
  reference_images: [],
  asset: {
    data_url: "/models/weeping-liberty-witness.glb",
    filename: "weeping-liberty-witness.glb",
    source_type: "glb",
    offset: [0, 0.953033, 0.001957],
    rotation: [0, 0, 0],
    scale: [1.952213, 1.952213, 1.952213],
    source_min: [-0.729941, -0.953033, -0.726027],
    source_center: [0, 0, -0.001957],
    source_bounds: [1.459882, 1.906066, 1.44814],
    material_names: ["asset_material_1"],
    stats: {
      meshes: 1,
      vertices: 10946,
      triangles: 13124,
      materials: 1,
      textures: 4,
      bytes: 10458360,
    },
  },
  collision: {
    profile: "custom_footprint",
    footprint: [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ],
  },
};

const mouthstoneGateAssetPreset = {
  id: "obj_mouthstone_gate",
  display_name: "Mouthstone Exile Gate",
  category: "setpiece",
  tags: ["prop", "setpiece", "interactable", "gate", "glb", "three_tile"],
  origin: "center_floor",
  bounds: [3, 8.05, 1.32],
  materials: ["asset_material_1"],
  material_settings: [],
  model_kind: "asset",
  parts: [],
  decals: [],
  reference_images: [],
  asset: {
    data_url: "/models/golden-hummingbirds-mouthstone.glb",
    filename: "golden-hummingbirds-mouthstone.glb",
    source_type: "glb",
    offset: [0.000041, 0.950048, 0.000814],
    rotation: [0, -3.141593, 0],
    scale: [4.239761, 4.239761, 4.239761],
    source_min: [-0.353834, -0.950048, -0.156439],
    source_center: [-0.000041, -0.000708, -0.000814],
    source_bounds: [0.707587, 1.89868, 0.31125],
    material_names: ["asset_material_1"],
    stats: {
      meshes: 1,
      vertices: 140041,
      triangles: 235532,
      materials: 1,
      textures: 4,
      bytes: 15409896,
    },
  },
  collision: {
    profile: "custom_footprint",
    footprint: [
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
  },
};

const baseObjectLibraryPresets = [
  ...createWitnessTownLibrary(),
  ...createPaganNetworkKit(),
  ...createParishKit(),
  ...createCityKit(),
];

export const objectLibraryPresets = baseObjectLibraryPresets.map((object) =>
  object.id === witnessStatueAssetPreset.id
    ? witnessStatueAssetPreset
    : object.id === mouthstoneGateAssetPreset.id
      ? mouthstoneGateAssetPreset
      : object,
);

// Alderamontico open world - Day 1 town pass.
//
// This generator authors the 300x300 town as a playable layout first:
// social districts, roads, tiers, gates, hidden entrances, and encounter
// staging. It intentionally stays greybox/practical and uses the existing
// parish, network, witness, and city model kits.

import {
  cellsRegion,
  createMap,
  rect,
  type Vec2,
} from "../utils/mapAuthoring";
import { parishTheme } from "../utils/parishTheme";
import { validateMap, formatProblems } from "../utils/mapValidator";
import "../utils/parishStamps";

export const OPENWORLD_W = 300;
export const OPENWORLD_H = 300;

const MIN_X = -150;
const MIN_Z = -150;
const WX0 = -124;
const WX1 = 124;
const WZ0 = -118;
const WZ1 = 118;

type Builder = ReturnType<typeof createMap>;
type Condition = Record<string, unknown>;

const testimonyGate: Condition = {
  any: [
    { switch: "testimonies_gathered" },
    { all: [{ switch: "testimony_dimos" }, { switch: "testimony_orin" }] },
    { all: [{ switch: "testimony_dimos" }, { switch: "testimony_marta" }] },
    { all: [{ switch: "testimony_orin" }, { switch: "testimony_marta" }] },
  ],
};

const caveOpenCondition: Condition = {
  all: [
    { switch: "act1_assigned" },
    { switch: "lazare_talked" },
    testimonyGate,
  ],
};

export const generateOpenWorldCells = () => {
  const m = createMap({
    width: OPENWORLD_W,
    height: OPENWORLD_H,
    minX: MIN_X,
    minZ: MIN_Z,
    theme: parishTheme,
    seed: 0x414c4445,
  });

  m.fill("floor.turf");
  carveEdges(m);
  carveDistrictFloors(m);
  carveRiver(m);
  carveCaveBand(m);
  buildTownWalls(m);
  buildRoadNetwork(m);
  buildAuthorityTier(m);
  buildWitnessSquare(m);
  buildMarketAndInn(m);
  buildResidentialQuarters(m);
  buildRiverAndGlassworks(m);
  buildCavesAndHiddenPlaces(m);
  placeFactionNPCs(m);
  placeTriggers(m);

  m.spawn({ id: "spawn_start", at: [0, -146], facing: "south" });
  m.spawn({ id: "spawn_plaza", at: [0, -24], facing: "north" });
  m.spawn({ id: "spawn_prison", at: [68, -54], facing: "east" });
  m.spawn({ id: "spawn_cave_return", at: [138, 58], facing: "west" });
  m.spawn({ id: "spawn_from_network", at: [-20, 104], facing: "north" });

  const result = m.build();
  const errs = validateMap(result).filter((p) => p.severity === "error");
  if (errs.length) console.warn("[openworld_gen] lint\n" + formatProblems(errs));
  return result;
};

function carveEdges(m: Builder) {
  // Old Exile Road and four visible approaches.
  m.road([[0, -150], [0, -118]], { width: 5, kind: "floor.road" });
  m.road([[0, 118], [0, 149]], { width: 5, kind: "floor.road" });
  m.road([[-150, 20], [-124, 20]], { width: 5, kind: "floor.road" });
  m.road([[124, 58], [149, 58]], { width: 5, kind: "floor.road" });

  m.scatter({
    in: rect(-148, -148, 148, -122),
    weighted: [["nature.tree.dark", 0.55], ["nature.tree", 0.25], ["nature.shrub", 0.2]],
    density: 0.045,
    minSpacing: 2,
    rngStream: "north_field",
  });
  m.scatter({
    in: rect(-148, 122, 148, 148),
    weighted: [["nature.tree.dark", 0.35], ["nature.tree", 0.25], ["nature.shrub", 0.4]],
    density: 0.05,
    minSpacing: 2,
    rngStream: "south_field",
  });
}

function carveDistrictFloors(m: Builder) {
  // Broad district surfaces before road and object passes.
  m.tier(rect(-58, -112, 86, -44), 2);
  m.tier(rect(-44, -42, 46, 28), 1);
  m.tier(rect(-5, -118, 5, -113), 1);
  m.tier(rect(-5, -43, 5, -43), 1);
  m.tier(rect(50, -43, 56, -43), 1);
  m.tier(rect(62, -43, 66, -42), 1);
  m.pave(rect(-58, -112, 86, -44), "floor.flagstone");
  m.pave(rect(-44, -42, 46, 28), "floor.cobble");
  m.pave(rect(-5, -118, 5, -113), "floor.cobble");
  m.pave(rect(-5, -43, 5, -43), "floor.cobble");
  m.pave(rect(50, -43, 56, -43), "floor.cobble");
  m.pave(rect(62, -43, 66, -42), "floor.cobble");
  m.pave(rect(-104, -30, -38, 42), "floor.turf");
  m.pave(rect(-116, 36, -24, 108), "floor.turf");
  m.pave(rect(42, -8, 114, 56), "floor.turf");
  m.pave(rect(-132, 70, 118, 112), "floor.mud");
  m.pave(rect(-124, 58, -72, 102), "floor.flagstone");
  m.pave(rect(112, 32, 149, 86), "floor.turf");
  m.pave(rect(-86, 116, 86, 149), "obj_net_floor_soil");

  // Retaining lines that make the sacred tiers read as real terraces.
  m.seal({ along: "z", at: -112, from: -58, to: 86, gaps: [-4, -3, -2, -1, 0, 1, 2, 3, 4] });
  m.seal({ along: "x", at: -58, from: -112, to: -44 });
  m.seal({ along: "x", at: 86, from: -112, to: -44 });
  m.seal({ along: "z", at: -44, from: -58, to: 86, gaps: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 52, 53, 54] });
  m.seal({ along: "z", at: -42, from: -44, to: 46, gaps: [-4, -3, -2, -1, 0, 1, 2, 3, 4] });
  for (let x = -4; x <= 4; x++) m.place({ at: [x, -113], role: "stairs", facing: "south", block: false });
  for (let x = -5; x <= 5; x++) {
    m.place({ at: [x, -43], role: "stairs", facing: "south", block: false });
    m.place({ at: [x, -41], role: "stairs", facing: "south", block: false });
  }
  for (let x = 52; x <= 54; x++) m.place({ at: [x, -43], role: "stairs", facing: "south", block: false });
  for (let x = 62; x <= 66; x++) m.place({ at: [x, -43], role: "stairs", facing: "south", block: false });
}

function carveRiver(m: Builder) {
  for (let x = -132; x <= 118; x++) {
    const center = 90 + Math.round(Math.sin((x + 18) * 0.055) * 5);
    m.pave(rect(x, center - 3, x, center + 3), "obj_water");
    m.setWalk(rect(x, center - 3, x, center + 3), false);
    m.pave(rect(x, center - 5, x, center - 4), "floor.mud");
    m.pave(rect(x, center + 4, x, center + 5), "floor.mud");
  }
}

function carveCaveBand(m: Builder) {
  m.pave(rect(-18, 116, 18, 126), "obj_net_floor_catacomb");
  m.pave(rect(-12, 127, 12, 142), "obj_net_floor_ritual");
  m.pave(rect(-82, 130, -58, 146), "obj_net_floor_catacomb");
  m.pave(rect(48, 126, 82, 146), "obj_net_floor_soil");
  m.pave(rect(-3, 143, 3, 149), "obj_net_water");
  m.setWalk(rect(-3, 143, 3, 149), false);

  // Cave retaining walls and ossuary edges.
  for (let x = -86; x <= 86; x++) {
    m.wall([x, 115], "obj_net_wall_catacomb");
  }
  for (let z = 116; z <= 149; z++) {
    m.wall([-87, z], "obj_net_wall_catacomb");
    m.wall([87, z], "obj_net_wall_catacomb");
  }
  for (let x = -20; x <= 20; x++) {
    if (Math.abs(x) <= 3) continue;
    m.wall([x, 126], "obj_net_wall_catacomb");
  }
}

function buildTownWalls(m: Builder) {
  const gateHalf = 4;
  const skipNorth = (x: number) => Math.abs(x) <= gateHalf;
  const skipSouth = (x: number) => Math.abs(x) <= gateHalf;
  const skipWest = (z: number) => Math.abs(z - 20) <= gateHalf || (z >= 88 && z <= 98);
  const skipEast = (z: number) => Math.abs(z - 58) <= gateHalf;

  for (let x = WX0; x <= WX1; x++) {
    if (!skipNorth(x)) m.wall([x, WZ0], "wall.fieldstone");
    if (!skipSouth(x)) m.wall([x, WZ1], "wall.fieldstone");
  }
  for (let z = WZ0; z <= WZ1; z++) {
    if (!skipWest(z)) m.wall([WX0, z], "wall.fieldstone");
    if (!skipEast(z)) m.wall([WX1, z], "wall.fieldstone");
  }

  m.place({ at: [0, -118], role: "lych_gate", facing: "south", footprint: rect(-1, -118, 1, -118) });
  m.place({ at: [0, 118], role: "lych_gate", facing: "north", footprint: rect(-1, 118, 1, 118) });
  m.place({ at: [-124, 20], role: "lych_gate", facing: "east", footprint: rect(-124, 19, -124, 21) });
  m.place({ at: [124, 58], role: "lych_gate", facing: "west", footprint: rect(124, 56, 124, 60) });

  for (const at of [[-124, -118], [124, -118], [-124, 118], [124, 118]] as Vec2[]) {
    m.place({ at, role: "bell_tower", footprint: rect(at[0] - 1, at[1] - 1, at[0] + 1, at[1] + 1) });
  }

  // The only monolith gate on the map. It blocks exactly three road cells.
  m.place({
    at: [0, -138],
    role: "obj_mouthstone_gate",
    facing: "south",
    dialogue: "dia_mouthstone",
    footprint: cellsRegion([[-1, -138], [0, -138], [1, -138]]),
  });
  m.place({ at: [-5, -134], role: "shrine_stone", facing: "east" });
  m.place({ at: [5, -134], role: "votive_token", block: false });
  for (const at of [[-9, -142], [9, -142], [-10, -130], [10, -130]] as Vec2[]) {
    m.place({ at, role: "nature.tree.dark" });
  }
}

function buildRoadNetwork(m: Builder) {
  // Procession Road: the one route a new player can always use for orientation.
  m.road([[0, -118], [0, -104], [0, -84], [0, -44], [0, -10], [0, 28], [-10, 52], [-20, 84], [-20, 104], [0, 116]], { width: 5, kind: "floor.cobble" });

  // Authority routes: office, custody hall, upper graveyard, and the visible stair breaks.
  m.road([[0, -84], [28, -84], [54, -76]], { width: 3, kind: "floor.flagstone" });
  m.road([[54, -76], [70, -66], [76, -54]], { width: 3, kind: "floor.flagstone" });
  m.road([[0, -84], [-26, -90], [-40, -92]], { width: 3, kind: "floor.flagstone" });
  m.road([[0, -44], [28, -44], [54, -44], [76, -54]], { width: 3, kind: "floor.flagstone" });

  // Witness square is a ring, not a puddle of cobble. It has four readable exits.
  m.road([[-40, -36], [-44, -8], [-34, 24], [0, 32], [34, 24], [44, -8], [34, -36], [0, -42], [-40, -36]], { width: 3, kind: "floor.cobble" });
  m.road([[-116, 20], [-102, 18], [-82, 4], [-58, 12], [-24, 4], [0, -10], [34, -12], [76, -54]], { width: 3, kind: "floor.cobble" });
  m.road([[0, -10], [42, 8], [82, 24], [98, 32], [116, 48], [138, 58]], { width: 3, kind: "floor.road" });

  // Market, inn, and lower industry spines. These are the high traffic routes.
  m.road([[-82, -30], [-82, -4], [-82, 24], [-82, 54], [-82, 84]], { width: 3, kind: "floor.road" });
  m.road([[-58, 12], [-64, 38], [-82, 64], [-104, 94], [-118, 90]], { width: 3, kind: "floor.road" });
  m.road([[-82, 4], [-100, 46], [-100, 76], [-118, 90]], { width: 3, kind: "floor.road" });
  m.road([[-118, 82], [-104, 82], [-72, 82], [-20, 82], [24, 84], [82, 82], [118, 86]], { width: 3, kind: "floor.mud" });
  m.road([[-122, 102], [-104, 102], [-72, 104], [-20, 104], [24, 104], [82, 112], [118, 112]], { width: 3, kind: "floor.mud" });
  m.road([[-118, 90], [-110, 78], [-104, 74], [-88, 72], [-72, 82]], { width: 3, kind: "floor.flagstone" });

  // Residential block lanes. The houses sit on lots around these streets.
  m.road([[-106, -28], [-106, 4]], { width: 3, kind: "floor.road" });
  m.road([[-94, -28], [-94, 4]], { width: 3, kind: "floor.road" });
  m.road([[-118, -15], [-82, -15]], { width: 3, kind: "floor.road" });
  m.road([[-93, 14], [-93, 38]], { width: 3, kind: "floor.road" });
  m.road([[-106, 25], [-80, 25]], { width: 3, kind: "floor.road" });
  m.road([[-106, 38], [-106, 80]], { width: 3, kind: "floor.road" });
  m.road([[-94, 38], [-94, 80]], { width: 3, kind: "floor.road" });
  m.road([[-118, 51], [-82, 51]], { width: 3, kind: "floor.road" });
  m.road([[-118, 63], [-82, 63]], { width: 3, kind: "floor.road" });
  m.road([[-66, 42], [-66, 76]], { width: 3, kind: "floor.road" });
  m.road([[-54, 42], [-54, 76]], { width: 3, kind: "floor.road" });
  m.road([[-78, 55], [-42, 55]], { width: 3, kind: "floor.road" });
  m.road([[-106, 98], [-106, 114]], { width: 3, kind: "floor.road" });
  m.road([[-94, 98], [-94, 114]], { width: 3, kind: "floor.road" });
  m.road([[-122, 112], [-82, 112]], { width: 3, kind: "floor.road" });

  m.road([[53, -2], [53, 26]], { width: 3, kind: "floor.road" });
  m.road([[65, -2], [65, 26]], { width: 3, kind: "floor.road" });
  m.road([[42, 11], [78, 11]], { width: 3, kind: "floor.road" });
  m.road([[79, 24], [79, 50]], { width: 3, kind: "floor.road" });
  m.road([[68, 35], [96, 35]], { width: 3, kind: "floor.road" });
  m.road([[92, 48], [112, 48], [124, 58]], { width: 2, kind: "floor.road" });
  m.road([[138, 58], [124, 58], [104, 72], [82, 112], [0, 116], [0, 138]], { width: 3, kind: "floor.road" });

  bridgeDeck(m, -118, 88, 100);
  bridgeDeck(m, -20, 84, 96);
  bridgeDeck(m, 24, 88, 100);
  bridgeDeck(m, 82, 82, 96);
  m.place({ at: [24, 94], role: "obj_c_arch_bridge", facing: "east", block: false });
}

function bridgeDeck(m: Builder, bx: number, z0: number, z1: number) {
  for (let x = bx - 1; x <= bx + 1; x++) {
    for (let z = z0; z <= z1; z++) {
      m.place({ at: [x, z], role: "river.bridge", facing: "east", block: false });
      m.setWalk(rect(x, z, x, z), true);
    }
  }
}

function buildAuthorityTier(m: Builder) {
  m.pave(rect(-44, -108, 72, -48), "floor.flagstone");

  m.place({
    at: [0, -84],
    role: "obj_c_cathedral",
    facing: "south",
    footprint: rect(-5, -91, 5, -77),
  });
  m.place({ at: [-28, -78], role: "obj_c_twin_spire", facing: "south", footprint: rect(-31, -82, -25, -74) });
  m.place({ at: [30, -78], role: "obj_c_twin_spire", facing: "south", footprint: rect(27, -82, 33, -74) });
  for (const at of [[-42, -54], [-28, -52], [-14, -50], [14, -50], [28, -52], [42, -54]] as Vec2[]) {
    m.place({ at, role: "arch", facing: "south" });
  }

  m.building({
    bounds: rect(44, -86, 64, -66),
    wall: "wall.church",
    floor: "floor.flagstone",
    roof: "slate",
    door: { at: [54, -66], facing: "south" },
    chimney: [62, -84],
  });
  m.place({ at: [56, -78], role: "desk", facing: "west" });
  m.place({ at: [60, -82], role: "shelf", facing: "west" });
  m.place({ at: [47, -80], role: "shelf", facing: "east" });
  m.place({ at: [51, -66], role: "notice", facing: "south", dialogue: "dia_notice_board", block: false });

  m.building({
    bounds: rect(66, -62, 92, -44),
    wall: "wall.fieldstone",
    floor: "floor.flagstone",
    roof: "slate",
    door: { at: [66, -54], facing: "west" },
    chimney: [90, -60],
    interiorWalls: [{ from: [80, -61], to: [80, -45], gap: [80, -52] }],
  });
  for (let z = -56; z <= -49; z++) {
    m.place({ at: [80, z], role: "wall.cell_bars", facing: "west", dialogue: z === -52 ? "dia_nessa_bars" : undefined });
  }
  m.place({ at: [86, -50], role: "pallet_bed" });
  m.place({ at: [70, -58], role: "desk", facing: "south" });
  m.container({
    id: "cnt_gaol_effects",
    at: [88, -58],
    name: "Confiscated Effects",
    locked: true,
    key: "itm_archive_key",
    items: [{ item_id: "itm_carried_stone" }],
  });

  m.stamp("graveyardEnclosure", {
    bounds: rect(-54, -108, -26, -92),
    gate: { at: [-40, -92], facing: "south" },
    yews: [[-50, -104], [-30, -104]],
    density: 0.18,
    rngStream: "upper_graves",
  });
  for (const at of [[-54, -58], [70, -66], [42, -94], [-42, -92], [0, -52]] as Vec2[]) {
    m.place({ at, role: "lantern" });
  }
}

function buildWitnessSquare(m: Builder) {
  m.pave(rect(-34, -32, 34, 20), "floor.cobble");
  m.pave(rect(-16, -22, 16, 2), "floor.flagstone");

  m.place({
    at: [0, -10],
    role: "witness_statue",
    facing: "south",
    dialogue: "dia_statue",
    footprint: rect(-1, -11, 1, -9),
  });

  const cordon: Vec2[] = [
    [-8, -18], [-4, -20], [0, -21], [4, -20], [8, -18],
    [10, -14], [10, -10], [10, -6], [8, -2], [4, 0],
    [0, 1], [-4, 0], [-8, -2], [-10, -6], [-10, -10], [-10, -14],
  ];
  cordon.forEach((at, i) => m.place({ at, role: "fence.cordon", facing: "south", block: false, dialogue: i === 2 ? "dia_cordon" : undefined }));
  for (const at of [[-14, -18], [14, -18], [-16, 0], [16, 0], [-20, 18], [20, 18]] as Vec2[]) {
    m.place({ at, role: "lantern" });
  }
  m.place({ at: [0, 14], role: "market_cross", facing: "south", dialogue: "dia_notice_board" });
  m.place({ at: [-18, 10], role: "well", dialogue: "dia_save", block: false });
  m.place({ at: [26, 18], role: "shrine_stone", facing: "west", dialogue: "dia_old_rite_shrine" });
  m.place({ at: [28, 18], role: "votive_token", block: false });
}

function buildMarketAndInn(m: Builder) {
  m.building({
    bounds: rect(-68, 4, -48, 24),
    wall: "wall.timber",
    floor: "floor.boards",
    roof: "clay",
    door: { at: [-48, 12], facing: "east" },
    chimney: [-66, 6],
    interiorWalls: [{ from: [-60, 5], to: [-60, 23], gap: [-60, 14] }],
  });
  m.place({ at: [-49, 10], role: "inn_sign", facing: "east" });
  m.place({ at: [-62, 20], role: "trapdoor", facing: "south", block: false, dialogue: "dia_cellar" });
  m.place({ at: [-54, 18], role: "barrel" });
  m.container({
    id: "cnt_inn_larder",
    at: [-64, 8],
    name: "Counted Cup Larder",
    items: [{ item_id: "itm_health_potion", count: 2 }],
  });

  m.pave(rect(-96, -16, -70, 12), "floor.cobble");
  for (const at of [[-90, -8], [-84, -8], [-78, -8], [-92, 4], [-84, 5], [-76, 5]] as Vec2[]) {
    m.place({ at, role: "stall", facing: "south", dialogue: at[0] === -84 && at[1] === -8 ? "dia_merchant" : undefined });
  }
  m.place({ at: [-82, -2], role: "cart", facing: "east" });
  m.place({ at: [-74, 12], role: "well" });
  m.place({ at: [-76, 22], role: "crate" });
  m.container({
    id: "cnt_smuggler_cache",
    at: [-72, 28],
    name: "Uncounted Back-Room Cache",
    locked: true,
    key: "itm_glass_shard",
    items: [{ item_id: "itm_votive" }, { item_id: "itm_glass_shard" }],
  });

  cottageBlock(m, -116, -24, 3, 2, "timber");
  cottageBlock(m, -102, 16, 2, 2, "fieldstone");
}

function buildResidentialQuarters(m: Builder) {
  cottageBlock(m, -116, 42, 3, 3, "timber");
  cottageBlock(m, -76, 46, 3, 2, "fieldstone");
  cottageBlock(m, -116, 102, 3, 1, "fieldstone");
  cottageBlock(m, 44, 2, 3, 2, "timber");
  cottageBlock(m, 70, 26, 2, 2, "fieldstone");

  m.building({
    bounds: rect(98, 26, 110, 38),
    wall: "wall.fieldstone",
    floor: "floor.boards",
    roof: "slate",
    door: { at: [98, 32], facing: "west" },
    chimney: [109, 27],
  });
  m.place({ at: [97, 32], role: "door", facing: "west", block: false, dialogue: "dia_lazare_vampire" });
  m.place({ at: [101, 38], role: "trapdoor", facing: "south", block: false, dialogue: "dia_old_rite_shrine" });
  m.place({ at: [94, 36], role: "nature.tree.dark" });

  m.place({ at: [-107, 63], role: "well", dialogue: "dia_save", block: false });
  m.place({ at: [-74, 82], role: "shrine_stone", dialogue: "dia_mother" });
  m.place({ at: [-70, 84], role: "votive_token", block: false });
  m.place({ at: [-66, 55], role: "cart", facing: "east", block: false });
  m.place({ at: [-94, 51], role: "placard", facing: "south", dialogue: "dia_notice_board", block: false });
  m.place({ at: [-104, 112], role: "barrel", block: false });
  m.place({ at: [-92, 112], role: "crate", block: false });
  m.place({ at: [62, 12], role: "placard", facing: "west", dialogue: "dia_notice_board", block: false });
  m.place({ at: [79, 35], role: "shrine_stone", facing: "west", dialogue: "dia_old_rite_shrine" });
  m.place({ at: [53, 11], role: "well", dialogue: "dia_save", block: false });
  m.scatter({
    in: rect(-118, 36, 114, 108),
    weighted: [["nature.shrub", 0.65], ["nature.tree", 0.2], ["nature.tree.dark", 0.15]],
    density: 0.028,
    minSpacing: 3,
    rngStream: "residential_green",
  });
}

function buildRiverAndGlassworks(m: Builder) {
  m.place({ at: [-22, 84], role: "river.dock", facing: "east", block: false, dialogue: "dia_ferryman" });
  m.place({ at: [24, 96], role: "river.dock", facing: "west", block: false });
  m.place({ at: [-116, 88], role: "river.dock", facing: "east", block: false });
  for (const at of [[-28, 84], [-12, 96], [20, 88], [42, 96], [-120, 92], [-106, 82]] as Vec2[]) {
    m.place({ at, role: "river.reeds", block: false });
  }

  m.place({ at: [-104, 74], role: "obj_c_glass_dome", facing: "east", footprint: rect(-108, 69, -100, 79) });
  m.stamp("glassworksHall", {
    bounds: rect(-96, 62, -76, 78),
    door: { at: [-96, 70], facing: "west" },
    stacks: [[-92, 64], [-82, 64]],
    furnaces: [[-90, 75], [-82, 75]],
  });
  m.place({ at: [-118, 90], role: "trapdoor", facing: "south", block: false, dialogue: "dia_old_rite_shrine" });
  m.place({ at: [-74, 72], role: "industrial.pipes", facing: "west" });
  m.place({ at: [-72, 82], role: "industrial.railcart", facing: "west", block: false });
  m.place({ at: [-70, 84], role: "industrial.railcart", facing: "west", block: false });
  m.place({ at: [-80, 92], role: "obj_net_glass_growth", facing: "north" });
  m.container({
    id: "cnt_glassworks_cullet",
    at: [-94, 77],
    name: "Cullet Bin",
    items: [{ item_id: "itm_glass_shard", count: 2 }],
  });

  m.stamp("graveyardEnclosure", {
    bounds: rect(64, 104, 102, 118),
    gate: { at: [82, 104], facing: "north" },
    yews: [[68, 110], [98, 112]],
    density: 0.2,
    rngStream: "lower_graves",
  });
  m.place({ at: [82, 112], role: "trapdoor", facing: "south", block: false, dialogue: "dia_old_rite_shrine" });
}

function buildCavesAndHiddenPlaces(m: Builder) {
  m.place({ at: [138, 58], role: "trapdoor", facing: "east", block: false });
  m.place({ at: [140, 54], role: "shrine_stone", facing: "west" });
  m.place({ at: [132, 66], role: "nature.tree.dark" });

  m.place({ at: [0, 116], role: "obj_net_arch_sigil", facing: "south", block: false });
  m.place({ at: [-6, 120], role: "obj_net_column_root" });
  m.place({ at: [6, 120], role: "obj_net_column_root" });
  m.place({ at: [0, 130], role: "obj_net_rite_circle", facing: "south", block: false, dialogue: "dia_maras_basement" });
  m.place({ at: [0, 138], role: "obj_net_omphalos", facing: "south" });
  m.place({ at: [-5, 137], role: "obj_net_glass_kneeler", facing: "east" });
  m.place({ at: [5, 137], role: "obj_net_glass_kneeler", facing: "west" });
  m.place({ at: [-72, 136], role: "obj_net_shrine_family", facing: "east", dialogue: "dia_gate_blocked_shrine" });
  m.place({ at: [-66, 140], role: "obj_net_bone_pile", facing: "north", block: false });
  m.place({ at: [62, 134], role: "obj_net_stele", facing: "west", dialogue: "dia_cyberghost_network" });
  m.place({ at: [70, 140], role: "obj_net_glass_growth", facing: "north" });
  m.place({ at: [-20, 104], role: "trapdoor", facing: "south", block: false, dialogue: "dia_old_rite_shrine" });
  m.place({ at: [48, -62], role: "trapdoor", facing: "south", block: false, dialogue: "dia_old_rite_shrine" });
}

function placeFactionNPCs(m: Builder) {
  m.npc({ id: "ent_aldric", at: [54, -76] });
  m.npc({
    id: "ent_priest",
    at: [0, -76],
    schedule: [{ hour: 5, at: [0, -76] }, { hour: 13, at: [0, -34] }, { hour: 21, at: [-22, -74] }],
  });
  m.npc({
    id: "ent_gate_anchorite",
    at: [0, -132],
    schedule: [{ hour: 6, at: [0, -132] }, { hour: 18, at: [-4, -134] }, { hour: 22, at: [4, -130] }],
  });
  m.npc({ id: "ent_nessa", at: [84, -52] });
  m.npc({
    id: "ent_gaoler",
    at: [70, -54],
    schedule: [{ hour: 6, at: [70, -54] }, { hour: 14, at: [66, -54] }, { hour: 22, at: [70, -57] }],
  });
  m.npc({ id: "ent_guard_cordon", at: [12, -10] });
  m.npc({
    id: "ent_guard_gate",
    at: [0, -116],
    schedule: [{ hour: 6, at: [0, -116] }, { hour: 18, at: [0, -30] }, { hour: 22, at: [0, -116] }],
  });
  m.npc({
    id: "ent_merchant",
    at: [-84, -6],
    schedule: [{ hour: 7, at: [-84, -6] }, { hour: 18, at: [-58, 12] }, { hour: 22, at: [-100, -10] }],
  });
  m.npc({
    id: "ent_innkeep",
    at: [-54, 14],
    schedule: [{ hour: 6, at: [-54, 14] }, { hour: 16, at: [-52, 18] }, { hour: 23, at: [-58, 20] }],
  });
  m.npc({
    id: "ent_elder",
    at: [24, 18],
    schedule: [{ hour: 8, at: [24, 18] }, { hour: 18, at: [-104, 63] }, { hour: 22, at: [-76, 82] }],
  });
  m.npc({
    id: "ent_mother",
    at: [-76, 82],
    schedule: [{ hour: 8, at: [-76, 82] }, { hour: 18, at: [-104, 63] }, { hour: 22, at: [-76, 82] }],
  });
  m.npc({
    id: "ent_mason",
    at: [-90, 74],
    schedule: [{ hour: 7, at: [-90, 74] }, { hour: 14, at: [8, -12] }, { hour: 21, at: [-54, 14] }],
  });
  m.npc({
    id: "ent_glass_apprentice",
    at: [-82, 72],
    schedule: [{ hour: 7, at: [-82, 72] }, { hour: 16, at: [-110, 74] }, { hour: 21, at: [-20, 104] }],
  });
  m.npc({
    id: "ent_burial_keeper",
    at: [82, 110],
    schedule: [{ hour: 7, at: [82, 110] }, { hour: 14, at: [24, 18] }, { hour: 21, at: [82, 112] }],
  });
  m.npc({
    id: "ent_ferryman",
    at: [-22, 84],
    schedule: [{ hour: 8, at: [-22, 84] }, { hour: 18, at: [24, 96] }, { hour: 23, at: [-20, 104] }],
  });
  m.npc({
    id: "ent_pilgrim",
    at: [0, -34],
    schedule: [{ hour: 6, at: [0, -34] }, { hour: 13, at: [0, -76] }, { hour: 21, at: [0, -132] }],
  });
  m.npc({ id: "ent_lazare_vampire", at: [104, 32] });
  m.npc({ id: "ent_save", at: [-16, 10] });
  m.npc({ id: "ent_cyberghost", at: [64, 134] });
}

function placeTriggers(m: Builder) {
  m.trigger({
    id: "trg_arrival",
    type: "on_load",
    conditions: [],
    condition: { not: { switch: "opening_ceremony_complete" } },
    cutscene_id: "cut_arrival",
    once: true,
  });
  m.trigger({
    id: "trg_openworld_music",
    type: "on_load",
    conditions: [],
    cutscene_id: "cut_town_music",
    once: false,
  });

  addStepTrigger(m, "trg_office", [[52, -68], [53, -68], [54, -68], [55, -68], [56, -68]], "cut_office_briefing", "act1_assigned", {
    not: { switch: "act1_rite_text" },
  });
  addStepTrigger(m, "trg_office_after", [[52, -68], [53, -68], [54, -68], [55, -68], [56, -68]], "cut_office_after", "act1_complete", {
    switch: "act1_rite_text",
  });
  addStepTrigger(m, "trg_gaol", [[66, -55], [66, -54], [66, -53], [67, -54]], "cut_gaol_entry", "gaol_entered", {
    switch: "act1_assigned",
  });
  addStepTrigger(m, "trg_first_sight", [[-2, -36], [-1, -36], [0, -36], [1, -36], [2, -36]], "cut_first_sight", "seen_cordon");
  addStepTrigger(m, "trg_rhyme", [[60, 12], [61, 12], [62, 12], [63, 12]], "cut_children_rhyme", "heard_rhyme");
  addStepTrigger(m, "trg_funeral", [[24, 18], [25, 18], [26, 18]], "cut_funeral_shrine", "seen_funeral");
  addStepTrigger(m, "trg_cellar", [[-62, 20], [-61, 20]], "cut_cellar_seal", "seen_cellar", {
    switch: "met_nessa",
  });

  const hiddenEntrances: Vec2[] = [[-62, 20], [-20, 104], [-118, 90], [82, 112], [101, 38], [48, -62]];
  hiddenEntrances.forEach((at, i) => {
    addInteractTrigger(m, `trg_hidden_locked_${i}`, at, "cut_trapdoor_locked", {
      not: { switch: "act1_assigned" },
    });
    addInteractTrigger(m, `trg_hidden_enter_${i}`, at, "cut_trapdoor_enter", {
      switch: "act1_assigned",
    });
  });

  m.trigger({
    id: "trg_cave_blocked",
    cell: [138, 58],
    type: "step",
    conditions: [],
    condition: { not: caveOpenCondition },
    cutscene_id: "cut_gate_blocked_cave",
    once: false,
  });
  m.trigger({
    id: "trg_cave_descent",
    cell: [138, 58],
    type: "step",
    conditions: [],
    condition: caveOpenCondition,
    cutscene_id: "cut_cave_descent",
    once: false,
  });
  m.trigger({
    id: "trg_cave_return",
    cell: [0, 116],
    type: "step",
    conditions: [],
    cutscene_id: "cut_cave_return",
    once: false,
  });
  m.trigger({
    id: "trg_boss_intro",
    cell: [0, 132],
    type: "step",
    conditions: [],
    condition: { not: { switch: "cyberghost_defeated" } },
    cutscene_id: "cut_boss_intro",
    once: true,
  });
}

function addStepTrigger(
  m: Builder,
  idBase: string,
  cells: Vec2[],
  cutsceneId: string,
  disarmSwitch: string,
  extraCondition?: Condition,
) {
  cells.forEach((cell, i) => {
    m.trigger({
      id: `${idBase}_${i}`,
      cell,
      type: "step",
      conditions: [],
      condition: extraCondition
        ? { all: [{ not: { switch: disarmSwitch } }, extraCondition] }
        : { not: { switch: disarmSwitch } },
      cutscene_id: cutsceneId,
      once: false,
    });
  });
}

function addInteractTrigger(
  m: Builder,
  id: string,
  cell: Vec2,
  cutsceneId: string,
  condition: Condition,
) {
  m.trigger({
    id,
    cell,
    type: "interact",
    conditions: [],
    condition,
    cutscene_id: cutsceneId,
    once: false,
  });
}

function cottageBlock(
  m: Builder,
  x0: number,
  z0: number,
  cols: number,
  rows: number,
  wall: "fieldstone" | "timber",
) {
  const size = 8;
  const gap = 4;
  const step = size + gap;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const bx0 = x0 + c * step;
      const bz0 = z0 + r * step;
      const bx1 = bx0 + size - 1;
      const bz1 = bz0 + size - 1;
      const doorEast = c < cols - 1 || cols === 1;
      m.stamp("cottage", {
        bounds: rect(bx0, bz0, bx1, bz1),
        wall,
        roof: wall === "timber" ? "clay" : "slate",
        door: doorEast
          ? { at: [bx1, bz0 + Math.floor(size / 2)], facing: "east" }
          : { at: [bx0, bz0 + Math.floor(size / 2)], facing: "west" },
        chimney: [bx0 + 1, bz0 + 1],
        furnish: false,
      });
    }
  }
}

// Alderamontico Parish — Pass 1 greybox.
//
// Fresh layout, not a revision of the previous parish/town maps. This file
// uses the map-authoring DSL as a greybox tool: districts, roads, tiers,
// building shells, gates, triggers, exits, anchors, zones, and validation.
// It deliberately avoids decorative scatter and final-art detailing.
//
// Orientation:
//   north/up-screen     = z decreases
//   east/right-screen   = x increases
//
// District structure:
//   z -45..-24  UPPER AUTHORITY TIER    cathedral shell, Aldric, gaol/Nessa
//   z -23..18   MIDDLE PARISH TIER      Witness cordon, churchyard, market,
//                                       Counted Cup, residences
//   z  19..45   LOWER RIVER TIER        river path, drains, Glassworks
//   x  37..60   OLD EXILE / OUTER EDGE  road out to the Monolith Gate field

import {
  createMap,
  rect,
  type MapBuilder,
  type Vec2,
} from "../utils/mapAuthoring";
import { parishTheme } from "../utils/parishTheme";
import { validateMap, formatProblems } from "../utils/mapValidator";
// Side-effect import: keeps editor stamp presets registered for this map.
import "../utils/parishStamps";

export const PARISH_W = 121;
export const PARISH_H = 91;

const MIN_X = -60;
const MAX_X = 60;
const MIN_Z = -45;
const MAX_Z = 45;
const EXILE_GATE_X = 36;

const range = (a: number, b: number) =>
  Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => a <= b ? a + i : a - i);

const lineWallZ = (
  m: MapBuilder,
  z: number,
  x0: number,
  x1: number,
  gaps: number[] = [],
) => {
  const open = new Set(gaps);
  for (const x of range(x0, x1)) {
    if (!open.has(x)) m.wall([x, z], "wall.low", { vh: 2 });
  }
};

const lineWallX = (
  m: MapBuilder,
  x: number,
  z0: number,
  z1: number,
  gaps: number[] = [],
) => {
  const open = new Set(gaps);
  for (const z of range(z0, z1)) {
    if (!open.has(z)) m.wall([x, z], "wall.low", { vh: 2 });
  }
};

const walledRect = (
  m: MapBuilder,
  bounds: { x0: number; z0: number; x1: number; z1: number },
  gates: Vec2[] = [],
) => {
  const gateKeys = new Set(gates.map(([x, z]) => `${x}|${z}`));
  for (const x of range(bounds.x0, bounds.x1)) {
    if (!gateKeys.has(`${x}|${bounds.z0}`)) m.wall([x, bounds.z0], "wall.low", { vh: 2 });
    if (!gateKeys.has(`${x}|${bounds.z1}`)) m.wall([x, bounds.z1], "wall.low", { vh: 2 });
  }
  for (const z of range(bounds.z0 + 1, bounds.z1 - 1)) {
    if (!gateKeys.has(`${bounds.x0}|${z}`)) m.wall([bounds.x0, z], "wall.low", { vh: 2 });
    if (!gateKeys.has(`${bounds.x1}|${z}`)) m.wall([bounds.x1, z], "wall.low", { vh: 2 });
  }
};

const addInteractionTrigger = (
  m: MapBuilder,
  id: string,
  at: Vec2,
  cutscene: string,
  condition?: any,
) => {
  m.trigger({
    id,
    type: "interact",
    cell: at,
    conditions: [],
    condition,
    cutscene_id: cutscene,
    once: false,
  });
};

const addStepTrigger = (
  m: MapBuilder,
  idBase: string,
  cells: Vec2[],
  cutscene: string,
  disarmSwitch: string,
  extraCondition?: any,
) => {
  cells.forEach((cell, i) => {
    m.trigger({
      id: `${idBase}_${i}`,
      type: "step",
      cell,
      conditions: [],
      condition: extraCondition
        ? { all: [{ not: { switch: disarmSwitch } }, extraCondition] }
        : { not: { switch: disarmSwitch } },
      cutscene_id: cutscene,
      once: false,
    });
  });
};

export const generateParishCells = () => {
  const m = createMap({
    width: PARISH_W,
    height: PARISH_H,
    minX: MIN_X,
    minZ: MIN_Z,
    theme: parishTheme,
    seed: 0x414c4445,
  });

  // ── District bookkeeping for editor/tooling ─────────────────────────────
  m.zone("upper_authority_tier", rect(-38, -45, 32, -24));
  m.zone("witness_square_churchyard", rect(-24, -23, 24, 2));
  m.zone("market_counted_cup_street", rect(-28, 3, 32, 16));
  m.zone("residential_parish_streets", rect(-58, -10, -28, 24));
  m.zone("lower_river_path", rect(-58, 19, 58, 33));
  m.zone("glassworks_industrial_edge", rect(34, 19, 58, 35));
  m.zone("old_exile_road", rect(18, -19, 60, -4));
  m.zone("outer_monolith_gate_field", rect(42, -25, 60, -5));
  m.zone("hidden_pagan_network_entrances", rect(-55, 12, 50, 33));

  // ── Base terrain and tiers ──────────────────────────────────────────────
  m.fill("floor.turf");
  m.tier(rect(-38, -45, 32, -24), 2);
  m.tier(rect(-58, -23, EXILE_GATE_X, 18), 1);

  // Lower water is collision, with roads/bridges cut back through later.
  m.pave(rect(MIN_X, 34, MAX_X, 39), "floor.river");
  m.block(rect(MIN_X, 34, MAX_X, 39));
  m.pave(rect(MIN_X, 31, MAX_X, 33), "floor.mud");
  m.pave(rect(MIN_X, 40, MAX_X, 42), "floor.mud");

  // ── Primary movement graph ──────────────────────────────────────────────
  // Start southwest -> market/inn -> Witness -> upper authority.
  m.road([[-56, 16], [-44, 16], [-32, 8], [-16, 8], [0, 8], [24, 8], [32, 12]], {
    width: 5,
    kind: "floor.cobble",
  });
  m.road([[0, 8], [0, -8], [0, -23], [0, -35]], {
    width: 5,
    kind: "floor.cobble",
  });
  m.pave(rect(-30, -43, 30, -25), "floor.flagstone");
  m.pave(rect(-19, -20, 19, 1), "floor.cobble");

  // Residential loops and side lanes. These are deliberately loops, not maze.
  m.road([[-52, 16], [-52, 3], [-42, -4], [-32, -2], [-24, 5], [-32, 8], [-44, 16]], {
    width: 3,
    kind: "floor.road",
  });
  m.road([[-42, 16], [-42, 25], [-25, 25], [-16, 14]], {
    width: 3,
    kind: "floor.road",
  });
  m.road([[-32, -2], [-32, -18], [-32, -23]], {
    width: 3,
    kind: "floor.cobble",
  });

  // Lower river path, industrial road, and river bridge/service crossing.
  m.road([[-56, 27], [-32, 27], [0, 27], [28, 26], [46, 27], [58, 27]], {
    width: 3,
    kind: "floor.road",
  });
  m.road([[0, 8], [0, 18], [0, 27]], {
    width: 5,
    kind: "floor.cobble",
  });
  m.road([[-42, 16], [-42, 25], [-42, 31]], {
    width: 3,
    kind: "floor.road",
  });
  m.road([[24, 8], [32, 15], [42, 22], [46, 27]], {
    width: 5,
    kind: "floor.road",
  });
  m.road([[46, 27], [46, 42]], {
    width: 3,
    kind: "floor.road",
  });
  for (const z of range(34, 39)) m.place({ at: [46, z], role: "river.bridge", block: false });

  // Old Exile Road: long, clear, and intentionally far from the Witness.
  m.road([[18, -8], [34, -8], [42, -14], [58, -14]], {
    width: 5,
    kind: "floor.road",
  });
  m.road([[46, 27], [48, 15], [48, -2], [52, -10]], {
    width: 3,
    kind: "floor.road",
  });
  m.pave(rect(43, -24, 60, -5), "floor.grave_earth");

  // ── Tier seams, checkpoints, and visible locked shortcuts ───────────────
  lineWallX(m, -38, -45, -24);
  lineWallX(m, 32, -45, -24);
  lineWallZ(m, -24, -38, 32, [-2, -1, 0, 1, 2]);
  lineWallZ(m, 18, -58, EXILE_GATE_X, [-43, -42, -41, -1, 0, 1, 27, 28, 29]);
  lineWallX(m, EXILE_GATE_X, -23, 18, [-9, -8, -7, 16, 17, 18]);

  for (const x of [-1, 0, 1]) {
    m.place({ at: [x, -24], role: "stairs", facing: "north", block: false });
    m.place({ at: [x, 18], role: "stairs", facing: "south", block: false });
  }
  for (const z of [16, 17, 18]) m.place({ at: [EXILE_GATE_X, z], role: "fence.iron", facing: "east" });
  for (const x of [-43, -42, -41, 27, 28, 29]) {
    m.place({ at: [x, 18], role: "stairs", facing: "south", block: false });
  }
  m.place({ at: [-32, -24], role: "fence.iron", facing: "north" }); // visible locked clergy shortcut
  m.place({ at: [EXILE_GATE_X, -8], role: "lych_gate", facing: "east", block: false });

  // ═════════════════════════════════════════════════════════════════════════
  // UPPER AUTHORITY TIER
  // ═════════════════════════════════════════════════════════════════════════
  m.building({
    bounds: rect(-12, -44, 12, -34),
    wall: "wall.church",
    floor: "floor.flagstone",
    roof: null,
    door: { at: [0, -34], facing: "south" },
    anchors: {
      "cathedral.shell": [0, -39],
      "authority.main_stair": [0, -24],
    },
  });
  m.place({ at: [0, -33], role: "church.front", facing: "south", dialogue: "dia_priest", block: false });

  m.building({
    bounds: rect(-31, -39, -16, -29),
    wall: "wall.church",
    floor: "floor.flagstone",
    roof: null,
    door: { at: [-16, -34], facing: "east" },
    interiorWalls: [{ from: [-23, -39], to: [-23, -29], gap: [-23, -34] }],
    anchors: {
      "aldric.office": [-27, -34],
      "aldric.archive": [-19, -36],
      "office.door": [-16, -34],
    },
  });
  m.place({ at: [-28, -34], role: "desk", facing: "east" });
  m.place({ at: [-20, -36], role: "shelf", facing: "west" });
  m.container({
    id: "cnt_aldric_archive",
    at: [-18, -36],
    name: "Archive Chest",
    locked: true,
    key: "itm_archive_key",
    items: [{ item_id: "itm_glass_shard" }, { item_id: "itm_health_potion" }],
  });
  m.item({ id: "wi_archive_key", item: "itm_archive_key", at: [-29, -32] });

  m.building({
    bounds: rect(16, -40, 32, -28),
    wall: "wall.fieldstone",
    floor: "floor.flagstone",
    roof: null,
    door: { at: [16, -34], facing: "west" },
    anchors: {
      "gaol.door": [16, -34],
      "nessa.cell": [29, -36],
      "nessa.bars": [26, -36],
      "gaol.guard_post": [19, -33],
    },
  });
  for (const z of range(-38, -34)) {
    m.place({
      at: [26, z],
      role: "wall.cell_bars",
      facing: "west",
      dialogue: z === -36 ? "dia_nessa_bars" : undefined,
    });
  }
  m.place({ at: [31, -38], role: "pallet_bed" });
  m.place({ at: [18, -33], role: "desk", facing: "east" });
  m.container({
    id: "cnt_gaol_effects",
    at: [30, -29],
    name: "Confiscated Effects",
    locked: true,
    key: "itm_archive_key",
    items: [{ item_id: "itm_carried_stone" }, { item_id: "itm_votive" }],
  });

  // ═════════════════════════════════════════════════════════════════════════
  // MIDDLE WITNESS SQUARE / CHURCHYARD TIER
  // ═════════════════════════════════════════════════════════════════════════
  m.anchor("witness.cordon.center", [0, -10]);
  m.place({
    at: [0, -10],
    role: "witness_statue",
    facing: "south",
    dialogue: "dia_statue",
    footprint: rect(-1, -11, 1, -9),
  });
  m.place({ at: [-3, -10], role: "glass_figure", facing: "east", dialogue: "dia_cordon" });
  m.place({ at: [3, -10], role: "glass_figure", facing: "west", dialogue: "dia_cordon" });
  m.place({ at: [0, -7], role: "glass_figure", facing: "north", dialogue: "dia_cordon" });

  for (const x of range(-7, 7)) {
    m.place({
      at: [x, -17],
      role: "fence.cordon",
      facing: "south",
      dialogue: x === 0 ? "dia_cordon" : undefined,
    });
    m.place({ at: [x, -3], role: "fence.cordon", facing: "north" });
  }
  for (const z of range(-16, -4)) {
    m.place({ at: [-7, z], role: "fence.cordon", facing: "east" });
    m.place({ at: [7, z], role: "fence.cordon", facing: "west" });
  }
  m.place({ at: [9, -10], role: "placard", facing: "west", dialogue: "dia_notice_board", block: false });

  // Churchyard and cemetery field: spatial placeholder only.
  m.pave(rect(21, -20, 34, 1), "floor.grave_earth");
  walledRect(m, { x0: 21, z0: -20, x1: 34, z1: 1 }, [[21, -9], [21, -8], [21, -7]]);
  m.place({ at: [21, -8], role: "lych_gate", facing: "west", block: false });
  m.place({ at: [28, -11], role: "shrine_stone", facing: "south", dialogue: "dia_elder" });

  // ═════════════════════════════════════════════════════════════════════════
  // MARKET + COUNTED CUP INN STREET
  // ═════════════════════════════════════════════════════════════════════════
  m.building({
    bounds: rect(-24, 3, -12, 14),
    wall: "wall.timber",
    floor: "floor.boards",
    roof: null,
    door: { at: [-12, 8], facing: "east" },
    anchors: {
      "counted_cup.inn": [-18, 8],
      "counted_cup.cellar": [-22, 13],
    },
  });
  m.place({ at: [-11, 8], role: "inn_sign", facing: "east", dialogue: "dia_innkeep", block: false });
  m.place({ at: [-22, 13], role: "trapdoor", facing: "south", block: false });
  m.container({
    id: "cnt_inn_larder",
    at: [-15, 12],
    name: "Inn Larder",
    items: [{ item_id: "itm_health_potion", count: 2 }],
  });
  m.container({
    id: "cnt_inn_cellar",
    at: [-23, 12],
    name: "Cellar Cache",
    locked: true,
    key: "itm_glass_shard",
    items: [{ item_id: "itm_votive", count: 2 }],
  });

  m.building({
    bounds: rect(16, 3, 28, 14),
    wall: "wall.timber",
    floor: "floor.boards",
    roof: null,
    door: { at: [16, 8], facing: "west" },
    anchors: { "market.storehouse": [22, 8] },
  });
  for (const at of [[4, 4], [9, 4], [14, 4], [6, 12], [12, 12]] as Vec2[]) {
    m.place({ at, role: "stall", facing: "south", dialogue: at[0] === 9 ? "dia_merchant" : undefined });
  }
  m.container({
    id: "cnt_shop_strongbox",
    at: [26, 12],
    name: "Shop Strongbox",
    items: [{ item_id: "itm_health_potion" }, { item_id: "itm_glass_shard" }],
  });
  m.item({ id: "wi_square_votive", item: "itm_votive", at: [2, 5] });

  // ═════════════════════════════════════════════════════════════════════════
  // RESIDENTIAL PARISH STREETS
  // ═════════════════════════════════════════════════════════════════════════
  const homes: { bounds: ReturnType<typeof rect>; door: Vec2; facing: "north" | "south" | "east" | "west"; wall: "wall.fieldstone" | "wall.timber" }[] = [
    { bounds: rect(-56, 4, -47, 12), door: [-47, 8], facing: "east", wall: "wall.fieldstone" },
    { bounds: rect(-46, -9, -37, -1), door: [-42, -1], facing: "south", wall: "wall.timber" },
    { bounds: rect(-39, 11, -30, 18), door: [-34, 11], facing: "north", wall: "wall.fieldstone" },
    { bounds: rect(-55, 20, -47, 29), door: [-47, 25], facing: "east", wall: "wall.timber" },
    { bounds: rect(-33, 20, -24, 29), door: [-29, 20], facing: "north", wall: "wall.fieldstone" },
  ];
  homes.forEach((home, i) => {
    m.building({
      bounds: home.bounds,
      wall: home.wall,
      floor: "floor.boards",
      roof: null,
      door: { at: home.door, facing: home.facing },
      anchors: i === 3 ? { "residential.hidden_cellar": [-51, 27] } : undefined,
    });
  });
  m.place({ at: [-51, 27], role: "trapdoor", facing: "south", block: false });
  m.place({ at: [-40, 14], role: "well", facing: "south", dialogue: "dia_save", block: false });
  m.container({ id: "cnt_home_w", at: [-54, 11], name: "Household Chest", items: [{ item_id: "itm_votive" }] });

  // ═════════════════════════════════════════════════════════════════════════
  // LOWER RIVER PATH + HIDDEN ROUTES
  // ═════════════════════════════════════════════════════════════════════════
  m.place({ at: [0, 27], role: "trapdoor", facing: "south", block: false });
  m.place({ at: [-18, 27], role: "trapdoor", facing: "south", block: false });
  m.place({ at: [26, 27], role: "fence.iron", facing: "south" }); // prison service grate, visible/locked
  m.place({ at: [-9, 30], role: "river.dock", facing: "south", block: false });
  m.place({ at: [11, 30], role: "river.dock", facing: "south", block: false });

  // ═════════════════════════════════════════════════════════════════════════
  // GLASSWORKS / INDUSTRIAL EDGE
  // ═════════════════════════════════════════════════════════════════════════
  m.pave(rect(34, 20, 56, 33), "floor.flagstone");
  walledRect(m, { x0: 34, z0: 20, x1: 56, z1: 33 }, [[34, 26], [35, 26], [44, 33], [45, 33]]);
  m.building({
    bounds: rect(43, 21, 55, 30),
    wall: "wall.fieldstone",
    floor: "floor.flagstone",
    roof: null,
    door: { at: [43, 26], facing: "west" },
    anchors: {
      "glassworks.main_hall": [50, 26],
      "glassworks.water_gate": [45, 33],
      "glassworks.maintenance_tunnel": [45, 31],
    },
  });
  m.place({ at: [52, 22], role: "industrial.smokestack" });
  m.place({ at: [49, 28], role: "industrial.furnace", dialogue: "dia_mason" });
  m.place({ at: [46, 31], role: "industrial.pipes" });
  m.place({ at: [45, 31], role: "trapdoor", facing: "south", block: false });
  m.container({
    id: "cnt_glassworks",
    at: [54, 29],
    name: "Cullet Bin",
    items: [{ item_id: "itm_glass_shard", count: 2 }],
  });

  // ═════════════════════════════════════════════════════════════════════════
  // OLD EXILE ROAD + OUTER MONOLITH GATE FIELD
  // ═════════════════════════════════════════════════════════════════════════
  walledRect(m, { x0: 43, z0: -24, x1: 60, z1: -5 }, [[43, -14], [44, -14]]);
  m.place({ at: [48, -5], role: "trapdoor", facing: "south", block: false });
  m.place({
    at: [56, -14],
    role: "monolith",
    facing: "south",
    dialogue: "dia_mouthstone",
    footprint: rect(55, -15, 57, -13),
  });
  m.anchor("monolith.gate", [56, -14]);

  // ── Cast / NPC posts ────────────────────────────────────────────────────
  m.npc({ id: "ent_aldric", at: [-27, -33] });
  m.npc({ id: "ent_nessa", at: [29, -36] });
  m.npc({
    id: "ent_priest",
    at: [0, -30],
    schedule: [{ hour: 5, at: [0, -30] }, { hour: 13, at: [0, -18] }, { hour: 21, at: [-32, -22] }],
  });
  m.npc({
    id: "ent_gaoler",
    at: [18, -34],
    schedule: [{ hour: 6, at: [18, -34] }, { hour: 13, at: [5, -6] }, { hour: 22, at: [20, -34] }],
  });
  m.npc({ id: "ent_guard_cordon", at: [9, -8] });
  m.npc({
    id: "ent_guard_gate",
    at: [35, -9],
    schedule: [{ hour: 6, at: [35, -9] }, { hour: 12, at: [16, 8] }, { hour: 22, at: [35, -9] }],
  });
  m.npc({
    id: "ent_merchant",
    at: [9, 8],
    schedule: [{ hour: 7, at: [9, 8] }, { hour: 20, at: [21, 8] }],
  });
  m.npc({
    id: "ent_innkeep",
    at: [-15, 8],
    schedule: [{ hour: 6, at: [-15, 8] }, { hour: 23, at: [-20, 12] }],
  });
  m.npc({
    id: "ent_elder",
    at: [28, -9],
    schedule: [{ hour: 8, at: [28, -9] }, { hour: 19, at: [-40, 14] }],
  });
  m.npc({
    id: "ent_mason",
    at: [49, 26],
    schedule: [{ hour: 7, at: [49, 26] }, { hour: 14, at: [14, 8] }, { hour: 20, at: [44, 26] }],
  });
  m.npc({
    id: "ent_mother",
    at: [-41, 15],
    schedule: [{ hour: 8, at: [-41, 15] }, { hour: 18, at: [-34, 13] }],
  });
  m.npc({
    id: "ent_pilgrim",
    at: [52, -13],
    schedule: [{ hour: 6, at: [52, -13] }, { hour: 13, at: [2, 8] }, { hour: 21, at: [52, -10] }],
  });
  m.npc({
    id: "ent_ferryman",
    at: [-9, 28],
    schedule: [{ hour: 8, at: [-9, 28] }, { hour: 20, at: [11, 28] }],
  });
  m.npc({ id: "ent_save", at: [-40, 15] });

  // ── Triggers / hidden network entrances / map exits ─────────────────────
  m.trigger({
    id: "trg_parish_music",
    type: "on_load",
    conditions: [],
    cutscene_id: "cut_town_music",
    once: false,
  });

  addStepTrigger(m, "trg_office", [[-17, -34], [-16, -34], [-18, -34]], "cut_office_briefing", "office_briefed", {
    not: { switch: "act1_rite_text" },
  });
  addStepTrigger(m, "trg_office_after", [[-17, -35], [-17, -34], [-18, -35]], "cut_office_after", "act1_complete", {
    switch: "act1_rite_text",
  });
  addStepTrigger(m, "trg_gaol", [[17, -34], [18, -34], [19, -34]], "cut_gaol_entry", "gaol_entered", {
    switch: "act1_assigned",
  });
  addStepTrigger(m, "trg_rhyme", [[-40, 8], [-41, 8], [-42, 8]], "cut_children_rhyme", "heard_rhyme");
  addStepTrigger(m, "trg_funeral", [[28, -8], [28, -10], [27, -9]], "cut_funeral_shrine", "seen_funeral");
  addStepTrigger(m, "trg_cellar", [[-51, 27], [-50, 27]], "cut_cellar_seal", "seen_cellar", {
    switch: "met_nessa",
  });

  const hiddenEntrances: Vec2[] = [
    [-22, 13], // Counted Cup cellar
    [-51, 27], // residential cellar
    [0, 27],   // main river drain
    [-18, 27], // churchyard drain
    [45, 31],  // glassworks maintenance tunnel
    [48, -5],  // old exile roadside hollow
  ];
  hiddenEntrances.forEach((at, i) => {
    addInteractionTrigger(m, `trg_hidden_locked_${i}`, at, "cut_trapdoor_locked", {
      not: { switch: "act1_assigned" },
    });
    addInteractionTrigger(m, `trg_hidden_enter_${i}`, at, "cut_trapdoor_enter", {
      switch: "act1_assigned",
    });
  });

  // Automatic lower-river exits for players who step onto the open drains
  // after the investigation writ is active. The inn/residential trapdoors stay
  // interact-only so the social hub does not surprise-teleport the player.
  m.exit({
    at: [0, 27],
    to: { map: "map_network_upper", spawn: "spawn_cellar_entry" },
    facing: "south",
    condition: { switch: "act1_assigned" },
  });
  m.exit({
    at: [-18, 27],
    to: { map: "map_network_upper", spawn: "spawn_cellar_entry" },
    facing: "south",
    condition: { switch: "act1_assigned" },
  });

  // ── Spawns ──────────────────────────────────────────────────────────────
  m.spawn({ id: "spawn_parish", at: [-56, 16], facing: "east" });
  m.spawn({ id: "spawn_from_network", at: [0, 28], facing: "south" });
  m.spawn({ id: "spawn_from_exile", at: [52, -10], facing: "west" });

  const result = m.build();
  const problems = validateMap(result);
  const errs = problems.filter((p) => p.severity === "error");
  if (errs.length) console.warn("[parish_gen] map lint\n" + formatProblems(errs));
  return result;
};

export { validateMap, formatProblems } from "../utils/mapValidator";
export { printMapAscii } from "../utils/mapPrinter";

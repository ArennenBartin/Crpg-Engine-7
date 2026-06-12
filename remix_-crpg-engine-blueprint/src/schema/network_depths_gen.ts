import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── The Pagan Network, Depths ───────────────────────────────────────────────
//
// Act 1, floor 2: the old tunnels under the basements — older than the
// Church's arrival, dressed entirely in the Network Kit (networkKit.ts).
// Layout reads as a profaned procession: stair landing → root-column
// gallery → ossuary crossing → (west) the cistern, (east) shrine row with
// a hidden passage → sigil gate → the Omphalos rotunda → Mara's basement,
// the finale room, where the under-rite circle still holds charge.

type Vec2 = [number, number];

const MIN_X = -23;
const MAX_X = 23;
const MIN_Z = -21;
const MAX_Z = 19;

const FLOOR = "obj_net_floor_catacomb";
const SOIL = "obj_net_floor_soil";
const RITUAL = "obj_net_floor_ritual";
const WATER = "obj_net_water";
const WALL = "obj_net_wall_catacomb";
const OSSUARY = "obj_net_wall_ossuary";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateNetworkDepthsCells = (): {
  cells: CellData[];
  custom_object_placements: ObjectPlacementData[];
  item_placements: WorldItemPlacementData[];
  container_placements: ContainerPlacementData[];
  entity_placements: EntityPlacementData[];
  triggers: TriggerData[];
} => {
  const cells: CellData[] = [];
  const custom_object_placements: ObjectPlacementData[] = [];
  const item_placements: WorldItemPlacementData[] = [];
  const container_placements: ContainerPlacementData[] = [];
  const entity_placements: EntityPlacementData[] = [];
  const triggers: TriggerData[] = [];

  const grid = new Map<string, CellData>();

  const get = (x: number, z: number) => grid.get(key(x, z));

  const setTile = (
    x: number,
    z: number,
    objectId: string,
    opts: { walkable?: boolean; blocksLos?: boolean; visualHeight?: number } = {},
  ) => {
    let c = get(x, z);
    if (!c) {
      c = {
        x, y: 0, z,
        active: true,
        walkable: opts.walkable ?? true,
        blocks_los: opts.blocksLos ?? false,
        height: 0,
        visual_height: opts.visualHeight ?? 0,
        terrain: "stone",
        surface_tag: "none",
        object_id: objectId,
      };
      grid.set(key(x, z), c);
      cells.push(c);
    } else {
      c.object_id = objectId;
      c.walkable = opts.walkable ?? true;
      c.blocks_los = opts.blocksLos ?? false;
      c.visual_height = opts.visualHeight ?? 0;
    }
  };

  const pave = (x: number, z: number, floor = FLOOR) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = FLOOR) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pave(x, z, floor);
  };

  const wallCell = (x: number, z: number, wall = WALL) => {
    setTile(x, z, wall, { walkable: false, blocksLos: true, visualHeight: 4 });
  };
  const wallRect = (x0: number, z0: number, x1: number, z1: number, wall = WALL) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) wallCell(x, z, wall);
  };

  const place = (
    objectId: string,
    x: number,
    z: number,
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const placement: ObjectPlacementData = { object_id: objectId, cell: [x, z], facing };
    if (opts.dialogue) placement.dialogue_id = opts.dialogue;
    custom_object_placements.push(placement);
    if (opts.block !== false) {
      const c = get(x, z);
      if (c) {
        c.walkable = false;
        c.blocks_los = false;
      }
    }
  };

  const placeItem = (id: string, itemId: string, x: number, z: number, count = 1) => {
    item_placements.push({ id, item_id: itemId, cell: [x, z], count });
  };

  const placeContainer = (
    id: string,
    x: number,
    z: number,
    opts: {
      name?: string;
      facing?: Vec2;
      locked?: boolean;
      key?: string;
      items?: { item_id: string; count?: number }[];
    } = {},
  ) => {
    container_placements.push({
      id,
      object_id: "obj_chest",
      cell: [x, z],
      facing: opts.facing || [0, 1],
      display_name: opts.name,
      locked: opts.locked ?? false,
      key_item_id: opts.key,
      consume_key: false,
      items: (opts.items || []).map((e) => ({ item_id: e.item_id, count: e.count ?? 1 })),
    });
  };

  // ── Solid rock first; rooms are carved out of it ──────────────────────────
  wallRect(MIN_X, MIN_Z, MAX_X, MAX_Z);

  // ── Stair landing (from the upper level) ──────────────────────────────────
  paveRect(-2, -19, 2, -15);
  place("obj_net_stele", -2, -18, [1, 0]);
  place("obj_net_brazier_cold", 2, -16);
  // The wayside candle keeps the zone entrance.
  entity_placements.push({ entity_id: "ent_save", cell: [2, -18] });

  // ── The Long Gallery: processional descent ────────────────────────────────
  paveRect(-2, -14, 2, -6);
  place("obj_net_arch_sigil", 0, -15, [0, 1], { block: false });
  // Root-bound columns pace the walls.
  place("obj_net_column_root", -2, -13);
  place("obj_net_column_root", 2, -13);
  place("obj_net_column_root", -2, -10);
  place("obj_net_column_root", 2, -10);
  place("obj_net_column_root", -2, -7);
  place("obj_net_column_root", 2, -7);
  // Roots dowse from the gallery ceiling.
  place("obj_net_root_curtain", 0, -11, [0, 1], { block: false });
  place("obj_net_root_curtain", 1, -8, [0, 1], { block: false });
  placeItem("itm_depths_votive_1", "itm_votive", -1, -9);

  // ── The Ossuary Crossing ──────────────────────────────────────────────────
  paveRect(-7, -5, 7, 1);
  // The dead are the masonry here: ossuary courses along the north wall.
  for (let x = -6; x <= 6; x += 1) {
    if (x >= -1 && x <= 1) continue; // gallery mouth
    wallCell(x, -6, OSSUARY);
  }
  // And along the south wall, flanking the sigil gate.
  for (let x = -6; x <= 6; x += 1) {
    if (x >= -1 && x <= 1) continue; // gate mouth
    wallCell(x, 2, OSSUARY);
  }
  place("obj_net_bone_pile", -5, -4, [0, 1], { block: false });
  place("obj_net_bone_pile", 5, 0, [0, 1], { block: false });
  place("obj_net_rubble", -6, 0);
  place("obj_net_brazier_cold", 6, -4);
  place("obj_net_candle_cluster", -3, 1);
  // Fast little horrors haunt the crossing.
  entity_placements.push({ entity_id: "ent_candle_eaten_1", cell: [-4, -2] });
  entity_placements.push({ entity_id: "ent_candle_eaten_2", cell: [4, -1] });

  // ── West branch: the Cistern ──────────────────────────────────────────────
  paveRect(-12, -3, -8, -1);
  place("obj_net_root_curtain", -10, -2, [0, 1], { block: false });
  // The cistern basin: still black water with a marble walkway across it.
  paveRect(-21, -6, -13, 4, WATER);
  for (let x = -21; x <= -13; x++) {
    for (let z = -6; z <= 4; z++) {
      setTile(x, z, WATER, { walkable: false, visualHeight: 0 });
    }
  }
  // Walkway and landings.
  paveRect(-21, -3, -13, -1);
  paveRect(-21, -6, -19, 4);
  place("obj_net_stele", -13, -4, [1, 0]);
  place("obj_net_krater", -20, -5);
  place("obj_net_glass_growth", -20, 3);
  place("obj_net_glass_kneeler", -19, 2, [1, 0]);
  placeItem("itm_depths_shard_1", "itm_glass_shard", -21, 0);
  // Something half-finished patrols the water line.
  entity_placements.push({ entity_id: "ent_partial_conversion_1", cell: [-17, -2] });
  placeContainer("cnt_cistern_cache", -21, -6, {
    name: "Drowned Offering Chest",
    items: [
      { item_id: "itm_health_potion", count: 1 },
      { item_id: "itm_votive", count: 2 },
    ],
  });

  // ── East branch: Shrine Row ───────────────────────────────────────────────
  paveRect(8, -3, 12, -1);
  paveRect(13, -6, 21, 6);
  // Three family shrines along the east wall; the middle one has been
  // dragged aside — the gap behind it is the hidden passage.
  place("obj_net_shrine_family", 21, -4, [-1, 0]);
  place("obj_net_shrine_family", 20, 0, [-1, 0]);
  place("obj_net_shrine_family", 21, 4, [-1, 0]);
  place("obj_net_candle_cluster", 19, -4);
  place("obj_net_votive_heap", 19, 2, [0, 1], { block: false });
  place("obj_net_column_root", 14, -5);
  place("obj_net_column_root", 14, 5);
  placeItem("itm_depths_votive_2", "itm_votive", 16, -2);
  placeItem("itm_depths_votive_3", "itm_votive", 18, 5);
  // The middle shrine — the one dragged aside — is the Vey family's. Mara's
  // people kept the door their shrine was built to hide.
  placeItem("itm_depths_vey_mark", "itm_family_mark_3", 19, 1);

  // The hidden passage: behind the displaced middle shrine, south then east.
  paveRect(20, 1, 21, 1); // the gap the shrine used to seal
  paveRect(20, 1, 22, 3);
  paveRect(18, 7, 22, 10, SOIL);
  paveRect(21, 3, 22, 7, SOIL);
  place("obj_net_root_curtain", 21, 5, [0, 1], { block: false });
  place("obj_net_glass_growth", 18, 9);
  placeContainer("cnt_hidden_tithe", 22, 9, {
    name: "The Family Tithe",
    locked: true,
    key: "itm_archive_key",
    items: [
      { item_id: "itm_glass_shard", count: 3 },
      { item_id: "itm_health_potion", count: 1 },
    ],
  });
  placeItem("itm_depths_shard_2", "itm_glass_shard", 19, 8);

  // ── The sigil gate and the Omphalos rotunda ───────────────────────────────
  paveRect(-1, 2, 1, 5);
  place("obj_net_arch_sigil", 0, 3, [0, 1], { block: false });

  // Rotunda: a carved circle on rite-floor mosaic.
  const ROT_CX = 0;
  const ROT_CZ = 11;
  const ROT_R = 5;
  for (let x = ROT_CX - ROT_R; x <= ROT_CX + ROT_R; x++) {
    for (let z = ROT_CZ - ROT_R; z <= ROT_CZ + ROT_R; z++) {
      const dx = x - ROT_CX;
      const dz = z - ROT_CZ;
      if (dx * dx + dz * dz <= ROT_R * ROT_R + 1) pave(x, z, RITUAL);
    }
  }
  // The navel-stone of the under-town, ringed by what it converted.
  place("obj_net_omphalos", 0, 11);
  place("obj_net_glass_kneeler", -1, 13, [0, -1]);
  place("obj_net_glass_kneeler", 2, 10, [-1, 0]);
  place("obj_net_column_root", -3, 8);
  place("obj_net_column_root", 3, 8);
  place("obj_net_column_root", -3, 14);
  place("obj_net_column_root", 3, 14);
  place("obj_net_candle_cluster", -4, 11);
  entity_placements.push({ entity_id: "ent_rite_remnant_1", cell: [-2, 9] });
  entity_placements.push({ entity_id: "ent_rite_remnant_2", cell: [2, 13] });

  // ── Mara's basement: the finale room ──────────────────────────────────────
  paveRect(-9, 10, -6, 12); // passage west
  
  // Scene 6 trigger
  for (let z = 10; z <= 12; z++) {
    triggers.push({
      id: `trg_maras_basement_${z}`,
      cell: [-9, z],
      type: "step",
      conditions: [],
      condition: { not: { switch: "act1_rite_text" } },
      cutscene_id: "cut_maras_basement",
      once: false,
    });
  }

  paveRect(-19, 8, -10, 16, SOIL);
  // The rite floor proper, where the doorway stood.
  paveRect(-16, 10, -12, 14, RITUAL);
  place("obj_net_rite_circle", -14, 12, [0, 1], { block: false });
  place("obj_net_krater", -17, 9);
  place("obj_net_candle_cluster", -11, 9);
  place("obj_net_candle_cluster", -17, 15);
  place("obj_net_votive_heap", -11, 15, [0, 1], { block: false });
  place("obj_net_shrine_family", -19, 12, [1, 0]);
  place("obj_net_bone_pile", -12, 10, [0, 1], { block: false });
  // What the interrupted rite left bound here.
  entity_placements.push({ entity_id: "ent_bound_remnant", cell: [-14, 11] });
  placeContainer("cnt_mara_effects", -19, 16, {
    name: "Mara's Keep-Chest",
    items: [
      { item_id: "itm_votive", count: 3 },
      { item_id: "itm_health_potion", count: 2 },
    ],
  });
  // Reading the circle yields the rite text — the dungeon's true reward.
  triggers.push({
    id: "trg_rite_circle",
    type: "interact",
    cell: [-14, 12],
    cutscene_id: "cut_rite_circle",
    once: false,
    conditions: [],
  });

  // Music takes over the moment the depths load.
  triggers.push({
    id: "trg_depths_music",
    type: "on_load",
    cutscene_id: "cut_depths_enter",
    once: false,
    conditions: [],
  });

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers,
  };
};

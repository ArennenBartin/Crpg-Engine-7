import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── The Pagan Network, Upper Level ──────────────────────────────────────────
//
// A sprawling subterranean labyrinth beneath the Town of the Witness.
// The upper level is a palimpsest: older pagan stonework overlaid with
// failed Church renovations, half-finished conversions, and witness
// architecture dragged underground.
//
// Object palette mixes Network Kit (obj_net_*) with Witness Kit (obj_*)
// to show the cultural layering. Witness statues have been completely
// purged from the subterranean levels.

type Vec2 = [number, number];

const MIN_X = -60;
const MAX_X = 60;
const MIN_Z = -20;
const MAX_Z = 80;

const CATACOMB = "obj_net_floor_catacomb";
const SOIL    = "obj_net_floor_soil";
const RITUAL  = "obj_net_floor_ritual";
const MARBLE  = "obj_floor_stone";
const WATER   = "obj_net_water";
const NET_WALL = "obj_net_wall_catacomb";
const OSS_WALL = "obj_net_wall_ossuary";
const WIT_WALL = "obj_wall_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateNetworkCells = (): {
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
  const reserved = new Set<string>();

  const get = (x: number, z: number) => grid.get(key(x, z));
  const reserve = (x: number, z: number) => reserved.add(key(x, z));

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

  const pave = (x: number, z: number, floor = CATACOMB) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = CATACOMB) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pave(x, z, floor);
  };

  const wallCell = (x: number, z: number, wall = NET_WALL) => {
    setTile(x, z, wall, { walkable: false, blocksLos: true, visualHeight: 4 });
    reserve(x, z);
  };
  const wallRect = (x0: number, z0: number, x1: number, z1: number, wall = NET_WALL) => {
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
    reserve(x, z);
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

  // Build the void
  wallRect(MIN_X, MIN_Z, MAX_X, MAX_Z);

  // ── 1. The Surface Seam (North) ───────────────────────────────────────────
  // A long, intimidating entry corridor
  paveRect(-2, -19, 2, 0, MARBLE);
  place("obj_column", -2, -18);
  place("obj_column", 2, -18);
  place("obj_column", -2, -10);
  place("obj_column", 2, -10);
  // Kept off the centerline so the ladder cell at [0,-19] stays reachable.
  place("obj_lantern_post", 1, -18);

  // Vestibule space (0, 0)
  paveRect(-8, 0, 8, 8, CATACOMB);
  place("obj_net_column_root", -6, 2);
  place("obj_net_column_root", 6, 2);
  place("obj_net_column_root", -6, 6);
  place("obj_net_column_root", 6, 6);
  place("obj_altar", 0, 4, [0, 1]);
  place("obj_net_votive_heap", 0, 5, [0, 1], { block: false });
  entity_placements.push({ entity_id: "ent_save", cell: [5, 2] });

  // ── 2. The Grand Processional (Center) ────────────────────────────────────
  paveRect(-12, 9, 12, 40, CATACOMB);

  // Giant central rite circle
  paveRect(-8, 20, 8, 30, RITUAL);
  place("obj_net_rite_circle", 0, 25, [0, 1], { block: false });

  // Outer pillars of the processional
  for(let z = 12; z <= 38; z += 6) {
    place("obj_net_column_root", -10, z);
    place("obj_net_column_root", 10, z);
    place("obj_net_brazier_cold", -9, z);
    place("obj_net_brazier_cold", 9, z);
  }

  // Pagan altars replacing the old statues
  place("obj_net_stele", 0, 15, [0, -1]);
  place("obj_net_krater", -4, 25);
  place("obj_net_krater", 4, 25);

  // Enemies in the grand processional
  entity_placements.push({ entity_id: "ent_rite_remnant_1", cell: [-4, 18] });
  entity_placements.push({ entity_id: "ent_rite_remnant_2", cell: [4, 18] });
  entity_placements.push({ entity_id: "ent_candle_eaten_1", cell: [0, 32] });
  entity_placements.push({ entity_id: "ent_partial_conversion_1", cell: [-6, 35] });
  entity_placements.push({ entity_id: "ent_partial_conversion_2", cell: [6, 35] });

  // ── 3. The Flooded Cisterns (West Wing) ───────────────────────────────────
  // Narrow passages over water connecting multiple cistern rooms
  paveRect(-20, 10, -13, 14, CATACOMB); // connection from processional
  place("obj_net_arch_sigil", -13, 12, [-1, 0], { block: false });

  // Cistern 1
  paveRect(-35, 10, -21, 20, WATER);
  paveRect(-30, 14, -21, 16, CATACOMB); // bridge
  place("obj_net_glass_growth", -30, 13);
  place("obj_net_glass_growth", -25, 17);
  place("obj_net_stele", -33, 15, [1, 0]);

  // Cistern 2 (Large lake)
  paveRect(-55, 20, -30, 45, WATER);
  // Winding walkways
  paveRect(-35, 15, -30, 35, CATACOMB);
  paveRect(-50, 30, -30, 35, CATACOMB);
  paveRect(-50, 20, -45, 30, CATACOMB);

  place("obj_net_column_root", -32, 20);
  place("obj_net_column_root", -32, 28);
  place("obj_net_column_root", -40, 32);
  place("obj_net_column_root", -48, 22);

  // Drowned shrine at the end of the walkway. A cyberghost keeps station
  // above the water — only a Mystic hears where Mara hid the second leaf.
  paveRect(-55, 18, -51, 24, MARBLE);
  place("obj_net_krater", -53, 21);
  place("obj_net_glass_kneeler", -52, 21, [1, 0]);
  placeContainer("cnt_drowned_cache", -54, 21, {
    name: "Drowned Offering Chest",
    items: [
      { item_id: "itm_health_potion", count: 2 },
      { item_id: "itm_votive", count: 3 },
    ],
  });
  entity_placements.push({ entity_id: "ent_cyberghost", cell: [-53, 19] });

  entity_placements.push({ entity_id: "ent_candle_eaten_2", cell: [-33, 25] });
  entity_placements.push({ entity_id: "ent_candle_eaten_3", cell: [-45, 33] });
  entity_placements.push({ entity_id: "ent_rite_remnant_3", cell: [-48, 25] });

  // ── 4. The Ossuary Cloister (East Wing) ───────────────────────────────────
  // Broad reliquary halls replace the old one-tile maze. The wing now reads as
  // a built place: threshold, upper family chapel, central ossuary court, Fen
  // alcove, and the crypt chapel at the far end.
  paveRect(13, 9, 20, 16, CATACOMB); // threshold from the processional
  place("obj_net_arch_sigil", 13, 12, [1, 0], { block: false });

  // Fill the east wing with ossuary stone, then open it into rooms and galleries.
  for (let x = 21; x <= 57; x++) {
    for (let z = 4; z <= 47; z++) {
      wallCell(x, z, OSS_WALL);
    }
  }

  // Entry gallery: a wide, readable shoulder off the grand processional.
  paveRect(21, 9, 29, 16, CATACOMB);
  place("obj_net_column_root", 23, 10);
  place("obj_net_column_root", 23, 15);
  place("obj_net_brazier_cold", 27, 10);
  place("obj_net_brazier_cold", 27, 15);

  // Rusk chapel: family rites and the first house mark.
  paveRect(30, 6, 45, 17, CATACOMB);
  paveRect(36, 10, 42, 16, RITUAL);
  place("obj_net_shrine_family", 41, 16, [0, -1]);
  place("obj_net_candle_cluster", 39, 15, [0, 1], { block: false });
  place("obj_net_bone_pile", 34, 8, [0, 1], { block: false });
  place("obj_net_stele", 44, 10, [-1, 0]);
  placeItem("itm_family_mark_1", "itm_family_mark_1", 40, 14);

  triggers.push({
    id: "trg_family_rites",
    cell: [40, 14],
    type: "interact",
    conditions: [],
    once: false,
    cutscene_id: "cut_read_family_rites",
  });

  // Central ossuary court: a large traversal space with cover and sightlines.
  paveRect(29, 18, 51, 32, CATACOMB);
  paveRect(34, 22, 46, 28, RITUAL);
  place("obj_net_column_root", 31, 20);
  place("obj_net_column_root", 49, 20);
  place("obj_net_column_root", 31, 30);
  place("obj_net_column_root", 49, 30);
  place("obj_net_glass_kneeler", 36, 24, [1, 0]);
  place("obj_net_glass_kneeler", 44, 26, [-1, 0]);
  place("obj_net_votive_heap", 40, 28, [0, -1], { block: false });

  // South gallery: a broad bend that pulls the player toward both final rooms.
  paveRect(35, 31, 50, 39, CATACOMB);

  // Fen alcove: same evidence beat, now visible off the south gallery.
  paveRect(31, 38, 39, 44, CATACOMB);
  paveRect(34, 41, 37, 44, RITUAL);
  place("obj_net_shrine_family", 35, 44, [0, -1]);
  placeItem("itm_family_mark_2", "itm_family_mark_2", 35, 43);
  place("obj_net_bone_pile", 33, 42, [0, 1], { block: false });
  place("obj_net_candle_cluster", 37, 42, [0, 1], { block: false });
  triggers.push({
    id: "trg_fen_votive_count",
    cell: [35, 44],
    type: "interact",
    conditions: [],
    once: false,
    cutscene_id: "cut_read_fen_votive_count",
  });

  // Crypt Chapel — "the second page sleeps with the bones, eastward." Mara hid
  // the other half of the rite text here, in an ossuary niche. Reading it is
  // the proof that she was willing.
  paveRect(47, 33, 55, 42, RITUAL);
  place("obj_net_rite_circle", 51, 37, [0, 1], { block: false });
  place("obj_net_stele", 54, 37, [-1, 0]);
  place("obj_net_brazier_cold", 49, 35);
  place("obj_net_brazier_cold", 49, 40);
  place("obj_net_bone_pile", 53, 35, [0, 1], { block: false });
  place("obj_net_candle_cluster", 50, 37, [0, 1], { block: false });
  placeContainer("cnt_crypt_offering", 54, 40, {
    name: "Crypt Offering Chest",
    items: [
      { item_id: "itm_health_potion", count: 2 },
      { item_id: "itm_glass_shard", count: 1 },
    ],
  });
  triggers.push({
    id: "trg_crypt_fragment",
    cell: [51, 37],
    type: "interact",
    conditions: [],
    once: true,
    cutscene_id: "cut_crypt_fragment",
  });

  entity_placements.push({ entity_id: "ent_rite_remnant_4", cell: [28, 14] });
  entity_placements.push({ entity_id: "ent_rite_remnant_5", cell: [42, 11] });
  entity_placements.push({ entity_id: "ent_partial_conversion_3", cell: [39, 25] });
  entity_placements.push({ entity_id: "ent_candle_eaten_4", cell: [51, 35] });

  // ── 5. The Omphalos Antechamber (Deep South) ──────────────────────────────
  paveRect(-8, 41, 8, 45, CATACOMB); // connection
  place("obj_net_arch_sigil", 0, 43, [0, 1], { block: false });

  // Massive circular antechamber
  const ANTE_CX = 0;
  const ANTE_CZ = 55;
  const ANTE_R = 10;
  for (let x = ANTE_CX - ANTE_R; x <= ANTE_CX + ANTE_R; x++) {
    for (let z = ANTE_CZ - ANTE_R; z <= ANTE_CZ + ANTE_R; z++) {
      const dx = x - ANTE_CX;
      const dz = z - ANTE_CZ;
      if (dx * dx + dz * dz <= ANTE_R * ANTE_R + 2) pave(x, z, RITUAL);
    }
  }

  // The lesser omphalos at the center
  place("obj_net_omphalos", 0, 55);

  // Ring of glass kneelers
  place("obj_net_glass_kneeler", 0, 51, [0, 1]);
  place("obj_net_glass_kneeler", 0, 59, [0, -1]);
  place("obj_net_glass_kneeler", -4, 55, [1, 0]);
  place("obj_net_glass_kneeler", 4, 55, [-1, 0]);

  // Massive root columns framing the room
  place("obj_net_column_root", -7, 48);
  place("obj_net_column_root", 7, 48);
  place("obj_net_column_root", -7, 62);
  place("obj_net_column_root", 7, 62);
  place("obj_net_brazier_cold", -9, 55);
  place("obj_net_brazier_cold", 9, 55);

  // Antechamber guardians
  entity_placements.push({ entity_id: "ent_partial_conversion_4", cell: [-4, 50] });
  entity_placements.push({ entity_id: "ent_partial_conversion_5", cell: [4, 50] });
  entity_placements.push({ entity_id: "ent_rite_remnant_6", cell: [-4, 60] });
  entity_placements.push({ entity_id: "ent_rite_remnant_7", cell: [4, 60] });
  entity_placements.push({ entity_id: "ent_save", cell: [22, 12] });

  // Exit throat to the Depths
  paveRect(-2, 65, 2, 75, CATACOMB);
  place("obj_net_arch_sigil", 0, 68, [0, 1], { block: false });
  place("obj_net_root_curtain", 0, 72, [0, 1], { block: false });

  // ── Items & Misc ──────────────────────────────────────────────────────────
  placeItem("itm_upper_health_1", "itm_health_potion", -8, 25);
  placeItem("itm_upper_health_2", "itm_health_potion", 8, 35);
  // The collection layer: votives left by generations of under-worshippers.
  // They are also fuel — the witness-rite in Act 3 burns brighter for each.
  placeItem("itm_upper_votive_1", "itm_votive", -7, 30);
  placeItem("itm_upper_votive_2", "itm_votive", 39, 28);
  placeItem("itm_upper_votive_3", "itm_votive", -46, 28);
  placeItem("itm_upper_votive_4", "itm_votive", 0, 61);
  placeItem("itm_upper_shard_1", "itm_glass_shard", -30, 15);

  triggers.push({
    id: "trg_network_upper_music",
    type: "on_load",
    cutscene_id: "cut_network_upper_enter",
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

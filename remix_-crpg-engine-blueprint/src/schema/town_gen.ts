import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── The Town of the Witness, rebuilt ────────────────────────────────────────
// A terraced procession town. The sacred way climbs three terraces from the
// Mouthstone gate in the north to the Temple of the Witness in the south —
// so the cordoned, bleeding statue is VISIBLE above the whole town from the
// moment you arrive. Buildings press close to the way; every civic door
// opens onto it. Nothing important is more than a lane away from the spine.
//
//   z -38..-30  Processional Gate (ground)     Mouthstone, spawn, guards
//   z -30..-20  Gate Quarter (ground)          Gaol (west) ⟷ Scriptorium (east)
//   z -19..-8   Lower Town (ground)            Inn (west), rowhouses (east)
//   z  -8..3    The Agora (ground)             fountain, stele, stoa market
//   z   4..13   The Upper Walk (terrace 1)     shrines, Sela's house, groves
//   z  14..32   Temple Terrace (terrace 2)     colonnade, cella, the cordon
//
// Terrace edges block movement naturally (visual_height delta > 1); access
// is only by the stair gaps left in the balustrade lines.

type Vec2 = [number, number];

const MIN_X = -28;
const MAX_X = 28;
const MIN_Z = -38;
const MAX_Z = 34;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const MOSAIC = "obj_floor_mosaic";
const ROOF = "obj_roof_tile";
const WATER = "obj_water";
const WALL_MARBLE = "obj_wall_stone";
const WALL_CLAY = "obj_wall_brick";

const key = (x: number, z: number) => `${x}|${z}`;

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Terrace height (visual_height units) by row.
const terraceFor = (z: number) => (z >= 14 ? 2 : z >= 4 ? 1 : 0);

export const generateTownCells = (): {
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
  const grid = new Map<string, CellData>();
  const reserved = new Set<string>();
  const rng = mulberry32(0x57495432);

  const get = (x: number, z: number) => grid.get(key(x, z));
  const reserve = (x: number, z: number) => reserved.add(key(x, z));

  const setTile = (
    x: number,
    z: number,
    objectId: string,
    opts: { walkable?: boolean; blocksLos?: boolean; visualHeight?: number } = {},
  ) => {
    const c = get(x, z);
    if (!c) return;
    c.object_id = objectId;
    c.walkable = opts.walkable ?? objectId !== WATER;
    c.blocks_los = opts.blocksLos ?? objectId.startsWith("obj_wall");
    c.visual_height =
      opts.visualHeight ??
      (objectId.startsWith("obj_wall") ? 4 : terraceFor(z));
    c.terrain = objectId === WATER ? "water" : objectId === GROUND ? "grass" : "stone";
    c.surface_tag = objectId === WATER ? "water" : "none";
  };

  const pave = (x: number, z: number, floor = MARBLE) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = MARBLE) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pave(x, z, floor);
  };

  const wallCell = (x: number, z: number, wall = WALL_MARBLE) => {
    setTile(x, z, wall, { walkable: false, blocksLos: true, visualHeight: 4 });
    reserve(x, z);
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
    reserve(x, z);
    const c = get(x, z);
    if (c) {
      c.walkable = false;
      c.blocks_los = false;
    }
  };

  const placeItem = (id: string, itemId: string, x: number, z: number, count = 1) => {
    item_placements.push({ id, item_id: itemId, cell: [x, z], count });
    reserve(x, z);
  };

  const addRoof = (x0: number, z0: number, x1: number, z1: number, skip?: Set<string>) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        if (skip?.has(key(x, z))) continue;
        cells.push({
          x, y: 2, z,
          active: true, walkable: false, blocks_los: true,
          height: 0, visual_height: 0,
          terrain: "stone", surface_tag: "none", object_id: ROOF,
        });
      }
    }
  };

  // ── Base terrain: terraced earth + the Spoken River ───────────────────────
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const isRiver = x <= -25;
      const cell: CellData = {
        x, y: 0, z,
        active: true,
        walkable: !isRiver,
        blocks_los: false,
        height: 0,
        visual_height: isRiver ? 0 : terraceFor(z),
        terrain: isRiver ? "water" : "grass",
        surface_tag: isRiver ? "water" : "none",
        object_id: isRiver ? WATER : GROUND,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // ── The Sacred Way and its plazas ─────────────────────────────────────────
  paveRect(-2, -30, 2, 13); // the spine, gate to upper walk
  paveRect(-8, -38, 8, -30); // processional gate plaza
  paveRect(-12, -8, 12, 3); // the agora
  paveRect(-6, -27, -3, -25); // gaol lane (west)
  paveRect(3, -27, 6, -25); // scriptorium lane (east)
  paveRect(-6, -14, -3, -12); // inn lane
  paveRect(3, -17, 6, -9); // rowhouse lane
  paveRect(-24, -3, -3, 0); // west road to the bridge
  paveRect(-28, -3, -25, 0); // the bridge itself
  paveRect(3, -3, 22, 0); // east road
  paveRect(-22, 4, 22, 13, GROUND); // the upper walk keeps earth underfoot
  paveRect(-2, 4, 2, 13); // ...except the spine
  paveRect(-14, 14, 14, 32); // temple terrace, full marble
  paveRect(-5, 21, 5, 29, MOSAIC); // cella floor (walls carved out below)

  // ── Processional Gate ─────────────────────────────────────────────────────
  place("obj_mouthstone_gate", 0, -34, [0, 1], { dialogue: "dia_mouthstone", block: false });
  for (let x = -6; x <= -2; x++) place("obj_fence_stone", x, -34, [0, 1]);
  for (let x = 2; x <= 6; x++) place("obj_fence_stone", x, -34, [0, 1]);
  place("obj_lantern_post", -4, -31, [0, 1]);
  place("obj_lantern_post", 4, -31, [0, 1]);
  place("obj_statue_votary", -7, -37, [0, 1]);
  place("obj_statue_votary", 7, -37, [0, 1]);
  place("obj_column_broken", -8, -32, [1, 0]);

  // ── The procession itself: votaries line the way, watching you climb ─────
  for (let z = -28; z <= 10; z += 8) {
    place("obj_statue_votary", -3, z, [1, 0]);
    place("obj_statue_votary", 3, z + 4, [-1, 0]);
  }
  for (let z = -24; z <= 8; z += 8) {
    place("obj_lantern_post", -3, z, [1, 0]);
    place("obj_lantern_post", 3, z + 4, [-1, 0]);
  }
  place("obj_cypress", -4, -19, [0, 1]);
  place("obj_cypress", 4, -23, [0, 1]);
  place("obj_cypress", -4, 2, [0, 1]);

  // ── Gate Quarter: the Hall of Custody (west) ──────────────────────────────
  const buildHall = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string,
    door: { x: number; z: number },
    courtyard?: { x0: number; z0: number; x1: number; z1: number },
  ) => {
    const skip = new Set<string>();
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = x === door.x && z === door.z;
        const isPerimeter = x === x0 || x === x1 || z === z0 || z === z1;
        const inCourt =
          courtyard && x >= courtyard.x0 && x <= courtyard.x1 && z >= courtyard.z0 && z <= courtyard.z1;
        if (isDoor) {
          pave(x, z, floor);
          reserve(x, z);
        } else if (isPerimeter) {
          wallCell(x, z, wall);
        } else if (inCourt) {
          setTile(x, z, GROUND);
          skip.add(key(x, z));
          reserve(x, z);
        } else {
          pave(x, z, floor);
          reserve(x, z);
        }
      }
    }
    if (courtyard)
      for (let x = courtyard.x0; x <= courtyard.x1; x++)
        for (let z = courtyard.z0; z <= courtyard.z1; z++) skip.add(key(x, z));
    addRoof(x0, z0, x1, z1, skip);
  };

  buildHall(-20, -31, -7, -21, WALL_MARBLE, MARBLE, { x: -7, z: -26 });
  // Bronze bars split the cell block (north) from the warden's office.
  for (let x = -19; x <= -8; x++) {
    place("obj_cell_bars", x, -26 - 1, [0, 1], {
      dialogue: x === -13 ? "dia_nessa_bars" : undefined,
    });
  }
  place("obj_pallet_bed", -18, -29, [0, 1]);
  place("obj_pallet_bed", -9, -29, [0, 1]);
  place("obj_amphora", -16, -30, [0, 1]);
  place("obj_table", -10, -23, [0, 1]);
  place("obj_pew", -14, -23, [0, 1]);
  placeContainer("cnt_gaol_effects", -19, -22, {
    name: "Confiscated Effects",
    items: [{ item_id: "itm_carried_stone" }, { item_id: "itm_votive" }],
  });

  // ── Gate Quarter: the Scriptorium of the Intercession (east) ──────────────
  buildHall(7, -31, 20, -21, WALL_CLAY, WOOD, { x: 7, z: -26 });
  // Interior wall: archive (north) and study (south), gap at x 13.
  for (let x = 8; x <= 19; x++) {
    if (x !== 13) wallCell(x, -26, WALL_CLAY);
  }
  placeContainer("cnt_aldric_archive", 17, -29, {
    name: "Archive Chest",
    locked: true,
    key: "itm_archive_key",
    items: [{ item_id: "itm_glass_shard" }, { item_id: "itm_health_potion" }],
  });
  placeContainer("cnt_aldric_supplies", 17, -27, {
    name: "Office Supply Chest",
    items: [{ item_id: "itm_health_potion", count: 2 }],
  });
  place("obj_amphora", 9, -29, [0, 1]);
  place("obj_table", 11, -23, [0, 1]);
  place("obj_podium", 17, -23, [0, 1]);
  place("obj_pew", 13, -22, [0, 1]);
  placeItem("wi_archive_key", "itm_archive_key", 9, -22);

  // ── Lower Town: the Counted Cup (inn, west) ───────────────────────────────
  buildHall(-20, -19, -7, -8, WALL_CLAY, WOOD, { x: -7, z: -13 });
  // Back room for quieter arrangements.
  for (let z = -18; z <= -9; z++) {
    if (z !== -16) wallCell(-15, z, WALL_CLAY);
  }
  place("obj_table", -11, -16, [0, 1]);
  place("obj_table", -11, -10, [0, 1]);
  place("obj_pew", -9, -16, [0, 1]);
  place("obj_pew", -13, -10, [0, 1]);
  place("obj_barrel", -8, -18, [0, 1]);
  place("obj_barrel", -16, -18, [0, 1]);
  place("obj_amphora", -19, -10, [0, 1]);
  place("obj_pallet_bed", -19, -17, [0, 1]);
  placeContainer("cnt_inn_larder", -12, -18, {
    name: "Inn Larder",
    items: [{ item_id: "itm_health_potion", count: 2 }],
  });
  placeContainer("cnt_ferryman_cache", -19, -12, {
    name: "Riverman's Cache",
    locked: true,
    key: "itm_glass_shard",
    items: [{ item_id: "itm_votive", count: 2 }, { item_id: "itm_health_potion" }],
  });

  // ── Lower Town: rowhouses (east) ──────────────────────────────────────────
  buildHall(7, -19, 18, -14, WALL_CLAY, WOOD, { x: 7, z: -16 });
  buildHall(7, -13, 18, -8, WALL_CLAY, WOOD, { x: 7, z: -10 });
  place("obj_table", 10, -17, [0, 1]);
  place("obj_pallet_bed", 16, -17, [0, 1]);
  placeContainer("cnt_home_rowA", 16, -15, {
    name: "Household Chest",
    items: [{ item_id: "itm_health_potion" }],
  });
  place("obj_table", 10, -11, [0, 1]);
  place("obj_pallet_bed", 16, -11, [0, 1]);
  place("obj_amphora", 9, -9, [0, 1]);
  placeContainer("cnt_home_rowB", 16, -9, {
    name: "Household Chest",
    items: [{ item_id: "itm_votive" }],
  });
  // Cellar entrance to Pagan Network
  place("obj_net_rubble", 17, -9); // Visual marker for the trapdoor

  // ── Homes flanking the agora roads ────────────────────────────────────────
  buildHall(-24, -6, -13, 2, WALL_CLAY, WOOD, { x: -13, z: -2 }, { x0: -19, z0: -3, x1: -18, z1: -2 });
  place("obj_table", -22, -4, [0, 1]);
  place("obj_pallet_bed", -15, -4, [0, 1]);
  placeContainer("cnt_home_west", -15, 0, {
    name: "Household Chest",
    items: [{ item_id: "itm_glass_shard" }],
  });
  buildHall(13, -6, 22, 2, WALL_CLAY, WOOD, { x: 13, z: -2 });
  place("obj_table", 15, -4, [0, 1]);
  place("obj_pallet_bed", 20, -4, [0, 1]);
  place("obj_amphora", 20, 0, [0, 1]);
  placeContainer("cnt_home_east", 15, 0, {
    name: "Household Chest",
    items: [{ item_id: "itm_votive" }],
  });

  // ── The Agora ─────────────────────────────────────────────────────────────
  place("obj_well", -5, -3, [0, 1]);
  place("obj_notice_board", 4, -6, [0, 1], { dialogue: "dia_notice_board" });
  place("obj_pew", -8, -6, [0, -1]);
  place("obj_pew", -2, -6, [0, -1]);
  place("obj_pew", 7, -3, [0, -1]);
  placeItem("wi_plaza_potion", "itm_health_potion", -4, -1);
  // Stoa market: columns sheltering stalls along the east edge.
  for (let z = -6; z <= 0; z += 3) place("obj_column", 8, z, [0, 1]);
  place("obj_market_stall", 10, -5, [-1, 0]);
  place("obj_market_stall", 10, -2, [-1, 0]);
  place("obj_barrel", 10, 1, [0, 1]);
  place("obj_amphora", 11, -4, [0, 1]);
  placeContainer("cnt_market_strongbox", 11, 1, {
    name: "Market Strongbox",
    items: [{ item_id: "itm_health_potion" }, { item_id: "itm_glass_shard" }],
  });

  // ── Terrace edges: balustrades with stair gaps ────────────────────────────
  const stairGapsB = new Set([-14, -13, -12, -1, 0, 1, 12, 13, 14]);
  for (let x = -22; x <= 22; x++) {
    if (!stairGapsB.has(x)) place("obj_fence_stone", x, 4, [0, 1]);
  }
  const stairGapsC = new Set<number>(); // no gaps — the cordon seals the temple
  for (let x = -14; x <= 14; x++) {
    if (!stairGapsC.has(x))
      place("obj_fence_stone", x, 14, [0, 1], {
        dialogue: x === 0 ? "dia_cordon" : undefined,
      });
  }

  // ── The Upper Walk (terrace 1) ────────────────────────────────────────────
  // Wayside shrine with the save candle.
  place("obj_altar", 5, 8, [0, -1]);
  place("obj_statue_votary", 7, 9, [-1, 0]);
  place("obj_lantern_post", 4, 10, [0, 1]);
  // The glass-funeral shrine: where the town mourns its counted.
  place("obj_altar", -9, 9, [0, -1]);
  place("obj_statue_votary", -11, 8, [1, 0]);
  place("obj_statue_votary", -7, 8, [-1, 0]);
  place("obj_lantern_post", -9, 11, [0, 1]);
  place("obj_dead_tree", -13, 10, [0, 1]);
  placeItem("wi_funeral_votive", "itm_votive", -8, 11);
  // Sela's cottage, the widow's cousin.
  buildHall(-22, 5, -15, 12, WALL_CLAY, WOOD, { x: -15, z: 9 });
  place("obj_table", -20, 7, [0, 1]);
  place("obj_pallet_bed", -17, 7, [0, 1]);
  placeContainer("cnt_sela_chest", -20, 10, {
    name: "Sela's Cedar Chest",
    items: [{ item_id: "itm_votive" }],
  });
  // Olive grove east.
  for (let x = 15; x <= 21; x += 3) {
    for (let z = 6; z <= 12; z += 4) {
      const jx = x + Math.floor(rng() * 2);
      const jz = z + Math.floor(rng() * 2);
      if (get(jx, jz)?.walkable && !reserved.has(key(jx, jz))) place("obj_tree", jx, jz, [0, 1]);
    }
  }
  placeItem("wi_grove_votive", "itm_votive", 18, 9);

  // ── Temple Terrace ────────────────────────────────────────────────────────
  for (let x = -9; x <= 9; x += 3) {
    place("obj_column", x, 17, [0, 1]);
    place("obj_column", x, 31, [0, 1]);
  }
  for (let z = 20; z <= 28; z += 4) {
    place("obj_column", -9, z, [0, 1]);
    place("obj_column", 9, z, [0, 1]);
  }
  for (let x = -5; x <= 5; x++) {
    if (x !== 0) wallCell(x, 21, WALL_MARBLE);
  }
  for (let x = -5; x <= 5; x++) wallCell(x, 29, WALL_MARBLE);
  for (let z = 22; z <= 28; z++) {
    wallCell(-5, z, WALL_MARBLE);
    wallCell(5, z, WALL_MARBLE);
  }
  place("obj_bleeding_witness", 0, 26, [0, -1], { dialogue: "dia_statue", block: false });
  place("obj_altar", 0, 23, [0, -1]);
  place("obj_lantern_post", -3, 24, [1, 0]);
  place("obj_lantern_post", 3, 24, [-1, 0]);
  place("obj_amphora", -3, 28, [0, 1]);
  place("obj_amphora", 3, 28, [0, 1]);
  place("obj_cypress", -12, 16, [0, 1]);
  place("obj_cypress", 12, 16, [0, 1]);
  place("obj_cypress", -12, 30, [0, 1]);
  place("obj_cypress", 12, 30, [0, 1]);
  placeItem("wi_cordon_shard", "itm_glass_shard", 4, 13);

  // ── Natural dressing ──────────────────────────────────────────────────────
  for (const cell of cells) {
    if (cell.y !== 0 || cell.object_id !== GROUND || !cell.walkable) continue;
    if (reserved.has(key(cell.x, cell.z))) continue;
    const nearRiver = cell.x >= -24 && cell.x <= -21;
    const oldGround = cell.z <= -31;
    const r = rng();
    if (oldGround) {
      if (r < 0.1) place("obj_dead_tree", cell.x, cell.z, [0, 1]);
      else if (r < 0.24) place("obj_grass_tuft", cell.x, cell.z, [0, 1], { block: false });
    } else if (nearRiver) {
      if (r < 0.12) place("obj_tree", cell.x, cell.z, [0, 1]);
      else if (r < 0.22) place("obj_bush", cell.x, cell.z, [0, 1]);
      else if (r < 0.4) place("obj_grass_tuft", cell.x, cell.z, [0, 1], { block: false });
    } else if (r < 0.06) {
      place("obj_grass_tuft", cell.x, cell.z, [0, 1], { block: false });
    }
  }
  place("obj_column_broken", 24, -7, [0, 1]);
  place("obj_column_broken", -10, -34, [1, 0]);

  // ── The cast, at their posts ──────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_aldric", cell: [13, -24] },
    { entity_id: "ent_nessa", cell: [-13, -29] },
    {
      entity_id: "ent_merchant",
      cell: [9, -3],
      schedule: [
        { hour: 7, cell: [9, -3] },
        { hour: 20, cell: [-9, -10] },
      ],
    },
    { entity_id: "ent_save", cell: [6, 11] },
    {
      entity_id: "ent_gaoler",
      cell: [-12, -23],
      schedule: [
        { hour: 6, cell: [-12, -23] },
        { hour: 21, cell: [-3, -32] },
      ],
    },
    { entity_id: "ent_guard_cordon", cell: [0, 13] },
    {
      entity_id: "ent_guard_gate",
      cell: [3, -31],
      schedule: [
        { hour: 6, cell: [3, -31] },
        { hour: 22, cell: [-10, -25] },
      ],
    },
    {
      entity_id: "ent_priest",
      cell: [1, 11],
      schedule: [
        { hour: 5, cell: [1, 11] },
        { hour: 21, cell: [16, -20] },
      ],
    },
    { entity_id: "ent_innkeep", cell: [-12, -13] },
    {
      entity_id: "ent_elder",
      cell: [-4, -5],
      schedule: [
        { hour: 8, cell: [-4, -5] },
        { hour: 19, cell: [-18, 8] },
      ],
    },
    {
      entity_id: "ent_mason",
      cell: [5, -4],
      schedule: [
        { hour: 7, cell: [5, -4] },
        { hour: 20, cell: [-21, -1] },
      ],
    },
    {
      entity_id: "ent_mother",
      cell: [-10, 10],
      schedule: [
        { hour: 8, cell: [-10, 10] },
        { hour: 18, cell: [17, -3] },
      ],
    },
    {
      entity_id: "ent_pilgrim",
      cell: [-1, 9],
      schedule: [
        { hour: 6, cell: [-1, 9] },
        { hour: 21, cell: [5, -33] },
      ],
    },
    {
      entity_id: "ent_ferryman",
      cell: [-17, -16],
      schedule: [
        { hour: 8, cell: [-17, -16] },
        { hour: 20, cell: [-23, -2] },
      ],
    },
  ];

  // ── Triggers: wide, unmissable, condition-disarmed ────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_arrival",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_arrival",
      once: true,
    },
    {
      id: "trg_town_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
      once: false,
    }
  ];

  // A multi-cell step trigger: one cutscene, fired from any listed cell,
  // disarmed for all of them by the switch the cutscene sets.
  const wideTrigger = (
    idBase: string,
    cutsceneId: string,
    disarmSwitch: string,
    cellsToCover: Vec2[],
    condition?: any,
  ) => {
    cellsToCover.forEach(([x, z], i) => {
      triggers.push({
        id: `${idBase}_${i}`,
        cell: [x, z],
        type: "step",
        conditions: [],
        condition: condition
          ? { all: [{ not: { switch: disarmSwitch } }, condition] }
          : { not: { switch: disarmSwitch } },
        cutscene_id: cutsceneId,
        once: false,
      });
    });
  };

  wideTrigger("trg_office", "cut_office_briefing", "act1_assigned", [
    [6, -27], [6, -26], [6, -25], [7, -26],
  ], { not: { switch: "act1_rite_text" } });
  
  wideTrigger("trg_office_after", "cut_office_after", "act1_complete", [
    [6, -27], [6, -26], [6, -25], [7, -26],
  ], { switch: "act1_rite_text" });

  wideTrigger(
    "trg_gaol",
    "cut_gaol_entry",
    "gaol_entered",
    [[-6, -27], [-6, -26], [-6, -25], [-7, -26]],
    { switch: "act1_assigned" },
  );
  wideTrigger("trg_rhyme", "cut_children_rhyme", "heard_rhyme", [
    [3, -16], [4, -16], [5, -16], [6, -16],
  ]);
  wideTrigger("trg_upper_walk", "cut_first_sight", "seen_cordon", [
    [-1, 5], [0, 5], [1, 5], [-13, 5], [13, 5],
  ]);
  wideTrigger("trg_funeral", "cut_funeral_shrine", "seen_funeral", [
    [-9, 12], [-8, 12], [-10, 12],
  ]);
  wideTrigger(
    "trg_cellar",
    "cut_cellar_seal",
    "seen_cellar",
    [[-19, -11], [-18, -11]],
    { switch: "met_nessa" },
  );

  // The Trapdoor to the Pagan Network Upper Level
  triggers.push({
    id: "trg_trapdoor_locked",
    cell: [17, -9],
    type: "interact",
    conditions: [],
    condition: { not: { switch: "act1_assigned" } },
    cutscene_id: "cut_trapdoor_locked",
    once: false,
  });
  triggers.push({
    id: "trg_trapdoor_enter",
    cell: [17, -9],
    type: "interact",
    conditions: [],
    condition: { switch: "act1_assigned" },
    cutscene_id: "cut_trapdoor_enter",
    once: false,
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

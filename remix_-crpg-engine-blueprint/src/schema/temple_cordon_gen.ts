import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Temple & Cordon Map ───────────────────────────────────────────────────
// The sacred terrace. The bleeding Witness statue dominates the center,
// cordoned off. The temple is behind it (north). The prison/Hall of Custody
// is in the southeast. Father Imre tends the temple. Guard Bren minds the
// cordon. Nessa is behind bars.
//
// Exits: west (→ residential), northwest (→ town square)
//
//   ┌────────────────────────────────────┐
//   │        [Temple Interior]           │
//   │             │                      │
//   │   ─── [Witness Cordon] ───         │
//   │   │   (bleeding statue)   │        │
//   │   │        fenced         │        │
//   │   ─────────────────────────        │
//   │                                    │
//   │   road west ──── road nw           │
//   │                                    │
//   │             [Lower Graves]         │
//   │                    [Prison/Gaol]   │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const TEMPLE_W = MAX_X - MIN_X + 1;
export const TEMPLE_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const WALL_MARBLE = "obj_wall_stone";
const WALL_CLAY = "obj_wall_brick";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateTempleCordonCells = (): {
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

  const get = (x: number, z: number) => grid.get(key(x, z));
  const reserve = (x: number, z: number) => reserved.add(key(x, z));

  const setTile = (
    x: number, z: number, objectId: string,
    opts: { walkable?: boolean; blocksLos?: boolean; visualHeight?: number } = {},
  ) => {
    const c = get(x, z);
    if (!c) return;
    c.object_id = objectId;
    c.walkable = opts.walkable ?? true;
    c.blocks_los = opts.blocksLos ?? objectId.startsWith("obj_wall");
    c.visual_height = opts.visualHeight ?? (objectId.startsWith("obj_wall") ? 4 : 0);
    c.terrain = objectId === GROUND ? "grass" : "stone";
    c.surface_tag = "none";
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
    objectId: string, x: number, z: number, facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const placement: ObjectPlacementData = { object_id: objectId, cell: [x, z], facing };
    if (opts.dialogue) placement.dialogue_id = opts.dialogue;
    custom_object_placements.push(placement);
    reserve(x, z);
    if (opts.block !== false) {
      const c = get(x, z);
      if (c) { c.walkable = false; c.blocks_los = false; }
    }
  };

  const placeIfClear = (
    objectId: string, x: number, z: number, facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const c = get(x, z);
    if (!c || !c.walkable || reserved.has(key(x, z))) return false;
    place(objectId, x, z, facing, opts);
    return true;
  };

  const placeContainer = (
    id: string, x: number, z: number,
    opts: { name?: string; locked?: boolean; key?: string; items?: { item_id: string; count?: number }[] } = {},
  ) => {
    container_placements.push({
      id, object_id: "obj_chest", cell: [x, z], facing: [0, 1],
      display_name: opts.name, locked: opts.locked ?? false,
      key_item_id: opts.key, consume_key: false,
      items: (opts.items || []).map(e => ({ item_id: e.item_id, count: e.count ?? 1 })),
    });
    reserve(x, z);
    const c = get(x, z);
    if (c) { c.walkable = false; c.blocks_los = false; }
  };

  const buildHall = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string, door: { x: number; z: number },
  ) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = x === door.x && z === door.z;
        const isPerimeter = x === x0 || x === x1 || z === z0 || z === z1;
        if (isDoor) { pave(x, z, floor); reserve(x, z); }
        else if (isPerimeter) { wallCell(x, z, wall); }
        else { pave(x, z, floor); reserve(x, z); }
      }
    }
  };

  // ── Base terrain ───────────────────────────────────────────────────────
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x, y: 0, z,
        active: true, walkable: true, blocks_los: false,
        height: 0, visual_height: 0,
        terrain: "grass", surface_tag: "none", object_id: GROUND,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // ── Roads ──────────────────────────────────────────────────────────────
  paveRect(MIN_X, -3, MAX_X, 3); // East-West road (connects west → residential, NW → square)
  paveRect(-3, MIN_Z, 3, MAX_Z); // North-South approach to temple

  // Raised terrace for temple (upper half)
  paveRect(-12, -18, 12, -6);
  for (let x = -12; x <= 12; x++) {
    for (let z = -18; z <= -6; z++) {
      const c = get(x, z);
      if (c) c.visual_height = 1;
    }
  }

  // ── Witness Cordon (center, z = -2 to -8) ─────────────────────────────
  paveRect(-8, -8, 8, -1);
  // The Bleeding Witness statue (nine_tile: 3x3 footprint)
  place("obj_bleeding_witness", 0, -5, [0, 1], { dialogue: "dia_first_sight" });
  // Block the full 3x3 footprint around the statue
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue; // already blocked by place()
      const c = get(dx, -5 + dz);
      if (c) { c.walkable = false; c.blocks_los = false; }
      reserve(dx, -5 + dz);
    }
  }
  // Cordon fencing
  for (let x = -8; x <= 8; x++) {
    if (Math.abs(x) > 1) place("obj_fence_stone", x, -8, [0, 1]);
    if (Math.abs(x) > 1) place("obj_fence_stone", x, -1, [0, 1]);
  }
  for (let z = -7; z <= -2; z++) {
    place("obj_fence_stone", -8, z, [1, 0]);
    place("obj_fence_stone", 8, z, [-1, 0]);
  }
  placeIfClear("obj_lantern_post", -9, -5, [1, 0]);
  placeIfClear("obj_lantern_post", 9, -5, [-1, 0]);

  // ── Temple Interior (north section, raised) ────────────────────────────
  buildHall(-8, -18, 8, -12, WALL_MARBLE, MARBLE, { x: 0, z: -12 });
  place("obj_altar", 0, -15, [0, -1]);
  for (const dx of [-6, -3, 3, 6]) {
    placeIfClear("obj_column", dx, -13, [0, 1]);
    placeIfClear("obj_column", dx, -17, [0, 1]);
  }

  // ── Lower Graves (southeast, z 6-16) ──────────────────────────────────
  paveRect(4, 6, 16, 16, GROUND);
  placeIfClear("obj_column_broken", 6, 8, [0, 1]);
  placeIfClear("obj_column_broken", 14, 8, [0, 1]);
  placeIfClear("obj_column_broken", 8, 14, [0, 1]);
  placeIfClear("obj_column_broken", 12, 14, [0, 1]);
  placeIfClear("obj_p_shrine_stone", 10, 11, [0, 1]);

  // ── Prison / Hall of Custody (south, z 8-18) ──────────────────────────
  buildHall(-16, 8, -6, 18, WALL_MARBLE, MARBLE, { x: -6, z: 13 });
  // Cell bars dividing prisoner from warden
  for (let z = 9; z <= 17; z++) {
    place("obj_cell_bars", -11, z, [1, 0], {
      dialogue: z === 13 ? "dia_nessa_bars" : undefined,
    });
  }
  place("obj_pallet_bed", -14, 10, [0, 1]); // Nessa's cell
  place("obj_pallet_bed", -14, 16, [0, 1]);
  place("obj_table", -8, 11, [0, 1]); // warden's desk
  place("obj_pew", -8, 15, [0, 1]);
  placeContainer("cnt_gaol_effects", -14, 12, {
    name: "Confiscated Effects",
    items: [{ item_id: "itm_carried_stone" }, { item_id: "itm_votive" }],
  });

  // ── Entity Placements ──────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_priest", cell: [0, -14] },
    { entity_id: "ent_guard_cordon", cell: [0, 0] },
    { entity_id: "ent_nessa", cell: [-13, 13] }, // behind bars
    { entity_id: "ent_gaoler", cell: [-9, 13] },
    { entity_id: "ent_burial_keeper", cell: [10, 10] },
    { entity_id: "ent_mason", cell: [8, 7] },
  ];

  // ── Triggers ───────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    // Town music on enter
    {
      id: "trg_temple_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
      once: false,
    },
    // First sight of the cordon
    {
      id: "trg_cordon_sight_0",
      cell: [0, -1],
      type: "step",
      conditions: [],
      condition: { not: { switch: "seen_cordon" } },
      cutscene_id: "cut_first_sight",
      once: true,
    },
    {
      id: "trg_cordon_sight_1",
      cell: [1, -1],
      type: "step",
      conditions: [],
      condition: { not: { switch: "seen_cordon" } },
      cutscene_id: "cut_first_sight",
      once: true,
    },
    // Prison gate — blocked until vampire cleared
    {
      id: "trg_gate_prison_0",
      cell: [-6, 13],
      type: "step",
      conditions: [],
      condition: { not: { switch: "vampire_cleared" } },
      cutscene_id: "cut_gate_blocked_prison",
      once: false,
    },
    {
      id: "trg_gate_prison_1",
      cell: [-6, 12],
      type: "step",
      conditions: [],
      condition: { not: { switch: "vampire_cleared" } },
      cutscene_id: "cut_gate_blocked_prison",
      once: false,
    },
  ];

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers,
  };
};

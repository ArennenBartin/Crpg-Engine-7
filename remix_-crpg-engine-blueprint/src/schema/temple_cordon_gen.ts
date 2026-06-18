import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";
import { addHippedRoof } from "../utils/cellRoofHelper";

// ── Temple & Cordon Map (Expanded) ─────────────────────────────────────────
// The sacred terrace. The bleeding Witness statue dominates the massive
// central paved plaza, cordoned off by a wide perimeter. The grand basilica
// of the temple sits behind it (north). The sprawling cemetery and lower
// graves run down the west slope. The imposing stone gaol sits southeast.
//
// Exits: west (→ residential), northwest (→ town square)

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

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

  const placeItem = (id: string, itemId: string, x: number, z: number, count = 1) => {
    item_placements.push({ id, item_id: itemId, cell: [x, z], count });
    reserve(x, z);
  };

  const buildBuilding = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string, doors: { x: number; z: number }[],
  ) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = doors.some(d => d.x === x && d.z === z);
        const isPerimeter = x === x0 || x === x1 || z === z0 || z === z1;
        if (isDoor) { pave(x, z, floor); reserve(x, z); }
        else if (isPerimeter) { wallCell(x, z, wall); }
        else { pave(x, z, floor); reserve(x, z); }
      }
    }
  };

  // ── Base terrain ────────────────────────────────────────────────────────
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

  // ── Main Roads & Exits ──────────────────────────────────────────────────
  // Road heading NW (to Town Square) from plaza to map edge (-40, -20)
  paveRect(-40, -22, -20, -18, GROUND);
  paveRect(-40, -21, -20, -19, MARBLE); // Inner paved path
  
  // Grand Road heading East (to Glassworks) from plaza to map edge (40)
  paveRect(20, -4, 40, 4, GROUND);
  paveRect(20, -2, 40, 2, MARBLE); // Inner paved path

  // ── Central Plaza & The Witness Cordon ──────────────────────────────────
  paveRect(-18, -10, 18, 14, MARBLE);
  paveRect(-6, -14, 6, -10, MARBLE);
  paveRect(-22, -4, -18, 4, MARBLE);
  paveRect(18, -4, 22, 4, MARBLE);

  // The Witness Statue: a continuous Church cordon, not spaced-out fence props.
  const cordonMin = -4;
  const cordonMax = 4;
  for (const [x, z] of [
    [cordonMin, cordonMin],
    [cordonMax, cordonMin],
    [cordonMin, cordonMax],
    [cordonMax, cordonMax],
  ] as Vec2[]) {
    place("obj_ald_cordon_corner_standard", x, z, [0, 1]);
  }

  for (let x = cordonMin + 1; x <= cordonMax - 1; x += 1) {
    place("obj_ald_cordon_viewing_rail", x, cordonMin, [0, 1]);
    place("obj_ald_cordon_viewing_rail", x, cordonMax, [0, -1]);
  }
  for (let z = cordonMin + 1; z <= cordonMax - 1; z += 1) {
    place("obj_ald_cordon_viewing_rail", cordonMin, z, [1, 0]);
    place("obj_ald_cordon_viewing_rail", cordonMax, z, [-1, 0]);
  }
  place("obj_bleeding_witness", 0, 0, [0, 1]); // The main event
  placeItem("wi_blood_shard", "itm_glass_shard", 1, -5);
  place("obj_p_placard", 0, -7, [0, 1], { block: false, dialogue: "dia_cordon" });
  place("obj_p_placard", 0, -6, [0, 1], { block: false, dialogue: "dia_statue" });
  place("obj_ald_witness_votive_bank", -5, 4, [0, 1], { block: false });
  place("obj_ald_witness_votive_bank", 5, 4, [0, 1], { block: false });

  // Cordon Plaza Decor
  place("obj_ald_civic_lantern_post", -12, 8, [0, 1]);
  place("obj_ald_civic_lantern_post", 12, 8, [0, 1]);
  place("obj_ald_civic_lantern_post", -12, -8, [0, 1]);
  place("obj_ald_civic_lantern_post", 12, -8, [0, 1]);
  place("obj_well", 0, 12, [0, 1]); // plaza fountain (well stand-in)
  place("obj_ald_civic_route_board", 14, -6, [0, 1], { block: false, dialogue: "dia_cordon" });
  place("obj_pew", -6, 12, [1, 0]);
  place("obj_pew", 6, 12, [-1, 0]);
  for (const [x, z] of [
    [-34, -8], [-28, -8], [28, -8], [34, -8],
    [-24, 10], [-18, 12], [18, 10], [24, 12],
  ] as Vec2[]) {
    placeIfClear("obj_cypress", x, z, [0, 1]);
  }

  // ── The Temple Basilica (North, x = -16 to 16, z = -36 to -14) ──────────
  buildBuilding(-16, -36, 16, -14, WALL_MARBLE, MARBLE, [{ x: -2, z: -14 }, { x: 2, z: -14 }]);
  addHippedRoof(cells, -16, -36, 16, -14, "slate");
  // Grand interior
  for (let x = -8; x <= 8; x += 4) {
    place("obj_column", x, -30, [0, 1]);
    place("obj_column", x, -24, [0, 1]);
  }
  // Pews
  for (let z = -28; z <= -20; z += 2) {
    if (z === -24) continue; // Leave the transept columns readable.
    place("obj_pew", -6, z, [1, 0]);
    place("obj_pew", -4, z, [1, 0]);
    place("obj_pew", 4, z, [-1, 0]);
    place("obj_pew", 6, z, [-1, 0]);
  }
  place("obj_altar", 0, -32, [0, 1]);
  place("obj_podium", -4, -34, [0, 1]);
  place("obj_ald_civic_lantern_post", -8, -34, [0, 1]);
  place("obj_ald_civic_lantern_post", 8, -34, [0, 1]);
  place("obj_statue_votary", -12, -32, [0, 1]);
  place("obj_statue_votary", 12, -32, [0, 1]);
  placeContainer("cnt_temple_tithe", 14, -34, {
    name: "Tithe Box",
    items: [{ item_id: "itm_votive", count: 4 }],
  });

  // ── The Lower Graves (South/West, x = -36 to -4, z = 16 to 36) ──────────
  // Deterministic so the layout stays stable between runs.
  const graveRng = (() => { let s = 0x6772; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  for (let x = -36; x <= -4; x += 4) {
    for (let z = 18; z <= 36; z += 4) {
      const r = graveRng();
      if (r < 0.5) {
        placeIfClear("obj_p_headstone", x, z, [0, 1]);
        if (graveRng() < 0.4) placeItem(`wi_votive_${x}_${z}`, "itm_votive", x, z + 1);
      } else if (r < 0.7) {
        placeIfClear("obj_p_grave_cross", x, z, [0, 1]);
      } else if (r < 0.85) {
        placeIfClear("obj_dead_tree", x, z, [0, 1]);
      }
    }
  }
  placeIfClear("obj_p_votive_token", -18, 24, [0, 1], { block: false, dialogue: "dia_lower_grave_cloth" });

  // ── The Gaol / Prison (Southeast, x = 12 to 36, z = 16 to 36) ───────────
  buildBuilding(12, 16, 36, 36, WALL_CLAY, MARBLE, [{ x: 12, z: 26 }]);
  addHippedRoof(cells, 12, 16, 36, 36, "slate");
  // Nessa's holding side: one continuous barred wall instead of separated cells.
  for (let z = 17; z <= 35; z += 1) {
    place(
      "obj_cell_bars",
      32,
      z,
      [-1, 0],
      z === 32 ? { dialogue: "dia_nessa_bars" } : {},
    );
  }
  for (const z of [20, 26, 34]) {
    place("obj_pallet_bed", 34, z, [-1, 0]);
  }
  // Interrogator's desk
  place("obj_p_desk", 24, 20, [0, 1]);
  place("obj_pew", 24, 18, [0, 1]);
  place("obj_ald_civic_lantern_post", 20, 24, [0, 1]);
  place("obj_ald_civic_lantern_post", 28, 24, [0, 1]);

  // Unique punishment props in the center aisle
  place("obj_iron_maiden", 24, 28, [0, -1]);
  place("obj_pillory", 24, 32, [0, -1]);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [0, 10] }, // save point near fountain
    { entity_id: "ent_priest", cell: [0, -31], schedule: [
      { hour: 5, cell: [0, -31] },
      { hour: 10, cell: [0, -29] },
      { hour: 18, cell: [-2, -14] },
      { hour: 22, cell: [0, -34] },
    ] }, // Father Imre at the altar
    { entity_id: "ent_guard_cordon", cell: [-5, -4], schedule: [
      { hour: 6, cell: [-5, -4] },
      { hour: 18, cell: [-5, -6] },
      { hour: 22, cell: [5, -4] },
    ] }, // Guard Bren outside the cordon
    { entity_id: "ent_nessa", cell: [34, 32] }, // Nessa visible behind the bars
    { entity_id: "ent_gaoler", cell: [24, 22], schedule: [
      { hour: 6, cell: [24, 22] },
      { hour: 18, cell: [27, 24] },
      { hour: 23, cell: [30, 34] },
    ] }, // Warden Sefa at the interrogator's desk
    { entity_id: "ent_burial_keeper", cell: [-21, 26], schedule: [
      { hour: 6, cell: [-21, 26] },
      { hour: 14, cell: [-30, 28] },
      { hour: 20, cell: [-10, 20] },
    ] }, // Marta among the lower graves
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_temple_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
      once: false,
    },
    {
      id: "trg_nessa_talk",
      cell: [32, 32],
      type: "interact",
      conditions: [],
      condition: { switch: "vampire_cleared" },
      cutscene_id: "cut_gaol_entry",
      once: true,
    },
    {
      id: "trg_witness_first_sight_interact",
      cell: [0, -4],
      type: "interact",
      conditions: [],
      condition: { not: { switch: "seen_cordon" } },
      cutscene_id: "cut_first_sight",
      once: false,
    },
    ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map((z, i) => ({
      id: `trg_glassworks_held_${i}`,
      cell: [40, z] as [number, number],
      type: "step" as const,
      conditions: [],
      condition: { not: { switch: "orin_public_accusation_seen" } },
      cutscene_id: "cut_gate_blocked_glassworks",
      once: false,
    })),
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

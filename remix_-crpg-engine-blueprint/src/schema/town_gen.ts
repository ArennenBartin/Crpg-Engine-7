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

const MIN_X = -56;
const MAX_X = 57;
const MIN_Z = -76;
const MAX_Z = 69;

export const TOWN_W = MAX_X - MIN_X + 1;
export const TOWN_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const MOSAIC = "obj_floor_mosaic";
const WATER = "obj_water";
const WALL_MARBLE = "obj_wall_stone";
const WALL_CLAY = "obj_wall_brick";

const ROOF_PLANE_Y = 2.1;
const ROOF_CONNECTOR_Y = 2.1;
const ROOF_TILE = "obj_roof_tile";
const ROOF_N = "obj_p_roof_clay_n";
const ROOF_S = "obj_p_roof_clay_s";
const ROOF_E = "obj_p_roof_clay_e";
const ROOF_W = "obj_p_roof_clay_w";
const ROOF_NW = "obj_p_roof_clay_hip_nw";
const ROOF_NE = "obj_p_roof_clay_hip_ne";
const ROOF_SE = "obj_p_roof_clay_hip_se";
const ROOF_SW = "obj_p_roof_clay_hip_sw";

const key = (x: number, z: number) => `${x}|${z}`;

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

  const blockFootprint = (cellsToBlock: Vec2[]) => {
    cellsToBlock.forEach(([x, z]) => {
      reserve(x, z);
      const c = get(x, z);
      if (c) {
        c.walkable = false;
        c.blocks_los = false;
      }
    });
  };

  const placeIfClear = (
    objectId: string,
    x: number,
    z: number,
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string; groundOnly?: boolean } = {},
  ) => {
    const c = get(x, z);
    if (!c || !c.walkable || reserved.has(key(x, z))) return false;
    if (opts.groundOnly && c.object_id !== GROUND) return false;
    place(objectId, x, z, facing, opts);
    return true;
  };

  const placeMany = (
    objectId: string,
    cellsToPlace: Vec2[],
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string; groundOnly?: boolean } = {},
  ) => cellsToPlace.forEach(([x, z]) => placeIfClear(objectId, x, z, facing, opts));

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
    const hasRoof = (x: number, z: number) =>
      x >= x0 && x <= x1 && z >= z0 && z <= z1 && !skip?.has(key(x, z));
    const roofIdFor = (x: number, z: number) => {
      const edgeN = !hasRoof(x, z - 1);
      const edgeS = !hasRoof(x, z + 1);
      const edgeW = !hasRoof(x - 1, z);
      const edgeE = !hasRoof(x + 1, z);

      if (edgeN && edgeW) return ROOF_NW;
      if (edgeN && edgeE) return ROOF_NE;
      if (edgeS && edgeE) return ROOF_SE;
      if (edgeS && edgeW) return ROOF_SW;
      if (edgeN) return ROOF_N;
      if (edgeS) return ROOF_S;
      if (edgeE) return ROOF_E;
      if (edgeW) return ROOF_W;
      return ROOF_TILE;
    };

    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        if (skip?.has(key(x, z))) continue;
        const objectId = roofIdFor(x, z);
        cells.push({
          x, y: objectId === ROOF_TILE ? ROOF_PLANE_Y : ROOF_CONNECTOR_Y, z,
          active: true, walkable: false, blocks_los: true,
          height: 0, visual_height: 0,
          terrain: "stone", surface_tag: "none", object_id: objectId,
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

  // ── Expanded map movement: the old core remains intact, while new roads
  // give the doubled map readable outer loops and edge destinations.
  paveRect(-2, -75, 2, -39); // north black-star approach
  paveRect(-12, -74, 12, -64); // outer gate court
  paveRect(-24, -52, 18, -49, MARBLE); // northern cross-road
  paveRect(23, -4, 55, 0, MARBLE); // eastern market/rowhouse road
  paveRect(31, -34, 34, 24, GROUND); // east parish street
  paveRect(44, -34, 47, 32, GROUND); // outer east lane
  paveRect(44, 32, 47, 50, GROUND); // extension to the glass/work edge
  paveRect(22, 18, 56, 22, GROUND); // high terrace work road
  paveRect(-2, 33, 2, 66); // south pilgrimage road
  paveRect(-18, 45, 18, 48, MARBLE); // lower sacred cross-road
  paveRect(-20, 57, 20, 66, GROUND); // old burial field
  paveRect(-24, -58, -21, 60, GROUND); // raised riverbank path
  paveRect(-56, -50, -25, -47, WOOD); // north timber bridge over river
  paveRect(-56, 46, -25, 49, WOOD); // south timber bridge over river
  paveRect(-54, -62, -44, -55, GROUND); // west dark river islet
  paveRect(-54, 54, -42, 63, GROUND); // lower river shrine islet
  paveRect(-50, -55, -47, -50, WOOD); // north bridge landing
  paveRect(-50, 49, -47, 54, WOOD); // south bridge landing

  // ── Outer Monolith Gate Field ─────────────────────────────────────────────
  // One Mouthstone gate, three blocked tiles wide: the model metadata and the
  // authored nav footprint now agree.
  place("obj_mouthstone_gate", 0, -70, [0, 1], { dialogue: "dia_mouthstone" });
  blockFootprint([[-1, -70], [0, -70], [1, -70]]);
  for (let x = -8; x <= -2; x++) place("obj_fence_stone", x, -70, [0, 1]);
  for (let x = 2; x <= 8; x++) place("obj_fence_stone", x, -70, [0, 1]);
  place("obj_lantern_post", -4, -65, [0, 1]);
  place("obj_lantern_post", 4, -65, [0, 1]);
  place("obj_statue_votary", -7, -73, [0, 1]);
  place("obj_statue_votary", 7, -73, [0, 1]);
  place("obj_column_broken", -8, -67, [1, 0]);
  place("obj_column_broken", 8, -67, [-1, 0]);

  // ── Inner Count Gate ──────────────────────────────────────────────────────
  for (let x = -6; x <= -2; x++) place("obj_fence_stone", x, -34, [0, 1]);
  for (let x = 2; x <= 6; x++) place("obj_fence_stone", x, -34, [0, 1]);
  place("obj_lantern_post", -4, -31, [0, 1]);
  place("obj_lantern_post", 4, -31, [0, 1]);
  place("obj_statue_votary", -7, -37, [0, 1]);
  place("obj_statue_votary", 7, -37, [0, 1]);
  place("obj_column_broken", -8, -32, [1, 0]);

  // ── The procession itself: paired votaries/lamps make the climb legible. ─
  for (const z of [-28, -20, -12, -4, 4]) {
    placeIfClear("obj_statue_votary", -3, z, [1, 0]);
    placeIfClear("obj_statue_votary", 3, z, [-1, 0]);
  }
  for (const z of [-24, -16, -8, 0, 8]) {
    placeIfClear("obj_lantern_post", -4, z, [1, 0]);
    placeIfClear("obj_lantern_post", 4, z, [-1, 0]);
  }
  placeMany("obj_cypress", [[-5, -22], [5, -22], [-5, 2], [5, 2]], [0, 1], { groundOnly: true });

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

  const stampRowhouse = (
    id: string,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    door: { x: number; z: number },
    wall = WALL_CLAY,
  ) => {
    buildHall(x0, z0, x1, z1, wall, WOOD, door);
    const cx = Math.floor((x0 + x1) / 2);
    const cz = Math.floor((z0 + z1) / 2);
    place("obj_table", cx - 2, cz - 1, [0, 1]);
    place("obj_pallet_bed", x1 - 2, z0 + 2, [0, 1]);
    place("obj_amphora", x0 + 2, z1 - 2, [0, 1]);
    placeContainer(`cnt_${id}`, x1 - 2, z1 - 2, {
      name: "Household Reliquary",
      items: [{ item_id: "itm_votive" }],
    });
  };

  const stampSacredCourt = (cx: number, cz: number, label: string) => {
    paveRect(cx - 7, cz - 5, cx + 7, cz + 5, MARBLE);
    for (const dx of [-6, -2, 2, 6]) {
      placeIfClear("obj_column", cx + dx, cz - 4, [0, 1]);
      placeIfClear("obj_column", cx + dx, cz + 4, [0, 1]);
    }
    placeIfClear("obj_altar", cx, cz, [0, -1]);
    placeIfClear("obj_statue_votary", cx - 4, cz, [1, 0]);
    placeIfClear("obj_statue_votary", cx + 4, cz, [-1, 0]);
    placeIfClear("obj_lantern_post", cx - 6, cz + 1, [1, 0]);
    placeIfClear("obj_lantern_post", cx + 6, cz + 1, [-1, 0]);
    placeIfClear("obj_p_votive_token", cx, cz + 3, [0, 1], { block: false });
    placeItem(`wi_${label}_votive`, "itm_votive", cx + 1, cz + 2);
  };

  const stampDarkGrove = (cx: number, cz: number, label: string) => {
    paveRect(cx - 7, cz - 5, cx + 7, cz + 5, GROUND);
    placeIfClear("obj_p_shrine_stone", cx, cz, [0, 1], { dialogue: "dia_old_rite_shrine" });
    placeIfClear("obj_p_arch", cx - 5, cz - 1, [1, 0]);
    placeIfClear("obj_p_arch", cx + 5, cz - 1, [-1, 0]);
    placeIfClear("obj_dead_tree", cx - 6, cz + 4, [0, 1]);
    placeIfClear("obj_dead_tree", cx + 6, cz + 4, [0, 1]);
    placeIfClear("obj_column_broken", cx, cz + 4, [0, -1]);
    placeIfClear("obj_p_glass_figure", cx - 2, cz + 2, [1, 0], { dialogue: "dia_cordon" });
    placeIfClear("obj_p_glass_figure", cx + 2, cz + 2, [-1, 0], { dialogue: "dia_cordon" });
    placeMany("obj_grass_tuft", [[cx - 6, cz - 4], [cx - 3, cz - 5], [cx + 3, cz - 5], [cx + 6, cz - 4]], [0, 1], {
      block: false,
      groundOnly: true,
    });
    placeItem(`wi_${label}_shard`, "itm_glass_shard", cx, cz + 2);
  };

  const stampWorkyard = (cx: number, cz: number, label: string) => {
    paveRect(cx - 8, cz - 6, cx + 8, cz + 6, WOOD);
    buildHall(cx - 5, cz - 5, cx + 6, cz + 3, WALL_CLAY, WOOD, { x: cx - 5, z: cz - 1 });
    place("obj_p_smokestack", cx + 4, cz - 4, [0, 1]);
    place("obj_p_furnace", cx + 2, cz + 1, [0, 1], { dialogue: "dia_mason" });
    place("obj_p_pipes", cx - 2, cz + 4, [0, 1]);
    place("obj_p_railcart", cx - 7, cz + 4, [1, 0], { block: false });
    place("obj_barrel", cx - 7, cz - 4, [0, 1]);
    place("obj_p_stall", cx + 8, cz - 1, [-1, 0]);
    placeContainer(`cnt_${label}_cullet`, cx + 5, cz + 2, {
      name: "Glass Cullet Bin",
      items: [{ item_id: "itm_glass_shard", count: 2 }],
    });
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
  // The Counted Cup's sealed cellar entrance to the Pagan Network.
  place("obj_net_rubble", -18, -11, [0, 1], { block: false });

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
  // Olive grove east: a planted orchard grid instead of jittered scatter.
  placeMany("obj_tree", [[16, 6], [20, 6], [16, 10], [20, 10], [18, 12]], [0, 1], { groundOnly: true });
  placeMany("obj_grass_tuft", [[15, 8], [18, 8], [21, 8], [17, 12], [22, 12]], [0, 1], {
    block: false,
    groundOnly: true,
  });
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
  place("obj_pine", -10, 18, [0, 1]);
  place("obj_pine", 10, 18, [0, 1]);
  place("obj_cypress", -12, 30, [0, 1]);
  place("obj_cypress", 12, 30, [0, 1]);
  place("obj_pine", -10, 28, [0, 1]);
  place("obj_pine", 10, 28, [0, 1]);
  placeItem("wi_cordon_shard", "itm_glass_shard", 4, 13);

  // ── Authored dressing clusters ───────────────────────────────────────────
  // Old gate field: sparse ruin markers at the edge, not noise across grass.
  placeMany("obj_dead_tree", [[-12, -36], [12, -36], [-11, -32], [11, -32]], [0, 1], { groundOnly: true });
  placeMany("obj_pine", [[-8, -39], [8, -39], [-15, -34], [15, -34]], [0, 1], { groundOnly: true });
  placeMany("obj_grass_tuft", [[-14, -37], [-10, -37], [10, -37], [14, -37], [-13, -31], [13, -31]], [0, 1], {
    block: false,
    groundOnly: true,
  });
  placeIfClear("obj_column_broken", -10, -34, [1, 0], { groundOnly: true });
  placeIfClear("obj_column_broken", 10, -34, [-1, 0], { groundOnly: true });

  // River edge: plants read as a bank line beside the bridge and ferry cache.
  placeMany("obj_tree", [[-23, -18], [-23, 6], [-22, 12]], [0, 1], { groundOnly: true });
  placeMany("obj_fig_tree", [[-24, -12], [-24, 2], [-23, 9]], [0, 1], { groundOnly: true });
  placeMany("obj_bush", [[-22, -14], [-21, -8], [-23, 3], [-21, 8]], [0, 1], { groundOnly: true });
  placeMany("obj_grass_tuft", [[-24, -6], [-22, -4], [-23, 1], [-24, 10], [-21, 13]], [0, 1], {
    block: false,
    groundOnly: true,
  });

  // Residential yards: small repeated domestic edges around doors and walls.
  placeMany("obj_grass_tuft", [[-24, 3], [-21, 3], [-14, 3], [14, 3], [18, 3], [22, 3]], [0, 1], {
    block: false,
    groundOnly: true,
  });
  placeMany("obj_bush", [[-23, 4], [-14, 4], [14, 4], [22, 4]], [0, 1], { groundOnly: true });
  placeMany("obj_flower_bush", [[-20, 3], [-16, 3], [16, 3], [20, 3]], [0, 1], { groundOnly: true });
  placeMany("obj_barrel", [[-16, 1], [14, 1]], [0, 1], { groundOnly: true });

  // Upper walk: groves frame the shrine and cottage without blocking stairs.
  placeMany("obj_pine", [[-10, 6], [10, 6], [-8, 12], [8, 12]], [0, 1], { groundOnly: true });
  placeMany("obj_fig_tree", [[-12, 8], [12, 8]], [0, 1], { groundOnly: true });
  placeMany("obj_grass_tuft", [[-13, 6], [-11, 12], [-6, 12], [6, 12], [10, 12], [13, 6]], [0, 1], {
    block: false,
    groundOnly: true,
  });

  // Agora/market edge: broken stone belongs to the east road threshold.
  placeIfClear("obj_column_broken", 24, -7, [0, 1], { groundOnly: true });

  // ══════════════════════════════════════════════════════════════════════════
  // EXPANDED OUTER TOWN — stamp pass
  // ══════════════════════════════════════════════════════════════════════════
  // North: black-star approach beyond the old Mouthstone gate.
  stampDarkGrove(0, -62, "north_black_star");
  stampSacredCourt(0, -52, "north_procession");
  stampRowhouse("north_hostel_w", -24, -67, -14, -58, { x: -14, z: -62 }, WALL_MARBLE);
  stampRowhouse("north_hostel_e", 14, -67, 24, -58, { x: 14, z: -62 }, WALL_MARBLE);
  place("obj_p_gibbet", 17, -72, [0, 1]);
  placeIfClear("obj_p_votive_token", -5, -63, [0, 1], { block: false });
  placeIfClear("obj_p_votive_token", 5, -63, [0, 1], { block: false });

  // East: dense sacred-residential blocks and a work edge.
  stampRowhouse("east_parish_a", 31, -31, 41, -23, { x: 31, z: -27 });
  stampRowhouse("east_parish_b", 44, -31, 54, -23, { x: 44, z: -27 });
  stampRowhouse("east_parish_c", 31, -18, 41, -10, { x: 31, z: -14 });
  stampRowhouse("east_parish_d", 44, -18, 54, -10, { x: 44, z: -14 });
  stampRowhouse("east_parish_e", 31, 4, 41, 12, { x: 31, z: 8 });
  stampRowhouse("east_parish_f", 44, 4, 54, 12, { x: 44, z: 8 });
  stampSacredCourt(38, 20, "east_shrine");
  stampWorkyard(45, 43, "east_glassyard");
  place("obj_p_trapdoor", 53, 47, [0, 1], { block: false });

  // South: lower pilgrimage belt and older dark-fantasy remains below the
  // Witness terrace. This keeps the sacred spine readable but much larger.
  stampRowhouse("south_pilgrim_w", -22, 35, -12, 43, { x: -12, z: 39 });
  stampRowhouse("south_pilgrim_e", 12, 35, 22, 43, { x: 12, z: 39 });
  stampSacredCourt(0, 47, "lower_pilgrim");
  stampDarkGrove(0, 62, "south_old_rite");
  placeMany("obj_p_cordon_post", [[-10, 56], [-6, 56], [-2, 56], [2, 56], [6, 56], [10, 56]], [0, 1], {
    block: false,
  });
  placeIfClear("obj_p_shrine_stone", -14, 62, [1, 0]);
  placeIfClear("obj_p_shrine_stone", 14, 62, [-1, 0]);

  // West: river crossings and dark islets, using the widened map's water.
  stampDarkGrove(-49, -59, "west_black_islet");
  stampDarkGrove(-48, 59, "lower_river_islet");
  for (let x = -54; x <= -27; x += 3) {
    place("obj_p_bridge", x, -49, [1, 0], { block: false });
    place("obj_p_bridge", x, 47, [1, 0], { block: false });
  }
  place("obj_p_dock", -25, -46, [1, 0], { block: false });
  place("obj_p_dock", -25, 50, [1, 0], { block: false });
  placeMany("obj_p_reeds", [[-26, -44], [-26, -40], [-26, 42], [-26, 53], [-55, -45], [-55, 50]], [0, 1], {
    block: false,
  });
  placeIfClear("obj_p_votive_token", -23, -43, [0, 1], { block: false });
  placeIfClear("obj_p_votive_token", -23, 52, [0, 1], { block: false });

  // Re-assert the one true Mouthstone footprint after all outer stamps have
  // had a chance to repaint terrain.
  blockFootprint([[-1, -70], [0, -70], [1, -70]]);

  // ── The cast, at their posts ──────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_aldric", cell: [13, -24] },
    { entity_id: "ent_nessa", cell: [-13, -29] },
    {
      entity_id: "ent_merchant",
      cell: [9, -3],
      schedule: [
        { hour: 7, cell: [9, -3] },
        { hour: 13, cell: [37, -2] },
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
      cell: [3, -66],
      schedule: [
        { hour: 6, cell: [3, -66] },
        { hour: 14, cell: [3, -31] },
        { hour: 22, cell: [2, -66] },
      ],
    },
    {
      entity_id: "ent_priest",
      cell: [1, 11],
      schedule: [
        { hour: 5, cell: [1, 11] },
        { hour: 13, cell: [0, 48] },
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
        { hour: 7, cell: [45, 43] },
        { hour: 14, cell: [38, 21] },
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
        { hour: 6, cell: [0, -66] },
        { hour: 13, cell: [0, 48] },
        { hour: 21, cell: [5, -33] },
      ],
    },
    {
      entity_id: "ent_ferryman",
      cell: [-17, -16],
      schedule: [
        { hour: 8, cell: [-17, -16] },
        { hour: 16, cell: [-23, 50] },
        { hour: 20, cell: [-23, -48] },
      ],
    },
    {
      entity_id: "ent_gate_anchorite",
      cell: [-4, -66],
      schedule: [
        { hour: 5, cell: [-4, -66] },
        { hour: 12, cell: [0, -51] },
        { hour: 21, cell: [-4, -66] },
      ],
    },
    {
      entity_id: "ent_glass_apprentice",
      cell: [43, 43],
      schedule: [
        { hour: 7, cell: [43, 43] },
        { hour: 14, cell: [38, 21] },
        { hour: 20, cell: [46, 8] },
      ],
    },
    {
      entity_id: "ent_burial_keeper",
      cell: [1, 47],
      schedule: [
        { hour: 6, cell: [1, 47] },
        { hour: 13, cell: [1, 62] },
        { hour: 22, cell: [-9, 12] },
      ],
    },
    {
      entity_id: "ent_lazare_vampire",
      cell: [49, -28],
      schedule: [
        { hour: 0, cell: [49, -28] },
        { hour: 8, cell: [49, -28] },
        { hour: 16, cell: [49, -28] },
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
    cell: [-18, -11],
    type: "interact",
    conditions: [],
    condition: { not: { switch: "act1_assigned" } },
    cutscene_id: "cut_trapdoor_locked",
    once: false,
  });
  triggers.push({
    id: "trg_trapdoor_enter",
    cell: [-18, -11],
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

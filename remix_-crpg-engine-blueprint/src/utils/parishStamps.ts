// Parish stamps — composed map recipes.
//
// Importing this file (side-effect) registers a set of named stamps with
// the map-authoring DSL. Each stamp emits a coherent composed structure
// (cottage, cathedral, graveyard, …) and returns an anchor table so the
// caller can place NPCs/items by name rather than coords.
//
// Authoring rule for stamps: be opinionated about geometry, configurable
// about scale and orientation. A stamp should look "right" with minimal
// options, and let the caller override the parts that matter.

import {
  defineStamp,
  rect,
  type Facing,
  type MapBuilder,
  type Region,
  type Vec2,
} from "./mapAuthoring";

// ── Cottage ──────────────────────────────────────────────────────────────
// A single dwelling. Walls + boards + roof + door + (optional) chimney +
// (optional) hearth/bed/table furnishing. Defaults to half-timber/clay.

export interface CottageOpts {
  bounds: Region;                       // must be rect, footprint of the cottage
  wall?: "fieldstone" | "timber";       // default "timber"
  roof?: "slate" | "clay";              // default "clay"
  door: { at: Vec2; facing: Facing };
  chimney?: Vec2;                       // default: nearest corner to NW
  furnish?: boolean;                    // default true — adds bed + table
}

defineStamp<CottageOpts>("cottage", (m: MapBuilder, opts) => {
  if (opts.bounds.kind !== "rect") throw new Error("cottage: rect bounds only");
  const { x0, z0, x1, z1 } = opts.bounds;
  const wall = opts.wall ?? "timber";
  const roof = opts.roof ?? "clay";
  const chimney: Vec2 = opts.chimney ?? [x0 + 1, z0 + 1];

  m.building({
    bounds: opts.bounds,
    wall: `wall.${wall}`,
    floor: "floor.boards",
    roof,
    door: opts.door,
    chimney,
  });

  const bed: Vec2 = [x0 + 1, z1 - 1];
  const table: Vec2 = [x1 - 1, z0 + 1];
  if (opts.furnish ?? true) {
    m.place({ at: bed, role: "pallet_bed" });
    m.place({ at: table, role: "desk" });
  }

  return {
    door: opts.door.at,
    hearth: chimney,
    bed,
    table,
  };
});

// ── Cathedral ────────────────────────────────────────────────────────────
// A church nave + west front + bell tower at a corner + ridge spires +
// optional south cloister arcade. The "anchor" is the west-front cell
// (where the rose window goes, facing south).

export interface CathedralOpts {
  westFront: Vec2;                      // forward face (rose window) cell, faces +z
  naveLength?: number;                  // along z (north into the rise), default 16
  naveWidth?: number;                   // along x, default 18 (must be odd-ish)
  towerSide?: "west" | "east";          // default "west"
  arcade?: boolean;                     // default true — 3 arches south of the front
  ridgeSpires?: number;                 // default 3
}

defineStamp<CathedralOpts>("cathedral", (m, opts) => {
  const [ax, az] = opts.westFront;
  const w = opts.naveWidth ?? 18;
  const len = opts.naveLength ?? 16;
  const x0 = ax - Math.floor(w / 2);
  const x1 = x0 + w - 1;
  const z1 = az - 1;             // door is at the south face, 1 step in from the front
  const z0 = z1 - len + 1;

  m.building({
    bounds: rect(x0, z0, x1, z1),
    wall: "wall.church",
    floor: "floor.flagstone",
    roof: "slate",
    door: { at: [ax, z1], facing: "south" },
  });
  m.place({
    at: [ax, az], role: "church.front", facing: "south",
    dialogue: "dia_priest",
    footprint: rect(ax - 1, az, ax + 1, az),
  });

  // Bell tower at the chosen corner.
  const tx = opts.towerSide === "east" ? x1 + 3 : x0 - 3;
  m.place({
    at: [tx, z0 + 1], role: "bell_tower",
    footprint: rect(tx - 1, z0, tx, z0 + 1),
  });

  // Ridge spires.
  const nSpires = opts.ridgeSpires ?? 3;
  const midZ = Math.floor((z0 + z1) / 2);
  for (let i = 0; i < nSpires; i++) {
    const t = (i + 1) / (nSpires + 1);
    const sx = Math.round(x0 + t * (x1 - x0));
    m.place({ at: [sx, midZ], role: "spire", block: false, raised: { yOffset: 2.95 } });
  }

  // South cloister arches.
  if (opts.arcade ?? true) {
    const arcadeZ = az + 3;
    for (let i = 0; i < 5; i++) {
      const ax2 = x0 + 2 + i * 3;
      if (ax2 > x1 - 2) break;
      m.place({ at: [ax2, arcadeZ], role: "arch", facing: "south" });
    }
  }

  return {
    westFront: [ax, az],
    door: [ax, z1],
    altar: [ax, midZ],
    tower: [tx, z0 + 1],
  };
});

// ── Walled yard ───────────────────────────────────────────────────────────
// Generic low-wall enclosure with a gate gap. Used as the basis for the
// graveyard and the charnel yard.

export interface WalledYardOpts {
  bounds: Region;
  gate: { at: Vec2; facing: Facing };
  // Gate width along the wall — default 3.
  gateWidth?: number;
  // Pave the interior with this floor (default no change).
  floor?: string;
}

defineStamp<WalledYardOpts>("walledYard", (m, opts) => {
  if (opts.bounds.kind !== "rect") throw new Error("walledYard: rect bounds only");
  const { x0, z0, x1, z1 } = opts.bounds;
  const [gx, gz] = opts.gate.at;
  const gw = opts.gateWidth ?? 3;
  const halfGate = Math.floor(gw / 2);

  if (opts.floor) m.pave(opts.bounds, opts.floor);

  const onGate = (x: number, z: number): boolean => {
    // The gate is centered at (gx, gz) and extends along whichever axis the
    // wall runs. We only blank the gate cells that lie on a perimeter edge.
    const onTop = z === z0, onBot = z === z1, onL = x === x0, onR = x === x1;
    if ((onTop || onBot) && Math.abs(x - gx) <= halfGate && z === gz) return true;
    if ((onL || onR) && Math.abs(z - gz) <= halfGate && x === gx) return true;
    return false;
  };

  for (let x = x0; x <= x1; x++) {
    if (!onGate(x, z0)) m.wall([x, z0], "wall.low", { vh: 2 });
    if (!onGate(x, z1)) m.wall([x, z1], "wall.low", { vh: 2 });
  }
  for (let z = z0 + 1; z <= z1 - 1; z++) {
    if (!onGate(x0, z)) m.wall([x0, z], "wall.low", { vh: 2 });
    if (!onGate(x1, z)) m.wall([x1, z], "wall.low", { vh: 2 });
  }

  m.place({
    at: opts.gate.at, role: "lych_gate", facing: opts.gate.facing,
    footprint: rect(gx - 1, gz, gx + 1, gz),
  });

  return { gate: opts.gate.at };
});

// ── Graveyard enclosure ───────────────────────────────────────────────────
// Walled yard with grave_earth floor, scattered headstones/crosses/tombs,
// and optional yew trees at named positions.

export interface GraveyardOpts {
  bounds: Region;
  gate: { at: Vec2; facing: Facing };
  yews?: Vec2[];
  density?: number;
  minSpacing?: number;
  rngStream: string;
}

defineStamp<GraveyardOpts>("graveyardEnclosure", (m, opts) => {
  if (opts.bounds.kind !== "rect") throw new Error("graveyardEnclosure: rect");
  const { x0, z0, x1, z1 } = opts.bounds;
  m.stamp("walledYard", {
    bounds: opts.bounds,
    gate: opts.gate,
    floor: "floor.grave_earth",
  });
  m.scatter({
    in: rect(x0 + 1, z0 + 1, x1 - 1, z1 - 1),
    weighted: [
      ["grave.headstone", 0.6],
      ["grave.cross", 0.25],
      ["grave.tomb", 0.15],
    ],
    density: opts.density ?? 0.16,
    minSpacing: opts.minSpacing ?? 2,
    rngStream: opts.rngStream,
  });
  for (const y of opts.yews || []) m.place({ at: y, role: "nature.tree.dark" });
  return { gate: opts.gate.at };
});

// ── Riverbank ─────────────────────────────────────────────────────────────
// Carve a meandering river through a region; banks become mud. Use for the
// lower-river tier. Returns the river-cross-cell anchor near the spine.

export interface RiverBankOpts {
  span: { xMin: number; xMax: number };
  centerZ: number;
  amplitude?: number;
  frequency?: number;
  width?: number;
}

defineStamp<RiverBankOpts>("riverbank", (m, opts) => {
  const amp = opts.amplitude ?? 4;
  const freq = opts.frequency ?? 0.16;
  const w = opts.width ?? 2;
  for (let x = opts.span.xMin; x <= opts.span.xMax; x++) {
    const cz = opts.centerZ + Math.round(Math.sin(x * freq) * amp);
    m.pave(rect(x, cz - w, x, cz + w), "floor.river");
    m.pave(rect(x, cz - w - 1, x, cz - w - 1), "floor.mud");
    m.pave(rect(x, cz + w + 1, x, cz + w + 1), "floor.mud");
  }
  return { center: [0, opts.centerZ] };
});

// ── Glassworks hall ───────────────────────────────────────────────────────
// A fieldstone hall with two smokestacks, a row of furnaces, a pipe run,
// and a pair of railcarts.

export interface GlassworksOpts {
  bounds: Region;
  door: { at: Vec2; facing: Facing };
  stacks: [Vec2, Vec2];          // two smokestack cells inside the hall
  furnaces?: Vec2[];             // default a row of 2 inside
}

// Stamp presets — drop-at-click defaults for the UI brush. Each preset
// converts a single anchor cell into the full opts for its stamp, so the
// editor's Stamp tool can offer one-click "drop a cottage here" without
// the user filling out a form.
export interface StampPreset {
  presetName: string;
  stampName: string;
  build: (cx: number, cz: number) => unknown;
}

export const STAMP_PRESETS: StampPreset[] = [
  {
    presetName: "Cottage · timber/clay",
    stampName: "cottage",
    build: (cx, cz) => ({
      bounds: rect(cx - 3, cz - 3, cx + 3, cz + 3),
      wall: "timber", roof: "clay",
      door: { at: [cx + 3, cz], facing: "east" },
      chimney: [cx - 2, cz - 2],
      furnish: true,
    }),
  },
  {
    presetName: "Cottage · stone/slate",
    stampName: "cottage",
    build: (cx, cz) => ({
      bounds: rect(cx - 3, cz - 3, cx + 3, cz + 3),
      wall: "fieldstone", roof: "slate",
      door: { at: [cx + 3, cz], facing: "east" },
      chimney: [cx - 2, cz - 2],
      furnish: true,
    }),
  },
  {
    presetName: "Cathedral",
    stampName: "cathedral",
    build: (cx, cz) => ({
      // West-front lands at click; nave extends north of it.
      westFront: [cx, cz],
      naveWidth: 15, naveLength: 14,
      towerSide: "west", ridgeSpires: 3, arcade: true,
    }),
  },
  {
    presetName: "Graveyard (small)",
    stampName: "graveyardEnclosure",
    build: (cx, cz) => ({
      bounds: rect(cx - 5, cz - 4, cx + 5, cz + 4),
      gate: { at: [cx, cz + 4], facing: "south" },
      rngStream: `gv_${cx}_${cz}`,
    }),
  },
  {
    presetName: "Walled yard",
    stampName: "walledYard",
    build: (cx, cz) => ({
      bounds: rect(cx - 4, cz - 4, cx + 4, cz + 4),
      gate: { at: [cx, cz + 4], facing: "south" },
      floor: "floor.grave_earth",
    }),
  },
  {
    presetName: "Glassworks hall",
    stampName: "glassworksHall",
    build: (cx, cz) => ({
      bounds: rect(cx - 6, cz - 5, cx + 6, cz + 5),
      door: { at: [cx - 6, cz], facing: "west" },
      stacks: [[cx - 4, cz - 4], [cx + 2, cz - 4]],
      furnaces: [[cx - 2, cz + 2], [cx + 2, cz + 2]],
    }),
  },
];

defineStamp<GlassworksOpts>("glassworksHall", (m, opts) => {
  if (opts.bounds.kind !== "rect") throw new Error("glassworksHall: rect");
  m.building({
    bounds: opts.bounds,
    wall: "wall.fieldstone",
    floor: "floor.flagstone",
    roof: "slate",
    door: opts.door,
  });
  for (const [sx, sz] of opts.stacks) {
    m.place({ at: [sx, sz], role: "industrial.smokestack", footprint: rect(sx - 1, sz - 1, sx + 1, sz + 1) });
  }
  const furnaces = opts.furnaces ?? [];
  furnaces.forEach((p, i) => {
    m.place({
      at: p, role: "industrial.furnace",
      dialogue: i === 0 ? "dia_mason" : undefined,
    });
  });
  return {
    door: opts.door.at,
    stackA: opts.stacks[0],
    stackB: opts.stacks[1],
  };
});

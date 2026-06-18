// The Witness Kit — hand-sculpted object library for rural Alderamontico.
//
// Every model here is a true mesh: vertices and quads laid down by lofting
// profile rings along curves, lathing silhouettes, sweeping tubes along
// paths, and stitching quad strips — no box/cylinder primitive assemblies.
// The look: weathered Greek sacred architecture under black stars. Warm
// marble and limestone, terracotta and cedar, bronze and votive flame, with
// the Grid's glass intrusions kept rare and cold.

import type {
  ObjectData,
  ObjectMaterialData,
  ObjectMeshData,
  ObjectMeshFace,
} from "../schema/game";
import { getMeshBounds, recomputeMeshNormals } from "./meshModel";

export type V3 = [number, number, number];
export type P2 = [number, number]; // profile point (x, z) or lathe point (radius, y)
export type Ring = number[];

// ── Palette ─────────────────────────────────────────────────────────────────

export const WITNESS_MATERIALS = {
  marble: {
    id: "wmat_paros_marble",
    name: "Paros Marble",
    // Sacred otherworld marble — cool, pale, with a whisper of the Grid
    // glowing cold under the surface.
    color: "#E9E7E2",
    emissive: "#0E0B1E",
    emissive_intensity: 0.08,
    opacity: 1,
    transparent: false,
    roughness: 0.4,
    metalness: 0.03,
    texture_kind: "marble_veins",
    texture_scale: 1.2,
    texture_strength: 0.4,
  },
  weatheredMarble: {
    id: "wmat_weathered_marble",
    name: "Weathered Marble",
    color: "#C5C1BC",
    emissive: "#0B0916",
    emissive_intensity: 0.05,
    opacity: 1,
    transparent: false,
    roughness: 0.56,
    metalness: 0.02,
    texture_kind: "marble_veins",
    texture_scale: 1.5,
    texture_strength: 0.48,
  },
  limestone: {
    id: "wmat_limestone",
    name: "Sun Limestone",
    color: "#D6CEBC",
    emissive: "#0A0814",
    emissive_intensity: 0.04,
    opacity: 1,
    transparent: false,
    roughness: 0.68,
    metalness: 0.01,
    texture_kind: "stone_grain",
    texture_scale: 1.6,
    texture_strength: 0.5,
  },
  terracotta: {
    id: "wmat_terracotta",
    name: "Terracotta",
    color: "#B26A4B",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.78,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 1.3,
    texture_strength: 0.35,
  },
  roofClay: {
    id: "wmat_roof_clay",
    name: "Roof Clay",
    color: "#9E5038",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.8,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 2.2,
    texture_strength: 0.4,
  },
  paintedBand: {
    id: "wmat_painted_band",
    name: "Painted Band",
    color: "#46383A",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.7,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  cedar: {
    id: "wmat_cedar",
    name: "Cedar",
    color: "#7C5638",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.8,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.5,
    texture_strength: 0.6,
  },
  darkCedar: {
    id: "wmat_dark_cedar",
    name: "Dark Cedar",
    color: "#5C3F2A",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.84,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.7,
    texture_strength: 0.62,
  },
  bronze: {
    id: "wmat_bronze",
    name: "Temple Bronze",
    // Dark votive bronze, lit faintly warm from within like a banked coal.
    color: "#6E5430",
    emissive: "#2A1A06",
    emissive_intensity: 0.2,
    opacity: 1,
    transparent: false,
    roughness: 0.4,
    metalness: 0.62,
    texture_kind: "metal_scratches",
    texture_scale: 1.3,
    texture_strength: 0.44,
  },
  gold: {
    id: "wmat_votive_gold",
    name: "Votive Gold",
    // Sacred gold leaf — brighter, warmer, the holiest accent in the set.
    color: "#E2B450",
    emissive: "#8C5E18",
    emissive_intensity: 0.46,
    opacity: 1,
    transparent: false,
    roughness: 0.3,
    metalness: 0.68,
    texture_kind: "metal_scratches",
    texture_scale: 1.2,
    texture_strength: 0.3,
  },
  flame: {
    id: "wmat_votive_flame",
    name: "Votive Flame",
    color: "#FFC46B",
    emissive: "#FF9E3D",
    emissive_intensity: 1.9,
    opacity: 0.92,
    transparent: true,
    roughness: 0.3,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  flameCore: {
    id: "wmat_flame_core",
    name: "Flame Core",
    color: "#FFF3D6",
    emissive: "#FFE9B8",
    emissive_intensity: 2.4,
    opacity: 1,
    transparent: false,
    roughness: 0.2,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  cypress: {
    id: "wmat_cypress",
    name: "Cypress Green",
    color: "#33523C",
    emissive: "#04120A",
    emissive_intensity: 0.1,
    opacity: 1,
    transparent: false,
    roughness: 0.85,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 2.4,
    texture_strength: 0.4,
  },
  oliveLeaf: {
    id: "wmat_olive_leaf",
    name: "Olive Silver-Leaf",
    color: "#8B9876",
    emissive: "#0B1208",
    emissive_intensity: 0.08,
    opacity: 1,
    transparent: false,
    roughness: 0.82,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 2.1,
    texture_strength: 0.42,
  },
  oliveBark: {
    id: "wmat_olive_bark",
    name: "Olive Bark",
    color: "#6E6049",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 2,
    texture_strength: 0.7,
  },
  deadWood: {
    id: "wmat_bleached_wood",
    name: "Bleached Wood",
    color: "#A39782",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.9,
    texture_strength: 0.66,
  },
  dryGrass: {
    id: "wmat_dry_grass",
    name: "Dry Grass",
    color: "#AD9D69",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  soil: {
    id: "wmat_warm_soil",
    name: "Processional Earth",
    // The trodden sacred ground of the whole town — a cooler, ashen packed
    // earth with the faintest cold light caught in the grit.
    color: "#5C5444",
    emissive: "#0A0814",
    emissive_intensity: 0.03,
    opacity: 1,
    transparent: false,
    roughness: 0.92,
    metalness: 0,
    texture_kind: "soil_grit",
    texture_scale: 1.8,
    texture_strength: 0.62,
  },
  nightWater: {
    id: "wmat_night_water",
    name: "Spoken River",
    color: "#1D3147",
    emissive: "#27506B",
    emissive_intensity: 0.35,
    opacity: 0.78,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "water_shimmer",
    texture_scale: 1.3,
    texture_strength: 0.6,
  },
  blackStone: {
    id: "wmat_mouthstone",
    name: "Mouthstone Black",
    color: "#17131D",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.66,
    metalness: 0.06,
    texture_kind: "stone_grain",
    texture_scale: 1.4,
    texture_strength: 0.55,
  },
  starGlass: {
    id: "wmat_star_glass",
    name: "Star Glass",
    color: "#A7D9DC",
    emissive: "#79C4CC",
    emissive_intensity: 0.9,
    opacity: 0.6,
    transparent: true,
    roughness: 0.16,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.3,
    texture_strength: 0.6,
  },
  blood: {
    id: "wmat_witness_blood",
    name: "Witness Blood",
    color: "#6E1320",
    emissive: "#3A0410",
    emissive_intensity: 0.35,
    opacity: 1,
    transparent: false,
    roughness: 0.5,
    metalness: 0,
    texture_kind: "blood_sheen",
    texture_scale: 1.2,
    texture_strength: 0.6,
  },
  mosaic: {
    id: "wmat_mosaic",
    name: "Cella Mosaic",
    // Sacred tesserae floor — deep indigo glass lit from within.
    color: "#3A4470",
    emissive: "#1A1C44",
    emissive_intensity: 0.3,
    opacity: 1,
    transparent: false,
    roughness: 0.42,
    metalness: 0.05,
    texture_kind: "glass_facets",
    texture_scale: 2.4,
    texture_strength: 0.55,
  },
  linen: {
    id: "wmat_linen",
    name: "Bleached Linen",
    color: "#D8CDB6",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.85,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 1.6,
    texture_strength: 0.5,
  },
} satisfies Record<string, ObjectMaterialData>;

type MatKey = keyof typeof WITNESS_MATERIALS;
const mat = (key: MatKey) => WITNESS_MATERIALS[key].id;

// ── Mesh sculpting toolkit ──────────────────────────────────────────────────

export const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const newMesh = (): ObjectMeshData => ({
  vertices: [],
  faces: [],
  material_slots: [],
  groups: [],
});

export const addV = (m: ObjectMeshData, v: V3) => {
  m.vertices.push(v);
  return m.vertices.length - 1;
};

export const addFace = (
  m: ObjectMeshData,
  name: string,
  vertices: number[],
  material: string,
  group: string,
) => {
  const face: ObjectMeshFace = { name, vertices, material, group };
  m.faces.push(face);
};

// A profile is a closed 2D outline (x, z pairs) traced counter-clockwise.
// Profiles are placed at a world center, scaled per-axis, and rotated.
export const placeRing = (
  m: ObjectMeshData,
  profile: P2[],
  center: V3,
  scaleX = 1,
  scaleZ = scaleX,
  rotY = 0,
): Ring => {
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  return profile.map(([x, z]) => {
    const sx = x * scaleX;
    const sz = z * scaleZ;
    return addV(m, [
      center[0] + sx * cos - sz * sin,
      center[1],
      center[2] + sx * sin + sz * cos,
    ]);
  });
};

// Stitch consecutive rings with quads. Rings must share length.
export const loft = (
  m: ObjectMeshData,
  name: string,
  material: string,
  rings: Ring[],
) => {
  for (let r = 0; r < rings.length - 1; r += 1) {
    const a = rings[r];
    const b = rings[r + 1];
    for (let i = 0; i < a.length; i += 1) {
      const j = (i + 1) % a.length;
      addFace(m, `${name}_${r}_${i}`, [a[i], a[j], b[j], b[i]], material, name);
    }
  }
};

// Close a ring with a single polygon (convex rings only).
export const cap = (
  m: ObjectMeshData,
  name: string,
  material: string,
  ring: Ring,
  facingDown = false,
) => {
  addFace(m, name, facingDown ? [...ring].reverse() : ring, material, name);
};

// Circle-ish profile with optional facet jitter and fluting.
export const circleProfile = (
  count: number,
  radius: number,
  opts: {
    jitter?: number;
    rng?: () => number;
    flutes?: number;
    fluteDepth?: number;
    phase?: number;
  } = {},
): P2[] => {
  const rng = opts.rng || (() => 0.5);
  const points: P2[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + (opts.phase || 0);
    let r = radius;
    if (opts.flutes) {
      r += Math.cos(angle * opts.flutes) * (opts.fluteDepth || 0);
    }
    if (opts.jitter) {
      r += (rng() - 0.5) * 2 * opts.jitter;
    }
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  return points;
};

// Rounded-rectangle profile (for masonry courses, slabs, lids).
export const slabProfile = (width: number, depth: number, chamfer = 0): P2[] => {
  const hw = width / 2;
  const hd = depth / 2;
  if (chamfer <= 0) {
    return [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ];
  }
  const c = Math.min(chamfer, hw * 0.9, hd * 0.9);
  return [
    [-hw + c, -hd],
    [hw - c, -hd],
    [hw, -hd + c],
    [hw, hd - c],
    [hw - c, hd],
    [-hw + c, hd],
    [-hw, hd - c],
    [-hw, -hd + c],
  ];
};

// Revolve a silhouette ([radius, y] points, bottom→top) around the Y axis.
export const lathe = (
  m: ObjectMeshData,
  name: string,
  material: string,
  silhouette: P2[],
  segments: number,
  opts: {
    center?: V3;
    jitter?: number;
    rng?: () => number;
    flutes?: number;
    fluteDepth?: number;
    scaleX?: number;
    scaleZ?: number;
    capBottom?: boolean;
    capTop?: boolean;
  } = {},
) => {
  const center = opts.center || [0, 0, 0];
  const rings: Ring[] = silhouette.map(([radius, y]) =>
    placeRing(
      m,
      circleProfile(segments, Math.max(0.004, radius), {
        jitter: opts.jitter,
        rng: opts.rng,
        flutes: opts.flutes,
        fluteDepth: opts.fluteDepth,
      }),
      [center[0], center[1] + y, center[2]],
      opts.scaleX ?? 1,
      opts.scaleZ ?? opts.scaleX ?? 1,
    ),
  );
  loft(m, name, material, rings);
  if (opts.capBottom !== false) cap(m, `${name}_base`, material, rings[0], true);
  if (opts.capTop !== false) cap(m, `${name}_crown`, material, rings[rings.length - 1]);
  return rings;
};

// Sweep a tube along a path of centers with per-point radii — trunks,
// branches, water spills, bronze bars. Sections stay axis-aligned (good
// enough at this poly scale, and the kink reads as hand-carved).
export const tube = (
  m: ObjectMeshData,
  name: string,
  material: string,
  path: V3[],
  radii: number[],
  segments = 6,
  opts: { jitter?: number; rng?: () => number; capEnds?: boolean } = {},
) => {
  const rings = path.map((point, index) =>
    placeRing(
      m,
      circleProfile(segments, Math.max(0.004, radii[Math.min(index, radii.length - 1)]), {
        jitter: opts.jitter,
        rng: opts.rng,
      }),
      point,
    ),
  );
  loft(m, name, material, rings);
  if (opts.capEnds !== false) {
    cap(m, `${name}_root`, material, rings[0], true);
    cap(m, `${name}_tip`, material, rings[rings.length - 1]);
  }
  return rings;
};

// Quad strip between two equal-length polylines — drapery, awnings,
// blood runs, leaning planks.
export const strip = (
  m: ObjectMeshData,
  name: string,
  material: string,
  edgeA: V3[],
  edgeB: V3[],
) => {
  const a = edgeA.map((v) => addV(m, v));
  const b = edgeB.map((v) => addV(m, v));
  for (let i = 0; i < a.length - 1; i += 1) {
    addFace(m, `${name}_${i}`, [a[i], a[i + 1], b[i + 1], b[i]], material, name);
  }
};

// Faceted stone/foliage blob: a jittered ellipsoid built from lofted rings.
export const blob = (
  m: ObjectMeshData,
  name: string,
  material: string,
  center: V3,
  size: V3,
  rng: () => number,
  segments = 7,
  rows = 3,
  jitter = 0.12,
) => {
  const rings: Ring[] = [];
  const tip = addV(m, [
    center[0] + (rng() - 0.5) * jitter,
    center[1] + size[1] / 2,
    center[2] + (rng() - 0.5) * jitter,
  ]);
  const base = addV(m, [
    center[0] + (rng() - 0.5) * jitter,
    center[1] - size[1] / 2,
    center[2] + (rng() - 0.5) * jitter,
  ]);
  for (let row = 1; row <= rows; row += 1) {
    const phi = (row / (rows + 1)) * Math.PI;
    const y = center[1] + (Math.cos(phi) * size[1]) / 2;
    const spread = Math.sin(phi);
    rings.push(
      placeRing(
        m,
        circleProfile(segments, 0.5, { jitter: jitter * 0.5, rng }),
        [center[0], y, center[2]],
        size[0] * spread,
        size[2] * spread,
        rng() * Math.PI,
      ),
    );
  }
  const first = rings[0];
  for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % segments;
    addFace(m, `${name}_cap_${i}`, [tip, first[j], first[i]], material, name);
  }
  loft(m, name, material, rings);
  const last = rings[rings.length - 1];
  for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % segments;
    addFace(m, `${name}_base_${i}`, [base, last[i], last[j]], material, name);
  }
};

// ── Object wrapper ──────────────────────────────────────────────────────────

const sculpt = ({
  id,
  name,
  category,
  tags,
  materialKeys,
  footprint = [[0, 0]],
  profile = "single",
  build,
}: {
  id: string;
  name: string;
  category: string;
  tags: string[];
  materialKeys: MatKey[];
  footprint?: [number, number][];
  profile?: ObjectData["collision"]["profile"];
  build: (m: ObjectMeshData, rng: () => number) => void;
}): ObjectData => {
  const m = newMesh();
  // Seed from the id so every rebuild of the library is identical.
  let seed = 0;
  for (let i = 0; i < id.length; i += 1) seed = (seed * 31 + id.charCodeAt(i)) | 0;
  build(m, mulberry32(seed));
  const mesh = recomputeMeshNormals(m);
  mesh.material_slots = materialKeys.map(mat);
  mesh.groups = Array.from(new Set(mesh.faces.map((f) => f.group || "default")));

  return {
    id,
    display_name: name,
    category,
    tags,
    origin: "center_floor",
    bounds: getMeshBounds(mesh),
    materials: materialKeys.map(mat),
    material_settings: materialKeys.map((key) => WITNESS_MATERIALS[key]),
    model_kind: "mesh",
    parts: [],
    mesh,
    decals: [],
    reference_images: [],
    collision: { profile, footprint },
  };
};

// Flat tiles render as instanced planes — only their material shows, so the
// "sculpt" for floors is purely the material definition.
const flatTile = (
  id: string,
  name: string,
  materialKey: MatKey,
  tags: string[],
  walkBlocking = false,
): ObjectData =>
  sculpt({
    id,
    name,
    category: "structure",
    tags: ["tile", ...tags],
    materialKeys: [materialKey],
    profile: walkBlocking ? "single" : "none",
    build: (m) => {
      const ring = placeRing(m, slabProfile(1, 1), [0, 0.01, 0]);
      cap(m, "surface", mat(materialKey), ring);
    },
  });

// ── Floors & water ──────────────────────────────────────────────────────────

const floorStone = () => flatTile("obj_floor_stone", "Processional Marble", "marble", ["floor"]);
const floorDirt = () => flatTile("obj_floor_dirt", "Processional Earth", "soil", ["floor"]);
const floorWood = () => flatTile("obj_floor_wood", "Cedar Boards", "cedar", ["floor"]);
const floorMosaic = () => flatTile("obj_floor_mosaic", "Cella Mosaic", "mosaic", ["floor"]);
const roofTile = () => flatTile("obj_roof_tile", "Terracotta Roof", "roofClay", ["floor", "roof"]);
const waterTile = () => flatTile("obj_water", "The Spoken River", "nightWater", ["water"], true);

// ── Walls ───────────────────────────────────────────────────────────────────

// Ashlar marble wall: three masonry courses, each its own slightly offset
// slab loft, with a projecting plinth and crown cornice. Joints read as
// shadow lines because each course steps in/out a little.
const wallStone = () =>
  sculpt({
    id: "obj_wall_stone",
    name: "Ashlar Marble Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["marble", "weatheredMarble"],
    build: (m, rng) => {
      const course = (
        name: string,
        y0: number,
        y1: number,
        inset: number,
        material: string,
        rotY: number,
      ) => {
        const lower = placeRing(
          m,
          slabProfile(1 - inset, 1 - inset, 0.05),
          [0, y0, 0],
          1,
          1,
          rotY,
        );
        const upper = placeRing(
          m,
          slabProfile(1 - inset - 0.02, 1 - inset - 0.02, 0.05),
          [0, y1, 0],
          1,
          1,
          rotY,
        );
        loft(m, name, material, [lower, upper]);
        cap(m, `${name}_top`, material, upper);
      };

      // Plinth
      const plinthBase = placeRing(m, slabProfile(1.06, 1.06, 0.06), [0, 0, 0]);
      const plinthTop = placeRing(m, slabProfile(1.0, 1.0, 0.05), [0, 0.22, 0]);
      loft(m, "plinth", mat("weatheredMarble"), [plinthBase, plinthTop]);
      cap(m, "plinth_top", mat("weatheredMarble"), plinthTop);

      course("course_a", 0.22, 0.82, 0.02, mat("marble"), 0);
      course("course_b", 0.86, 1.46, 0.045, mat("weatheredMarble"), rng() * 0.02);
      course("course_c", 1.5, 2.04, 0.02, mat("marble"), -rng() * 0.02);

      // Crown cornice: steps outward then closes flat.
      const corniceLow = placeRing(m, slabProfile(0.98, 0.98, 0.05), [0, 2.04, 0]);
      const corniceFlare = placeRing(m, slabProfile(1.12, 1.12, 0.07), [0, 2.16, 0]);
      const corniceTop = placeRing(m, slabProfile(1.04, 1.04, 0.06), [0, 2.24, 0]);
      loft(m, "cornice", mat("marble"), [corniceLow, corniceFlare, corniceTop]);
      cap(m, "cornice_top", mat("weatheredMarble"), corniceTop);
    },
  });

// Sun-clay wall for homes: limestone body with a terracotta coping course.
const wallClay = () =>
  sculpt({
    id: "obj_wall_brick",
    name: "Sun-Clay Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["limestone", "terracotta", "weatheredMarble"],
    build: (m, rng) => {
      const base = placeRing(m, slabProfile(1.04, 1.04, 0.05), [0, 0, 0]);
      const waist = placeRing(m, slabProfile(0.96, 0.96, 0.05), [0, 0.9, 0]);
      const shoulder = placeRing(
        m,
        slabProfile(0.92, 0.92, 0.05),
        [0, 1.86, 0],
        1,
        1,
        (rng() - 0.5) * 0.04,
      );
      loft(m, "clay_body", mat("limestone"), [base, waist, shoulder]);

      // Terracotta coping: a low gabled cap shedding rain.
      const copingBase = placeRing(m, slabProfile(1.08, 1.08, 0.05), [0, 1.86, 0]);
      const copingRidge = placeRing(m, slabProfile(0.5, 0.62, 0.04), [0, 2.12, 0]);
      loft(m, "coping", mat("terracotta"), [copingBase, copingRidge]);
      cap(m, "coping_top", mat("terracotta"), copingRidge);

      // A pale patch of failed plaster low on one face.
      strip(
        m,
        "plaster_patch",
        mat("weatheredMarble"),
        [
          [-0.34, 0.28, 0.527],
          [0.05, 0.34, 0.527],
          [0.3, 0.3, 0.527],
        ],
        [
          [-0.28, 0.72, 0.527],
          [0.02, 0.86, 0.527],
          [0.24, 0.7, 0.527],
        ],
      );
    },
  });

// ── Architecture ────────────────────────────────────────────────────────────

const SHAFT_SILHOUETTE: P2[] = [
  [0.3, 0.18],
  [0.27, 0.5],
  [0.245, 1.0],
  [0.225, 1.5],
  [0.21, 1.9],
];

// Fluted Doric column: stepped plinth, 16-segment fluted shaft with
// entasis taper, flared echinus, square abacus.
const column = () =>
  sculpt({
    id: "obj_column",
    name: "Doric Column",
    category: "architecture",
    tags: ["prop", "architecture", "column"],
    materialKeys: ["marble", "weatheredMarble", "gold"],
    build: (m) => {
      const plinthBase = placeRing(m, slabProfile(0.84, 0.84, 0.07), [0, 0, 0]);
      const plinthTop = placeRing(m, slabProfile(0.72, 0.72, 0.06), [0, 0.18, 0]);
      loft(m, "plinth", mat("weatheredMarble"), [plinthBase, plinthTop]);
      cap(m, "plinth_top", mat("weatheredMarble"), plinthTop);

      lathe(m, "shaft", mat("marble"), SHAFT_SILHOUETTE, 16, {
        flutes: 8,
        fluteDepth: 0.016,
        capBottom: false,
        capTop: false,
      });

      // Gilded sacred collar — a thin gold neck-ring beneath the capital.
      lathe(
        m,
        "gold_collar",
        mat("gold"),
        [[0.215, 1.82], [0.235, 1.86], [0.215, 1.9]],
        16,
        { capBottom: false, capTop: false },
      );

      // Echinus: the cushion flare under the abacus.
      lathe(
        m,
        "echinus",
        mat("marble"),
        [
          [0.21, 1.9],
          [0.3, 1.98],
          [0.34, 2.06],
        ],
        14,
        { capBottom: false, capTop: false },
      );

      const abacusBase = placeRing(m, slabProfile(0.74, 0.74, 0.05), [0, 2.06, 0]);
      const abacusTop = placeRing(m, slabProfile(0.78, 0.78, 0.05), [0, 2.22, 0]);
      loft(m, "abacus", mat("weatheredMarble"), [abacusBase, abacusTop]);
      cap(m, "abacus_top", mat("weatheredMarble"), abacusTop);
    },
  });

// Broken column: shaft sheared at an angle, fallen drum resting beside it.
const columnBroken = () =>
  sculpt({
    id: "obj_column_broken",
    name: "Broken Column",
    category: "architecture",
    tags: ["prop", "architecture", "ruin"],
    materialKeys: ["weatheredMarble", "marble"],
    build: (m, rng) => {
      const plinthBase = placeRing(m, slabProfile(0.8, 0.8, 0.07), [0, 0, 0]);
      const plinthTop = placeRing(m, slabProfile(0.68, 0.68, 0.06), [0, 0.16, 0]);
      loft(m, "plinth", mat("weatheredMarble"), [plinthBase, plinthTop]);
      cap(m, "plinth_top", mat("weatheredMarble"), plinthTop);

      // Sheared shaft: rings climb then the final ring tilts.
      const segs = 14;
      const rings: Ring[] = [
        placeRing(m, circleProfile(segs, 0.28, { flutes: 8, fluteDepth: 0.015 }), [0, 0.16, 0]),
        placeRing(m, circleProfile(segs, 0.26, { flutes: 8, fluteDepth: 0.015 }), [0, 0.66, 0]),
        placeRing(m, circleProfile(segs, 0.25, { flutes: 8, fluteDepth: 0.014 }), [0.01, 1.04, 0]),
      ];
      const breakRing = circleProfile(segs, 0.24, { jitter: 0.05, rng });
      rings.push(
        breakRing.map(([x, z]) =>
          addV(m, [x, 1.18 + x * 0.34 + (rng() - 0.5) * 0.06, z]),
        ),
      );
      loft(m, "sheared_shaft", mat("weatheredMarble"), rings);
      cap(m, "break_face", mat("marble"), rings[rings.length - 1]);

      // Fallen drum on its side.
      const drum = circleProfile(10, 0.24, { flutes: 8, fluteDepth: 0.014 });
      const drumA = drum.map(([x, z]) => addV(m, [0.52 + 0.0, 0.24 + x, 0.42 + z]));
      const drumB = drum.map(([x, z]) => addV(m, [0.52 + 0.56, 0.24 + x, 0.5 + z]));
      loft(m, "fallen_drum", mat("weatheredMarble"), [drumA, drumB]);
      cap(m, "drum_face_a", mat("marble"), drumA, true);
      cap(m, "drum_face_b", mat("marble"), drumB);
    },
  });

// Low marble balustrade for sacred boundaries — the cordon line.
const fenceStone = () =>
  sculpt({
    id: "obj_fence_stone",
    name: "Marble Balustrade",
    category: "architecture",
    tags: ["prop", "fence"],
    materialKeys: ["marble", "weatheredMarble"],
    build: (m) => {
      const baluster = (x: number) =>
        lathe(
          m,
          `baluster_${x}`,
          mat("marble"),
          [
            [0.11, 0.06],
            [0.07, 0.16],
            [0.13, 0.38],
            [0.08, 0.62],
            [0.11, 0.72],
          ],
          9,
          { center: [x, 0, 0] },
        );
      baluster(-0.3);
      baluster(0.3);

      const sillA = placeRing(m, slabProfile(1.0, 0.3, 0.04), [0, 0, 0]);
      const sillB = placeRing(m, slabProfile(0.96, 0.26, 0.04), [0, 0.06, 0]);
      loft(m, "sill", mat("weatheredMarble"), [sillA, sillB]);
      cap(m, "sill_top", mat("weatheredMarble"), sillB);

      const railA = placeRing(m, slabProfile(1.0, 0.24, 0.05), [0, 0.72, 0]);
      const railB = placeRing(m, slabProfile(0.92, 0.18, 0.05), [0, 0.86, 0]);
      loft(m, "rail", mat("marble"), [railA, railB]);
      cap(m, "rail_top", mat("marble"), railB);
    },
  });

// Bronze gaol bars in a marble sill — judgment furniture, not dungeon iron.
const cellBars = () =>
  sculpt({
    id: "obj_cell_bars",
    name: "Bronze Custody Bars",
    category: "architecture",
    tags: ["prop", "fence", "interactable"],
    materialKeys: ["bronze", "weatheredMarble"],
    build: (m, rng) => {
      const sillA = placeRing(m, slabProfile(1.02, 0.34, 0.04), [0, 0, 0]);
      const sillB = placeRing(m, slabProfile(0.94, 0.26, 0.04), [0, 0.14, 0]);
      loft(m, "sill", mat("weatheredMarble"), [sillA, sillB]);
      cap(m, "sill_top", mat("weatheredMarble"), sillB);

      for (let i = 0; i < 4; i += 1) {
        const x = -0.36 + i * 0.24 + (rng() - 0.5) * 0.02;
        tube(
          m,
          `bar_${i}`,
          mat("bronze"),
          [
            [x, 0.14, 0],
            [x + (rng() - 0.5) * 0.03, 1.05, 0],
            [x, 1.95, 0],
          ],
          [0.045, 0.04, 0.045],
          6,
        );
      }

      const railA = placeRing(m, slabProfile(1.02, 0.2, 0.03), [0, 1.95, 0]);
      const railB = placeRing(m, slabProfile(0.96, 0.16, 0.03), [0, 2.08, 0]);
      loft(m, "head_rail", mat("bronze"), [railA, railB]);
      cap(m, "head_rail_top", mat("bronze"), railB);
    },
  });

// ── Set pieces ──────────────────────────────────────────────────────────────

// The Mouthstone: a split black monolith, two leaning halves with a thin
// seam of star-glass breathing between them, ringed by toppled stones.
const mouthstoneGate = () =>
  sculpt({
    id: "obj_mouthstone_gate",
    name: "Mouthstone Exile Gate",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    materialKeys: ["blackStone", "starGlass", "weatheredMarble"],
    profile: "custom_footprint",
    footprint: [
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
    build: (m, rng) => {
      const half = (side: 1 | -1) => {
        const lean = side * 0.16;
        const rings: Ring[] = [
          placeRing(
            m,
            circleProfile(7, 0.62, { jitter: 0.07, rng }),
            [side * 0.55, 0, 0],
            1,
            0.72,
          ),
          placeRing(
            m,
            circleProfile(7, 0.56, { jitter: 0.08, rng }),
            [side * 0.62, 1.4, 0.04],
            1,
            0.66,
          ),
          placeRing(
            m,
            circleProfile(7, 0.46, { jitter: 0.07, rng }),
            [side * (0.62 + lean), 2.9, -0.02],
            1,
            0.6,
          ),
          placeRing(
            m,
            circleProfile(7, 0.26, { jitter: 0.05, rng }),
            [side * (0.58 + lean * 1.5), 3.9, 0],
            1,
            0.5,
          ),
        ];
        loft(m, `monolith_${side}`, mat("blackStone"), rings);
        cap(m, `monolith_${side}_crown`, mat("blackStone"), rings[rings.length - 1]);
        cap(m, `monolith_${side}_root`, mat("blackStone"), rings[0], true);
      };
      half(1);
      half(-1);

      // The seam: a tall narrow glass strip in the split.
      strip(
        m,
        "seam",
        mat("starGlass"),
        [
          [-0.07, 0.1, 0.05],
          [-0.05, 1.5, 0.09],
          [-0.06, 3.0, 0.04],
          [-0.03, 3.7, 0.02],
        ],
        [
          [0.07, 0.1, 0.05],
          [0.05, 1.5, 0.09],
          [0.06, 3.0, 0.04],
          [0.03, 3.7, 0.02],
        ],
      );

      // Toppled boundary stones.
      blob(m, "toppled_a", mat("weatheredMarble"), [-1.3, 0.16, 0.5], [0.5, 0.32, 0.4], rng, 6, 2);
      blob(m, "toppled_b", mat("weatheredMarble"), [1.25, 0.13, -0.45], [0.42, 0.26, 0.36], rng, 6, 2);
      blob(m, "toppled_c", mat("blackStone"), [0.2, 0.1, 0.85], [0.3, 0.2, 0.26], rng, 5, 2);
    },
  });

// The Bleeding Witness: a cloaked marble woman on a high plinth, carved in
// the old imperial style and weathered like a dug-up Venus — face tipped
// back to the sky, hood slid off the crown, arms lifted in supplication and
// broken off mid-forearm. Blood runs from her upturned eyes down the cheeks,
// throat, and robe; a gold halo ring tilts back behind the lifted head, and
// glass grows where the blood meets the ground.
const bleedingWitness = () =>
  sculpt({
    id: "obj_bleeding_witness",
    name: "Witness of the Dark Lights",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    materialKeys: ["marble", "weatheredMarble", "gold", "blood", "starGlass"],
    build: (m, rng) => {
      // Plinth: two stacked chamfered slabs.
      const baseA = placeRing(m, slabProfile(1.5, 1.5, 0.12), [0, 0, 0]);
      const baseB = placeRing(m, slabProfile(1.26, 1.26, 0.1), [0, 0.3, 0]);
      const baseC = placeRing(m, slabProfile(1.0, 1.0, 0.08), [0, 0.56, 0]);
      loft(m, "plinth", mat("weatheredMarble"), [baseA, baseB, baseC]);
      cap(m, "plinth_top", mat("weatheredMarble"), baseC);

      // Robed body: a lathe with a feminine silhouette — flared hem,
      // pinched waist, soft swell at the chest, narrow shoulders — seven
      // uneven facets so the robe reads carved, not turned.
      const body = [
        [0.48, 0.58],
        [0.41, 0.92],
        [0.3, 1.42],
        [0.225, 1.82],
        [0.285, 2.12],
        [0.235, 2.36],
        [0.1, 2.48],
      ] as P2[];
      lathe(m, "robe", mat("marble"), body, 7, {
        jitter: 0.02,
        rng,
        scaleZ: 0.78,
        capBottom: false,
        capTop: false,
      });

      // Cloak panels falling off the shoulders down the back sides.
      strip(
        m,
        "cloak_left",
        mat("weatheredMarble"),
        [
          [-0.245, 2.34, -0.02],
          [-0.31, 1.7, -0.05],
          [-0.36, 1.0, -0.1],
          [-0.42, 0.6, -0.14],
        ],
        [
          [-0.2, 2.34, -0.14],
          [-0.26, 1.7, -0.17],
          [-0.31, 1.0, -0.22],
          [-0.36, 0.6, -0.3],
        ],
      );
      strip(
        m,
        "cloak_right",
        mat("weatheredMarble"),
        [
          [0.2, 2.34, -0.14],
          [0.26, 1.7, -0.17],
          [0.31, 1.0, -0.22],
          [0.36, 0.6, -0.3],
        ],
        [
          [0.245, 2.34, -0.02],
          [0.31, 1.7, -0.05],
          [0.36, 1.0, -0.1],
          [0.42, 0.6, -0.14],
        ],
      );

      // Head thrown back to the sky: neck-to-crown rings drift backward as
      // they rise, so the whole skull tips up and the chin lifts.
      const neckRing = placeRing(
        m,
        circleProfile(7, 0.08, { jitter: 0.008, rng }),
        [0, 2.46, 0],
        1,
        0.9,
      );
      const jawRing = placeRing(
        m,
        circleProfile(7, 0.125, { jitter: 0.008, rng }),
        [0, 2.6, -0.05],
        1,
        0.85,
      );
      const browRing = placeRing(
        m,
        circleProfile(7, 0.135, { jitter: 0.008, rng }),
        [0, 2.74, -0.12],
        1,
        0.85,
      );
      const crownRing = placeRing(
        m,
        circleProfile(7, 0.07, { jitter: 0.008, rng }),
        [0, 2.83, -0.2],
        1,
        0.8,
      );
      loft(m, "head", mat("marble"), [neckRing, jawRing, browRing, crownRing]);
      cap(m, "head_crown", mat("marble"), crownRing);

      // Upturned face: a smooth plane angled at the sky, chin proud.
      strip(
        m,
        "face",
        mat("marble"),
        [
          [-0.07, 2.585, 0.09],
          [-0.08, 2.67, 0.06],
          [-0.075, 2.74, 0.005],
        ],
        [
          [0.07, 2.585, 0.09],
          [0.08, 2.67, 0.06],
          [0.075, 2.74, 0.005],
        ],
      );

      // Hood slid back off the crown: a carved rim arcing over the head,
      // collapsing into a bunched fold of cloth behind the shoulders.
      tube(
        m,
        "hood_rim",
        mat("marble"),
        [
          [-0.175, 2.55, 0.03],
          [-0.155, 2.76, -0.06],
          [0, 2.9, -0.13],
          [0.155, 2.76, -0.06],
          [0.175, 2.55, 0.03],
        ],
        [0.05, 0.055, 0.06, 0.055, 0.05],
        5,
        { jitter: 0.008, rng },
      );
      blob(m, "hood_fold", mat("marble"), [0, 2.38, -0.21], [0.42, 0.2, 0.18], rng, 6, 2);

      // Arms lifted in supplication and broken off mid-forearm, the way a
      // dug-up Venus survives: rough weathered break faces, no hands, one
      // arm snapped shorter than the other.
      const armLeft = tube(
        m,
        "arm_left",
        mat("marble"),
        [
          [-0.2, 2.28, 0.05],
          [-0.33, 2.44, 0.12],
          [-0.385, 2.62, 0.17],
        ],
        [0.075, 0.065, 0.058],
        6,
        { jitter: 0.01, rng, capEnds: false },
      );
      cap(m, "arm_left_root", mat("marble"), armLeft[0], true);
      cap(m, "arm_left_break", mat("weatheredMarble"), armLeft[armLeft.length - 1]);
      const armRight = tube(
        m,
        "arm_right",
        mat("marble"),
        [
          [0.2, 2.28, 0.05],
          [0.305, 2.42, 0.11],
          [0.345, 2.5, 0.13],
        ],
        [0.075, 0.066, 0.062],
        6,
        { jitter: 0.01, rng, capEnds: false },
      );
      cap(m, "arm_right_root", mat("marble"), armRight[0], true);
      cap(m, "arm_right_break", mat("weatheredMarble"), armRight[armRight.length - 1]);

      // Halo: a thin gold ring behind the head, tilted back with it.
      const haloOuter = circleProfile(14, 0.34);
      const haloInner = circleProfile(14, 0.26);
      const haloV = (profilePoints: P2[], back: boolean) =>
        profilePoints.map(([x, y]) =>
          addV(m, [
            x,
            2.92 + y * 0.82 - (back ? 0.029 : 0),
            -0.24 - y * 0.57 - (back ? 0.041 : 0),
          ]),
        );
      const haloFront = haloV(haloOuter, false);
      const haloBack = haloV(haloOuter, true);
      const haloFrontIn = haloV(haloInner, false);
      const haloBackIn = haloV(haloInner, true);
      for (let i = 0; i < 14; i += 1) {
        const j = (i + 1) % 14;
        addFace(m, `halo_face_${i}`, [haloFront[i], haloFront[j], haloFrontIn[j], haloFrontIn[i]], mat("gold"), "halo");
        addFace(m, `halo_back_${i}`, [haloBackIn[i], haloBackIn[j], haloBack[j], haloBack[i]], mat("gold"), "halo");
        addFace(m, `halo_rim_${i}`, [haloFront[j], haloFront[i], haloBack[i], haloBack[j]], mat("gold"), "halo");
        addFace(m, `halo_rim_in_${i}`, [haloFrontIn[i], haloFrontIn[j], haloBackIn[j], haloBackIn[i]], mat("gold"), "halo");
      }

      // Blood: with the face tipped back the runs start at the eyes, slide
      // down the cheeks to the jaw, then the throat, bodice, and robe.
      strip(
        m,
        "blood_run_a",
        mat("blood"),
        [
          [-0.052, 2.705, 0.04],
          [-0.1, 2.6, 0.075],
          [-0.105, 2.47, 0.09],
          [-0.155, 2.1, 0.2],
          [-0.185, 1.5, 0.195],
          [-0.235, 0.8, 0.31],
          [-0.3, 0.585, 0.44],
        ],
        [
          [-0.012, 2.71, 0.05],
          [-0.055, 2.6, 0.095],
          [-0.06, 2.47, 0.105],
          [-0.1, 2.1, 0.225],
          [-0.115, 1.5, 0.215],
          [-0.13, 0.8, 0.345],
          [-0.16, 0.585, 0.49],
        ],
      );
      strip(
        m,
        "blood_run_b",
        mat("blood"),
        [
          [0.045, 2.705, 0.04],
          [0.09, 2.59, 0.08],
          [0.095, 2.46, 0.095],
          [0.13, 2.0, 0.215],
          [0.15, 1.3, 0.2],
          [0.185, 0.62, 0.4],
        ],
        [
          [0.075, 2.7, 0.045],
          [0.125, 2.59, 0.07],
          [0.13, 2.46, 0.085],
          [0.175, 2.0, 0.2],
          [0.2, 1.3, 0.185],
          [0.25, 0.62, 0.37],
        ],
      );
      // Pooled blood on the plinth.
      const pool = placeRing(
        m,
        circleProfile(8, 0.3, { jitter: 0.07, rng }),
        [-0.18, 0.585, 0.32],
        1,
        0.7,
      );
      cap(m, "blood_pool", mat("blood"), pool);

      // Glass growth at the plinth's foot where the blood reached ground.
      const shard = (x: number, z: number, h: number, r: number) => {
        const ring = placeRing(m, circleProfile(5, r, { jitter: r * 0.3, rng }), [x, 0.02, z]);
        const tip = addV(m, [x + (rng() - 0.5) * 0.1, h, z + (rng() - 0.5) * 0.1]);
        for (let i = 0; i < 5; i += 1) {
          const j = (i + 1) % 5;
          addFace(m, `shard_${x}_${i}`, [ring[i], ring[j], tip], mat("starGlass"), "glass_growth");
        }
      };
      shard(-0.72, 0.62, 0.74, 0.12);
      shard(-0.5, 0.84, 0.48, 0.09);
      shard(-0.88, 0.3, 0.36, 0.07);
    },
  });

// Votive altar: stepped block with a shallow offering basin sunk in the top.
const altar = () =>
  sculpt({
    id: "obj_altar",
    name: "Votive Altar",
    category: "setpiece",
    tags: ["prop", "shrine", "interactable"],
    materialKeys: ["weatheredMarble", "marble", "gold"],
    build: (m) => {
      const a = placeRing(m, slabProfile(1.1, 0.86, 0.08), [0, 0, 0]);
      const b = placeRing(m, slabProfile(0.92, 0.7, 0.07), [0, 0.2, 0]);
      const c = placeRing(m, slabProfile(0.84, 0.62, 0.06), [0, 0.78, 0]);
      const d = placeRing(m, slabProfile(1.0, 0.76, 0.07), [0, 0.94, 0]);
      loft(m, "altar_body", mat("weatheredMarble"), [a, b, c, d]);
      cap(m, "altar_top", mat("marble"), d);

      lathe(
        m,
        "offering_basin",
        mat("gold"),
        [
          [0.2, 0.945],
          [0.24, 0.99],
          [0.2, 1.03],
        ],
        10,
        { capBottom: true, capTop: true },
      );
    },
  });

// Small weathered votary statue for shrines and graves.
// A tiny low-poly sacred votary: a cowled marble worshipper on a stepped
// plinth, head bowed, arms folded over the chest, a thin gold halo standing
// behind the hood. The repeated sacred figure of Alderamontico — carved as
// if by another world's hand: Hellenic robe, gothic stillness, Grid-cold
// marble with one warm halo of votive gold.
const votaryStatue = () =>
  sculpt({
    id: "obj_statue_votary",
    name: "Votary Statue",
    category: "setpiece",
    tags: ["prop", "shrine"],
    materialKeys: ["weatheredMarble", "marble", "gold"],
    build: (m, rng) => {
      // Stepped plinth: two chamfered slabs + a moulded plinth band.
      const baseA = placeRing(m, slabProfile(0.58, 0.58, 0.06), [0, 0, 0]);
      const baseB = placeRing(m, slabProfile(0.5, 0.5, 0.05), [0, 0.12, 0]);
      const baseC = placeRing(m, slabProfile(0.4, 0.4, 0.04), [0, 0.22, 0]);
      loft(m, "plinth", mat("weatheredMarble"), [baseA, baseB, baseC]);
      cap(m, "plinth_top", mat("marble"), baseC);

      // Robed body — flared hem, pinched waist, narrow cowled shoulders.
      lathe(
        m,
        "robe",
        mat("marble"),
        [
          [0.26, 0.22],
          [0.24, 0.42],
          [0.17, 0.82],
          [0.2, 1.04],
          [0.15, 1.18],
          [0.09, 1.26],
        ],
        7,
        { jitter: 0.012, rng, scaleZ: 0.82, capBottom: false, capTop: false },
      );

      // Bowed cowl + head: small lathe drifting forward (+z) as it rises so
      // the figure reads as looking down in prayer.
      const neck = placeRing(m, circleProfile(7, 0.09, { jitter: 0.006, rng }), [0, 1.26, 0.0], 1, 0.85);
      const brow = placeRing(m, circleProfile(7, 0.12, { jitter: 0.006, rng }), [0, 1.36, 0.05], 1, 0.85);
      const crown = placeRing(m, circleProfile(7, 0.06, { jitter: 0.006, rng }), [0, 1.45, 0.09], 1, 0.8);
      loft(m, "cowl", mat("marble"), [neck, brow, crown]);
      cap(m, "cowl_crown", mat("marble"), crown);
      // Shadowed face plane inside the hood.
      strip(
        m,
        "face",
        mat("weatheredMarble"),
        [[-0.07, 1.28, 0.12], [-0.06, 1.38, 0.15]],
        [[0.07, 1.28, 0.12], [0.06, 1.38, 0.15]],
      );

      // Folded forearms across the chest.
      strip(
        m,
        "arms",
        mat("weatheredMarble"),
        [[-0.16, 1.0, 0.13], [-0.02, 0.92, 0.17]],
        [[0.16, 1.0, 0.13], [0.02, 0.92, 0.17]],
      );

      // Thin gold halo standing behind the bowed head.
      const haloOuter = circleProfile(12, 0.2);
      const haloInner = circleProfile(12, 0.15);
      const cy = 1.4, cz = -0.05;
      const oF = haloOuter.map(([x, y]) => addV(m, [x, cy + y, cz]));
      const oB = haloOuter.map(([x, y]) => addV(m, [x, cy + y, cz - 0.03]));
      const iF = haloInner.map(([x, y]) => addV(m, [x, cy + y, cz]));
      const iB = haloInner.map(([x, y]) => addV(m, [x, cy + y, cz - 0.03]));
      for (let i = 0; i < 12; i += 1) {
        const j = (i + 1) % 12;
        addFace(m, `halo_f_${i}`, [oF[i], oF[j], iF[j], iF[i]], mat("gold"), "halo");
        addFace(m, `halo_b_${i}`, [iB[i], iB[j], oB[j], oB[i]], mat("gold"), "halo");
        addFace(m, `halo_r_${i}`, [oF[j], oF[i], oB[i], oB[j]], mat("gold"), "halo");
      }
    },
  });

// ── Light: the tripod brazier (replaces the lantern post everywhere) ────────

const brazier = () =>
  sculpt({
    id: "obj_lantern_post",
    name: "Tripod Brazier",
    category: "props",
    tags: ["prop", "light"],
    materialKeys: ["bronze", "flame", "flameCore", "gold"],
    build: (m, rng) => {
      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        tube(
          m,
          `leg_${i}`,
          mat("bronze"),
          [
            [x * 0.34, 0, z * 0.34],
            [x * 0.22, 0.52, z * 0.22],
            [x * 0.13, 0.95, z * 0.13],
          ],
          [0.05, 0.04, 0.035],
          5,
        );
      }
      lathe(
        m,
        "bowl",
        mat("bronze"),
        [
          [0.1, 0.92],
          [0.3, 1.0],
          [0.38, 1.14],
          [0.34, 1.2],
          [0.26, 1.14],
        ],
        10,
        { capBottom: true, capTop: true },
      );
      // Gilded rim band around the bowl lip — sacred votive gold.
      lathe(
        m,
        "gold_rim",
        mat("gold"),
        [[0.38, 1.13], [0.4, 1.16], [0.37, 1.2]],
        10,
        { capBottom: false, capTop: false },
      );
      // Flame: two nested wavering cones.
      lathe(
        m,
        "flame_outer",
        mat("flame"),
        [
          [0.2, 1.16],
          [0.12, 1.42],
          [0.05, 1.62],
          [0.01, 1.78],
        ],
        7,
        { jitter: 0.025, rng, capBottom: false },
      );
      lathe(
        m,
        "flame_core",
        mat("flameCore"),
        [
          [0.1, 1.18],
          [0.05, 1.38],
          [0.01, 1.52],
        ],
        6,
        { jitter: 0.02, rng, capBottom: false },
      );
    },
  });

// ── Furniture & props ───────────────────────────────────────────────────────

// Marble exedra bench (the pew of this town).
const pew = () =>
  sculpt({
    id: "obj_pew",
    name: "Exedra Bench",
    category: "props",
    tags: ["prop", "seat"],
    materialKeys: ["marble", "weatheredMarble"],
    build: (m) => {
      const support = (x: number) => {
        const foot = placeRing(m, slabProfile(0.22, 0.5, 0.04), [x, 0, 0]);
        const waist = placeRing(m, slabProfile(0.14, 0.34, 0.03), [x, 0.22, 0]);
        const neck = placeRing(m, slabProfile(0.2, 0.46, 0.04), [x, 0.42, 0]);
        loft(m, `support_${x}`, mat("weatheredMarble"), [foot, waist, neck]);
      };
      support(-0.32);
      support(0.32);

      const seatLow = placeRing(m, slabProfile(1.04, 0.56, 0.06), [0, 0.42, 0]);
      const seatTop = placeRing(m, slabProfile(0.98, 0.5, 0.08), [0, 0.54, 0]);
      loft(m, "seat", mat("marble"), [seatLow, seatTop]);
      cap(m, "seat_top", mat("marble"), seatTop);
    },
  });

// Bema lectern: a low stepped drum with a slanted reading slab.
const podium = () =>
  sculpt({
    id: "obj_podium",
    name: "Bema Lectern",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["weatheredMarble", "marble", "cedar"],
    build: (m) => {
      lathe(
        m,
        "drum",
        mat("weatheredMarble"),
        [
          [0.42, 0],
          [0.4, 0.14],
          [0.3, 0.18],
          [0.28, 0.7],
          [0.33, 0.82],
        ],
        10,
        { capTop: true },
      );
      // Slanted reading slab.
      const low = placeRing(m, slabProfile(0.56, 0.4, 0.04), [0, 0.84, 0.05]);
      const high = low; // unused; slab built by strip below
      void high;
      const slabBack: V3[] = [
        [-0.3, 0.92, -0.2],
        [0.3, 0.92, -0.2],
      ];
      const slabFront: V3[] = [
        [-0.3, 1.06, 0.18],
        [0.3, 1.06, 0.18],
      ];
      strip(m, "reading_slab", mat("cedar"), slabBack, slabFront);
      strip(
        m,
        "slab_edge",
        mat("marble"),
        [
          [-0.3, 0.92, -0.2],
          [-0.3, 1.06, 0.18],
        ],
        [
          [-0.3, 0.86, -0.2],
          [-0.3, 1.0, 0.18],
        ],
      );
      cap(m, "drum_collar", mat("marble"), low);
    },
  });

// Cedar chest with an arched lid and bronze banding.
const chest = () =>
  sculpt({
    id: "obj_chest",
    name: "Cedar Reliquary Chest",
    category: "props",
    tags: ["prop", "interactable", "container"],
    materialKeys: ["cedar", "darkCedar", "bronze"],
    build: (m) => {
      const base = placeRing(m, slabProfile(0.92, 0.6, 0.04), [0, 0.02, 0]);
      const top = placeRing(m, slabProfile(0.88, 0.56, 0.04), [0, 0.42, 0]);
      loft(m, "body", mat("cedar"), [base, top]);
      cap(m, "body_bottom", mat("darkCedar"), base, true);

      // Arched lid: arc profiles lofted along x.
      const arcAt = (x: number): V3[] => {
        const points: V3[] = [];
        for (let i = 0; i <= 5; i += 1) {
          const t = i / 5;
          const angle = Math.PI * t;
          points.push([x, 0.42 + Math.sin(angle) * 0.18, Math.cos(angle) * 0.28]);
        }
        return points;
      };
      strip(m, "lid", mat("darkCedar"), arcAt(-0.44), arcAt(0.44));
      // Bronze bands across the lid.
      const bandAt = (x: number) => {
        const inner = arcAt(x - 0.035).map(([px, py, pz]) => [px, py + 0.012, pz] as V3);
        const outer = arcAt(x + 0.035).map(([px, py, pz]) => [px, py + 0.012, pz] as V3);
        strip(m, `band_${x}`, mat("bronze"), inner, outer);
      };
      bandAt(-0.26);
      bandAt(0.26);
      // Clasp.
      strip(
        m,
        "clasp",
        mat("bronze"),
        [
          [-0.05, 0.46, 0.295],
          [-0.05, 0.3, 0.305],
        ],
        [
          [0.05, 0.46, 0.295],
          [0.05, 0.3, 0.305],
        ],
      );
    },
  });

// Pithos storage jar — what a barrel is, here.
const pithos = () =>
  sculpt({
    id: "obj_barrel",
    name: "Pithos Jar",
    category: "props",
    tags: ["prop"],
    materialKeys: ["terracotta", "paintedBand"],
    build: (m, rng) => {
      lathe(
        m,
        "jar",
        mat("terracotta"),
        [
          [0.18, 0],
          [0.34, 0.16],
          [0.43, 0.5],
          [0.38, 0.84],
          [0.24, 1.04],
          [0.28, 1.14],
          [0.24, 1.18],
        ],
        11,
        { jitter: 0.012, rng, capBottom: true, capTop: true },
      );
      // Painted meander band at the shoulder.
      lathe(
        m,
        "painted_band",
        mat("paintedBand"),
        [
          [0.4, 0.78],
          [0.36, 0.88],
        ],
        11,
        { capBottom: false, capTop: false },
      );
    },
  });

// Slender amphora for shelves and shrines.
const amphora = () =>
  sculpt({
    id: "obj_amphora",
    name: "Amphora",
    category: "props",
    tags: ["prop"],
    materialKeys: ["terracotta", "paintedBand"],
    build: (m, rng) => {
      lathe(
        m,
        "vessel",
        mat("terracotta"),
        [
          [0.09, 0],
          [0.06, 0.08],
          [0.2, 0.3],
          [0.24, 0.52],
          [0.14, 0.78],
          [0.09, 0.92],
          [0.13, 1.0],
        ],
        9,
        { jitter: 0.008, rng, capBottom: true, capTop: true },
      );
      lathe(
        m,
        "band",
        mat("paintedBand"),
        [
          [0.225, 0.46],
          [0.205, 0.56],
        ],
        9,
        { capBottom: false, capTop: false },
      );
      // Two handles: thin tubes from shoulder to neck.
      const handle = (side: 1 | -1) =>
        tube(
          m,
          `handle_${side}`,
          mat("terracotta"),
          [
            [side * 0.2, 0.62, 0],
            [side * 0.3, 0.78, 0],
            [side * 0.16, 0.92, 0],
          ],
          [0.03, 0.03, 0.03],
          5,
        );
      handle(1);
      handle(-1);
    },
  });

// Trapeza: three-legged cedar table with a faceted oval top.
const table = () =>
  sculpt({
    id: "obj_table",
    name: "Trapeza Table",
    category: "props",
    tags: ["prop"],
    materialKeys: ["cedar", "darkCedar"],
    build: (m) => {
      const topLow = placeRing(m, circleProfile(8, 0.46), [0, 0.62, 0], 1, 0.78);
      const topHigh = placeRing(m, circleProfile(8, 0.5), [0, 0.7, 0], 1, 0.8);
      loft(m, "top_rim", mat("cedar"), [topLow, topHigh]);
      cap(m, "top", mat("cedar"), topHigh);
      cap(m, "top_under", mat("darkCedar"), topLow, true);

      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(angle);
        const z = Math.sin(angle) * 0.8;
        tube(
          m,
          `leg_${i}`,
          mat("darkCedar"),
          [
            [x * 0.42, 0, z * 0.42],
            [x * 0.3, 0.3, z * 0.3],
            [x * 0.22, 0.62, z * 0.22],
          ],
          [0.05, 0.045, 0.04],
          5,
        );
      }
    },
  });

// Kline: the reclining bed, curved headrest, linen cushion.
const kline = () =>
  sculpt({
    id: "obj_pallet_bed",
    name: "Kline Bed",
    category: "props",
    tags: ["prop"],
    materialKeys: ["cedar", "darkCedar", "linen"],
    build: (m) => {
      const frameLow = placeRing(m, slabProfile(0.96, 0.6, 0.05), [0, 0.26, 0]);
      const frameHigh = placeRing(m, slabProfile(0.92, 0.56, 0.05), [0, 0.4, 0]);
      loft(m, "frame", mat("cedar"), [frameLow, frameHigh]);

      const legAt = (x: number, z: number) =>
        tube(
          m,
          `leg_${x}_${z}`,
          mat("darkCedar"),
          [
            [x, 0, z],
            [x, 0.26, z],
          ],
          [0.05, 0.045],
          5,
        );
      legAt(-0.4, -0.22);
      legAt(0.4, -0.22);
      legAt(-0.4, 0.22);
      legAt(0.4, 0.22);

      // Linen cushion: a soft loft with a slight middle sag.
      const cushA = placeRing(m, slabProfile(0.86, 0.5, 0.1), [0, 0.4, 0]);
      const cushB = placeRing(m, slabProfile(0.8, 0.44, 0.12), [0, 0.52, 0]);
      loft(m, "cushion", mat("linen"), [cushA, cushB]);
      cap(m, "cushion_top", mat("linen"), cushB);

      // Curved headrest sweeping up at one end.
      strip(
        m,
        "headrest",
        mat("cedar"),
        [
          [-0.46, 0.4, -0.26],
          [-0.55, 0.62, -0.26],
          [-0.6, 0.82, -0.26],
        ],
        [
          [-0.46, 0.4, 0.26],
          [-0.55, 0.62, 0.26],
          [-0.6, 0.82, 0.26],
        ],
      );
    },
  });

// Stoa market stall: cedar frame, marble counter, striped linen awning.
const marketStall = () =>
  sculpt({
    id: "obj_market_stall",
    name: "Stoa Stall",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["cedar", "marble", "linen", "terracotta"],
    build: (m, rng) => {
      // Counter.
      const counterLow = placeRing(m, slabProfile(1.0, 0.5, 0.04), [0, 0.3, 0.2]);
      const counterHigh = placeRing(m, slabProfile(0.96, 0.46, 0.05), [0, 0.78, 0.2]);
      loft(m, "counter", mat("marble"), [counterLow, counterHigh]);
      cap(m, "counter_top", mat("marble"), counterHigh);

      // Rear posts.
      const post = (x: number) =>
        tube(
          m,
          `post_${x}`,
          mat("cedar"),
          [
            [x, 0, -0.32],
            [x, 1.7, -0.32],
          ],
          [0.05, 0.04],
          5,
        );
      post(-0.45);
      post(0.45);

      // Awning: a wavy quad-strip sloping forward, alternating stripes
      // suggested by a second offset strip.
      const wave = (z0: number, y0: number, z1: number, y1: number): [V3[], V3[]] => {
        const back: V3[] = [];
        const front: V3[] = [];
        for (let i = 0; i <= 6; i += 1) {
          const t = i / 6;
          const x = -0.55 + t * 1.1;
          const sag = Math.sin(t * Math.PI * 3) * 0.035 + (rng() - 0.5) * 0.01;
          back.push([x, y0 + sag, z0]);
          front.push([x, y1 + sag - 0.04, z1]);
        }
        return [back, front];
      };
      const [awnBack, awnFront] = wave(-0.34, 1.7, 0.55, 1.32);
      strip(m, "awning", mat("linen"), awnBack, awnFront);
      // Terracotta stripe along the awning's leading edge.
      strip(
        m,
        "awning_hem",
        mat("terracotta"),
        awnFront,
        awnFront.map(([x, y, z]) => [x, y - 0.1, z + 0.02] as V3),
      );

      // Wares: two small jars on the counter.
      lathe(m, "ware_a", mat("terracotta"), [
        [0.06, 0.8],
        [0.1, 0.9],
        [0.05, 1.0],
      ], 7, { center: [-0.25, 0, 0.16], capTop: true });
      lathe(m, "ware_b", mat("terracotta"), [
        [0.08, 0.8],
        [0.11, 0.86],
        [0.04, 0.96],
      ], 7, { center: [0.2, 0, 0.24], capTop: true });
    },
  });

// Inscribed stele — the notice board of a town that writes on stone.
const stele = () =>
  sculpt({
    id: "obj_notice_board",
    name: "Proclamation Stele",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["marble", "weatheredMarble", "paintedBand"],
    build: (m) => {
      const base = placeRing(m, slabProfile(0.7, 0.42, 0.05), [0, 0, 0]);
      const baseTop = placeRing(m, slabProfile(0.58, 0.32, 0.04), [0, 0.14, 0]);
      loft(m, "base", mat("weatheredMarble"), [base, baseTop]);

      // Tapering slab.
      const slabLow = placeRing(m, slabProfile(0.52, 0.16, 0.03), [0, 0.14, 0]);
      const slabHigh = placeRing(m, slabProfile(0.44, 0.13, 0.03), [0, 1.5, 0]);
      loft(m, "slab", mat("marble"), [slabLow, slabHigh]);

      // Pediment cap.
      const pedBase = placeRing(m, slabProfile(0.56, 0.18, 0.03), [0, 1.5, 0]);
      const pedRidge = placeRing(m, slabProfile(0.1, 0.1, 0.02), [0, 1.72, 0]);
      loft(m, "pediment", mat("marble"), [pedBase, pedRidge]);
      cap(m, "pediment_tip", mat("marble"), pedRidge);

      // Carved text: four shallow dark lines.
      for (let i = 0; i < 4; i += 1) {
        const y = 1.26 - i * 0.18;
        const w = 0.16 + (i % 2) * 0.04;
        strip(
          m,
          `line_${i}`,
          mat("paintedBand"),
          [
            [-w, y, 0.085],
            [w, y, 0.085],
          ],
          [
            [-w, y - 0.045, 0.085],
            [w, y - 0.045, 0.085],
          ],
        );
      }
    },
  });

// Fountain of First Water: lathe basin, central column, three spill streams.
const fountain = () =>
  sculpt({
    id: "obj_well",
    name: "Fountain of First Water",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["marble", "weatheredMarble", "nightWater"],
    build: (m, rng) => {
      lathe(
        m,
        "basin",
        mat("weatheredMarble"),
        [
          [0.78, 0],
          [0.84, 0.12],
          [0.88, 0.34],
          [0.8, 0.44],
          [0.72, 0.38],
        ],
        12,
        { jitter: 0.01, rng, capBottom: true, capTop: false },
      );
      // Water surface inside the basin.
      const water = placeRing(m, circleProfile(12, 0.72), [0, 0.34, 0]);
      cap(m, "water_surface", mat("nightWater"), water);

      // Central column with a small upper bowl.
      lathe(
        m,
        "column",
        mat("marble"),
        [
          [0.14, 0.34],
          [0.11, 0.7],
          [0.1, 0.96],
          [0.26, 1.06],
          [0.3, 1.16],
          [0.24, 1.12],
        ],
        9,
        { capTop: true },
      );

      // Three falling streams.
      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2 + 0.4;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        strip(
          m,
          `stream_${i}`,
          mat("nightWater"),
          [
            [x * 0.26, 1.08, z * 0.26],
            [x * 0.4, 0.78, z * 0.4],
            [x * 0.5, 0.42, z * 0.5],
          ],
          [
            [x * 0.32, 1.08, z * 0.32],
            [x * 0.46, 0.78, z * 0.46],
            [x * 0.56, 0.42, z * 0.56],
          ],
        );
      }
    },
  });

// ── Nature ──────────────────────────────────────────────────────────────────

// Olive tree: twisted trunk swept along a bent path, silver-leaf canopy of
// faceted blobs.
const oliveTree = () =>
  sculpt({
    id: "obj_tree",
    name: "Olive Tree",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["oliveBark", "oliveLeaf"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0.08, 0.5, -0.05],
          [-0.06, 1.0, 0.06],
          [0.1, 1.45, 0.02],
        ],
        [0.22, 0.17, 0.13, 0.09],
        7,
        { jitter: 0.04, rng },
      );
      tube(
        m,
        "branch_a",
        mat("oliveBark"),
        [
          [0.05, 1.2, 0.0],
          [0.45, 1.5, 0.25],
        ],
        [0.07, 0.04],
        5,
      );
      tube(
        m,
        "branch_b",
        mat("oliveBark"),
        [
          [-0.02, 1.35, 0.02],
          [-0.42, 1.62, -0.2],
        ],
        [0.06, 0.035],
        5,
      );
      blob(m, "canopy_a", mat("oliveLeaf"), [0.28, 1.85, 0.18], [1.0, 0.62, 0.9], rng, 8, 3, 0.14);
      blob(m, "canopy_b", mat("oliveLeaf"), [-0.4, 1.95, -0.15], [0.85, 0.55, 0.75], rng, 7, 3, 0.14);
      blob(m, "canopy_c", mat("oliveLeaf"), [0.0, 2.2, 0.0], [0.7, 0.5, 0.65], rng, 7, 2, 0.12);
    },
  });

// Cypress: the tall dark flame of the Greek landscape.
const cypress = () =>
  sculpt({
    id: "obj_cypress",
    name: "Cypress",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["cypress", "oliveBark"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0, 0.3, 0],
        ],
        [0.09, 0.07],
        6,
      );
      lathe(
        m,
        "crown",
        mat("cypress"),
        [
          [0.18, 0.25],
          [0.34, 0.7],
          [0.3, 1.4],
          [0.22, 2.1],
          [0.12, 2.7],
          [0.03, 3.1],
        ],
        8,
        { jitter: 0.05, rng, capBottom: false },
      );
    },
  });

// Dead tree: bleached, branching, no leaves — burial-ground furniture.
const deadTree = () =>
  sculpt({
    id: "obj_dead_tree",
    name: "Bleached Tree",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["deadWood"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("deadWood"),
        [
          [0, 0, 0],
          [-0.08, 0.7, 0.05],
          [0.06, 1.4, -0.04],
          [0.02, 1.9, 0.02],
        ],
        [0.18, 0.13, 0.09, 0.04],
        6,
        { jitter: 0.03, rng },
      );
      tube(
        m,
        "limb_a",
        mat("deadWood"),
        [
          [0.0, 1.1, 0.0],
          [0.4, 1.6, 0.2],
          [0.55, 2.0, 0.3],
        ],
        [0.06, 0.035, 0.015],
        5,
      );
      tube(
        m,
        "limb_b",
        mat("deadWood"),
        [
          [-0.04, 1.5, 0.02],
          [-0.4, 1.85, -0.15],
        ],
        [0.05, 0.02],
        5,
      );
      tube(
        m,
        "limb_c",
        mat("deadWood"),
        [
          [0.02, 1.85, 0.0],
          [0.18, 2.3, -0.12],
        ],
        [0.035, 0.012],
        4,
      );
    },
  });

// Laurel bush: two leaf blobs over a stub trunk.
const laurel = () =>
  sculpt({
    id: "obj_bush",
    name: "Laurel Bush",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["cypress", "oliveBark"],
    build: (m, rng) => {
      tube(
        m,
        "stem",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0.02, 0.18, 0.01],
        ],
        [0.05, 0.04],
        5,
      );
      blob(m, "leaf_a", mat("cypress"), [0.06, 0.46, 0.04], [0.62, 0.5, 0.58], rng, 7, 3, 0.1);
      blob(m, "leaf_b", mat("cypress"), [-0.18, 0.36, -0.1], [0.42, 0.34, 0.4], rng, 6, 2, 0.08);
    },
  });

// Dry grass tuft: arched blades fanned from the root.
const grassTuft = () =>
  sculpt({
    id: "obj_grass_tuft",
    name: "Dry Grass",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["dryGrass"],
    profile: "none",
    build: (m, rng) => {
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2 + rng() * 0.6;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);
        const lean = 0.16 + rng() * 0.18;
        const height = 0.26 + rng() * 0.2;
        strip(
          m,
          `blade_${i}`,
          mat("dryGrass"),
          [
            [dx * 0.03, 0, dz * 0.03],
            [dx * lean * 0.6, height * 0.7, dz * lean * 0.6],
            [dx * lean, height, dz * lean],
          ],
          [
            [dx * 0.03 + dz * 0.025, 0, dz * 0.03 - dx * 0.025],
            [dx * lean * 0.6 + dz * 0.012, height * 0.7, dz * lean * 0.6 - dx * 0.012],
            [dx * lean + dz * 0.003, height, dz * lean - dx * 0.003],
          ],
        );
      }
    },
  });

// Pine tree: a tall, layered conical shape.
const pineTree = () =>
  sculpt({
    id: "obj_pine",
    name: "Pine Tree",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["cypress", "oliveBark"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0, 0.4, 0],
        ],
        [0.08, 0.05],
        5,
      );
      blob(m, "layer1", mat("cypress"), [0, 0.6, 0], [0.6, 0.4, 0.6], rng, 7, 3, 0.1);
      blob(m, "layer2", mat("cypress"), [0, 1.1, 0], [0.45, 0.35, 0.45], rng, 7, 3, 0.1);
      blob(m, "layer3", mat("cypress"), [0, 1.5, 0], [0.3, 0.3, 0.3], rng, 6, 2, 0.1);
      blob(m, "top", mat("cypress"), [0, 1.8, 0], [0.15, 0.25, 0.15], rng, 5, 1, 0.05);
    },
  });

const pineTreeLarge = () =>
  sculpt({
    id: "obj_pine_large",
    name: "Large Pine Tree",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["cypress", "oliveBark"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0, 0.8, 0],
        ],
        [0.16, 0.1],
        5,
      );
      blob(m, "layer1", mat("cypress"), [0, 1.2, 0], [1.2, 0.8, 1.2], rng, 7, 3, 0.2);
      blob(m, "layer2", mat("cypress"), [0, 2.2, 0], [0.9, 0.7, 0.9], rng, 7, 3, 0.2);
      blob(m, "layer3", mat("cypress"), [0, 3.0, 0], [0.6, 0.6, 0.6], rng, 6, 2, 0.2);
      blob(m, "top", mat("cypress"), [0, 3.6, 0], [0.3, 0.5, 0.3], rng, 5, 1, 0.1);
    },
  });

// Fig tree: wide canopy with dense foliage.
const figTree = () =>
  sculpt({
    id: "obj_fig_tree",
    name: "Fig Tree",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["oliveLeaf", "oliveBark"],
    build: (m, rng) => {
      tube(
        m,
        "trunk",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0, 0.8, 0],
        ],
        [0.12, 0.08],
        6,
      );
      // Main wide canopy
      blob(m, "canopy_center", mat("oliveLeaf"), [0, 1.2, 0], [1.2, 0.6, 1.2], rng, 8, 4, 0.2);
      blob(m, "canopy_side1", mat("oliveLeaf"), [0.6, 1.0, 0.2], [0.8, 0.5, 0.8], rng, 7, 3, 0.15);
      blob(m, "canopy_side2", mat("oliveLeaf"), [-0.5, 1.1, -0.4], [0.9, 0.5, 0.9], rng, 7, 3, 0.15);
      blob(m, "canopy_side3", mat("oliveLeaf"), [-0.2, 0.9, 0.7], [0.7, 0.4, 0.7], rng, 6, 3, 0.15);
    },
  });

// Flowering bush: similar to laurel but with flower blobs
const flowerBush = () =>
  sculpt({
    id: "obj_flower_bush",
    name: "Flowering Bush",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["cypress", "oliveBark", "blood"],
    build: (m, rng) => {
      tube(
        m,
        "stem",
        mat("oliveBark"),
        [
          [0, 0, 0],
          [0.02, 0.18, 0.01],
        ],
        [0.05, 0.04],
        5,
      );
      blob(m, "leaf_a", mat("cypress"), [0.06, 0.46, 0.04], [0.62, 0.5, 0.58], rng, 7, 3, 0.1);
      blob(m, "leaf_b", mat("cypress"), [-0.18, 0.36, -0.1], [0.42, 0.34, 0.4], rng, 6, 2, 0.08);
      blob(m, "flower_1", mat("blood"), [0.2, 0.5, 0.2], [0.15, 0.15, 0.15], rng, 5, 2, 0.05);
      blob(m, "flower_2", mat("blood"), [-0.3, 0.4, 0.1], [0.12, 0.12, 0.12], rng, 5, 2, 0.05);
      blob(m, "flower_3", mat("blood"), [0.1, 0.6, -0.2], [0.1, 0.1, 0.1], rng, 4, 1, 0.04);
    },
  });

// ── Unique Prison Props ─────────────────────────────────────────────────────

const pillory = () =>
  sculpt({
    id: "obj_pillory",
    name: "Wooden Pillory",
    category: "prop",
    tags: ["wood", "prison"],
    materialKeys: ["cedar", "darkCedar", "bronze"],
    build: (m, rng) => {
      // Base post
      tube(m, "post", mat("darkCedar"), [[0, 0, 0], [0, 1.2, 0]], [0.08, 0.08], 4);
      // Lower board
      const lowerB = placeRing(m, slabProfile(1.4, 0.1), [0, 1.2, 0]);
      const lowerT = placeRing(m, slabProfile(1.4, 0.1), [0, 1.4, 0]);
      loft(m, "board_low", mat("cedar"), [lowerB, lowerT]);
      cap(m, "board_low_top", mat("cedar"), lowerT);
      cap(m, "board_low_bot", mat("cedar"), lowerB, true);
      // Upper board
      const upperB = placeRing(m, slabProfile(1.4, 0.1), [0, 1.45, 0]);
      const upperT = placeRing(m, slabProfile(1.4, 0.1), [0, 1.65, 0]);
      loft(m, "board_high", mat("cedar"), [upperB, upperT]);
      cap(m, "board_high_top", mat("cedar"), upperT);
      cap(m, "board_high_bot", mat("cedar"), upperB, true);
      // Lock
      blob(m, "lock", mat("bronze"), [0.75, 1.425, 0], [0.1, 0.15, 0.12], rng, 4, 1, 0);
    },
  });

const ironMaiden = () =>
  sculpt({
    id: "obj_iron_maiden",
    name: "Bronze Maiden",
    category: "prop",
    tags: ["metal", "prison"],
    materialKeys: ["bronze", "blood"],
    build: (m, rng) => {
      lathe(
        m,
        "body",
        mat("bronze"),
        [
          [0.4, 0],
          [0.45, 1.0],
          [0.4, 1.8],
          [0.1, 2.1],
          [0.01, 2.15]
        ],
        8,
        { jitter: 0.02, rng }
      );
      blob(m, "stain", mat("blood"), [0, 0.05, 0.42], [0.3, 0.4, 0.1], rng, 5, 2, 0.05);
    },
  });

// ── Library export ──────────────────────────────────────────────────────────

export const createWitnessTownLibrary = (): ObjectData[] => [
  floorStone(),
  floorDirt(),
  floorWood(),
  floorMosaic(),
  roofTile(),
  waterTile(),
  wallStone(),
  wallClay(),
  column(),
  columnBroken(),
  fenceStone(),
  cellBars(),
  mouthstoneGate(),
  bleedingWitness(),
  altar(),
  votaryStatue(),
  brazier(),
  pew(),
  podium(),
  chest(),
  pithos(),
  amphora(),
  table(),
  kline(),
  marketStall(),
  stele(),
  fountain(),
  oliveTree(),
  cypress(),
  deadTree(),
  laurel(),
  pineTree(),
  pineTreeLarge(),
  figTree(),
  flowerBush(),
  grassTuft(),
  pillory(),
  ironMaiden(),
];

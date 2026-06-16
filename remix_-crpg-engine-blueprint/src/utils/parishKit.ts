// The Parish Kit — hand-sculpted object library for the rural parish-town of
// Alderamontico: a quiet, suspicious village gathered under the weight of the
// Church. Practical fieldstone and weathered oak timber, dark slate roofs,
// mossy churchyard turf and grave-earth, all touched by doctrine — wayside
// crosses, edict boards, stocks, a bell-tower over everything.
//
// Like the Witness Kit, every model here is a true mesh built from the shared
// sculpting toolkit (loft / lathe / tube / strip / blob). The aesthetic is the
// brooding overhead watercolour of a parish at dusk: cold stone, lichen, lead
// and iron, the orange of a single autumn oak, the black-green of yews.
//
// Authoring rule that keeps the renderer happy: everything is meant to be
// placed as a *cell* (or stacked cells at elevated y for towers / roofs), so
// it flows through the engine's instanced cell + occlusion path. Walls are
// tagged "wall"; pitched-roof pieces carry a real collision profile (so they
// render as meshes, not flat tiles) and are dropped on cells at y=2 where the
// occlusion system already treats them as fading overhead geometry.

import type {
  ObjectData,
  ObjectMaterialData,
  ObjectMeshData,
} from "../schema/game";
import { getMeshBounds, recomputeMeshNormals } from "./meshModel";
import {
  addFace,
  addV,
  blob,
  cap,
  circleProfile,
  lathe,
  loft,
  mulberry32,
  newMesh,
  placeRing,
  slabProfile,
  strip,
  tube,
  type P2,
  type Ring,
  type V3,
} from "./witnessKit";

// ── Palette ─────────────────────────────────────────────────────────────────
// Cold, muted, rain-darkened. Stone leans grey-brown; timber is near-black oak
// over dirty plaster; roofs are wet slate. Accents are lichen-green, lead, iron,
// candle-amber, and the one warm note: an autumn oak.

export const PARISH_MATERIALS = {
  fieldstone: {
    id: "pmat_fieldstone",
    name: "Fieldstone",
    color: "#7C7468",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.92,
    metalness: 0.01,
    texture_kind: "stone_grain",
    texture_scale: 1.5,
    texture_strength: 0.6,
  },
  darkStone: {
    id: "pmat_dark_stone",
    name: "Shadowed Stone",
    color: "#574F47",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.94,
    metalness: 0.01,
    texture_kind: "stone_grain",
    texture_scale: 1.6,
    texture_strength: 0.62,
  },
  ashlar: {
    id: "pmat_ashlar",
    name: "Church Ashlar",
    color: "#8E867A",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.8,
    metalness: 0.02,
    texture_kind: "stone_grain",
    texture_scale: 1.2,
    texture_strength: 0.5,
  },
  mossStone: {
    id: "pmat_moss_stone",
    name: "Lichened Stone",
    color: "#6B6E54",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.95,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 1.7,
    texture_strength: 0.6,
  },
  plaster: {
    id: "pmat_plaster",
    name: "Dirty Plaster",
    color: "#B6A98C",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 2.0,
    texture_strength: 0.3,
  },
  oak: {
    id: "pmat_oak",
    name: "Weathered Oak",
    color: "#3E3026",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.88,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.6,
    texture_strength: 0.7,
  },
  darkOak: {
    id: "pmat_dark_oak",
    name: "Tar-Black Oak",
    color: "#241C16",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.8,
    texture_strength: 0.7,
  },
  slate: {
    id: "pmat_slate",
    name: "Wet Slate",
    color: "#43414A",
    emissive: "#241a3e",
    emissive_intensity: 0.22,
    opacity: 1,
    transparent: false,
    roughness: 0.4,
    metalness: 0.12,
    texture_kind: "glass_facets",
    texture_scale: 2.4,
    texture_strength: 0.45,
  },
  roofTileClay: {
    id: "pmat_roof_clay",
    name: "Old Clay Tile",
    color: "#6E4632",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.82,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 2.6,
    texture_strength: 0.55,
  },
  iron: {
    id: "pmat_iron",
    name: "Black Iron",
    color: "#1F1E20",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.55,
    metalness: 0.6,
    texture_kind: "metal_scratches",
    texture_scale: 1.3,
    texture_strength: 0.4,
  },
  lead: {
    id: "pmat_lead",
    name: "Lead Came",
    color: "#5C5E63",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.5,
    metalness: 0.4,
    texture_kind: "metal_scratches",
    texture_scale: 1.4,
    texture_strength: 0.3,
  },
  graveMarble: {
    id: "pmat_grave_marble",
    name: "Weathered Headstone",
    color: "#9C988C",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.85,
    metalness: 0.01,
    texture_kind: "stone_grain",
    texture_scale: 1.4,
    texture_strength: 0.5,
  },
  leadGlass: {
    id: "pmat_lead_glass",
    name: "Rose Glass",
    color: "#7A4A86",
    emissive: "#5A2A6E",
    emissive_intensity: 1.0,
    opacity: 0.84,
    transparent: true,
    roughness: 0.22,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.55,
  },
  candle: {
    id: "pmat_candle",
    name: "Lantern Flame",
    color: "#FFCE7A",
    emissive: "#FF9C3C",
    emissive_intensity: 1.8,
    opacity: 0.95,
    transparent: true,
    roughness: 0.3,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  cobble: {
    id: "pmat_cobble",
    name: "Wet Iridescent Cobbles",
    color: "#5E5A60",
    emissive: "#3A2A5E",
    emissive_intensity: 0.35,
    opacity: 1,
    transparent: false,
    roughness: 0.34,
    metalness: 0.1,
    texture_kind: "glass_facets",
    texture_scale: 1.1,
    texture_strength: 0.55,
  },
  road: {
    id: "pmat_road",
    name: "Ceremonial Earth",
    color: "#7A6B52",
    emissive: "#2A1E40",
    emissive_intensity: 0.16,
    opacity: 1,
    transparent: false,
    roughness: 0.7,
    metalness: 0.02,
    texture_kind: "soil_grit",
    texture_scale: 1.6,
    texture_strength: 0.55,
  },
  turf: {
    id: "pmat_turf",
    name: "Churchyard Turf",
    color: "#4C5235",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.95,
    metalness: 0,
    texture_kind: "soil_grit",
    texture_scale: 1.8,
    texture_strength: 0.5,
  },
  graveEarth: {
    id: "pmat_grave_earth",
    name: "Grave Earth",
    color: "#3B3327",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.97,
    metalness: 0,
    texture_kind: "soil_grit",
    texture_scale: 1.5,
    texture_strength: 0.6,
  },
  flagstone: {
    id: "pmat_flagstone",
    name: "Church Flagstone",
    color: "#787067",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.86,
    metalness: 0.01,
    texture_kind: "stone_grain",
    texture_scale: 1.1,
    texture_strength: 0.45,
  },
  yew: {
    id: "pmat_yew",
    name: "Yew Needle",
    color: "#26331F",
    emissive: "#040A04",
    emissive_intensity: 0.06,
    opacity: 1,
    transparent: false,
    roughness: 0.92,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 2.2,
    texture_strength: 0.45,
  },
  oakLeaf: {
    id: "pmat_oak_leaf",
    name: "Autumn Oak Leaf",
    color: "#9A6326",
    emissive: "#1A0E04",
    emissive_intensity: 0.08,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 2.0,
    texture_strength: 0.5,
  },
  bark: {
    id: "pmat_bark",
    name: "Dark Bark",
    color: "#3A2F23",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.94,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.9,
    texture_strength: 0.7,
  },
  copper: {
    id: "pmat_copper",
    name: "Verdigris Copper",
    color: "#4E6B5A",
    emissive: "#0A1410",
    emissive_intensity: 0.08,
    opacity: 1,
    transparent: false,
    roughness: 0.6,
    metalness: 0.45,
    texture_kind: "metal_scratches",
    texture_scale: 1.4,
    texture_strength: 0.4,
  },
  canvas: {
    id: "pmat_canvas",
    name: "Greyed Canvas",
    color: "#A39A82",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.92,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 1.6,
    texture_strength: 0.5,
  },
  // ── Lean-psychedelic accents ────────────────────────────────────────────
  gold: {
    id: "pmat_gold",
    name: "Engraved Gold",
    color: "#C79A3E",
    emissive: "#5A3E0C",
    emissive_intensity: 0.5,
    opacity: 1,
    transparent: false,
    roughness: 0.34,
    metalness: 0.7,
    texture_kind: "metal_scratches",
    texture_scale: 1.2,
    texture_strength: 0.3,
  },
  obsidian: {
    id: "pmat_obsidian",
    name: "Polished Black Slab",
    color: "#0C0A12",
    emissive: "#160a26",
    emissive_intensity: 0.18,
    opacity: 1,
    transparent: false,
    roughness: 0.12,
    metalness: 0.4,
    texture_kind: "glass_facets",
    texture_scale: 2.0,
    texture_strength: 0.25,
  },
  glassRose: {
    id: "pmat_glass_rose",
    name: "Rose Stained Glass",
    color: "#C24B86",
    emissive: "#7A1E55",
    emissive_intensity: 1.5,
    opacity: 0.86,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.6,
  },
  glassBlue: {
    id: "pmat_glass_blue",
    name: "Azure Stained Glass",
    color: "#3E78C2",
    emissive: "#1B3E86",
    emissive_intensity: 1.4,
    opacity: 0.86,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.6,
  },
  glassGreen: {
    id: "pmat_glass_green",
    name: "Viridian Stained Glass",
    color: "#3EB07A",
    emissive: "#0F6B45",
    emissive_intensity: 1.3,
    opacity: 0.86,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.6,
  },
  glassGold: {
    id: "pmat_glass_gold",
    name: "Amber Stained Glass",
    color: "#D9A648",
    emissive: "#A56E14",
    emissive_intensity: 1.4,
    opacity: 0.88,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.6,
  },
  // The "Glass" itself — the iridescent substance the doctrine fears.
  starGlass: {
    id: "pmat_star_glass",
    name: "Star Glass",
    color: "#9AD9DC",
    emissive: "#5AC0CC",
    emissive_intensity: 1.1,
    opacity: 0.72,
    transparent: true,
    roughness: 0.14,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.3,
    texture_strength: 0.6,
  },
  ember: {
    id: "pmat_ember",
    name: "Furnace Ember",
    color: "#FF7A3C",
    emissive: "#FF5A1E",
    emissive_intensity: 2.1,
    opacity: 1,
    transparent: false,
    roughness: 0.4,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
  brass: {
    id: "pmat_brass",
    name: "Tarnished Brass",
    color: "#9C7E3A",
    emissive: "#2A1E08",
    emissive_intensity: 0.14,
    opacity: 1,
    transparent: false,
    roughness: 0.42,
    metalness: 0.65,
    texture_kind: "metal_scratches",
    texture_scale: 1.3,
    texture_strength: 0.4,
  },
  riverWater: {
    id: "pmat_river_water",
    name: "Iridescent River",
    color: "#243A52",
    emissive: "#3A2E66",
    emissive_intensity: 0.5,
    opacity: 0.82,
    transparent: true,
    roughness: 0.12,
    metalness: 0,
    texture_kind: "water_shimmer",
    texture_scale: 1.3,
    texture_strength: 0.7,
  },
  reed: {
    id: "pmat_reed",
    name: "River Reed",
    color: "#6E7344",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.9,
    metalness: 0,
    texture_kind: "cloth_weave",
    texture_scale: 1.8,
    texture_strength: 0.4,
  },
  parchment: {
    id: "pmat_parchment",
    name: "Sealed Parchment",
    color: "#C9BC97",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.88,
    metalness: 0,
    texture_kind: "paper_fiber",
    texture_scale: 1.4,
    texture_strength: 0.5,
  },
  waxRed: {
    id: "pmat_wax_red",
    name: "Votive Wax",
    color: "#9C3A3A",
    emissive: "#2A0808",
    emissive_intensity: 0.1,
    opacity: 1,
    transparent: false,
    roughness: 0.7,
    metalness: 0,
    texture_kind: "none",
    texture_scale: 1,
    texture_strength: 0,
  },
} satisfies Record<string, ObjectMaterialData>;

type MatKey = keyof typeof PARISH_MATERIALS;
const mat = (key: MatKey) => PARISH_MATERIALS[key].id;

// ── Local helpers (flat faces) ───────────────────────────────────────────────

const quad = (
  m: ObjectMeshData,
  name: string,
  material: string,
  a: V3,
  b: V3,
  c: V3,
  d: V3,
  group: string,
) => {
  addFace(m, name, [addV(m, a), addV(m, b), addV(m, c), addV(m, d)], material, group);
};

const tri = (
  m: ObjectMeshData,
  name: string,
  material: string,
  a: V3,
  b: V3,
  c: V3,
  group: string,
) => {
  addFace(m, name, [addV(m, a), addV(m, b), addV(m, c)], material, group);
};

// A rectangular box from min/max corners, all six faces, one material.
const box = (
  m: ObjectMeshData,
  name: string,
  material: string,
  min: V3,
  max: V3,
  group = name,
) => {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  quad(m, `${name}_bot`, material, [x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], group);
  quad(m, `${name}_top`, material, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], group);
  quad(m, `${name}_zn`, material, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], group);
  quad(m, `${name}_zp`, material, [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], group);
  quad(m, `${name}_xn`, material, [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], group);
  quad(m, `${name}_xp`, material, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], group);
};

// ── Object wrapper (mirrors witnessKit's, kept local so the kit is standalone) ─

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
    material_settings: materialKeys.map((key) => PARISH_MATERIALS[key]),
    model_kind: "mesh",
    parts: [],
    mesh,
    decals: [],
    reference_images: [],
    collision: { profile, footprint },
  };
};

// Flat ground/floor tiles: only the top surface shows, so the model is a single
// capped quad. profile "none" keeps them on the cheap instanced-tile path.
const flatTile = (
  id: string,
  name: string,
  materialKey: MatKey,
  tags: string[],
): ObjectData =>
  sculpt({
    id,
    name,
    category: "structure",
    tags: ["tile", "floor", ...tags],
    materialKeys: [materialKey],
    profile: "none",
    build: (m) => {
      const ring = placeRing(m, slabProfile(1, 1), [0, 0.01, 0]);
      cap(m, "surface", mat(materialKey), ring);
    },
  });

// ── Floors & ground ───────────────────────────────────────────────────────────

const groundRoad = () => flatTile("obj_p_road", "Ceremonial Road", "road", ["ground"]);
const groundCobble = () => flatTile("obj_p_cobble", "Square Cobbles", "cobble", ["ground"]);
const groundTurf = () => flatTile("obj_p_turf", "Churchyard Turf", "turf", ["ground"]);
const groundGraveEarth = () =>
  flatTile("obj_p_grave_earth", "Grave Earth", "graveEarth", ["ground"]);
const groundFlagstone = () =>
  flatTile("obj_p_flagstone", "Church Flagstone", "flagstone", ["ground"]);
const floorBoards = () => flatTile("obj_p_boards", "Plank Floor", "oak", ["floor"]);

// ── Walls ─────────────────────────────────────────────────────────────────────
// Built facing +Z (the detailed outward face), ~2.1 units tall, so the
// renderer's wall auto-rotation turns the decorated face outward.

const WALL_H = 2.15;

const wallFieldstone = () =>
  sculpt({
    id: "obj_p_wall_fieldstone",
    name: "Fieldstone Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["fieldstone", "darkStone", "mossStone", "plaster", "graveMarble", "iron"],
    build: (m, rng) => {
      // Rubble courses: four stacked slabs each nudged in/out so joints read.
      let y = 0;
      const courses = [0.6, 0.56, 0.52, 0.47];
      const mats: MatKey[] = ["fieldstone", "darkStone", "fieldstone", "mossStone"];
      courses.forEach((h, i) => {
        const inset = 0.02 + rng() * 0.03;
        box(
          m,
          `course_${i}`,
          mat(mats[i]),
          [-0.5 + inset, y, -0.5 + inset],
          [0.5 - inset, y + h - 0.04, 0.5 - inset],
          `course_${i}`,
        );
        y += h;
      });
      // A failed-plaster scar low on the outward face.
      quad(
        m,
        "scar",
        mat("plaster"),
        [-0.28, 0.18, 0.49],
        [0.16, 0.2, 0.49],
        [0.18, 0.7, 0.49],
        [-0.3, 0.66, 0.49],
        "scar",
      );
      // A small deep-set window with a stone lintel and sill.
      box(m, "win_dark", mat("darkStone"), [-0.2, 1.2, 0.38], [0.2, 1.7, 0.46], "window");
      box(m, "win_lintel", mat("darkStone"), [-0.26, 1.68, 0.4], [0.26, 1.8, 0.5], "window");
      box(m, "win_sill", mat("graveMarble"), [-0.26, 1.12, 0.4], [0.26, 1.2, 0.5], "window");
      box(m, "win_mull", mat("iron"), [-0.02, 1.2, 0.45], [0.02, 1.7, 0.47], "window");
    },
  });

const wallTimber = () =>
  sculpt({
    id: "obj_p_wall_timber",
    name: "Half-Timbered Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["plaster", "darkOak", "fieldstone", "oak"],
    build: (m) => {
      // Stone footing.
      box(m, "footing", mat("fieldstone"), [-0.5, 0, -0.5], [0.5, 0.5, 0.5], "footing");
      // Plaster infill body.
      box(m, "infill", mat("plaster"), [-0.46, 0.5, -0.42], [0.46, WALL_H, 0.42], "infill");
      // Oak frame on the outward (+z) face: sill, head, posts, two braces.
      const z = 0.44;
      const beam = (name: string, min: V3, max: V3) =>
        box(m, name, mat("darkOak"), min, max, "frame");
      beam("sill", [-0.5, 0.5, z - 0.06], [0.5, 0.62, z + 0.04]);
      beam("head", [-0.5, WALL_H - 0.16, z - 0.06], [0.5, WALL_H, z + 0.04]);
      beam("post_l", [-0.5, 0.5, z - 0.06], [-0.38, WALL_H, z + 0.04]);
      beam("post_r", [0.38, 0.5, z - 0.06], [0.5, WALL_H, z + 0.04]);
      beam("stud_m", [-0.06, 0.62, z - 0.05], [0.06, WALL_H - 0.16, z + 0.03]);
      // Diagonal braces.
      strip(
        m,
        "brace_l",
        mat("darkOak"),
        [
          [-0.36, 0.64, z],
          [-0.1, 1.4, z],
        ],
        [
          [-0.28, 0.64, z],
          [-0.02, 1.4, z],
        ],
      );
      strip(
        m,
        "brace_r",
        mat("darkOak"),
        [
          [0.36, 0.64, z],
          [0.1, 1.4, z],
        ],
        [
          [0.28, 0.64, z],
          [0.02, 1.4, z],
        ],
      );
      // A small shuttered window on the upper outward face.
      box(m, "win_recess", mat("darkOak"), [-0.24, 1.46, 0.4], [0.24, 1.92, 0.46], "window");
      box(m, "win_sill", mat("fieldstone"), [-0.28, 1.4, 0.42], [0.28, 1.5, 0.5], "window");
      box(m, "shutter_l", mat("oak"), [-0.26, 1.46, 0.46], [-0.02, 1.92, 0.5], "window");
      box(m, "shutter_r", mat("oak"), [0.02, 1.46, 0.46], [0.26, 1.92, 0.5], "window");
    },
  });

const wallChurch = () =>
  sculpt({
    id: "obj_p_wall_church",
    name: "Church Ashlar Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["ashlar", "darkStone", "leadGlass", "lead"],
    build: (m) => {
      // Tall dressed-stone body with a buttress-like pilaster and a lancet.
      box(m, "body", mat("ashlar"), [-0.5, 0, -0.5], [0.5, WALL_H, 0.5], "body");
      // Plinth + string course darker bands.
      box(m, "plinth", mat("darkStone"), [-0.52, 0, -0.52], [0.52, 0.34, 0.52], "plinth");
      box(m, "string", mat("darkStone"), [-0.52, 1.3, 0.46], [0.52, 1.42, 0.54], "string");
      // Buttress projecting from the outward face.
      box(m, "buttress", mat("ashlar"), [-0.14, 0, 0.5], [0.14, WALL_H - 0.2, 0.74], "buttress");
      box(m, "buttress_cap", mat("darkStone"), [-0.17, WALL_H - 0.24, 0.5], [0.17, WALL_H - 0.12, 0.78], "buttress");
      // A tall lancet window, lead-glass set just inside the face.
      const z = 0.47;
      quad(m, "lancet", mat("leadGlass"), [-0.18, 0.7, z], [0.18, 0.7, z], [0.18, 1.5, z], [-0.18, 1.5, z], "lancet");
      tri(m, "lancet_head", mat("leadGlass"), [-0.18, 1.5, z], [0.18, 1.5, z], [0, 1.72, z], "lancet");
      // Lead mullion.
      box(m, "mullion", mat("lead"), [-0.02, 0.7, z], [0.02, 1.62, z + 0.01], "lancet");
    },
  });

// Low parish / graveyard wall — coped fieldstone, about waist height.
const wallLow = () =>
  sculpt({
    id: "obj_p_wall_low",
    name: "Low Coped Wall",
    category: "structure",
    tags: ["tile", "wall", "low_wall"],
    materialKeys: ["fieldstone", "mossStone", "darkStone"],
    build: (m, rng) => {
      const h = 0.92;
      box(m, "body", mat("fieldstone"), [-0.5, 0, -0.28], [0.5, h, 0.28], "body");
      // Irregular rubble face suggested by a couple of offset stones.
      box(m, "stone_a", mat("mossStone"), [-0.42, 0.1, 0.26], [-0.1, 0.42, 0.32], "face");
      box(m, "stone_b", mat("darkStone"), [0.06, 0.34, 0.26], [0.4, 0.66, 0.32], "face");
      // Triangular coping ridge.
      const t = 0.32 + rng() * 0.02;
      tri(m, "cope_zn", mat("darkStone"), [-0.5, h, -t], [-0.5, h, t], [-0.5, h + 0.16, 0], "cope");
      tri(m, "cope_zp", mat("darkStone"), [0.5, h, t], [0.5, h, -t], [0.5, h + 0.16, 0], "cope");
      quad(m, "cope_a", mat("darkStone"), [-0.5, h, -t], [-0.5, h + 0.16, 0], [0.5, h + 0.16, 0], [0.5, h, -t], "cope");
      quad(m, "cope_b", mat("darkStone"), [-0.5, h + 0.16, 0], [-0.5, h, t], [0.5, h, t], [0.5, h + 0.16, 0], "cope");
    },
  });

// Graveyard iron railing on a low stone kerb.
const ironFence = () =>
  sculpt({
    id: "obj_p_iron_fence",
    name: "Iron Railing",
    category: "architecture",
    tags: ["prop", "fence"],
    materialKeys: ["iron", "darkStone"],
    build: (m) => {
      box(m, "kerb", mat("darkStone"), [-0.5, 0, -0.1], [0.5, 0.24, 0.1], "kerb");
      const rail = (y: number) =>
        box(m, `rail_${y}`, mat("iron"), [-0.5, y, -0.03], [0.5, y + 0.05, 0.03], "rail");
      rail(0.5);
      rail(1.02);
      for (let i = 0; i < 5; i += 1) {
        const x = -0.4 + i * 0.2;
        box(m, `bar_${i}`, mat("iron"), [x - 0.018, 0.24, -0.02], [x + 0.018, 1.12, 0.02], "bar");
        // Spear finial.
        tri(m, `tip_a_${i}`, mat("iron"), [x - 0.04, 1.12, 0], [x + 0.04, 1.12, 0], [x, 1.22, 0], "bar");
      }
    },
  });

// Bronze-barred gaol grille in a stone surround — where Nessa is held.
const cellBars = () =>
  sculpt({
    id: "obj_p_cell_bars",
    name: "Gaol Bars",
    category: "architecture",
    tags: ["tile", "wall", "interactable"],
    materialKeys: ["fieldstone", "darkStone", "iron"],
    build: (m, rng) => {
      // Stone jambs and a heavy lintel framing the barred opening.
      box(m, "jamb_l", mat("fieldstone"), [-0.5, 0, -0.22], [-0.32, WALL_H, 0.22], "jamb");
      box(m, "jamb_r", mat("fieldstone"), [0.32, 0, -0.22], [0.5, WALL_H, 0.22], "jamb");
      box(m, "lintel", mat("darkStone"), [-0.5, WALL_H - 0.34, -0.24], [0.5, WALL_H, 0.24], "lintel");
      box(m, "sill", mat("darkStone"), [-0.5, 0, -0.24], [0.5, 0.22, 0.24], "sill");
      // Vertical iron bars.
      for (let i = 0; i < 5; i += 1) {
        const x = -0.26 + i * 0.13;
        box(m, `bar_${i}`, mat("iron"), [x - 0.022, 0.22, -0.02], [x + 0.022, WALL_H - 0.34, 0.02], "bar");
      }
      // Two cross-rails.
      box(m, "rail_lo", mat("iron"), [-0.3, 0.7, -0.03], [0.3, 0.78, 0.03], "bar");
      box(m, "rail_hi", mat("iron"), [-0.3, 1.5, -0.03], [0.3, 1.58, 0.03], "bar");
      // A keyhole plate, off to one side.
      box(m, "lock", mat("iron"), [0.16, 0.92, 0.02], [0.3, 1.18, 0.06], "bar");
      void rng;
    },
  });

// A planked oak door set in an arched stone surround — placed on door cells so
// thresholds read as real doorways. Non-blocking (the cell stays walkable).
const doorway = () =>
  sculpt({
    id: "obj_p_door",
    name: "Oak Doorway",
    category: "props",
    tags: ["prop", "door"],
    materialKeys: ["darkStone", "oak", "iron"],
    profile: "none",
    build: (m) => {
      // Surround.
      box(m, "jamb_l", mat("darkStone"), [-0.46, 0, -0.12], [-0.34, 1.9, 0.12], "jamb");
      box(m, "jamb_r", mat("darkStone"), [0.34, 0, -0.12], [0.46, 1.9, 0.12], "jamb");
      box(m, "lintel", mat("darkStone"), [-0.46, 1.78, -0.14], [0.46, 2.0, 0.14], "jamb");
      // Door leaf, ajar, hinged into the opening.
      box(m, "leaf", mat("oak"), [-0.32, 0.02, -0.02], [0.3, 1.78, 0.04], "leaf");
      box(m, "plank", mat("darkStone"), [-0.04, 0.02, 0.03], [0.0, 1.78, 0.05], "leaf");
      for (let i = 0; i < 2; i += 1) {
        const y = 0.5 + i * 0.7;
        box(m, `strap_${i}`, mat("iron"), [-0.32, y, 0.04], [0.18, y + 0.08, 0.06], "iron");
      }
      box(m, "ring", mat("iron"), [0.18, 0.9, 0.04], [0.26, 1.04, 0.07], "iron");
    },
  });

// ── Pitched roofs ─────────────────────────────────────────────────────────────
// Each piece is a 1×1 wedge meant to be dropped on a cell at y=2 (wall-top
// height). Slope pieces tile into a pitched plane; ridge pieces are full
// double-pitch tents for single-row roofs and sheds. They carry profile
// "single" so the renderer draws the mesh (not a flat tile) and the occlusion
// system fades them as overhead geometry when the player is beneath.

const RIDGE_Y = 0.95;
const EAVE_Y = 0.06;
const THICK = 0.1;
const OVER = 0.06; // eave overhang

// canonical slope: high edge at -Z (the ridge side), low eave at +Z.
const buildSlope = (m: ObjectMeshData, material: string, rotQuarters: number) => {
  const c = [1, 0, -1, 0][((rotQuarters % 4) + 4) % 4];
  const s = [0, 1, 0, -1][((rotQuarters % 4) + 4) % 4];
  const r = (p: V3): V3 => [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
  const hx = 0.5 + OVER;
  const lo = -0.5 - OVER; // low eave at +Z direction
  // top surface (sloped) and underside (parallel, THICK below)
  const tA: V3 = [-hx, RIDGE_Y, -0.5];
  const tB: V3 = [hx, RIDGE_Y, -0.5];
  const tC: V3 = [hx, EAVE_Y, -lo];
  const tD: V3 = [-hx, EAVE_Y, -lo];
  const uA: V3 = [-hx, RIDGE_Y - THICK, -0.5];
  const uB: V3 = [hx, RIDGE_Y - THICK, -0.5];
  const uC: V3 = [hx, EAVE_Y - THICK, -lo];
  const uD: V3 = [-hx, EAVE_Y - THICK, -lo];
  quad(m, "slope_top", material, r(tA), r(tB), r(tC), r(tD), "roof");
  quad(m, "slope_under", material, r(uD), r(uC), r(uB), r(uA), "roof");
  quad(m, "eave", material, r(tD), r(tC), r(uC), r(uD), "roof");
  quad(m, "ridge_edge", material, r(uA), r(uB), r(tB), r(tA), "roof");
  quad(m, "side_l", material, r(tA), r(tD), r(uD), r(uA), "roof");
  quad(m, "side_r", material, r(tC), r(tB), r(uB), r(uC), "roof");
};

// Hip corner: the cell at a building corner, sloping down toward its two
// outer edges so the four roof faces close cleanly instead of leaving a notch.
// Canonical = north-west corner (outer corner toward -X,-Z); rotQuarters spins
// it to NE/SE/SW.
const buildHipCorner = (m: ObjectMeshData, material: string, rotQuarters: number) => {
  const c = [1, 0, -1, 0][((rotQuarters % 4) + 4) % 4];
  const s = [0, 1, 0, -1][((rotQuarters % 4) + 4) % 4];
  const r = (p: V3): V3 => [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
  const o = 0.5 + OVER;
  // Corners: outer NW low, north & west edges at eave, inner SE high.
  const NW: V3 = [-o, EAVE_Y, -o];
  const NE: V3 = [0.5, EAVE_Y, -o];
  const SE: V3 = [0.5, RIDGE_Y, 0.5];
  const SW: V3 = [-o, EAVE_Y, 0.5];
  const dN: V3 = [NW[0], NW[1] - THICK, NW[2]];
  const dNE: V3 = [NE[0], NE[1] - THICK, NE[2]];
  const dSE: V3 = [SE[0], SE[1] - THICK, SE[2]];
  const dSW: V3 = [SW[0], SW[1] - THICK, SW[2]];
  quad(m, "hip_top", material, r(NW), r(NE), r(SE), r(SW), "roof");
  quad(m, "hip_under", material, r(dSW), r(dSE), r(dNE), r(dN), "roof");
  // Two outer eave skirts (north and west).
  quad(m, "hip_eave_n", material, r(NE), r(NW), r(dN), r(dNE), "roof");
  quad(m, "hip_eave_w", material, r(NW), r(SW), r(dSW), r(dN), "roof");
};

const hipObj = (id: string, name: string, material: MatKey, rotQ: number) =>
  sculpt({
    id,
    name,
    category: "structure",
    tags: ["roof"],
    materialKeys: [material],
    build: (m) => buildHipCorner(m, mat(material), rotQ),
  });

const roofHipNW = () => hipObj("obj_p_roof_hip_nw", "Roof Hip (NW)", "slate", 0);
const roofHipNE = () => hipObj("obj_p_roof_hip_ne", "Roof Hip (NE)", "slate", 1);
const roofHipSE = () => hipObj("obj_p_roof_hip_se", "Roof Hip (SE)", "slate", 2);
const roofHipSW = () => hipObj("obj_p_roof_hip_sw", "Roof Hip (SW)", "slate", 3);
const roofClayHipNW = () => hipObj("obj_p_roof_clay_hip_nw", "Clay Hip (NW)", "roofTileClay", 0);
const roofClayHipNE = () => hipObj("obj_p_roof_clay_hip_ne", "Clay Hip (NE)", "roofTileClay", 1);
const roofClayHipSE = () => hipObj("obj_p_roof_clay_hip_se", "Clay Hip (SE)", "roofTileClay", 2);
const roofClayHipSW = () => hipObj("obj_p_roof_clay_hip_sw", "Clay Hip (SW)", "roofTileClay", 3);

const roofSlopeS = () =>
  sculpt({
    id: "obj_p_roof_s",
    name: "Roof Slope (south eave)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildSlope(m, mat("slate"), 0),
  });
const roofSlopeN = () =>
  sculpt({
    id: "obj_p_roof_n",
    name: "Roof Slope (north eave)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildSlope(m, mat("slate"), 2),
  });
const roofSlopeE = () =>
  sculpt({
    id: "obj_p_roof_e",
    name: "Roof Slope (east eave)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildSlope(m, mat("slate"), 3),
  });
const roofSlopeW = () =>
  sculpt({
    id: "obj_p_roof_w",
    name: "Roof Slope (west eave)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildSlope(m, mat("slate"), 1),
  });

// Clay-tile variants (warmer roofs for the lower-town cottages).
const roofClaySlopeS = () =>
  sculpt({
    id: "obj_p_roof_clay_s",
    name: "Clay Roof Slope (south)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["roofTileClay"],
    build: (m) => buildSlope(m, mat("roofTileClay"), 0),
  });
const roofClaySlopeN = () =>
  sculpt({
    id: "obj_p_roof_clay_n",
    name: "Clay Roof Slope (north)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["roofTileClay"],
    build: (m) => buildSlope(m, mat("roofTileClay"), 2),
  });

// Double-pitch tent for single-row roofs; ridge runs along X.
const buildTent = (m: ObjectMeshData, material: string, alongX: boolean) => {
  const r = (p: V3): V3 => (alongX ? p : [p[2], p[1], p[0]]);
  const hx = 0.5 + OVER;
  quad(m, "n", material, r([-hx, EAVE_Y, -0.5 - OVER]), r([hx, EAVE_Y, -0.5 - OVER]), r([hx, RIDGE_Y, 0]), r([-hx, RIDGE_Y, 0]), "roof");
  quad(m, "s", material, r([-hx, RIDGE_Y, 0]), r([hx, RIDGE_Y, 0]), r([hx, EAVE_Y, 0.5 + OVER]), r([-hx, EAVE_Y, 0.5 + OVER]), "roof");
  // gable triangles
  tri(m, "g_a", material, r([-hx, EAVE_Y, -0.5 - OVER]), r([-hx, RIDGE_Y, 0]), r([-hx, EAVE_Y, 0.5 + OVER]), "gable");
  tri(m, "g_b", material, r([hx, EAVE_Y, 0.5 + OVER]), r([hx, RIDGE_Y, 0]), r([hx, EAVE_Y, -0.5 - OVER]), "gable");
};

const roofClaySlopeE = () =>
  sculpt({
    id: "obj_p_roof_clay_e",
    name: "Clay Roof Slope (east)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["roofTileClay"],
    build: (m) => buildSlope(m, mat("roofTileClay"), 3),
  });
const roofClaySlopeW = () =>
  sculpt({
    id: "obj_p_roof_clay_w",
    name: "Clay Roof Slope (west)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["roofTileClay"],
    build: (m) => buildSlope(m, mat("roofTileClay"), 1),
  });
const roofClayFlat = () =>
  sculpt({
    id: "obj_p_roof_clay_flat",
    name: "Clay Roof Plateau",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["roofTileClay"],
    build: (m) => {
      box(m, "cap", mat("roofTileClay"), [-0.5 - OVER, RIDGE_Y - THICK, -0.5 - OVER], [0.5 + OVER, RIDGE_Y, 0.5 + OVER], "roof");
    },
  });

// Flat ridge plateau — the top of a hipped roof, where the four slopes meet.
// Dropped on the interior cells of a building's roof so any footprint reads as
// a clean hipped roof (sloped edges, level ridge).
const roofFlat = () =>
  sculpt({
    id: "obj_p_roof_flat",
    name: "Roof Ridge Plateau",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => {
      box(m, "cap", mat("slate"), [-0.5 - OVER, RIDGE_Y - THICK, -0.5 - OVER], [0.5 + OVER, RIDGE_Y, 0.5 + OVER], "roof");
    },
  });

const roofTentX = () =>
  sculpt({
    id: "obj_p_roof_tent_x",
    name: "Roof Tent (ridge X)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildTent(m, mat("slate"), true),
  });
const roofTentZ = () =>
  sculpt({
    id: "obj_p_roof_tent_z",
    name: "Roof Tent (ridge Z)",
    category: "structure",
    tags: ["roof"],
    materialKeys: ["slate"],
    build: (m) => buildTent(m, mat("slate"), false),
  });

// Chimney stack with smoking pot — sits on a roof cell.
const chimney = () =>
  sculpt({
    id: "obj_p_chimney",
    name: "Chimney Stack",
    category: "props",
    tags: ["prop", "roof"],
    materialKeys: ["fieldstone", "darkStone", "roofTileClay"],
    build: (m) => {
      box(m, "stack", mat("fieldstone"), [-0.16, 0, -0.16], [0.16, 1.0, 0.16], "stack");
      box(m, "cap", mat("darkStone"), [-0.2, 1.0, -0.2], [0.2, 1.12, 0.2], "cap");
      // Two clay pots.
      lathe(m, "pot_a", mat("roofTileClay"), [[0.07, 1.12], [0.09, 1.3], [0.07, 1.4]], 7, {
        center: [-0.08, 0, -0.05],
        capTop: false,
      });
      lathe(m, "pot_b", mat("roofTileClay"), [[0.07, 1.12], [0.09, 1.28], [0.07, 1.38]], 7, {
        center: [0.09, 0, 0.06],
        capTop: false,
      });
    },
  });

// ── The Church front & bell-tower ───────────────────────────────────────────
// Large landmark meshes placed via custom placements (facing set explicitly).

const churchFront = () =>
  sculpt({
    id: "obj_p_church_front",
    name: "Church West Front",
    category: "setpiece",
    tags: ["prop", "setpiece", "structure"],
    materialKeys: ["ashlar", "darkStone", "leadGlass", "lead", "oak", "iron"],
    footprint: [
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
    build: (m) => {
      // Gabled facade ~3 wide, 4.6 tall. Faces +Z.
      const z0 = -0.5;
      const z1 = 0.5;
      box(m, "wall", mat("ashlar"), [-1.5, 0, z0], [1.5, 3.4, z1], "wall");
      box(m, "plinth", mat("darkStone"), [-1.56, 0, z0 - 0.04], [1.56, 0.4, z1 + 0.04], "plinth");
      // Gable above the eaves.
      tri(m, "gable_face", mat("ashlar"), [-1.5, 3.4, z1], [1.5, 3.4, z1], [0, 4.5, z1], "gable");
      tri(m, "gable_back", mat("darkStone"), [1.5, 3.4, z0], [-1.5, 3.4, z0], [0, 4.5, z0], "gable");
      quad(m, "gable_rake_l", mat("darkStone"), [-1.5, 3.4, z0], [0, 4.5, z0], [0, 4.5, z1], [-1.5, 3.4, z1], "gable");
      quad(m, "gable_rake_r", mat("darkStone"), [0, 4.5, z0], [1.5, 3.4, z0], [1.5, 3.4, z1], [0, 4.5, z1], "gable");
      // Apex cross.
      box(m, "cross_v", mat("darkStone"), [-0.05, 4.5, -0.05], [0.05, 5.0, 0.05], "cross");
      box(m, "cross_h", mat("darkStone"), [-0.22, 4.68, -0.04], [0.22, 4.78, 0.04], "cross");
      // Rose window (lead glass disc) with spoke leads.
      const cy = 2.5;
      const seg = 16;
      const front = z1 + 0.02;
      const outer = circleProfile(seg, 0.62);
      const ringF = outer.map(([x, y]) => addV(m, [x, cy + y, front]));
      const center = addV(m, [0, cy, front]);
      for (let i = 0; i < seg; i += 1) {
        const j = (i + 1) % seg;
        addFace(m, `rose_${i}`, [center, ringF[i], ringF[j]], mat("leadGlass"), "rose");
      }
      // Lead spokes + rim.
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        box(m, `spoke_${i}`, mat("lead"), [-0.02, cy - 0.62, front + 0.005], [0.02, cy + 0.62, front + 0.01], "rose");
        void a;
      }
      lathe(m, "rose_rim", mat("darkStone"), [[0.62, -0.06], [0.7, 0], [0.62, 0.06]], 16, {
        center: [0, cy, front - 0.04],
        capBottom: false,
        capTop: false,
        scaleZ: 0.18,
      });
      // Pointed-arch oak doors with iron strap hinges.
      const dz = z1 + 0.01;
      box(m, "door", mat("oak"), [-0.55, 0, dz - 0.02], [0.55, 1.7, dz], "door");
      tri(m, "door_arch", mat("oak"), [-0.55, 1.7, dz], [0.55, 1.7, dz], [0, 2.2, dz], "door");
      box(m, "door_split", mat("darkStone"), [-0.03, 0, dz + 0.001], [0.03, 1.7, dz + 0.005], "door");
      for (let i = 0; i < 3; i += 1) {
        const y = 0.4 + i * 0.5;
        box(m, `hinge_l_${i}`, mat("iron"), [-0.55, y, dz + 0.002], [-0.18, y + 0.08, dz + 0.01], "iron");
        box(m, `hinge_r_${i}`, mat("iron"), [0.18, y, dz + 0.002], [0.55, y + 0.08, dz + 0.01], "iron");
      }
      // Door surround arch (dressed stone).
      lathe(m, "surround", mat("darkStone"), [[0.66, 0], [0.74, 0]], 9, { center: [0, 0, dz - 0.05] });
    },
  });

const bellTower = () =>
  sculpt({
    id: "obj_p_bell_tower",
    name: "Parish Bell-Tower",
    category: "setpiece",
    tags: ["prop", "setpiece", "structure", "landmark"],
    materialKeys: ["ashlar", "darkStone", "slate", "leadGlass", "lead", "copper"],
    footprint: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    build: (m) => {
      // Square tower ~2.2 wide, ~8.5 tall, set-back stages + spire.
      const stage = (y0: number, y1: number, half: number, material: string) =>
        box(m, `stage_${y0}`, material, [-half, y0, -half], [half, y1, half], "tower");
      stage(0, 0.5, 1.18, mat("darkStone")); // plinth
      stage(0.5, 3.4, 1.1, mat("ashlar"));
      // string course
      stage(3.4, 3.6, 1.16, mat("darkStone"));
      stage(3.6, 6.2, 1.04, mat("ashlar"));
      // Corner pilasters up the main shaft.
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          box(
            m,
            `pil_${sx}_${sz}`,
            mat("darkStone"),
            [sx * 1.04 - 0.12 * (sx > 0 ? 1 : -1), 0.5, sz * 1.04 - 0.12 * (sz > 0 ? 1 : -1)],
            [sx * 1.04 + 0.12 * (sx > 0 ? 0 : 1) * 0, 6.2, sz * 1.04],
            "pil",
          );
      // Belfry stage with louvred lancet openings on each face.
      stage(6.2, 6.4, 1.12, mat("darkStone"));
      stage(6.4, 7.8, 1.0, mat("ashlar"));
      const louvre = (rotQ: number) => {
        const c = [1, 0, -1, 0][rotQ];
        const s = [0, 1, 0, -1][rotQ];
        const r = (p: V3): V3 => [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
        quad(m, `louvre_${rotQ}`, mat("darkStone"), r([-0.26, 6.6, 1.0]), r([0.26, 6.6, 1.0]), r([0.26, 7.4, 1.0]), r([-0.26, 7.4, 1.0]), "louvre");
        tri(m, `louvre_h_${rotQ}`, mat("darkStone"), r([-0.26, 7.4, 1.0]), r([0.26, 7.4, 1.0]), r([0, 7.62, 1.0]), "louvre");
      };
      louvre(0);
      louvre(1);
      louvre(2);
      louvre(3);
      // Clock face on the +Z side.
      lathe(m, "clock", mat("leadGlass"), [[0.3, -0.04], [0.34, 0], [0.3, 0.04]], 14, {
        center: [0, 5.4, 1.02],
        scaleZ: 0.12,
        capBottom: false,
        capTop: false,
      });
      lathe(m, "clock_rim", mat("copper"), [[0.34, 0], [0.38, 0]], 14, { center: [0, 5.4, 1.0], scaleZ: 0.1 });
      // Cornice then the slate broach spire.
      stage(7.8, 8.0, 1.14, mat("darkStone"));
      const apex = addV(m, [0, 9.9, 0]);
      const eave: Ring = [
        addV(m, [-1.0, 8.0, -1.0]),
        addV(m, [1.0, 8.0, -1.0]),
        addV(m, [1.0, 8.0, 1.0]),
        addV(m, [-1.0, 8.0, 1.0]),
      ];
      for (let i = 0; i < 4; i += 1) {
        const j = (i + 1) % 4;
        addFace(m, `spire_${i}`, [eave[i], eave[j], apex], mat("slate"), "spire");
      }
      // Weathervane.
      box(m, "vane_mast", mat("iron"), [-0.03, 9.9, -0.03], [0.03, 10.5, 0.03], "vane");
      box(m, "vane_arm", mat("iron"), [-0.3, 10.3, -0.02], [0.3, 10.36, 0.02], "vane");
    },
  });

// The domed gaol / charnel rotunda (bottom-right of the reference).
const rotunda = () =>
  sculpt({
    id: "obj_p_rotunda",
    name: "Domed Charnel House",
    category: "setpiece",
    tags: ["prop", "setpiece", "structure", "landmark"],
    materialKeys: ["fieldstone", "darkStone", "slate", "copper", "oak", "leadGlass"],
    footprint: [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ],
    build: (m, rng) => {
      // Drum.
      lathe(m, "drum", mat("fieldstone"), [
        [1.5, 0],
        [1.5, 2.4],
        [1.46, 2.6],
      ], 14, { jitter: 0.02, rng, capBottom: true, capTop: false });
      // Cornice ring.
      lathe(m, "cornice", mat("darkStone"), [[1.5, 2.6], [1.62, 2.7], [1.5, 2.8]], 14, {
        capBottom: false,
        capTop: false,
      });
      // Ribbed lead/slate dome.
      lathe(m, "dome", mat("slate"), [
        [1.46, 2.8],
        [1.3, 3.4],
        [0.95, 3.95],
        [0.5, 4.35],
        [0.16, 4.55],
      ], 14, { capBottom: false, capTop: false });
      // Copper lantern finial.
      lathe(m, "lantern", mat("copper"), [
        [0.2, 4.55],
        [0.24, 4.75],
        [0.2, 4.95],
        [0.06, 5.1],
      ], 8, { capBottom: false, capTop: true });
      box(m, "finial", mat("copper"), [-0.03, 5.1, -0.03], [0.03, 5.5, 0.03], "finial");
      box(m, "finial_x", mat("copper"), [-0.16, 5.28, -0.02], [0.16, 5.36, 0.02], "finial");
      // Arched windows + oak door around the drum.
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + 0.2;
        const x = Math.cos(a) * 1.48;
        const z = Math.sin(a) * 1.48;
        const isDoor = i === 0;
        const w = isDoor ? 0.4 : 0.26;
        const h = isDoor ? 1.7 : 1.1;
        const yb = isDoor ? 0 : 0.8;
        const nx = Math.cos(a);
        const nz = Math.sin(a);
        // Simple billboarded opening quad facing outward.
        const tx = -nz;
        const tz = nx;
        const material = isDoor ? mat("oak") : mat("leadGlass");
        quad(
          m,
          `open_${i}`,
          material,
          [x - tx * w, yb, z - tz * w],
          [x + tx * w, yb, z + tz * w],
          [x + tx * w, yb + h, z + tz * w],
          [x - tx * w, yb + h, z - tz * w],
          "openings",
        );
      }
    },
  });

// Roofed lych-gate into the graveyard.
const lychGate = () =>
  sculpt({
    id: "obj_p_lych_gate",
    name: "Lych-Gate",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    materialKeys: ["oak", "darkOak", "slate", "fieldstone"],
    footprint: [
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
    build: (m) => {
      // Four posts, lintels, and a little gabled slate roof.
      const post = (x: number, z: number) => {
        box(m, `base_${x}_${z}`, mat("fieldstone"), [x - 0.16, 0, z - 0.16], [x + 0.16, 0.3, z + 0.16], "base");
        box(m, `post_${x}_${z}`, mat("darkOak"), [x - 0.1, 0.3, z - 0.1], [x + 0.1, 2.2, z + 0.1], "post");
      };
      post(-1.1, -0.4);
      post(1.1, -0.4);
      post(-1.1, 0.4);
      post(1.1, 0.4);
      // Tie-beams.
      box(m, "tie_a", mat("oak"), [-1.2, 2.2, -0.46], [1.2, 2.35, -0.34], "beam");
      box(m, "tie_b", mat("oak"), [-1.2, 2.2, 0.34], [1.2, 2.35, 0.46], "beam");
      box(m, "tie_c", mat("oak"), [-1.2, 2.2, -0.1], [1.2, 2.32, 0.1], "beam");
      // Gabled roof (ridge along X).
      const ridge = 3.1;
      const eave = 2.35;
      quad(m, "roof_n", mat("slate"), [-1.35, eave, -0.62], [1.35, eave, -0.62], [1.35, ridge, 0], [-1.35, ridge, 0], "roof");
      quad(m, "roof_s", mat("slate"), [-1.35, ridge, 0], [1.35, ridge, 0], [1.35, eave, 0.62], [-1.35, eave, 0.62], "roof");
      tri(m, "gable_a", mat("darkOak"), [-1.35, eave, -0.62], [-1.35, ridge, 0], [-1.35, eave, 0.62], "gable");
      tri(m, "gable_b", mat("darkOak"), [1.35, eave, 0.62], [1.35, ridge, 0], [1.35, eave, -0.62], "gable");
      // Low swinging gate between the inner posts.
      box(m, "gate", mat("oak"), [-0.95, 0.2, -0.04], [0.95, 1.1, 0.04], "gate");
    },
  });

// Stepped market / wayside cross at the heart of the ritual square.
const marketCross = () =>
  sculpt({
    id: "obj_p_market_cross",
    name: "Wayside Cross",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable", "shrine"],
    materialKeys: ["mossStone", "darkStone", "graveMarble"],
    build: (m, rng) => {
      // Three octagonal steps.
      const step = (y0: number, r: number, material: string) =>
        lathe(m, `step_${y0}`, material, [[r, y0], [r, y0 + 0.22]], 8, {
          jitter: 0.01,
          rng,
          capTop: true,
        });
      step(0, 1.0, mat("mossStone"));
      step(0.22, 0.76, mat("mossStone"));
      step(0.44, 0.54, mat("darkStone"));
      // Socket + tapering shaft.
      box(m, "socket", mat("darkStone"), [-0.26, 0.66, -0.26], [0.26, 0.94, 0.26], "socket");
      lathe(m, "shaft", mat("graveMarble"), [
        [0.16, 0.94],
        [0.13, 2.0],
        [0.12, 2.7],
      ], 8, { jitter: 0.008, rng, capTop: false });
      // Weathered cross head.
      box(m, "head_v", mat("graveMarble"), [-0.1, 2.7, -0.08], [0.1, 3.3, 0.08], "head");
      box(m, "head_h", mat("graveMarble"), [-0.42, 2.92, -0.07], [0.42, 3.12, 0.07], "head");
      // A worn ring linking the arms (Celtic-ish, doctrine-touched).
      lathe(m, "ring", mat("graveMarble"), [[0.3, -0.06], [0.34, 0], [0.3, 0.06]], 12, {
        center: [0, 3.02, 0],
        scaleZ: 0.2,
        capBottom: false,
        capTop: false,
      });
    },
  });

// Gibbet / signal derrick (the timber frame on the rise, top-right of ref).
const gibbet = () =>
  sculpt({
    id: "obj_p_gibbet",
    name: "Signal Gibbet",
    category: "setpiece",
    tags: ["prop", "setpiece"],
    materialKeys: ["darkOak", "oak", "iron"],
    build: (m) => {
      // Four splayed legs to a platform, an upright, and a jib arm.
      const leg = (x: number, z: number) =>
        tube(m, `leg_${x}_${z}`, mat("darkOak"), [[x, 0, z], [x * 0.4, 2.6, z * 0.4]], [0.08, 0.05], 4);
      leg(-0.6, -0.6);
      leg(0.6, -0.6);
      leg(-0.6, 0.6);
      leg(0.6, 0.6);
      box(m, "platform", mat("oak"), [-0.34, 2.55, -0.34], [0.34, 2.7, 0.34], "platform");
      box(m, "mast", mat("darkOak"), [-0.08, 2.7, -0.08], [0.08, 4.4, 0.08], "mast");
      box(m, "jib", mat("darkOak"), [-0.06, 4.2, -0.06], [0.9, 4.32, 0.06], "jib");
      tube(m, "brace", mat("oak"), [[0.06, 3.7, 0], [0.8, 4.2, 0]], [0.04, 0.04], 4);
      // Iron hook + chain hint at the jib end.
      box(m, "chain", mat("iron"), [0.82, 3.9, -0.02], [0.86, 4.2, 0.02], "iron");
      tube(m, "hook", mat("iron"), [[0.84, 3.9, 0], [0.84, 3.7, 0.06], [0.78, 3.66, 0.1]], [0.03, 0.025, 0.02], 4);
    },
  });

// ── Graveyard furniture ───────────────────────────────────────────────────────

const headstone = () =>
  sculpt({
    id: "obj_p_headstone",
    name: "Headstone",
    category: "props",
    tags: ["prop", "grave"],
    materialKeys: ["graveMarble", "mossStone", "darkStone"],
    build: (m, rng) => {
      const lean = (rng() - 0.5) * 0.16;
      const w = 0.34;
      const h = 0.9 + rng() * 0.3;
      const top: V3[] = [];
      void top;
      // Slightly leaning slab.
      const tilt = (p: V3): V3 => [p[0] + p[1] * lean, p[1], p[2]];
      box(m, "base", mat("darkStone"), [-w - 0.05, 0, -0.12], [w + 0.05, 0.12, 0.12], "base");
      // Slab body with rounded shoulders approximated by a chamfer.
      quad(m, "face", mat("graveMarble"), tilt([-w, 0.1, 0.08]), tilt([w, 0.1, 0.08]), tilt([w, h, 0.08]), tilt([-w, h, 0.08]), "slab");
      quad(m, "back", mat("mossStone"), tilt([w, 0.1, -0.06]), tilt([-w, 0.1, -0.06]), tilt([-w, h, -0.06]), tilt([w, h, -0.06]), "slab");
      quad(m, "edge_l", mat("graveMarble"), tilt([-w, 0.1, -0.06]), tilt([-w, 0.1, 0.08]), tilt([-w, h, 0.08]), tilt([-w, h, -0.06]), "slab");
      quad(m, "edge_r", mat("graveMarble"), tilt([w, 0.1, 0.08]), tilt([w, 0.1, -0.06]), tilt([w, h, -0.06]), tilt([w, h, 0.08]), "slab");
      quad(m, "top", mat("graveMarble"), tilt([-w, h, -0.06]), tilt([-w, h, 0.08]), tilt([w, h, 0.08]), tilt([w, h, -0.06]), "slab");
      // Incised cross.
      box(m, "cross_v", mat("darkStone"), tilt([-0.04, h - 0.5, 0.081]), tilt([0.04, h - 0.12, 0.085]), "incise");
      box(m, "cross_h", mat("darkStone"), tilt([-0.16, h - 0.34, 0.081]), tilt([0.16, h - 0.26, 0.085]), "incise");
    },
  });

const chestTomb = () =>
  sculpt({
    id: "obj_p_tomb",
    name: "Chest Tomb",
    category: "props",
    tags: ["prop", "grave"],
    materialKeys: ["graveMarble", "mossStone", "darkStone"],
    build: (m, rng) => {
      box(m, "base", mat("darkStone"), [-0.5, 0, -0.32], [0.5, 0.12, 0.32], "base");
      box(m, "body", mat("graveMarble"), [-0.44, 0.12, -0.26], [0.44, 0.62, 0.26], "body");
      // Mossy lid with a slight overhang.
      box(m, "lid", mat("mossStone"), [-0.5, 0.62, -0.32], [0.5, 0.74, 0.32], "lid");
      // Corner colonnettes.
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          box(m, `col_${sx}_${sz}`, mat("darkStone"), [sx * 0.4 - 0.04, 0.12, sz * 0.22 - 0.04], [sx * 0.4 + 0.04, 0.62, sz * 0.22 + 0.04], "col");
      void rng;
    },
  });

const graveCross = () =>
  sculpt({
    id: "obj_p_grave_cross",
    name: "Grave Cross",
    category: "props",
    tags: ["prop", "grave"],
    materialKeys: ["darkOak", "graveMarble"],
    build: (m, rng) => {
      const lean = (rng() - 0.5) * 0.12;
      const tilt = (p: V3): V3 => [p[0] + p[1] * lean, p[1], p[2]];
      box(m, "mound", mat("graveMarble"), [-0.3, 0, -0.2], [0.3, 0.1, 0.2], "mound");
      box(m, "v", mat("darkOak"), tilt([-0.05, 0.1, -0.04]), tilt([0.05, 1.0, 0.04]), "cross");
      box(m, "h", mat("darkOak"), tilt([-0.28, 0.66, -0.04]), tilt([0.28, 0.76, 0.04]), "cross");
    },
  });

// ── Parish props ───────────────────────────────────────────────────────────────

const well = () =>
  sculpt({
    id: "obj_p_well",
    name: "Parish Well",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["fieldstone", "darkStone", "oak", "darkOak", "iron", "slate"],
    build: (m, rng) => {
      lathe(m, "ring", mat("fieldstone"), [
        [0.6, 0],
        [0.62, 0.6],
        [0.6, 0.72],
        [0.5, 0.72],
      ], 10, { jitter: 0.015, rng, capBottom: true, capTop: false });
      cap(m, "lip", mat("darkStone"), placeRing(m, circleProfile(10, 0.6), [0, 0.72, 0]));
      // Dark water disc inside.
      cap(m, "water", mat("darkStone"), placeRing(m, circleProfile(10, 0.46), [0, 0.5, 0]));
      // Two posts + ridge beam + little slate roof + windlass.
      box(m, "post_l", mat("darkOak"), [-0.58, 0.72, -0.05], [-0.48, 2.0, 0.05], "post");
      box(m, "post_r", mat("darkOak"), [0.48, 0.72, -0.05], [0.58, 2.0, 0.05], "post");
      box(m, "ridge", mat("oak"), [-0.6, 1.95, -0.04], [0.6, 2.05, 0.04], "ridge");
      quad(m, "roof_a", mat("slate"), [-0.7, 2.0, -0.55], [0.7, 2.0, -0.55], [0.7, 2.4, 0], [-0.7, 2.4, 0], "roof");
      quad(m, "roof_b", mat("slate"), [-0.7, 2.4, 0], [0.7, 2.4, 0], [0.7, 2.0, 0.55], [-0.7, 2.0, 0.55], "roof");
      // Windlass barrel + crank + bucket.
      tube(m, "windlass", mat("oak"), [[-0.5, 1.2, 0], [0.5, 1.2, 0]], [0.08, 0.08], 7);
      box(m, "crank", mat("iron"), [0.5, 1.16, 0], [0.66, 1.24, 0.02], "iron");
      tube(m, "rope", mat("iron"), [[0.1, 1.2, 0], [0.1, 0.74, 0]], [0.012, 0.012], 4);
      box(m, "bucket", mat("darkOak"), [0.02, 0.74, -0.08], [0.18, 0.94, 0.08], "bucket");
    },
  });

const lanternPost = () =>
  sculpt({
    id: "obj_p_lantern",
    name: "Iron Lantern Post",
    category: "props",
    tags: ["prop", "light"],
    materialKeys: ["iron", "darkStone", "candle", "leadGlass"],
    build: (m) => {
      box(m, "footing", mat("darkStone"), [-0.12, 0, -0.12], [0.12, 0.2, 0.12], "footing");
      tube(m, "post", mat("iron"), [[0, 0.2, 0], [0, 1.9, 0]], [0.05, 0.04], 6);
      // Curved bracket.
      tube(m, "bracket", mat("iron"), [[0, 1.9, 0], [0.18, 2.05, 0], [0.3, 1.98, 0]], [0.025, 0.025, 0.02], 4);
      // Lantern cage hanging.
      box(m, "cage", mat("iron"), [0.24, 1.55, -0.12], [0.36, 1.92, 0.12], "cage");
      box(m, "glass", mat("leadGlass"), [0.25, 1.6, -0.1], [0.35, 1.86, 0.1], "glass");
      // Flame.
      lathe(m, "flame", mat("candle"), [[0.05, 1.64], [0.03, 1.78], [0.01, 1.86]], 6, {
        center: [0.3, 0, 0],
        capBottom: false,
      });
      box(m, "cap", mat("iron"), [0.22, 1.9, -0.14], [0.38, 1.98, 0.14], "cap");
    },
  });

const stocks = () =>
  sculpt({
    id: "obj_p_stocks",
    name: "Punishment Stocks",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["darkOak", "oak", "iron", "fieldstone"],
    build: (m) => {
      box(m, "plinth", mat("fieldstone"), [-0.7, 0, -0.3], [0.7, 0.18, 0.3], "plinth");
      const upright = (x: number) => box(m, `up_${x}`, mat("darkOak"), [x - 0.07, 0.18, -0.06], [x + 0.07, 1.1, 0.06], "upright");
      upright(-0.6);
      upright(0.6);
      // Lower fixed board + upper board with three holes (hinted by gaps).
      box(m, "board_lo", mat("oak"), [-0.62, 0.62, -0.05], [0.62, 0.78, 0.05], "board");
      box(m, "board_hi_l", mat("oak"), [-0.62, 0.78, -0.05], [-0.32, 0.92, 0.05], "board");
      box(m, "board_hi_m", mat("oak"), [-0.12, 0.78, -0.05], [0.12, 0.92, 0.05], "board");
      box(m, "board_hi_r", mat("oak"), [0.32, 0.78, -0.05], [0.62, 0.92, 0.05], "board");
      box(m, "hasp", mat("iron"), [0.58, 0.7, 0.04], [0.66, 0.86, 0.08], "iron");
    },
  });

const noticeBoard = () =>
  sculpt({
    id: "obj_p_notice",
    name: "Edict Board",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["darkOak", "oak", "slate", "canvas", "iron"],
    build: (m) => {
      box(m, "post_l", mat("darkOak"), [-0.5, 0, -0.05], [-0.4, 1.5, 0.05], "post");
      box(m, "post_r", mat("darkOak"), [0.4, 0, -0.05], [0.5, 1.5, 0.05], "post");
      box(m, "board", mat("oak"), [-0.5, 0.7, -0.03], [0.5, 1.5, 0.03], "board");
      // Little slate pent roof over it.
      quad(m, "roof", mat("slate"), [-0.58, 1.5, -0.16], [0.58, 1.5, -0.16], [0.58, 1.66, 0.14], [-0.58, 1.66, 0.14], "roof");
      // Pinned proclamations.
      box(m, "paper_a", mat("canvas"), [-0.38, 0.92, 0.031], [-0.04, 1.34, 0.035], "paper");
      box(m, "paper_b", mat("canvas"), [0.04, 1.0, 0.031], [0.36, 1.3, 0.035], "paper");
      box(m, "wax", mat("iron"), [0.18, 1.04, 0.036], [0.24, 1.1, 0.04], "iron");
    },
  });

const innSign = () =>
  sculpt({
    id: "obj_p_inn_sign",
    name: "Hanging Inn Sign",
    category: "props",
    tags: ["prop"],
    materialKeys: ["iron", "darkOak", "canvas"],
    profile: "none",
    build: (m) => {
      box(m, "post", mat("darkOak"), [-0.06, 0, -0.06], [0.06, 2.0, 0.06], "post");
      box(m, "arm", mat("iron"), [0.0, 1.85, -0.02], [0.7, 1.93, 0.02], "arm");
      tube(m, "brace", mat("iron"), [[0.06, 1.5, 0], [0.5, 1.85, 0]], [0.02, 0.02], 4);
      // Swinging board.
      box(m, "sign", mat("canvas"), [0.36, 1.1, -0.02], [0.66, 1.78, 0.02], "sign");
      box(m, "frame", mat("iron"), [0.34, 1.08, -0.025], [0.68, 1.14, 0.025], "frame");
      box(m, "frame2", mat("iron"), [0.34, 1.76, -0.025], [0.68, 1.82, 0.025], "frame");
    },
  });

const handcart = () =>
  sculpt({
    id: "obj_p_cart",
    name: "Handcart",
    category: "props",
    tags: ["prop"],
    materialKeys: ["oak", "darkOak", "iron"],
    build: (m) => {
      box(m, "bed", mat("oak"), [-0.5, 0.42, -0.3], [0.5, 0.5, 0.3], "bed");
      box(m, "side_l", mat("oak"), [-0.5, 0.5, -0.32], [0.5, 0.74, -0.26], "side");
      box(m, "side_r", mat("oak"), [-0.5, 0.5, 0.26], [0.5, 0.74, 0.32], "side");
      box(m, "side_b", mat("oak"), [-0.5, 0.5, -0.3], [-0.44, 0.74, 0.3], "side");
      // Shafts.
      tube(m, "shaft_l", mat("darkOak"), [[0.5, 0.46, -0.22], [1.1, 0.4, -0.22]], [0.04, 0.03], 4);
      tube(m, "shaft_r", mat("darkOak"), [[0.5, 0.46, 0.22], [1.1, 0.4, 0.22]], [0.04, 0.03], 4);
      // Two wheels.
      const wheel = (z: number) => {
        lathe(m, `wheel_${z}`, mat("darkOak"), [[0.34, -0.03], [0.36, 0], [0.34, 0.03]], 10, {
          center: [0, 0.34, z],
          scaleZ: 1,
          capBottom: false,
          capTop: false,
        });
        lathe(m, `tyre_${z}`, mat("iron"), [[0.36, 0], [0.38, 0]], 10, { center: [0, 0.34, z], capBottom: false, capTop: false });
      };
      wheel(-0.34);
      wheel(0.34);
    },
  });

const barrel = () =>
  sculpt({
    id: "obj_p_barrel",
    name: "Oak Barrel",
    category: "props",
    tags: ["prop"],
    materialKeys: ["oak", "iron"],
    build: (m, rng) => {
      lathe(m, "body", mat("oak"), [
        [0.24, 0],
        [0.32, 0.3],
        [0.34, 0.55],
        [0.32, 0.8],
        [0.24, 1.05],
      ], 10, { jitter: 0.008, rng, capBottom: true, capTop: true });
      lathe(m, "hoop_a", mat("iron"), [[0.33, 0.22], [0.33, 0.3]], 10, { capBottom: false, capTop: false });
      lathe(m, "hoop_b", mat("iron"), [[0.33, 0.76], [0.33, 0.84]], 10, { capBottom: false, capTop: false });
    },
  });

const crate = () =>
  sculpt({
    id: "obj_p_crate",
    name: "Crate & Sacks",
    category: "props",
    tags: ["prop"],
    materialKeys: ["oak", "darkOak", "canvas"],
    build: (m, rng) => {
      box(m, "crate", mat("oak"), [-0.34, 0, -0.34], [0.34, 0.66, 0.34], "crate");
      // Cross battens.
      box(m, "batten_a", mat("darkOak"), [-0.36, 0.1, -0.36], [0.36, 0.18, -0.3], "batten");
      box(m, "batten_b", mat("darkOak"), [-0.36, 0.46, -0.36], [0.36, 0.54, -0.3], "batten");
      // A leaning sack.
      blob(m, "sack", mat("canvas"), [0.24, 0.34, 0.28], [0.46, 0.66, 0.42], rng, 7, 3, 0.05);
    },
  });

// ── Nature ──────────────────────────────────────────────────────────────────

const yewTree = () =>
  sculpt({
    id: "obj_p_yew",
    name: "Graveyard Yew",
    category: "nature",
    tags: ["prop", "nature", "tree"],
    materialKeys: ["bark", "yew"],
    build: (m, rng) => {
      tube(m, "trunk", mat("bark"), [[0, 0, 0], [0.04, 0.5, 0.02], [-0.03, 0.9, 0]], [0.16, 0.12, 0.09], 6, {
        jitter: 0.03,
        rng,
      });
      // Tall dark conical crown (cypress/yew column).
      lathe(m, "crown", mat("yew"), [
        [0.32, 0.6],
        [0.5, 1.2],
        [0.42, 2.2],
        [0.3, 3.1],
        [0.16, 3.8],
        [0.04, 4.2],
      ], 8, { jitter: 0.06, rng, capBottom: false });
    },
  });

const autumnOak = () =>
  sculpt({
    id: "obj_p_oak",
    name: "Autumn Oak",
    category: "nature",
    tags: ["prop", "nature", "tree"],
    materialKeys: ["bark", "oakLeaf"],
    build: (m, rng) => {
      tube(m, "trunk", mat("bark"), [
        [0, 0, 0],
        [0.06, 0.6, -0.04],
        [-0.05, 1.2, 0.05],
        [0.08, 1.7, 0.0],
      ], [0.26, 0.2, 0.15, 0.1], 7, { jitter: 0.04, rng });
      tube(m, "branch_a", mat("bark"), [[0.04, 1.3, 0], [0.5, 1.7, 0.3]], [0.08, 0.04], 5);
      tube(m, "branch_b", mat("bark"), [[-0.02, 1.45, 0.02], [-0.5, 1.9, -0.25]], [0.07, 0.035], 5);
      blob(m, "canopy_a", mat("oakLeaf"), [0.32, 2.2, 0.2], [1.2, 0.8, 1.1], rng, 8, 3, 0.16);
      blob(m, "canopy_b", mat("oakLeaf"), [-0.45, 2.35, -0.2], [1.0, 0.7, 0.9], rng, 7, 3, 0.16);
      blob(m, "canopy_c", mat("oakLeaf"), [0.0, 2.7, 0.0], [0.85, 0.6, 0.8], rng, 7, 2, 0.14);
    },
  });

const shrub = () =>
  sculpt({
    id: "obj_p_shrub",
    name: "Bramble Shrub",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["yew", "bark"],
    build: (m, rng) => {
      tube(m, "stem", mat("bark"), [[0, 0, 0], [0.02, 0.16, 0.01]], [0.05, 0.04], 4);
      blob(m, "leaf_a", mat("yew"), [0.04, 0.4, 0.02], [0.6, 0.46, 0.56], rng, 7, 3, 0.1);
      blob(m, "leaf_b", mat("yew"), [-0.18, 0.32, -0.1], [0.42, 0.34, 0.4], rng, 6, 2, 0.08);
    },
  });

// Tilled cemetery / kitchen plot (the cultivated rows in the reference).
const tilledPlot = () =>
  sculpt({
    id: "obj_p_plot",
    name: "Tilled Plot",
    category: "nature",
    tags: ["tile", "floor", "ground"],
    materialKeys: ["graveEarth", "turf"],
    profile: "none",
    build: (m) => {
      cap(m, "soil", mat("graveEarth"), placeRing(m, slabProfile(1, 1), [0, 0.01, 0]));
      // Low furrow ridges.
      for (let i = 0; i < 4; i += 1) {
        const z = -0.36 + i * 0.24;
        box(m, `furrow_${i}`, mat("turf"), [-0.46, 0.02, z - 0.04], [0.46, 0.1, z + 0.04], "furrow");
      }
    },
  });

// ── The Monolith Gate / Mouthstone ───────────────────────────────────────────
// A polished black slab, older than the Church and renamed by it: broad faces
// smooth, the thin side faces carved with ornate golden hummingbirds. The
// exile threshold — stood at the edge of town, far from the Witness.
const monolith = () =>
  sculpt({
    id: "obj_p_monolith",
    name: "The Mouthstone (Monolith Gate)",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable", "landmark"],
    materialKeys: ["obsidian", "gold", "darkStone", "mossStone"],
    footprint: [
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
    build: (m, rng) => {
      // Stepped stone base.
      box(m, "base", mat("darkStone"), [-1.1, 0, -0.5], [1.1, 0.3, 0.5], "base");
      box(m, "base2", mat("mossStone"), [-0.95, 0.3, -0.42], [0.95, 0.5, 0.42], "base");
      // The slab: tall, slightly tapered, broad faces toward ±Z.
      const hw0 = 0.8;
      const hw1 = 0.66;
      const hd = 0.26;
      const y0 = 0.5;
      const y1 = 4.4;
      // broad faces (+Z / -Z)
      quad(m, "broad_zp", mat("obsidian"), [-hw0, y0, hd], [hw0, y0, hd], [hw1, y1, hd], [-hw1, y1, hd], "slab");
      quad(m, "broad_zn", mat("obsidian"), [hw0, y0, -hd], [-hw0, y0, -hd], [-hw1, y1, -hd], [hw1, y1, -hd], "slab");
      // thin side faces (±X)
      quad(m, "thin_xp", mat("obsidian"), [hw0, y0, -hd], [hw0, y0, hd], [hw1, y1, hd], [hw1, y1, -hd], "slab");
      quad(m, "thin_xn", mat("obsidian"), [-hw0, y0, hd], [-hw0, y0, -hd], [-hw1, y1, -hd], [-hw1, y1, hd], "slab");
      // rounded top
      quad(m, "top", mat("obsidian"), [-hw1, y1, -hd], [hw1, y1, -hd], [hw1, y1, hd], [-hw1, y1, hd], "slab");
      // Golden hummingbird engravings down each thin face (y-z plane).
      const hummingbird = (xFace: number, yc: number) => {
        const xf = xFace + Math.sign(xFace) * 0.01;
        // body
        quad(m, `hb_body_${xFace}_${yc}`, mat("gold"), [xf, yc - 0.05, -0.04], [xf, yc - 0.05, 0.06], [xf, yc + 0.05, 0.05], [xf, yc + 0.05, -0.03], "engrave");
        // upper + lower wing
        tri(m, `hb_wU_${xFace}_${yc}`, mat("gold"), [xf, yc + 0.02, 0.02], [xf, yc + 0.16, 0.12], [xf, yc + 0.04, 0.13], "engrave");
        tri(m, `hb_wL_${xFace}_${yc}`, mat("gold"), [xf, yc - 0.02, 0.02], [xf, yc - 0.16, 0.1], [xf, yc - 0.04, 0.13], "engrave");
        // long beak
        tri(m, `hb_beak_${xFace}_${yc}`, mat("gold"), [xf, yc + 0.04, -0.03], [xf, yc - 0.02, -0.03], [xf, yc + 0.02, -0.22], "engrave");
        void rng;
      };
      for (const xf of [hw0 - 0.04, -(hw0 - 0.04)]) {
        hummingbird(xf, 1.4);
        hummingbird(xf, 2.6);
        hummingbird(xf, 3.7);
      }
    },
  });

// ── Witness cordon kit ────────────────────────────────────────────────────────

// Cordon post with a sagging rope to the next post — Church crime-scene seal.
const cordonPost = () =>
  sculpt({
    id: "obj_p_cordon_post",
    name: "Cordon Post",
    category: "props",
    tags: ["prop", "fence"],
    materialKeys: ["iron", "brass", "waxRed"],
    build: (m) => {
      box(m, "foot", mat("iron"), [-0.1, 0, -0.1], [0.1, 0.12, 0.1], "foot");
      tube(m, "post", mat("iron"), [[0, 0.12, 0], [0, 1.0, 0]], [0.04, 0.035], 6);
      box(m, "knob", mat("brass"), [-0.06, 1.0, -0.06], [0.06, 1.12, 0.06], "knob");
      // Rope swag toward +X.
      strip(
        m,
        "rope",
        mat("waxRed"),
        [
          [0.04, 0.95, 0],
          [0.5, 0.78, 0],
          [1.0, 0.95, 0],
        ],
        [
          [0.04, 0.9, 0.03],
          [0.5, 0.73, 0.03],
          [1.0, 0.9, 0.03],
        ],
      );
    },
  });

// Cluster of prayer candles on a stone shelf.
const prayerCandles = () =>
  sculpt({
    id: "obj_p_candles",
    name: "Prayer Candles",
    category: "props",
    tags: ["prop", "light", "shrine"],
    materialKeys: ["darkStone", "waxRed", "candle", "brass"],
    profile: "none",
    build: (m, rng) => {
      box(m, "shelf", mat("darkStone"), [-0.4, 0, -0.2], [0.4, 0.16, 0.2], "shelf");
      const candle = (x: number, z: number, h: number) => {
        lathe(m, `wax_${x}_${z}`, mat("waxRed"), [[0.05, 0.16], [0.05, 0.16 + h]], 6, {
          center: [x, 0, z],
          capTop: true,
        });
        lathe(m, `flame_${x}_${z}`, mat("candle"), [[0.03, 0.16 + h], [0.015, 0.16 + h + 0.08], [0.005, 0.16 + h + 0.14]], 5, {
          center: [x, 0, z],
          capBottom: false,
        });
      };
      candle(-0.26, 0.02, 0.28 + rng() * 0.1);
      candle(-0.05, -0.06, 0.4 + rng() * 0.1);
      candle(0.12, 0.05, 0.24 + rng() * 0.1);
      candle(0.28, -0.04, 0.34 + rng() * 0.1);
      box(m, "tray", mat("brass"), [-0.4, 0.14, -0.2], [0.4, 0.18, 0.2], "tray");
    },
  });

// Church warning placard on a stake, red wax seal.
const placard = () =>
  sculpt({
    id: "obj_p_placard",
    name: "Church Warning Placard",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["darkOak", "parchment", "waxRed", "iron"],
    profile: "none",
    build: (m) => {
      box(m, "stake", mat("darkOak"), [-0.05, 0, -0.05], [0.05, 1.1, 0.05], "stake");
      box(m, "board", mat("darkOak"), [-0.32, 0.7, -0.04], [0.32, 1.18, 0.04], "board");
      box(m, "notice", mat("parchment"), [-0.26, 0.78, 0.04], [0.26, 1.12, 0.05], "notice");
      box(m, "seal", mat("waxRed"), [0.0, 0.82, 0.05], [0.1, 0.92, 0.07], "seal");
      box(m, "nail_a", mat("iron"), [-0.24, 1.08, 0.05], [-0.18, 1.12, 0.06], "nail");
      box(m, "nail_b", mat("iron"), [0.18, 1.08, 0.05], [0.24, 1.12, 0.06], "nail");
    },
  });

// ── Tier transitions ────────────────────────────────────────────────────────

// Stone stair flight rising +Z from ground (0) to a half-tier (0.5). Placed on
// the lower cell of a tier gap; cosmetic (movement already allows the step).
const stairs = () =>
  sculpt({
    id: "obj_p_stairs",
    name: "Stone Stair",
    category: "structure",
    tags: ["prop"],
    materialKeys: ["fieldstone", "darkStone"],
    profile: "none",
    build: (m) => {
      const steps = 4;
      for (let i = 0; i < steps; i += 1) {
        const z0 = -0.5 + (i / steps);
        const y = (i / steps) * 0.5;
        box(m, `step_${i}`, i % 2 ? mat("darkStone") : mat("fieldstone"), [-0.5, 0, z0], [0.5, y + 0.5 / steps, z0 + 1 / steps], `step_${i}`);
      }
    },
  });

// Free-standing pointed marble arch — processional / cloister gateway.
const marbleArch = () =>
  sculpt({
    id: "obj_p_arch",
    name: "Marble Arch",
    category: "architecture",
    tags: ["prop", "architecture"],
    materialKeys: ["ashlar", "darkStone"],
    build: (m) => {
      const pier = (x: number) => {
        box(m, `pier_${x}`, mat("ashlar"), [x - 0.16, 0, -0.16], [x + 0.16, 2.0, 0.16], "pier");
        box(m, `cap_${x}`, mat("darkStone"), [x - 0.2, 2.0, -0.2], [x + 0.2, 2.16, 0.2], "cap");
      };
      pier(-0.6);
      pier(0.6);
      // Pointed arch of voussoir boxes.
      const seg = 7;
      for (let i = 0; i <= seg; i += 1) {
        const t = i / seg;
        const ang = Math.PI * (0.1 + t * 0.8);
        const x = Math.cos(ang) * 0.78;
        const y = 2.16 + Math.sin(ang) * 0.7;
        box(m, `vous_${i}`, i % 2 ? mat("ashlar") : mat("darkStone"), [x - 0.12, y - 0.12, -0.16], [x + 0.12, y + 0.12, 0.16], "arch");
      }
      // Keystone peak.
      box(m, "key", mat("darkStone"), [-0.1, 2.82, -0.18], [0.1, 3.04, 0.18], "key");
    },
  });

// Small spire pinnacle — a roof ornament (placed on roof cells at height).
const spire = () =>
  sculpt({
    id: "obj_p_spire",
    name: "Spire Pinnacle",
    category: "architecture",
    tags: ["prop", "roof"],
    materialKeys: ["darkStone", "slate", "gold"],
    build: (m) => {
      box(m, "base", mat("darkStone"), [-0.16, 0, -0.16], [0.16, 0.4, 0.16], "base");
      const apex = addV(m, [0, 1.8, 0]);
      const ring: Ring = [
        addV(m, [-0.16, 0.4, -0.16]),
        addV(m, [0.16, 0.4, -0.16]),
        addV(m, [0.16, 0.4, 0.16]),
        addV(m, [-0.16, 0.4, 0.16]),
      ];
      for (let i = 0; i < 4; i += 1) addFace(m, `spire_${i}`, [ring[i], ring[(i + 1) % 4], apex], mat("slate"), "spire");
      box(m, "finial", mat("gold"), [-0.03, 1.8, -0.03], [0.03, 2.1, 0.03], "finial");
    },
  });

// ── Market ────────────────────────────────────────────────────────────────────

const marketStall = () =>
  sculpt({
    id: "obj_p_stall",
    name: "Market Stall",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["oak", "darkOak", "canvas", "glassGold", "brass"],
    build: (m, rng) => {
      box(m, "counter", mat("oak"), [-0.5, 0.4, 0.1], [0.5, 0.56, 0.42], "counter");
      box(m, "front", mat("darkOak"), [-0.5, 0, 0.34], [0.5, 0.4, 0.42], "front");
      const post = (x: number) => box(m, `post_${x}`, mat("darkOak"), [x - 0.04, 0, -0.34], [x + 0.04, 1.7, -0.26], "post");
      post(-0.45);
      post(0.45);
      // Striped awning sloping forward.
      quad(m, "awning", mat("canvas"), [-0.56, 1.7, -0.34], [0.56, 1.7, -0.34], [0.56, 1.34, 0.5], [-0.56, 1.34, 0.5], "awning");
      quad(m, "awning_stripe", mat("glassGold"), [-0.56, 1.36, 0.46], [0.56, 1.36, 0.46], [0.56, 1.3, 0.52], [-0.56, 1.3, 0.52], "awning");
      // Wares: a couple of glass jars + a brass scale.
      lathe(m, "jar_a", mat("glassGold"), [[0.06, 0.56], [0.09, 0.66], [0.05, 0.74]], 7, { center: [-0.24, 0, 0.22], capTop: true });
      lathe(m, "jar_b", mat("glassGold"), [[0.07, 0.56], [0.08, 0.64], [0.04, 0.72]], 7, { center: [0.2, 0, 0.26], capTop: true });
      box(m, "scale", mat("brass"), [0.02, 0.56, 0.16], [0.14, 0.64, 0.28], "scale");
      void rng;
    },
  });

// ── Industrial glassworks ─────────────────────────────────────────────────────

const smokestack = () =>
  sculpt({
    id: "obj_p_smokestack",
    name: "Glassworks Smokestack",
    category: "setpiece",
    tags: ["prop", "structure", "landmark"],
    materialKeys: ["fieldstone", "darkStone", "iron", "mossStone"],
    build: (m, rng) => {
      lathe(m, "stack", mat("fieldstone"), [
        [0.55, 0],
        [0.42, 1.5],
        [0.34, 3.2],
        [0.3, 4.6],
        [0.32, 4.9],
      ], 10, { jitter: 0.01, rng, capBottom: true, capTop: false });
      lathe(m, "crown", mat("darkStone"), [[0.34, 4.9], [0.36, 5.05]], 10, { capBottom: false, capTop: false });
      // Iron bands.
      for (const y of [1.2, 2.6, 3.8]) lathe(m, `band_${y}`, mat("iron"), [[0.38, y], [0.38, y + 0.1]], 10, { capBottom: false, capTop: false });
      // Smoke puffs.
      blob(m, "smoke_a", mat("mossStone"), [0.1, 5.4, 0.05], [0.6, 0.5, 0.55], rng, 6, 2, 0.1);
      blob(m, "smoke_b", mat("mossStone"), [-0.2, 6.0, -0.1], [0.8, 0.6, 0.7], rng, 6, 2, 0.12);
    },
  });

const furnace = () =>
  sculpt({
    id: "obj_p_furnace",
    name: "Glass Furnace",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["fieldstone", "darkStone", "iron", "ember", "brass"],
    build: (m) => {
      box(m, "body", mat("fieldstone"), [-0.5, 0, -0.4], [0.5, 1.1, 0.4], "body");
      box(m, "cap", mat("darkStone"), [-0.54, 1.1, -0.44], [0.54, 1.3, 0.44], "cap");
      // Glowing arched mouth on +Z.
      box(m, "mouth", mat("ember"), [-0.22, 0.16, 0.38], [0.22, 0.6, 0.44], "mouth");
      box(m, "lintel", mat("iron"), [-0.28, 0.6, 0.38], [0.28, 0.72, 0.46], "iron");
      // Short flue + brass valve.
      tube(m, "flue", mat("iron"), [[0.3, 1.3, 0], [0.3, 1.9, 0]], [0.1, 0.09], 6);
      box(m, "valve", mat("brass"), [0.22, 1.5, -0.1], [0.38, 1.62, 0.1], "valve");
    },
  });

const pipeRun = () =>
  sculpt({
    id: "obj_p_pipes",
    name: "Pipe Run & Gauge",
    category: "props",
    tags: ["prop"],
    materialKeys: ["brass", "iron", "glassBlue"],
    build: (m) => {
      tube(m, "pipe", mat("brass"), [[-0.5, 0.6, 0.2], [0.1, 0.6, 0.2], [0.1, 1.1, 0.2], [0.5, 1.1, 0.2]], [0.07, 0.07, 0.07, 0.07], 6);
      box(m, "bracket_a", mat("iron"), [-0.42, 0, 0.16], [-0.34, 0.6, 0.24], "bracket");
      box(m, "bracket_b", mat("iron"), [0.42, 0, 0.16], [0.5, 1.1, 0.24], "bracket");
      // Pressure gauge.
      lathe(m, "gauge", mat("glassBlue"), [[0.12, -0.03], [0.14, 0], [0.12, 0.03]], 10, { center: [-0.2, 0.6, 0.28], scaleZ: 0.2, capBottom: false, capTop: false });
      lathe(m, "gauge_rim", mat("brass"), [[0.14, 0], [0.16, 0]], 10, { center: [-0.2, 0.6, 0.26], scaleZ: 0.15 });
      // Valve wheel.
      lathe(m, "wheel", mat("iron"), [[0.12, 0], [0.13, 0]], 8, { center: [0.3, 0.9, 0.28], scaleZ: 0.18, capBottom: false, capTop: false });
    },
  });

const railCart = () =>
  sculpt({
    id: "obj_p_railcart",
    name: "Rail Tipper Cart",
    category: "props",
    tags: ["prop"],
    materialKeys: ["iron", "darkOak", "brass", "starGlass"],
    build: (m) => {
      // Short rails.
      box(m, "rail_l", mat("iron"), [-0.5, 0.02, -0.22], [0.5, 0.08, -0.16], "rail");
      box(m, "rail_r", mat("iron"), [-0.5, 0.02, 0.16], [0.5, 0.08, 0.22], "rail");
      // Tipper body.
      box(m, "body", mat("darkOak"), [-0.3, 0.28, -0.26], [0.3, 0.66, 0.26], "body");
      box(m, "band", mat("iron"), [-0.31, 0.4, -0.27], [0.31, 0.46, 0.27], "band");
      // Glass cullet load.
      blob(m, "load", mat("starGlass"), [0, 0.62, 0], [0.5, 0.2, 0.42], (() => 0.5), 6, 2, 0.06);
      // Wheels.
      const wheel = (x: number, z: number) => lathe(m, `wheel_${x}_${z}`, mat("brass"), [[0.12, -0.02], [0.13, 0], [0.12, 0.02]], 8, { center: [x, 0.14, z], scaleZ: 1, capBottom: false, capTop: false });
      wheel(-0.24, -0.19);
      wheel(0.24, -0.19);
      wheel(-0.24, 0.19);
      wheel(0.24, 0.19);
    },
  });

// ── Clerical interior props ───────────────────────────────────────────────────

const clericalDesk = () =>
  sculpt({
    id: "obj_p_desk",
    name: "Writ Desk",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["darkOak", "oak", "parchment", "waxRed", "candle"],
    build: (m) => {
      box(m, "top", mat("oak"), [-0.5, 0.62, -0.32], [0.5, 0.72, 0.32], "top");
      const leg = (x: number, z: number) => box(m, `leg_${x}_${z}`, mat("darkOak"), [x - 0.04, 0, z - 0.04], [x + 0.04, 0.62, z + 0.04], "leg");
      leg(-0.44, -0.26); leg(0.44, -0.26); leg(-0.44, 0.26); leg(0.44, 0.26);
      box(m, "drawer", mat("darkOak"), [-0.5, 0.42, -0.32], [0.5, 0.62, 0.32], "drawer");
      // Papers + sealed writ + a candle stub.
      box(m, "paper", mat("parchment"), [-0.2, 0.72, -0.1], [0.16, 0.74, 0.18], "paper");
      box(m, "seal", mat("waxRed"), [0.02, 0.74, 0.0], [0.1, 0.77, 0.06], "seal");
      lathe(m, "candle", mat("parchment"), [[0.04, 0.72], [0.04, 0.86]], 6, { center: [0.34, 0, -0.16], capTop: false });
      lathe(m, "flame", mat("candle"), [[0.02, 0.86], [0.005, 0.96]], 5, { center: [0.34, 0, -0.16], capBottom: false });
    },
  });

const documentShelf = () =>
  sculpt({
    id: "obj_p_shelf",
    name: "Archive Shelf",
    category: "props",
    tags: ["prop", "interactable"],
    materialKeys: ["darkOak", "oak", "parchment", "waxRed"],
    build: (m, rng) => {
      box(m, "frame", mat("darkOak"), [-0.5, 0, -0.22], [0.5, 2.0, 0.22], "frame");
      box(m, "hollow", mat("oak"), [-0.42, 0.1, -0.16], [0.42, 1.94, 0.18], "hollow");
      for (const y of [0.5, 1.0, 1.5]) box(m, `shelf_${y}`, mat("darkOak"), [-0.42, y, -0.18], [0.42, y + 0.06, 0.2], "shelf");
      // Rolled documents on each shelf.
      for (const y of [0.12, 0.62, 1.12, 1.62]) {
        for (let i = 0; i < 4; i += 1) {
          const x = -0.3 + i * 0.2 + (rng() - 0.5) * 0.04;
          lathe(m, `roll_${y}_${i}`, mat("parchment"), [[0.05, y], [0.05, y + 0.34]], 5, { center: [x, 0, 0.0], capTop: true });
        }
      }
      box(m, "ledger", mat("waxRed"), [-0.36, 1.56, 0.0], [-0.18, 1.62, 0.16], "ledger");
    },
  });

// ── River & lower town ────────────────────────────────────────────────────────

const riverTile = () => flatTile("obj_p_river", "Iridescent River", "riverWater", ["water"]);
const mudTile = () => flatTile("obj_p_mud", "River Mud", "graveEarth", ["ground"]);

const bridgeDeck = () =>
  sculpt({
    id: "obj_p_bridge",
    name: "Plank Bridge",
    category: "structure",
    tags: ["prop", "bridge"],
    materialKeys: ["darkOak", "oak", "iron"],
    profile: "none",
    build: (m) => {
      box(m, "deck", mat("oak"), [-0.5, 0.18, -0.5], [0.5, 0.26, 0.5], "deck");
      box(m, "beam_l", mat("darkOak"), [-0.5, 0.02, -0.44], [0.5, 0.18, -0.36], "beam");
      box(m, "beam_r", mat("darkOak"), [-0.5, 0.02, 0.36], [0.5, 0.18, 0.44], "beam");
      // Plank lines.
      for (let i = 0; i < 5; i += 1) {
        const z = -0.4 + i * 0.2;
        box(m, `plank_${i}`, mat("darkOak"), [-0.5, 0.26, z - 0.012], [0.5, 0.27, z + 0.012], "plank");
      }
      // Rope rails.
      box(m, "rail_l", mat("iron"), [-0.5, 0.26, -0.5], [0.5, 0.5, -0.46], "rail");
      box(m, "rail_r", mat("iron"), [-0.5, 0.26, 0.46], [0.5, 0.5, 0.5], "rail");
    },
  });

const dock = () =>
  sculpt({
    id: "obj_p_dock",
    name: "River Dock",
    category: "structure",
    tags: ["prop"],
    materialKeys: ["darkOak", "oak"],
    profile: "none",
    build: (m) => {
      box(m, "deck", mat("oak"), [-0.5, 0.16, -0.4], [0.5, 0.24, 0.4], "deck");
      const pile = (x: number, z: number) => tube(m, `pile_${x}_${z}`, mat("darkOak"), [[x, -0.3, z], [x, 0.16, z]], [0.06, 0.06], 5);
      pile(-0.4, -0.34); pile(0.4, -0.34); pile(-0.4, 0.34); pile(0.4, 0.34);
      for (let i = 0; i < 4; i += 1) box(m, `plank_${i}`, mat("darkOak"), [-0.5, 0.24, -0.4 + i * 0.22], [0.5, 0.25, -0.34 + i * 0.22], "plank");
    },
  });

const reeds = () =>
  sculpt({
    id: "obj_p_reeds",
    name: "River Reeds",
    category: "nature",
    tags: ["prop", "nature"],
    materialKeys: ["reed", "bark"],
    profile: "none",
    build: (m, rng) => {
      for (let i = 0; i < 9; i += 1) {
        const a = (i / 9) * Math.PI * 2 + rng();
        const x = Math.cos(a) * (0.1 + rng() * 0.28);
        const z = Math.sin(a) * (0.1 + rng() * 0.28);
        const h = 0.5 + rng() * 0.5;
        const lean = (rng() - 0.5) * 0.18;
        tube(m, `reed_${i}`, mat("reed"), [[x, 0, z], [x + lean, h * 0.6, z], [x + lean * 1.6, h, z]], [0.02, 0.015, 0.006], 4);
      }
    },
  });

const votiveToken = () =>
  sculpt({
    id: "obj_p_votive_token",
    name: "Votive Offering",
    category: "props",
    tags: ["prop", "interactable", "shrine"],
    materialKeys: ["brass", "starGlass", "waxRed", "mossStone"],
    profile: "none",
    build: (m, rng) => {
      box(m, "stone", mat("mossStone"), [-0.18, 0, -0.14], [0.18, 0.1, 0.14], "stone");
      lathe(m, "bowl", mat("brass"), [[0.12, 0.1], [0.14, 0.16], [0.1, 0.18]], 8, { capBottom: true, capTop: false });
      // A few glass shards + a candle stub as offerings.
      blob(m, "shards", mat("starGlass"), [0, 0.2, 0], [0.16, 0.08, 0.14], rng, 5, 2, 0.04);
      lathe(m, "stub", mat("waxRed"), [[0.03, 0.18], [0.03, 0.28]], 5, { center: [0.1, 0, 0.06], capTop: true });
    },
  });

// ── Pagan under-place props ─────────────────────────────────────────────────

const trapdoor = () =>
  sculpt({
    id: "obj_p_trapdoor",
    name: "Cellar Trapdoor",
    category: "props",
    tags: ["prop", "interactable", "door"],
    materialKeys: ["darkOak", "oak", "iron"],
    profile: "none",
    build: (m) => {
      box(m, "frame", mat("darkOak"), [-0.46, 0.02, -0.46], [0.46, 0.08, 0.46], "frame");
      box(m, "leaf", mat("oak"), [-0.4, 0.08, -0.4], [0.4, 0.14, 0.4], "leaf");
      for (let i = 0; i < 3; i += 1) box(m, `plank_${i}`, mat("darkOak"), [-0.4, 0.14, -0.4 + i * 0.28], [0.4, 0.15, -0.28 + i * 0.28], "plank");
      box(m, "ring", mat("iron"), [0.18, 0.14, -0.06], [0.32, 0.18, 0.06], "ring");
      box(m, "hinge", mat("iron"), [-0.4, 0.14, -0.06], [-0.24, 0.17, 0.06], "hinge");
    },
  });

const shrineStone = () =>
  sculpt({
    id: "obj_p_shrine_stone",
    name: "Family Shrine Stone",
    category: "props",
    tags: ["prop", "interactable", "shrine"],
    materialKeys: ["mossStone", "darkStone", "waxRed", "starGlass", "brass"],
    build: (m, rng) => {
      // A small rough standing stone with a niche.
      box(m, "stone", mat("mossStone"), [-0.26, 0, -0.16], [0.26, 0.9, 0.16], "stone");
      box(m, "niche", mat("darkStone"), [-0.14, 0.4, 0.1], [0.14, 0.74, 0.18], "niche");
      // Offering bowl + glass shard + candle.
      lathe(m, "bowl", mat("brass"), [[0.1, 0], [0.12, 0.06], [0.08, 0.08]], 8, { center: [0, 0, 0.32], capBottom: true, capTop: false });
      blob(m, "shard", mat("starGlass"), [0.02, 0.12, 0.32], [0.1, 0.12, 0.08], rng, 5, 2, 0.03);
      lathe(m, "candle", mat("waxRed"), [[0.03, 0.0], [0.03, 0.16]], 5, { center: [-0.16, 0, 0.3], capTop: true });
    },
  });

// A young-adult figure turned to Glass, frozen mid-reach toward the Witness —
// the crime-scene at the heart of the cordon. Translucent iridescent star-glass.
const glassFigure = () =>
  sculpt({
    id: "obj_p_glass_figure",
    name: "Glass Figure",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable"],
    materialKeys: ["starGlass", "glassBlue"],
    build: (m, rng) => {
      const g = mat("starGlass");
      // Legs.
      tube(m, "leg_l", g, [[-0.1, 0, 0], [-0.12, 0.42, 0.02], [-0.1, 0.82, 0]], [0.08, 0.07, 0.06], 5, { jitter: 0.01, rng });
      tube(m, "leg_r", g, [[0.1, 0, 0.03], [0.12, 0.42, 0.05], [0.1, 0.82, 0.04]], [0.08, 0.07, 0.06], 5, { jitter: 0.01, rng });
      // Torso, leaning slightly toward the reach.
      lathe(m, "torso", g, [[0.16, 0.82], [0.2, 1.04], [0.17, 1.28], [0.12, 1.44]], 7, { center: [0.04, 0, 0.06], jitter: 0.01, rng, capBottom: false });
      // Head, tipped up.
      blob(m, "head", mat("glassBlue"), [0.06, 1.56, 0.08], [0.26, 0.3, 0.26], rng, 6, 2, 0.04);
      // Reaching arm (toward +Z, where the statue stands), and a lowered arm.
      tube(m, "arm_reach", g, [[0.12, 1.34, 0.06], [0.26, 1.46, 0.3], [0.34, 1.5, 0.52]], [0.06, 0.05, 0.04], 5, { jitter: 0.01, rng });
      tube(m, "arm_low", g, [[-0.14, 1.32, 0.04], [-0.2, 1.0, 0.06], [-0.18, 0.74, 0.04]], [0.06, 0.05, 0.04], 5, { jitter: 0.01, rng });
    },
  });

// ── Library export ──────────────────────────────────────────────────────────

export const createParishKit = (): ObjectData[] => [
  // ground & floors
  groundRoad(),
  groundCobble(),
  groundTurf(),
  groundGraveEarth(),
  groundFlagstone(),
  floorBoards(),
  tilledPlot(),
  // walls & fences
  wallFieldstone(),
  wallTimber(),
  wallChurch(),
  wallLow(),
  ironFence(),
  cellBars(),
  doorway(),
  // roofs
  roofSlopeS(),
  roofSlopeN(),
  roofSlopeE(),
  roofSlopeW(),
  roofHipNW(),
  roofHipNE(),
  roofHipSE(),
  roofHipSW(),
  roofClaySlopeS(),
  roofClaySlopeN(),
  roofClaySlopeE(),
  roofClaySlopeW(),
  roofClayHipNW(),
  roofClayHipNE(),
  roofClayHipSE(),
  roofClayHipSW(),
  roofClayFlat(),
  roofFlat(),
  roofTentX(),
  roofTentZ(),
  chimney(),
  // landmarks
  churchFront(),
  bellTower(),
  rotunda(),
  lychGate(),
  marketCross(),
  gibbet(),
  // graveyard
  headstone(),
  chestTomb(),
  graveCross(),
  // props
  well(),
  lanternPost(),
  stocks(),
  noticeBoard(),
  innSign(),
  handcart(),
  barrel(),
  crate(),
  // nature
  yewTree(),
  autumnOak(),
  shrub(),
  reeds(),
  // landmarks & setpieces
  monolith(),
  cordonPost(),
  prayerCandles(),
  placard(),
  marbleArch(),
  spire(),
  stairs(),
  // market
  marketStall(),
  // industrial glassworks
  smokestack(),
  furnace(),
  pipeRun(),
  railCart(),
  // clerical interiors
  clericalDesk(),
  documentShelf(),
  // river & lower town
  riverTile(),
  mudTile(),
  bridgeDeck(),
  dock(),
  votiveToken(),
  // pagan under-places
  trapdoor(),
  shrineStone(),
  // crime scene
  glassFigure(),
];

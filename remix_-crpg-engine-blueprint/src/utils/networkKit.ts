// The Network Kit — hand-sculpted object library for the Subterranean Pagan
// Network beneath the town.
//
// Same discipline as the Witness Kit: every model is a true mesh built from
// lofted profile rings, lathed silhouettes, swept tubes, and quad strips.
// The look down here inverts the town: where the surface is sun-bleached
// marble under black stars, the Network is older than the Church — damp
// violet catacomb stone, black ritual soil, generations of family shrines,
// ossuary courses of bone, roots that carry signal, and the Grid's cold
// glass pressing in through the seams. Greek sacred-underworld forms:
// omphalos stones, kraters, stelae, aediculae — profaned by an alien sky.

import type {
  ObjectData,
  ObjectMaterialData,
  ObjectMeshData,
} from "../schema/game";
import { getMeshBounds, recomputeMeshNormals } from "./meshModel";
import {
  mulberry32,
  newMesh,
  addV,
  addFace,
  placeRing,
  loft,
  cap,
  circleProfile,
  slabProfile,
  lathe,
  tube,
  strip,
  blob,
  type V3,
  type P2,
  type Ring,
} from "./witnessKit";

// ── Palette ─────────────────────────────────────────────────────────────────

export const NETWORK_MATERIALS = {
  catacomb: {
    id: "nmat_catacomb_stone",
    name: "Catacomb Stone",
    color: "#6B647E",
    emissive: "#0A0712",
    emissive_intensity: 0.08,
    opacity: 1,
    transparent: false,
    roughness: 0.78,
    metalness: 0.02,
    texture_kind: "stone_grain",
    texture_scale: 1.7,
    texture_strength: 0.58,
  },
  deepStone: {
    id: "nmat_deep_stone",
    name: "Deep Stone",
    color: "#494258",
    emissive: "#06040C",
    emissive_intensity: 0.06,
    opacity: 1,
    transparent: false,
    roughness: 0.84,
    metalness: 0.02,
    texture_kind: "stone_grain",
    texture_scale: 1.5,
    texture_strength: 0.62,
  },
  buriedMarble: {
    id: "nmat_buried_marble",
    name: "Buried Marble",
    color: "#B5AFA4",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.58,
    metalness: 0.02,
    texture_kind: "marble_veins",
    texture_scale: 1.4,
    texture_strength: 0.46,
  },
  blackSoil: {
    id: "nmat_black_soil",
    name: "Black Ritual Soil",
    color: "#2E2333",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.96,
    metalness: 0,
    texture_kind: "soil_grit",
    texture_scale: 1.9,
    texture_strength: 0.72,
  },
  rootPale: {
    id: "nmat_root_pale",
    name: "Signal Root",
    color: "#C0AE94",
    emissive: "#221A0E",
    emissive_intensity: 0.1,
    opacity: 1,
    transparent: false,
    roughness: 0.88,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 2.0,
    texture_strength: 0.66,
  },
  bone: {
    id: "nmat_ossuary_bone",
    name: "Ossuary Bone",
    color: "#D8D0BE",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.7,
    metalness: 0,
    texture_kind: "bone_pores",
    texture_scale: 1.3,
    texture_strength: 0.52,
  },
  wax: {
    id: "nmat_votive_wax",
    name: "Votive Wax",
    color: "#E9DFC3",
    emissive: "#2A2110",
    emissive_intensity: 0.1,
    opacity: 1,
    transparent: false,
    roughness: 0.6,
    metalness: 0,
    texture_kind: "paper_fiber",
    texture_scale: 1.4,
    texture_strength: 0.34,
  },
  flame: {
    id: "nmat_under_flame",
    name: "Under-Flame",
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
    id: "nmat_under_flame_core",
    name: "Under-Flame Core",
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
  verdigris: {
    id: "nmat_verdigris_bronze",
    name: "Verdigris Bronze",
    color: "#5E8272",
    emissive: "#0A1410",
    emissive_intensity: 0.1,
    opacity: 1,
    transparent: false,
    roughness: 0.52,
    metalness: 0.45,
    texture_kind: "metal_scratches",
    texture_scale: 1.4,
    texture_strength: 0.5,
  },
  ritualMosaic: {
    id: "nmat_ritual_mosaic",
    name: "Rite-Floor Mosaic",
    color: "#322B4E",
    emissive: "#473A8E",
    emissive_intensity: 0.26,
    opacity: 1,
    transparent: false,
    roughness: 0.5,
    metalness: 0.04,
    texture_kind: "glass_facets",
    texture_scale: 2.3,
    texture_strength: 0.52,
  },
  gridGlass: {
    id: "nmat_grid_glass",
    name: "Grid Glass",
    color: "#9FE8EF",
    emissive: "#6FD2DE",
    emissive_intensity: 1.1,
    opacity: 0.58,
    transparent: true,
    roughness: 0.14,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.3,
    texture_strength: 0.62,
  },
  starViolet: {
    id: "nmat_star_violet",
    name: "Black-Star Violet",
    color: "#8D5CFF",
    emissive: "#7A3DF5",
    emissive_intensity: 1.5,
    opacity: 0.8,
    transparent: true,
    roughness: 0.2,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.2,
    texture_strength: 0.5,
  },
  oldBlood: {
    id: "nmat_rite_blood",
    name: "Rite Blood",
    color: "#6E1320",
    emissive: "#3A0410",
    emissive_intensity: 0.3,
    opacity: 1,
    transparent: false,
    roughness: 0.52,
    metalness: 0,
    texture_kind: "blood_sheen",
    texture_scale: 1.2,
    texture_strength: 0.6,
  },
  stillWater: {
    id: "nmat_still_water",
    name: "Cistern Water",
    color: "#13202E",
    emissive: "#1F4150",
    emissive_intensity: 0.3,
    opacity: 0.8,
    transparent: true,
    roughness: 0.12,
    metalness: 0,
    texture_kind: "water_shimmer",
    texture_scale: 1.4,
    texture_strength: 0.55,
  },
  votiveClay: {
    id: "nmat_votive_clay",
    name: "Votive Clay",
    color: "#9C5F45",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.8,
    metalness: 0,
    texture_kind: "stone_grain",
    texture_scale: 1.3,
    texture_strength: 0.36,
  },
} satisfies Record<string, ObjectMaterialData>;

type NMatKey = keyof typeof NETWORK_MATERIALS;
const nmat = (key: NMatKey) => NETWORK_MATERIALS[key].id;

// ── Object wrapper (Network palette) ────────────────────────────────────────

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
  materialKeys: NMatKey[];
  footprint?: [number, number][];
  profile?: ObjectData["collision"]["profile"];
  build: (m: ObjectMeshData, rng: () => number) => void;
}): ObjectData => {
  const m = newMesh();
  let seed = 0;
  for (let i = 0; i < id.length; i += 1) seed = (seed * 31 + id.charCodeAt(i)) | 0;
  build(m, mulberry32(seed));
  const mesh = recomputeMeshNormals(m);
  mesh.material_slots = materialKeys.map(nmat);
  mesh.groups = Array.from(new Set(mesh.faces.map((f) => f.group || "default")));

  return {
    id,
    display_name: name,
    category,
    tags,
    origin: "center_floor",
    bounds: getMeshBounds(mesh),
    materials: materialKeys.map(nmat),
    material_settings: materialKeys.map((key) => NETWORK_MATERIALS[key]),
    model_kind: "mesh",
    parts: [],
    mesh,
    decals: [],
    reference_images: [],
    collision: { profile, footprint },
  };
};

const flatTile = (
  id: string,
  name: string,
  materialKey: NMatKey,
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
      cap(m, "surface", nmat(materialKey), ring);
    },
  });

// ── Floors & water ──────────────────────────────────────────────────────────

const floorCatacomb = () =>
  flatTile("obj_net_floor_catacomb", "Catacomb Flags", "catacomb", ["floor"]);
const floorSoil = () =>
  flatTile("obj_net_floor_soil", "Black Ritual Soil", "blackSoil", ["floor"]);
const floorRitual = () =>
  flatTile("obj_net_floor_ritual", "Rite-Floor Mosaic", "ritualMosaic", ["floor"]);
const waterStill = () =>
  flatTile("obj_net_water", "Cistern Water", "stillWater", ["water"], true);

// ── Walls ───────────────────────────────────────────────────────────────────

// Catacomb wall: three rough courses of violet stone, each more sunken and
// crooked than the last, with a pale signal-root erupting through a joint
// and running up the face.
const wallCatacomb = () =>
  sculpt({
    id: "obj_net_wall_catacomb",
    name: "Catacomb Wall",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["catacomb", "deepStone", "rootPale"],
    build: (m, rng) => {
      const course = (
        name: string,
        y0: number,
        y1: number,
        inset: number,
        material: string,
      ) => {
        const lower = placeRing(
          m,
          slabProfile(1 - inset, 1 - inset, 0.06),
          [(rng() - 0.5) * 0.03, y0, (rng() - 0.5) * 0.03],
          1,
          1,
          (rng() - 0.5) * 0.05,
        );
        const upper = placeRing(
          m,
          slabProfile(1 - inset - 0.03, 1 - inset - 0.03, 0.06),
          [(rng() - 0.5) * 0.03, y1, (rng() - 0.5) * 0.03],
          1,
          1,
          (rng() - 0.5) * 0.05,
        );
        loft(m, name, material, [lower, upper]);
        cap(m, `${name}_top`, material, upper);
      };

      const footing = placeRing(m, slabProfile(1.08, 1.08, 0.07), [0, 0, 0]);
      const footingTop = placeRing(m, slabProfile(1.02, 1.02, 0.06), [0, 0.2, 0]);
      loft(m, "footing", nmat("deepStone"), [footing, footingTop]);
      cap(m, "footing_top", nmat("deepStone"), footingTop);

      course("course_a", 0.2, 0.92, 0.02, nmat("catacomb"));
      course("course_b", 0.94, 1.58, 0.05, nmat("deepStone"));
      course("course_c", 1.6, 2.18, 0.03, nmat("catacomb"));

      // The root: bursts from the lower joint, climbs the face, splits.
      tube(
        m,
        "wall_root",
        nmat("rootPale"),
        [
          [0.34, 0.18, 0.52],
          [0.22, 0.66, 0.55],
          [0.3, 1.12, 0.53],
          [0.12, 1.62, 0.56],
          [0.18, 2.08, 0.5],
        ],
        [0.085, 0.07, 0.055, 0.04, 0.02],
        6,
        { jitter: 0.012, rng },
      );
      tube(
        m,
        "wall_root_branch",
        nmat("rootPale"),
        [
          [0.28, 1.0, 0.54],
          [-0.08, 1.3, 0.56],
          [-0.3, 1.5, 0.52],
        ],
        [0.04, 0.028, 0.015],
        5,
        { jitter: 0.01, rng },
      );
    },
  });

// Ossuary wall: a readable one-tile catacomb block. The stone shell keeps the
// map footprint stable, while the front/back reliefs make the "course" legible:
// femurs stacked as masonry with skull niches between them.
const wallOssuary = () =>
  sculpt({
    id: "obj_net_wall_ossuary",
    name: "Ossuary Course",
    category: "structure",
    tags: ["tile", "wall"],
    materialKeys: ["deepStone", "catacomb", "blackSoil", "bone"],
    build: (m, rng) => {
      const box = (name: string, center: V3, size: V3, material: string, group = name) => {
        const [cx, cy, cz] = center;
        const [sx, sy, sz] = size;
        const x0 = cx - sx / 2;
        const x1 = cx + sx / 2;
        const y0 = cy - sy / 2;
        const y1 = cy + sy / 2;
        const z0 = cz - sz / 2;
        const z1 = cz + sz / 2;
        const v = [
          addV(m, [x0, y0, z0]),
          addV(m, [x1, y0, z0]),
          addV(m, [x1, y1, z0]),
          addV(m, [x0, y1, z0]),
          addV(m, [x0, y0, z1]),
          addV(m, [x1, y0, z1]),
          addV(m, [x1, y1, z1]),
          addV(m, [x0, y1, z1]),
        ];
        addFace(m, `${name}_back`, [v[0], v[3], v[2], v[1]], material, group);
        addFace(m, `${name}_front`, [v[4], v[5], v[6], v[7]], material, group);
        addFace(m, `${name}_left`, [v[0], v[4], v[7], v[3]], material, group);
        addFace(m, `${name}_right`, [v[1], v[2], v[6], v[5]], material, group);
        addFace(m, `${name}_top`, [v[3], v[7], v[6], v[2]], material, group);
        addFace(m, `${name}_bottom`, [v[0], v[1], v[5], v[4]], material, group);
      };

      const panelZ = (
        name: string,
        zSign: -1 | 1,
        centerX: number,
        centerY: number,
        width: number,
        height: number,
        material: string,
        group = name,
      ) => {
        const z = zSign * 0.563;
        const x0 = centerX - width / 2;
        const x1 = centerX + width / 2;
        const y0 = centerY - height / 2;
        const y1 = centerY + height / 2;
        const v = [
          addV(m, [x0, y0, z]),
          addV(m, [x1, y0, z]),
          addV(m, [x1, y1, z]),
          addV(m, [x0, y1, z]),
        ];
        addFace(m, name, zSign > 0 ? v : [...v].reverse(), material, group);
      };

      const panelX = (
        name: string,
        xSign: -1 | 1,
        centerZ: number,
        centerY: number,
        depth: number,
        height: number,
        material: string,
        group = name,
      ) => {
        const x = xSign * 0.563;
        const z0 = centerZ - depth / 2;
        const z1 = centerZ + depth / 2;
        const y0 = centerY - height / 2;
        const y1 = centerY + height / 2;
        const v = [
          addV(m, [x, y0, z0]),
          addV(m, [x, y0, z1]),
          addV(m, [x, y1, z1]),
          addV(m, [x, y1, z0]),
        ];
        addFace(m, name, xSign > 0 ? v : [...v].reverse(), material, group);
      };

      // Solid silhouette and collision-friendly bounds: one tile wide, wall tall.
      const plinthBase = placeRing(m, slabProfile(1.08, 1.08, 0.06), [0, 0, 0]);
      const plinthTop = placeRing(m, slabProfile(1.02, 1.02, 0.05), [0, 0.2, 0]);
      loft(m, "ossuary_plinth", nmat("deepStone"), [plinthBase, plinthTop]);
      cap(m, "ossuary_plinth_top", nmat("deepStone"), plinthTop);

      const coreLow = placeRing(m, slabProfile(0.94, 0.94, 0.05), [0, 0.2, 0]);
      const coreHigh = placeRing(m, slabProfile(0.9, 0.9, 0.05), [0, 1.92, 0]);
      loft(m, "ossuary_core", nmat("catacomb"), [coreLow, coreHigh]);

      const crownLow = placeRing(m, slabProfile(1.0, 1.0, 0.06), [0, 1.92, 0]);
      const crownFlare = placeRing(m, slabProfile(1.1, 1.1, 0.07), [0, 2.08, 0]);
      const crownTop = placeRing(m, slabProfile(1.02, 1.02, 0.06), [0, 2.2, 0]);
      loft(m, "ossuary_crown", nmat("deepStone"), [crownLow, crownFlare, crownTop]);
      cap(m, "ossuary_crown_top", nmat("deepStone"), crownTop);

      const skullRelief = (prefix: string, x: number, zSign: -1 | 1) => {
        const center: V3 = [x, 1.08, zSign * 0.53];
        blob(m, `${prefix}_skull`, nmat("bone"), center, [0.15, 0.21, 0.08], rng, 5, 2, 0.024);
        panelZ(`${prefix}_eye_l`, zSign, x - 0.036, 1.12, 0.032, 0.034, nmat("blackSoil"), prefix);
        panelZ(`${prefix}_eye_r`, zSign, x + 0.036, 1.12, 0.032, 0.034, nmat("blackSoil"), prefix);
        panelZ(`${prefix}_nose`, zSign, x, 1.055, 0.024, 0.042, nmat("blackSoil"), prefix);
      };

      const femur = (prefix: string, x: number, y: number, zSign: -1 | 1, width: number) => {
        const z = zSign * 0.555;
        box(`${prefix}_shaft`, [x, y, z], [width, 0.052, 0.038], nmat("bone"), prefix);
        box(`${prefix}_knob_l`, [x - width / 2 - 0.032, y, z], [0.07, 0.08, 0.052], nmat("bone"), prefix);
        box(`${prefix}_knob_r`, [x + width / 2 + 0.032, y, z], [0.07, 0.08, 0.052], nmat("bone"), prefix);
      };

      const facade = (prefix: string, zSign: -1 | 1) => {
        const zFrame = zSign * 0.5;
        panelZ(`${prefix}_shadow`, zSign, 0, 1.08, 0.68, 1.46, nmat("blackSoil"), prefix);
        box(`${prefix}_post_l`, [-0.44, 1.08, zFrame], [0.11, 1.72, 0.12], nmat("deepStone"), prefix);
        box(`${prefix}_post_r`, [0.44, 1.08, zFrame], [0.11, 1.72, 0.12], nmat("deepStone"), prefix);
        box(`${prefix}_sill`, [0, 0.34, zFrame], [0.86, 0.11, 0.12], nmat("deepStone"), prefix);
        box(`${prefix}_lintel`, [0, 1.82, zFrame], [0.86, 0.12, 0.12], nmat("deepStone"), prefix);

        femur(`${prefix}_low_a`, -0.02, 0.58 + (rng() - 0.5) * 0.018, zSign, 0.58);
        femur(`${prefix}_low_b`, 0.03, 0.74 + (rng() - 0.5) * 0.018, zSign, 0.54);
        skullRelief(`${prefix}_skull_a`, -0.22, zSign);
        skullRelief(`${prefix}_skull_b`, 0, zSign);
        skullRelief(`${prefix}_skull_c`, 0.22, zSign);
        femur(`${prefix}_high_a`, 0.02, 1.43 + (rng() - 0.5) * 0.018, zSign, 0.58);
        femur(`${prefix}_high_b`, -0.03, 1.6 + (rng() - 0.5) * 0.018, zSign, 0.54);
      };

      const sideRelief = (prefix: string, xSign: -1 | 1) => {
        const xFrame = xSign * 0.5;
        panelX(`${prefix}_shadow`, xSign, 0, 1.08, 0.62, 1.28, nmat("blackSoil"), prefix);
        box(`${prefix}_sill`, [xFrame, 0.36, 0], [0.12, 0.1, 0.74], nmat("deepStone"), prefix);
        box(`${prefix}_lintel`, [xFrame, 1.78, 0], [0.12, 0.11, 0.74], nmat("deepStone"), prefix);
        box(`${prefix}_bone_low`, [xSign * 0.555, 0.68, 0], [0.04, 0.052, 0.54], nmat("bone"), prefix);
        box(`${prefix}_bone_high`, [xSign * 0.555, 1.5, 0], [0.04, 0.052, 0.54], nmat("bone"), prefix);
        blob(m, `${prefix}_skull`, nmat("bone"), [xSign * 0.53, 1.08, 0], [0.08, 0.19, 0.15], rng, 5, 2, 0.02);
        panelX(`${prefix}_eye_l`, xSign, -0.036, 1.12, 0.032, 0.034, nmat("blackSoil"), prefix);
        panelX(`${prefix}_eye_r`, xSign, 0.036, 1.12, 0.032, 0.034, nmat("blackSoil"), prefix);
      };

      facade("front", 1);
      facade("back", -1);
      sideRelief("side_e", 1);
      sideRelief("side_w", -1);
    },
  });

// ── Architecture ────────────────────────────────────────────────────────────

// Root-strangled column: the town's Doric order dragged under — a fluted
// shaft leaning slightly, wrapped by a thick signal-root that coils from the
// soil to the capital.
const columnRoot = () =>
  sculpt({
    id: "obj_net_column_root",
    name: "Root-Bound Column",
    category: "architecture",
    tags: ["prop", "architecture", "column"],
    materialKeys: ["buriedMarble", "deepStone", "rootPale"],
    build: (m, rng) => {
      const plinthBase = placeRing(m, slabProfile(0.86, 0.86, 0.07), [0, 0, 0]);
      const plinthTop = placeRing(m, slabProfile(0.72, 0.72, 0.06), [0, 0.16, 0]);
      loft(m, "plinth", nmat("deepStone"), [plinthBase, plinthTop]);
      cap(m, "plinth_top", nmat("deepStone"), plinthTop);

      // Leaning fluted shaft: rings drift off-axis as they climb.
      const segs = 14;
      const lean = 0.085;
      const shaft: Ring[] = [
        [0.29, 0.16],
        [0.265, 0.62],
        [0.245, 1.12],
        [0.225, 1.62],
        [0.21, 2.0],
      ].map(([radius, y]) =>
        placeRing(
          m,
          circleProfile(segs, radius, { flutes: 8, fluteDepth: 0.015 }),
          [(y / 2) * lean, y, (y / 2) * lean * 0.4],
        ),
      );
      loft(m, "shaft", nmat("buriedMarble"), shaft);

      // Squashed echinus and abacus, following the lean.
      lathe(
        m,
        "echinus",
        nmat("buriedMarble"),
        [
          [0.21, 2.0],
          [0.3, 2.08],
          [0.33, 2.16],
        ],
        12,
        { center: [lean, 0, lean * 0.4], capBottom: false, capTop: false },
      );
      const abacusBase = placeRing(
        m,
        slabProfile(0.72, 0.72, 0.05),
        [lean, 2.16, lean * 0.4],
      );
      const abacusTop = placeRing(
        m,
        slabProfile(0.76, 0.76, 0.05),
        [lean, 2.3, lean * 0.4],
      );
      loft(m, "abacus", nmat("deepStone"), [abacusBase, abacusTop]);
      cap(m, "abacus_top", nmat("deepStone"), abacusTop);

      // The strangler: one thick root coiling up the shaft.
      const coil: V3[] = [];
      const coilRadii: number[] = [];
      for (let i = 0; i <= 9; i += 1) {
        const t = i / 9;
        const angle = t * Math.PI * 2.6 + 0.6;
        const r = 0.31 - t * 0.08;
        coil.push([
          Math.cos(angle) * r + t * lean,
          0.05 + t * 2.05,
          Math.sin(angle) * r + t * lean * 0.4,
        ]);
        coilRadii.push(0.095 - t * 0.055);
      }
      tube(m, "strangler_root", nmat("rootPale"), coil, coilRadii, 6, {
        jitter: 0.014,
        rng,
      });

      // Feeder rootlets at the base.
      for (let i = 0; i < 3; i += 1) {
        const angle = rng() * Math.PI * 2;
        tube(
          m,
          `rootlet_${i}`,
          nmat("rootPale"),
          [
            [Math.cos(angle) * 0.42, 0.02, Math.sin(angle) * 0.42],
            [Math.cos(angle) * 0.3, 0.1, Math.sin(angle) * 0.3],
            [Math.cos(angle) * 0.2, 0.04, Math.sin(angle) * 0.2],
          ],
          [0.045, 0.035, 0.02],
          5,
          { jitter: 0.01, rng },
        );
      }
    },
  });

// Sigil threshold: two squared jambs and a heavy lintel over a walkable gap,
// the lintel carved with a violet rite-sigil that still burns. Doors locked
// by sigils are the Network's grammar — this is the door.
const archSigil = () =>
  sculpt({
    id: "obj_net_arch_sigil",
    name: "Sigil Threshold",
    category: "architecture",
    tags: ["prop", "architecture", "door"],
    materialKeys: ["deepStone", "catacomb", "starViolet"],
    profile: "none",
    build: (m, rng) => {
      const jamb = (x: number, group: string) => {
        const base = placeRing(m, slabProfile(0.26, 0.5, 0.04), [x, 0, 0]);
        const waist = placeRing(
          m,
          slabProfile(0.22, 0.44, 0.04),
          [x + (rng() - 0.5) * 0.02, 1.1, 0],
        );
        const top = placeRing(m, slabProfile(0.24, 0.46, 0.04), [x, 1.92, 0]);
        loft(m, group, nmat("deepStone"), [base, waist, top]);
        cap(m, `${group}_top`, nmat("deepStone"), top);
      };
      jamb(-0.42, "jamb_west");
      jamb(0.42, "jamb_east");

      // Lintel slab, slightly proud of the jambs.
      const lintelLow = placeRing(m, slabProfile(1.16, 0.54, 0.05), [0, 1.92, 0]);
      const lintelHigh = placeRing(m, slabProfile(1.1, 0.5, 0.05), [0, 2.26, 0]);
      loft(m, "lintel", nmat("catacomb"), [lintelLow, lintelHigh]);
      cap(m, "lintel_top", nmat("catacomb"), lintelHigh);

      // The sigil: a violet ring with three radiating strokes, floated just
      // off the lintel face so it reads as light, not paint.
      const sigilRing = circleProfile(10, 0.16);
      const ringOuter = sigilRing.map(([x, y]) =>
        addV(m, [x, 2.09 + y, 0.262]),
      );
      const ringInner = circleProfile(10, 0.1).map(([x, y]) =>
        addV(m, [x, 2.09 + y, 0.262]),
      );
      for (let i = 0; i < ringOuter.length; i += 1) {
        const j = (i + 1) % ringOuter.length;
        addFace(
          m,
          `sigil_ring_${i}`,
          [ringOuter[i], ringOuter[j], ringInner[j], ringInner[i]],
          nmat("starViolet"),
          "sigil",
        );
      }
      const strokeTargets: V3[] = [
        [0, 2.33, 0.262],
        [-0.2, 1.95, 0.262],
        [0.2, 1.95, 0.262],
      ];
      strokeTargets.forEach((tip, index) => {
        strip(
          m,
          `sigil_stroke_${index}`,
          nmat("starViolet"),
          [
            [tip[0] * 0.45, 2.09 + (tip[1] - 2.09) * 0.45, 0.262],
            [tip[0] * 0.45 + 0.02, 2.09 + (tip[1] - 2.09) * 0.45, 0.262],
          ],
          [
            [tip[0], tip[1], 0.262],
            [tip[0] + 0.02, tip[1], 0.262],
          ],
        );
      });
    },
  });

// ── Set pieces ──────────────────────────────────────────────────────────────

// The omphalos: the navel-stone of the under-town. A lathed ovoid of deep
// stone wrapped in the carved net (agrenon) of the old faith — but down
// here the net's knots have gone luminous, the Grid tracing the lattice
// like current through a circuit it did not build but recognizes.
const omphalos = () =>
  sculpt({
    id: "obj_net_omphalos",
    name: "Omphalos of the Network",
    category: "setpiece",
    tags: ["prop", "setpiece", "sacred"],
    materialKeys: ["deepStone", "catacomb", "starViolet", "gridGlass"],
    build: (m, rng) => {
      // Stepped socle.
      const socleA = placeRing(m, slabProfile(1.04, 1.04, 0.08), [0, 0, 0]);
      const socleB = placeRing(m, slabProfile(0.86, 0.86, 0.07), [0, 0.16, 0]);
      const socleC = placeRing(m, slabProfile(0.68, 0.68, 0.06), [0, 0.3, 0]);
      loft(m, "socle", nmat("catacomb"), [socleA, socleB, socleC]);
      cap(m, "socle_top", nmat("catacomb"), socleC);

      // The stone: egg silhouette, faceted by jitter.
      lathe(
        m,
        "navel_stone",
        nmat("deepStone"),
        [
          [0.18, 0.3],
          [0.32, 0.52],
          [0.38, 0.86],
          [0.34, 1.22],
          [0.22, 1.52],
          [0.08, 1.68],
        ],
        12,
        { jitter: 0.012, rng, capBottom: false },
      );

      // The agrenon net: diagonal cords swept around the belly both ways,
      // in living violet.
      const netCord = (phase: number, direction: 1 | -1, index: number) => {
        const path: V3[] = [];
        const radii: number[] = [];
        for (let i = 0; i <= 8; i += 1) {
          const t = i / 8;
          const y = 0.42 + t * 1.1;
          // Belly radius at this height, slightly proud of the stone.
          const belly =
            (y < 0.86
              ? 0.32 + ((y - 0.42) / 0.44) * 0.07
              : 0.39 - ((y - 0.86) / 0.66) * 0.165) + 0.02;
          const angle = phase + direction * t * Math.PI * 1.5;
          path.push([Math.cos(angle) * belly, y, Math.sin(angle) * belly]);
          radii.push(0.022);
        }
        tube(m, `net_cord_${index}`, nmat("starViolet"), path, radii, 4, {
          capEnds: false,
        });
      };
      for (let i = 0; i < 4; i += 1) {
        netCord((i / 4) * Math.PI * 2, 1, i);
        netCord((i / 4) * Math.PI * 2, -1, i + 4);
      }

      // Glass intrusion at the crown: the Grid kissing the stone's apex.
      blob(
        m,
        "crown_glass",
        nmat("gridGlass"),
        [0.02, 1.74, -0.01],
        [0.2, 0.18, 0.2],
        rng,
        6,
        3,
        0.05,
      );
    },
  });

// A family shrine: the aedicula — a miniature temple front in a wall of
// soil-darkened marble, generations of wax pooled on its sill, one flame
// still kept. The hidden passages of the Network hide behind these.
const shrineFamily = () =>
  sculpt({
    id: "obj_net_shrine_family",
    name: "Family Shrine",
    category: "setpiece",
    tags: ["prop", "setpiece", "shrine"],
    materialKeys: [
      "buriedMarble",
      "deepStone",
      "wax",
      "flame",
      "flameCore",
      "votiveClay",
    ],
    build: (m, rng) => {
      // Sill and back slab.
      const sillA = placeRing(m, slabProfile(0.96, 0.6, 0.05), [0, 0, 0.12]);
      const sillB = placeRing(m, slabProfile(0.88, 0.52, 0.05), [0, 0.18, 0.12]);
      loft(m, "sill", nmat("deepStone"), [sillA, sillB]);
      cap(m, "sill_top", nmat("deepStone"), sillB);

      const backA = placeRing(m, slabProfile(0.84, 0.14), [0, 0.18, 0.32]);
      const backB = placeRing(m, slabProfile(0.78, 0.12), [0, 1.28, 0.32]);
      loft(m, "back_slab", nmat("buriedMarble"), [backA, backB]);
      cap(m, "back_slab_top", nmat("buriedMarble"), backB);

      // Twin colonnettes carrying a little pediment.
      const colonnette = (x: number, name: string) =>
        lathe(
          m,
          name,
          nmat("buriedMarble"),
          [
            [0.06, 0.18],
            [0.05, 0.7],
            [0.045, 1.06],
            [0.07, 1.14],
          ],
          8,
          { center: [x, 0, 0.02] },
        );
      colonnette(-0.3, "colonnette_west");
      colonnette(0.3, "colonnette_east");

      // Pediment: a true gable lofted from a triangle profile.
      const gableBase = [
        addV(m, [-0.42, 1.14, -0.08]),
        addV(m, [0.42, 1.14, -0.08]),
        addV(m, [0.42, 1.14, 0.18]),
        addV(m, [-0.42, 1.14, 0.18]),
      ];
      const gableRidge = [
        addV(m, [-0.42, 1.38, 0.05]),
        addV(m, [0.42, 1.38, 0.05]),
      ];
      addFace(m, "gable_front", [gableBase[0], gableBase[1], gableRidge[1], gableRidge[0]], nmat("buriedMarble"), "pediment");
      addFace(m, "gable_back", [gableBase[3], gableRidge[0], gableRidge[1], gableBase[2]], nmat("buriedMarble"), "pediment");
      addFace(m, "gable_end_w", [gableBase[0], gableRidge[0], gableBase[3]], nmat("deepStone"), "pediment");
      addFace(m, "gable_end_e", [gableBase[1], gableBase[2], gableRidge[1]], nmat("deepStone"), "pediment");
      addFace(m, "gable_soffit", [gableBase[0], gableBase[3], gableBase[2], gableBase[1]], nmat("deepStone"), "pediment");

      // Generations of wax: pooled lumps along the sill.
      for (let i = 0; i < 3; i += 1) {
        blob(
          m,
          `wax_pool_${i}`,
          nmat("wax"),
          [-0.26 + i * 0.26 + (rng() - 0.5) * 0.06, 0.22, 0.05 + (rng() - 0.5) * 0.08],
          [0.18 + rng() * 0.08, 0.1, 0.16 + rng() * 0.06],
          rng,
          6,
          2,
          0.04,
        );
      }

      // The kept candle and its flame.
      lathe(
        m,
        "kept_candle",
        nmat("wax"),
        [
          [0.05, 0.24],
          [0.045, 0.52],
          [0.035, 0.56],
        ],
        7,
        { center: [0.02, 0, 0.08] },
      );
      lathe(
        m,
        "kept_flame",
        nmat("flame"),
        [
          [0.012, 0.56],
          [0.034, 0.63],
          [0.016, 0.72],
          [0.004, 0.78],
        ],
        6,
        { center: [0.02, 0, 0.08], capBottom: false },
      );
      blob(m, "kept_flame_core", nmat("flameCore"), [0.02, 0.62, 0.08], [0.03, 0.05, 0.03], rng, 5, 2, 0.004);

      // A left offering: small clay votary figure on the sill.
      lathe(
        m,
        "clay_votary",
        nmat("votiveClay"),
        [
          [0.05, 0.18],
          [0.04, 0.3],
          [0.05, 0.38],
          [0.03, 0.46],
          [0.035, 0.52],
        ],
        6,
        { center: [-0.3, 0.02, 0.0] },
      );
    },
  });

// Candle cluster: a free-standing rite of wax — a soil mound carrying a
// crowd of candles in every state of melt, three still lit.
const candleCluster = () =>
  sculpt({
    id: "obj_net_candle_cluster",
    name: "Candle Cluster",
    category: "prop",
    tags: ["prop", "light", "shrine"],
    materialKeys: ["blackSoil", "wax", "flame", "flameCore"],
    profile: "none",
    build: (m, rng) => {
      blob(m, "soil_mound", nmat("blackSoil"), [0, 0.09, 0], [0.78, 0.2, 0.7], rng, 8, 3, 0.06);

      const candles: { x: number; z: number; h: number; lit: boolean }[] = [
        { x: -0.2, z: -0.12, h: 0.46, lit: true },
        { x: 0.16, z: -0.2, h: 0.3, lit: false },
        { x: 0.24, z: 0.1, h: 0.52, lit: true },
        { x: -0.04, z: 0.2, h: 0.2, lit: false },
        { x: -0.3, z: 0.16, h: 0.34, lit: true },
        { x: 0.04, z: -0.02, h: 0.62, lit: false },
      ];
      candles.forEach((candle, index) => {
        lathe(
          m,
          `candle_${index}`,
          nmat("wax"),
          [
            [0.055 + rng() * 0.015, 0.12],
            [0.05, 0.12 + candle.h * 0.6],
            [0.04, 0.12 + candle.h],
            [0.028, 0.13 + candle.h],
          ],
          7,
          { center: [candle.x, 0, candle.z], jitter: 0.006, rng },
        );
        if (candle.lit) {
          const flameBase = 0.13 + candle.h;
          lathe(
            m,
            `flame_${index}`,
            nmat("flame"),
            [
              [0.012, flameBase],
              [0.03, flameBase + 0.07],
              [0.014, flameBase + 0.14],
              [0.004, flameBase + 0.19],
            ],
            6,
            { center: [candle.x, 0, candle.z], capBottom: false },
          );
          blob(
            m,
            `flame_core_${index}`,
            nmat("flameCore"),
            [candle.x, flameBase + 0.06, candle.z],
            [0.026, 0.045, 0.026],
            rng,
            5,
            2,
            0.003,
          );
        }
      });

      // Wax run bleeding off the mound's south edge.
      strip(
        m,
        "wax_run",
        nmat("wax"),
        [
          [-0.08, 0.16, 0.28],
          [0.02, 0.14, 0.34],
          [0.1, 0.12, 0.3],
        ],
        [
          [-0.1, 0.02, 0.4],
          [0.0, 0.01, 0.46],
          [0.12, 0.02, 0.42],
        ],
      );
    },
  });

// Votive heap: a libation bowl half-buried in offerings — clay figures,
// shards, things given so something else would listen.
const votiveHeap = () =>
  sculpt({
    id: "obj_net_votive_heap",
    name: "Votive Heap",
    category: "prop",
    tags: ["prop", "shrine"],
    materialKeys: ["votiveClay", "blackSoil", "buriedMarble", "gridGlass"],
    build: (m, rng) => {
      blob(m, "offering_soil", nmat("blackSoil"), [0, 0.07, 0], [0.7, 0.16, 0.62], rng, 8, 2, 0.05);

      // The phiale (libation bowl).
      lathe(
        m,
        "phiale",
        nmat("buriedMarble"),
        [
          [0.1, 0.12],
          [0.24, 0.16],
          [0.3, 0.24],
          [0.27, 0.27],
          [0.12, 0.22],
        ],
        10,
        { center: [0.12, 0, -0.06], jitter: 0.008, rng },
      );

      // Clay votaries leaning in the soil.
      for (let i = 0; i < 4; i += 1) {
        const angle = rng() * Math.PI * 2;
        const r = 0.18 + rng() * 0.16;
        lathe(
          m,
          `votary_${i}`,
          nmat("votiveClay"),
          [
            [0.045, 0.06],
            [0.035, 0.16],
            [0.045, 0.22],
            [0.025, 0.3],
            [0.03, 0.35],
          ],
          6,
          {
            center: [Math.cos(angle) * r - 0.1, 0.02 + rng() * 0.03, Math.sin(angle) * r + 0.08],
            jitter: 0.005,
            rng,
          },
        );
      }

      // One offering the Grid answered: a small glass shard standing upright.
      const shardTip = addV(m, [-0.26, 0.42, -0.14]);
      const shardBase = circleProfile(4, 0.05, { jitter: 0.012, rng }).map(
        ([x, z]) => addV(m, [-0.26 + x, 0.08, -0.14 + z]),
      );
      for (let i = 0; i < shardBase.length; i += 1) {
        const j = (i + 1) % shardBase.length;
        addFace(m, `shard_${i}`, [shardBase[i], shardBase[j], shardTip], nmat("gridGlass"), "answer_shard");
      }
    },
  });

// Ritual krater: the great mixing vessel on a tripod ring, its mouth still
// holding a black mirror of old libation.
const krater = () =>
  sculpt({
    id: "obj_net_krater",
    name: "Rite Krater",
    category: "prop",
    tags: ["prop", "vessel", "shrine"],
    materialKeys: ["votiveClay", "verdigris", "stillWater", "deepStone"],
    build: (m, rng) => {
      // Tripod ring stand.
      const standRing = placeRing(m, circleProfile(8, 0.26), [0, 0.16, 0]);
      const standRingTop = placeRing(m, circleProfile(8, 0.24), [0, 0.24, 0]);
      loft(m, "stand_ring", nmat("verdigris"), [standRing, standRingTop]);
      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        tube(
          m,
          `stand_leg_${i}`,
          nmat("verdigris"),
          [
            [Math.cos(angle) * 0.24, 0.2, Math.sin(angle) * 0.24],
            [Math.cos(angle) * 0.34, 0.02, Math.sin(angle) * 0.34],
          ],
          [0.035, 0.045],
          5,
        );
      }

      // The vessel: volute krater silhouette.
      lathe(
        m,
        "krater_body",
        nmat("votiveClay"),
        [
          [0.14, 0.22],
          [0.3, 0.42],
          [0.36, 0.72],
          [0.3, 0.98],
          [0.34, 1.08],
          [0.4, 1.14],
        ],
        12,
        { jitter: 0.008, rng, capBottom: false, capTop: false },
      );

      // The libation surface, recessed in the mouth.
      const mouth = placeRing(m, circleProfile(12, 0.33), [0, 1.1, 0]);
      cap(m, "libation", nmat("stillWater"), mouth);

      // Volute handles: two bronze scrolls.
      const handle = (side: 1 | -1, name: string) =>
        tube(
          m,
          name,
          nmat("verdigris"),
          [
            [side * 0.34, 0.88, 0],
            [side * 0.5, 1.02, 0],
            [side * 0.52, 1.18, 0],
            [side * 0.42, 1.22, 0],
          ],
          [0.035, 0.03, 0.028, 0.024],
          5,
        );
      handle(1, "handle_east");
      handle(-1, "handle_west");

      // Spilled libation gone dark on the plinth side.
      strip(
        m,
        "old_spill",
        nmat("deepStone"),
        [
          [0.1, 0.42, 0.3],
          [0.18, 0.3, 0.34],
        ],
        [
          [0.06, 0.04, 0.42],
          [0.22, 0.02, 0.46],
        ],
      );
    },
  });

// The glass kneeler: someone the Network's pressure finished converting
// mid-prayer. A translucent figure of Grid glass, head bowed, hands lost in
// its lap — the most honest monument the under-town has.
const glassKneeler = () =>
  sculpt({
    id: "obj_net_glass_kneeler",
    name: "Glass Kneeler",
    category: "setpiece",
    tags: ["prop", "setpiece", "glass"],
    materialKeys: ["gridGlass", "blackSoil", "starViolet"],
    build: (m, rng) => {
      // The soil never takes the converted back.
      blob(m, "untaken_soil", nmat("blackSoil"), [0, 0.05, 0], [0.66, 0.12, 0.6], rng, 8, 2, 0.04);

      const glass = nmat("gridGlass");
      // Kneeling mass: folded legs.
      const shin = placeRing(m, slabProfile(0.4, 0.46, 0.08), [0, 0.08, 0.04]);
      const lap = placeRing(m, slabProfile(0.36, 0.4, 0.08), [0, 0.34, 0.0]);
      loft(m, "folded_legs", glass, [shin, lap]);
      cap(m, "legs_base", glass, shin, true);

      // Torso leaning forward in prayer.
      const waist = placeRing(m, circleProfile(8, 0.17, { jitter: 0.01, rng }), [0, 0.34, 0]);
      const chest = placeRing(m, circleProfile(8, 0.19, { jitter: 0.01, rng }), [0, 0.66, -0.07]);
      const shoulders = placeRing(m, circleProfile(8, 0.16, { jitter: 0.01, rng }), [0, 0.84, -0.12]);
      loft(m, "torso", glass, [waist, chest, shoulders]);

      // Bowed head.
      blob(m, "bowed_head", glass, [0, 0.97, -0.2], [0.22, 0.24, 0.22], rng, 7, 3, 0.02);

      // Arms folded to the lap.
      tube(
        m,
        "arm_west",
        glass,
        [
          [-0.17, 0.8, -0.1],
          [-0.2, 0.58, 0.02],
          [-0.08, 0.42, 0.1],
        ],
        [0.05, 0.045, 0.04],
        5,
      );
      tube(
        m,
        "arm_east",
        glass,
        [
          [0.17, 0.8, -0.1],
          [0.2, 0.56, 0.04],
          [0.08, 0.42, 0.1],
        ],
        [0.05, 0.045, 0.04],
        5,
      );

      // The seam of violet where the conversion entered, nape to crown.
      tube(
        m,
        "entry_seam",
        nmat("starViolet"),
        [
          [0, 0.6, -0.13],
          [0, 0.86, -0.18],
          [0, 1.04, -0.22],
        ],
        [0.015, 0.012, 0.008],
        4,
        { capEnds: false },
      );
    },
  });

// Root curtain: signal-roots hanging from the tunnel ceiling, dowsing for
// something below the floor. Walk-through; they part like the dark does.
const rootCurtain = () =>
  sculpt({
    id: "obj_net_root_curtain",
    name: "Root Curtain",
    category: "prop",
    tags: ["prop", "nature"],
    materialKeys: ["rootPale", "blackSoil"],
    profile: "none",
    build: (m, rng) => {
      // Soil collar at the ceiling line (~2.1 world units up).
      blob(m, "ceiling_soil", nmat("blackSoil"), [0, 2.08, 0], [0.9, 0.18, 0.8], rng, 8, 2, 0.06);

      for (let i = 0; i < 7; i += 1) {
        const x = (rng() - 0.5) * 0.74;
        const z = (rng() - 0.5) * 0.7;
        const reach = 0.7 + rng() * 1.05;
        tube(
          m,
          `hanging_root_${i}`,
          nmat("rootPale"),
          [
            [x, 2.05, z],
            [x + (rng() - 0.5) * 0.16, 2.05 - reach * 0.5, z + (rng() - 0.5) * 0.16],
            [x + (rng() - 0.5) * 0.26, 2.05 - reach, z + (rng() - 0.5) * 0.26],
          ],
          [0.05 + rng() * 0.02, 0.032, 0.012],
          5,
          { jitter: 0.012, rng },
        );
      }
    },
  });

// Collapse rubble: a fallen vault — catacomb blocks and a snapped column
// drum, sealing a passage the town forgot it dug.
const rubble = () =>
  sculpt({
    id: "obj_net_rubble",
    name: "Vault Collapse",
    category: "prop",
    tags: ["prop", "ruin"],
    materialKeys: ["catacomb", "deepStone", "buriedMarble"],
    build: (m, rng) => {
      const stones: { c: V3; s: V3; mat: NMatKey }[] = [
        { c: [-0.2, 0.18, -0.1], s: [0.5, 0.36, 0.44], mat: "catacomb" },
        { c: [0.22, 0.14, 0.12], s: [0.42, 0.3, 0.4], mat: "deepStone" },
        { c: [0.02, 0.42, -0.04], s: [0.4, 0.3, 0.34], mat: "catacomb" },
        { c: [-0.26, 0.1, 0.28], s: [0.3, 0.2, 0.26], mat: "deepStone" },
        { c: [0.05, 0.66, 0.05], s: [0.3, 0.22, 0.26], mat: "deepStone" },
      ];
      stones.forEach((stone, index) =>
        blob(m, `block_${index}`, nmat(stone.mat), stone.c, stone.s, rng, 6, 2, 0.07),
      );

      // The snapped drum, half-buried at an angle.
      const drumProfile = circleProfile(9, 0.2, { flutes: 8, fluteDepth: 0.012 });
      const drumA = drumProfile.map(([x, z]) => addV(m, [0.3 + x * 0.2, 0.34 + x, -0.3 + z]));
      const drumB = drumProfile.map(([x, z]) => addV(m, [-0.14 + x * 0.2, 0.18 + x, -0.34 + z]));
      loft(m, "snapped_drum", nmat("buriedMarble"), [drumA, drumB]);
      cap(m, "drum_face", nmat("buriedMarble"), drumA, true);
    },
  });

// Boundary stele: the under-town's warning marker — a marble slab whose
// crown has gone to glass, with a painted prohibition band still legible.
const steleWarning = () =>
  sculpt({
    id: "obj_net_stele",
    name: "Boundary Stele",
    category: "prop",
    tags: ["prop", "marker"],
    materialKeys: ["buriedMarble", "deepStone", "oldBlood", "gridGlass"],
    build: (m, rng) => {
      const base = placeRing(m, slabProfile(0.6, 0.4, 0.05), [0, 0, 0]);
      const baseTop = placeRing(m, slabProfile(0.5, 0.32, 0.05), [0, 0.14, 0]);
      loft(m, "base", nmat("deepStone"), [base, baseTop]);
      cap(m, "base_top", nmat("deepStone"), baseTop);

      // The slab tapers as it rises and tips a degree or two.
      const slabRings = [
        placeRing(m, slabProfile(0.4, 0.16, 0.02), [0, 0.14, 0]),
        placeRing(m, slabProfile(0.36, 0.14, 0.02), [0.02, 0.78, 0.01]),
        placeRing(m, slabProfile(0.32, 0.12, 0.02), [0.035, 1.36, 0.015]),
      ];
      loft(m, "slab", nmat("buriedMarble"), slabRings);

      // Painted prohibition band — old blood pigment, front face only.
      strip(
        m,
        "warning_band",
        nmat("oldBlood"),
        [
          [-0.16, 0.92, 0.085],
          [0.18, 0.93, 0.085],
        ],
        [
          [-0.155, 1.06, 0.087],
          [0.185, 1.07, 0.087],
        ],
      );
      strip(
        m,
        "warning_strokes",
        nmat("oldBlood"),
        [
          [-0.1, 0.62, 0.085],
          [0.0, 0.66, 0.085],
          [0.12, 0.6, 0.085],
        ],
        [
          [-0.08, 0.8, 0.085],
          [0.02, 0.76, 0.085],
          [0.14, 0.82, 0.085],
        ],
      );

      // The crown gone to glass: the warning the stele could not give.
      blob(m, "glass_crown", nmat("gridGlass"), [0.04, 1.5, 0.015], [0.3, 0.26, 0.18], rng, 6, 3, 0.05);
    },
  });

// Cold brazier: the town's tripod light, toppled and green — whoever fled
// the Network did not stop to right it.
const brazierCold = () =>
  sculpt({
    id: "obj_net_brazier_cold",
    name: "Cold Brazier",
    category: "prop",
    tags: ["prop", "ruin"],
    materialKeys: ["verdigris", "blackSoil", "deepStone"],
    build: (m, rng) => {
      // Bowl on its side, mouth facing east, ash spilled.
      const bowlProfile: P2[] = [
        [0.05, 0],
        [0.22, 0.08],
        [0.3, 0.22],
        [0.26, 0.3],
      ];
      // Build the bowl lathed around a tilted local frame: cheat by lathing
      // upright at a shifted center, then leaning rings progressively.
      const rings: Ring[] = bowlProfile.map(([radius, y], index) =>
        placeRing(
          m,
          circleProfile(10, radius, { jitter: 0.01, rng }),
          [0.1 + y * 0.85, 0.12 + y * 0.4, 0.05],
        ),
      );
      loft(m, "fallen_bowl", nmat("verdigris"), rings);
      cap(m, "bowl_mouth", nmat("verdigris"), rings[rings.length - 1]);

      // Two legs in the air, one crushed beneath.
      tube(m, "leg_up_a", nmat("verdigris"), [[0.02, 0.3, 0.0], [-0.3, 0.52, -0.12]], [0.03, 0.024], 5);
      tube(m, "leg_up_b", nmat("verdigris"), [[0.04, 0.28, 0.12], [-0.24, 0.46, 0.32]], [0.03, 0.024], 5);
      tube(m, "leg_crushed", nmat("verdigris"), [[0.06, 0.06, -0.02], [0.34, 0.03, -0.18]], [0.03, 0.024], 5);

      // Spilled ash fan.
      strip(
        m,
        "ash_fan",
        nmat("blackSoil"),
        [
          [0.38, 0.02, -0.12],
          [0.4, 0.03, 0.06],
          [0.36, 0.02, 0.24],
        ],
        [
          [0.62, 0.01, -0.2],
          [0.68, 0.01, 0.08],
          [0.6, 0.01, 0.32],
        ],
      );
      // A scorch shadow under the mouth.
      const scorch = placeRing(m, circleProfile(8, 0.18, { jitter: 0.03, rng }), [0.5, 0.015, 0.04]);
      cap(m, "scorch", nmat("deepStone"), scorch);
    },
  });

// The rite circle: a walk-on floor piece — soil ring, wax points, and the
// chalk-violet geometry of the under-rite, still faintly holding charge.
// Mara's basement wears one of these.
const riteCircle = () =>
  sculpt({
    id: "obj_net_rite_circle",
    name: "Under-Rite Circle",
    category: "setpiece",
    tags: ["prop", "setpiece", "ritual"],
    materialKeys: ["blackSoil", "starViolet", "wax", "oldBlood"],
    profile: "none",
    build: (m, rng) => {
      // Soil ring pressed into the floor.
      const soilOuter = placeRing(m, circleProfile(14, 0.62, { jitter: 0.02, rng }), [0, 0.02, 0]);
      const soilInner = placeRing(m, circleProfile(14, 0.5, { jitter: 0.02, rng }), [0, 0.025, 0]);
      for (let i = 0; i < 14; i += 1) {
        const j = (i + 1) % 14;
        addFace(m, `soil_ring_${i}`, [soilOuter[i], soilOuter[j], soilInner[j], soilInner[i]], nmat("blackSoil"), "soil_ring");
      }

      // The violet working: an inner ring and a triangle of strokes.
      const glowOuter = placeRing(m, circleProfile(12, 0.42), [0, 0.035, 0]);
      const glowInner = placeRing(m, circleProfile(12, 0.36), [0, 0.035, 0]);
      for (let i = 0; i < 12; i += 1) {
        const j = (i + 1) % 12;
        addFace(m, `glow_ring_${i}`, [glowOuter[i], glowOuter[j], glowInner[j], glowInner[i]], nmat("starViolet"), "glow_ring");
      }
      for (let i = 0; i < 3; i += 1) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const b = ((i + 1) / 3) * Math.PI * 2 + Math.PI / 6;
        strip(
          m,
          `glow_chord_${i}`,
          nmat("starViolet"),
          [
            [Math.cos(a) * 0.34, 0.04, Math.sin(a) * 0.34],
            [Math.cos(b) * 0.34, 0.04, Math.sin(b) * 0.34],
          ],
          [
            [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3],
            [Math.cos(b) * 0.3, 0.04, Math.sin(b) * 0.3],
          ],
        );
      }

      // Three wax points at the triangle's corners.
      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(angle) * 0.34;
        const z = Math.sin(angle) * 0.34;
        lathe(
          m,
          `corner_candle_${i}`,
          nmat("wax"),
          [
            [0.04, 0.03],
            [0.035, 0.14],
            [0.025, 0.17],
          ],
          6,
          { center: [x, 0, z] },
        );
      }

      // The stain at center, where the doorway stood.
      const stain = placeRing(m, circleProfile(8, 0.12, { jitter: 0.025, rng }), [0, 0.045, 0]);
      cap(m, "center_stain", nmat("oldBlood"), stain);
    },
  });

// Bone pile: the ossuary's overflow, dry and unjudging. Walk-through.
const bonePile = () =>
  sculpt({
    id: "obj_net_bone_pile",
    name: "Bone Pile",
    category: "prop",
    tags: ["prop", "ruin"],
    materialKeys: ["bone", "blackSoil"],
    profile: "none",
    build: (m, rng) => {
      blob(m, "pile_soil", nmat("blackSoil"), [0, 0.05, 0], [0.6, 0.12, 0.54], rng, 7, 2, 0.05);
      for (let i = 0; i < 5; i += 1) {
        const angle = rng() * Math.PI * 2;
        const r = rng() * 0.2;
        tube(
          m,
          `long_bone_${i}`,
          nmat("bone"),
          [
            [Math.cos(angle) * (r + 0.22), 0.08 + rng() * 0.06, Math.sin(angle) * (r + 0.2)],
            [Math.cos(angle) * r - 0.1, 0.1 + rng() * 0.08, Math.sin(angle) * r],
          ],
          [0.035 + rng() * 0.012],
          5,
          { jitter: 0.008, rng },
        );
      }
      blob(m, "pile_skull", nmat("bone"), [0.08, 0.2, -0.04], [0.2, 0.18, 0.17], rng, 6, 3, 0.04);
    },
  });

// Glass growth: the Grid's intrusion proper — a clutch of cold crystal
// blades erupting from a fracture, the Network's deepest "no".
const glassGrowth = () =>
  sculpt({
    id: "obj_net_glass_growth",
    name: "Grid Intrusion",
    category: "setpiece",
    tags: ["prop", "setpiece", "glass"],
    materialKeys: ["gridGlass", "starViolet", "deepStone"],
    build: (m, rng) => {
      // Fractured collar of stone.
      blob(m, "fracture_collar", nmat("deepStone"), [0, 0.08, 0], [0.74, 0.2, 0.68], rng, 8, 2, 0.09);

      // Crystal blades: tapered four-sided spears at conspiring angles.
      const blades: { x: number; z: number; h: number; tilt: number; angle: number; mat: NMatKey }[] = [
        { x: 0, z: 0, h: 1.5, tilt: 0.14, angle: 0.4, mat: "gridGlass" },
        { x: -0.22, z: 0.12, h: 0.95, tilt: 0.3, angle: 2.4, mat: "gridGlass" },
        { x: 0.2, z: -0.16, h: 1.1, tilt: 0.26, angle: 4.2, mat: "gridGlass" },
        { x: 0.16, z: 0.22, h: 0.6, tilt: 0.42, angle: 1.3, mat: "starViolet" },
        { x: -0.18, z: -0.2, h: 0.7, tilt: 0.38, angle: 5.3, mat: "starViolet" },
      ];
      blades.forEach((blade, index) => {
        const dx = Math.cos(blade.angle) * blade.tilt;
        const dz = Math.sin(blade.angle) * blade.tilt;
        const baseRing = circleProfile(4, 0.13 + rng() * 0.04, { jitter: 0.015, rng }).map(
          ([x, z]) => addV(m, [blade.x + x, 0.05, blade.z + z]),
        );
        const midRing = circleProfile(4, 0.08, { jitter: 0.01, rng }).map(
          ([x, z]) =>
            addV(m, [
              blade.x + x + dx * blade.h * 0.5,
              0.05 + blade.h * 0.55,
              blade.z + z + dz * blade.h * 0.5,
            ]),
        );
        const tip = addV(m, [blade.x + dx * blade.h, 0.05 + blade.h, blade.z + dz * blade.h]);
        loft(m, `blade_${index}`, nmat(blade.mat), [baseRing, midRing]);
        for (let i = 0; i < 4; i += 1) {
          const j = (i + 1) % 4;
          addFace(m, `blade_${index}_tip_${i}`, [midRing[i], midRing[j], tip], nmat(blade.mat), `blade_${index}`);
        }
      });
    },
  });

// ── Library export ──────────────────────────────────────────────────────────

export const createPaganNetworkKit = (): ObjectData[] => [
  floorCatacomb(),
  floorSoil(),
  floorRitual(),
  waterStill(),
  wallCatacomb(),
  wallOssuary(),
  columnRoot(),
  archSigil(),
  omphalos(),
  shrineFamily(),
  candleCluster(),
  votiveHeap(),
  krater(),
  glassKneeler(),
  rootCurtain(),
  rubble(),
  steleWarning(),
  brazierCold(),
  riteCircle(),
  bonePile(),
  glassGrowth(),
];

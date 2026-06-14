// The City Kit — grand iridescent-gothic landmark models.
//
// Where the parish kit is rural fieldstone, this kit is the great sacred city:
// pale dressed ashlar with a lavender sheen, lead/verdigris domes, soaring
// spires, flying buttresses, vast stained glass, a black obelisk on a
// reflecting island. Built to read as the reference painting's skyline from
// the iso camera — silhouette + colour, stylised low-poly.
//
// All models reuse the shared sculpting toolkit from witnessKit.

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
  circleProfile,
  lathe,
  mulberry32,
  newMesh,
  tube,
  type P2,
  type Ring,
  type V3,
} from "./witnessKit";

// ── Palette ───────────────────────────────────────────────────────────────
export const CITY_MATERIALS = {
  ashlar: {
    id: "cmat_ashlar", name: "Pale Ashlar", color: "#C4BFD4",
    emissive: "#241C4A", emissive_intensity: 0.14, opacity: 1, transparent: false,
    roughness: 0.5, metalness: 0.05, texture_kind: "stone_grain", texture_scale: 1.2, texture_strength: 0.4,
  },
  ashlarShadow: {
    id: "cmat_ashlar_shadow", name: "Shadowed Ashlar", color: "#7E7A98",
    emissive: "#160f33", emissive_intensity: 0.12, opacity: 1, transparent: false,
    roughness: 0.6, metalness: 0.04, texture_kind: "stone_grain", texture_scale: 1.4, texture_strength: 0.5,
  },
  lead: {
    id: "cmat_lead", name: "Lead Dome", color: "#5E6788",
    emissive: "#16204a", emissive_intensity: 0.2, opacity: 1, transparent: false,
    roughness: 0.32, metalness: 0.55, texture_kind: "metal_scratches", texture_scale: 1.4, texture_strength: 0.4,
  },
  verdigris: {
    id: "cmat_verdigris", name: "Verdigris Copper", color: "#4E7A6A",
    emissive: "#0c241c", emissive_intensity: 0.18, opacity: 1, transparent: false,
    roughness: 0.42, metalness: 0.5, texture_kind: "metal_scratches", texture_scale: 1.4, texture_strength: 0.4,
  },
  obsidian: {
    id: "cmat_obsidian", name: "Obsidian", color: "#0C0A14",
    emissive: "#1a0c30", emissive_intensity: 0.22, opacity: 1, transparent: false,
    roughness: 0.12, metalness: 0.4, texture_kind: "glass_facets", texture_scale: 2.0, texture_strength: 0.3,
  },
  gold: {
    id: "cmat_gold", name: "Gold Leaf", color: "#D9A648",
    emissive: "#7A5414", emissive_intensity: 0.5, opacity: 1, transparent: false,
    roughness: 0.32, metalness: 0.65, texture_kind: "metal_scratches", texture_scale: 1.2, texture_strength: 0.3,
  },
  iron: {
    id: "cmat_iron", name: "Black Iron", color: "#191820",
    emissive: "#000000", emissive_intensity: 0, opacity: 1, transparent: false,
    roughness: 0.5, metalness: 0.6, texture_kind: "metal_scratches", texture_scale: 1.3, texture_strength: 0.4,
  },
  wetMarble: {
    id: "cmat_wet_marble", name: "Wet Iridescent Marble", color: "#6A6684",
    emissive: "#2a1f54", emissive_intensity: 0.34, opacity: 1, transparent: false,
    roughness: 0.16, metalness: 0.12, texture_kind: "glass_facets", texture_scale: 1.2, texture_strength: 0.5,
  },
  glassRose: {
    id: "cmat_glass_rose", name: "Rose Glass", color: "#C24B86",
    emissive: "#8A1E5A", emissive_intensity: 1.6, opacity: 0.84, transparent: true,
    roughness: 0.16, metalness: 0, texture_kind: "glass_facets", texture_scale: 1.3, texture_strength: 0.6,
  },
  glassBlue: {
    id: "cmat_glass_blue", name: "Azure Glass", color: "#3E78C2",
    emissive: "#1B3E96", emissive_intensity: 1.5, opacity: 0.84, transparent: true,
    roughness: 0.16, metalness: 0, texture_kind: "glass_facets", texture_scale: 1.3, texture_strength: 0.6,
  },
  glassGold: {
    id: "cmat_glass_gold", name: "Amber Glass", color: "#E0B24E",
    emissive: "#B47A18", emissive_intensity: 1.6, opacity: 0.86, transparent: true,
    roughness: 0.16, metalness: 0, texture_kind: "glass_facets", texture_scale: 1.3, texture_strength: 0.6,
  },
  glassViolet: {
    id: "cmat_glass_violet", name: "Violet Glass", color: "#7E4BC2",
    emissive: "#4A1E8A", emissive_intensity: 1.5, opacity: 0.84, transparent: true,
    roughness: 0.16, metalness: 0, texture_kind: "glass_facets", texture_scale: 1.3, texture_strength: 0.6,
  },
  glassGreen: {
    id: "cmat_glass_green", name: "Viridian Glass", color: "#3EB07A",
    emissive: "#0F7A4A", emissive_intensity: 1.4, opacity: 0.84, transparent: true,
    roughness: 0.16, metalness: 0, texture_kind: "glass_facets", texture_scale: 1.3, texture_strength: 0.6,
  },
  ember: {
    id: "cmat_ember", name: "Brazier Ember", color: "#FF7A3C",
    emissive: "#FF5A1E", emissive_intensity: 2.2, opacity: 1, transparent: false,
    roughness: 0.4, metalness: 0, texture_kind: "none", texture_scale: 1, texture_strength: 0,
  },
} satisfies Record<string, ObjectMaterialData>;

type MatKey = keyof typeof CITY_MATERIALS;
const mat = (k: MatKey) => CITY_MATERIALS[k].id;
const GLASS: MatKey[] = ["glassRose", "glassBlue", "glassGold", "glassViolet", "glassGreen"];

// ── Local mesh helpers ──────────────────────────────────────────────────────
const quad = (m: ObjectMeshData, n: string, mt: string, a: V3, b: V3, c: V3, d: V3, g: string) =>
  addFace(m, n, [addV(m, a), addV(m, b), addV(m, c), addV(m, d)], mt, g);
const tri = (m: ObjectMeshData, n: string, mt: string, a: V3, b: V3, c: V3, g: string) =>
  addFace(m, n, [addV(m, a), addV(m, b), addV(m, c)], mt, g);
const box = (m: ObjectMeshData, n: string, mt: string, min: V3, max: V3, g = n) => {
  const [x0, y0, z0] = min; const [x1, y1, z1] = max;
  quad(m, `${n}_bt`, mt, [x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], g);
  quad(m, `${n}_tp`, mt, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], g);
  quad(m, `${n}_zn`, mt, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], g);
  quad(m, `${n}_zp`, mt, [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], g);
  quad(m, `${n}_xn`, mt, [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], g);
  quad(m, `${n}_xp`, mt, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], g);
};

// A tapered square spire: square base ring → apex, optional gold finial.
const spire = (m: ObjectMeshData, name: string, cx: number, cz: number, baseY: number, half: number, topY: number, material: string, finial = true) => {
  const apex = addV(m, [cx, topY, cz]);
  const ring: Ring = [
    addV(m, [cx - half, baseY, cz - half]),
    addV(m, [cx + half, baseY, cz - half]),
    addV(m, [cx + half, baseY, cz + half]),
    addV(m, [cx - half, baseY, cz + half]),
  ];
  for (let i = 0; i < 4; i++) addFace(m, `${name}_${i}`, [ring[i], ring[(i + 1) % 4], apex], material, name);
  if (finial) box(m, `${name}_fin`, mat("gold"), [cx - 0.05, topY, cz - 0.05], [cx + 0.05, topY + 0.4, cz + 0.05], name);
};

// A circular ribbed dome on a drum. Returns the top Y.
const dome = (m: ObjectMeshData, name: string, cx: number, cz: number, drumY0: number, radius: number, drumH: number, domeH: number, seg = 12) => {
  // Drum.
  lathe(m, `${name}_drum`, mat("ashlar"), [[radius, drumY0], [radius, drumY0 + drumH]], seg, { center: [cx, 0, cz], capBottom: false, capTop: false });
  // Drum stained-glass windows (a ring band).
  lathe(m, `${name}_drumglass`, mat("glassBlue"), [[radius + 0.02, drumY0 + drumH * 0.3], [radius + 0.02, drumY0 + drumH * 0.75]], seg, { center: [cx, 0, cz], capBottom: false, capTop: false });
  // Ribbed dome: lathe a quarter-circle silhouette.
  const sil: P2[] = [];
  const top = drumY0 + drumH;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    sil.push([Math.cos(a) * radius, top + Math.sin(a) * domeH]);
  }
  lathe(m, `${name}_shell`, mat("lead"), sil, seg, { center: [cx, 0, cz], capBottom: false, capTop: false });
  // Meridian ribs (verdigris) — thin tubes up the dome.
  for (let r = 0; r < seg; r += 2) {
    const ang = (r / seg) * Math.PI * 2;
    const path: V3[] = sil.filter((_, i) => i % 2 === 0).map(([rad, y]) => [cx + Math.cos(ang) * (rad + 0.02), y, cz + Math.sin(ang) * (rad + 0.02)]);
    tube(m, `${name}_rib_${r}`, mat("verdigris"), path, path.map(() => 0.05), 4, { capEnds: false });
  }
  const lanternY = top + domeH;
  // Lantern + spire crowning the dome.
  lathe(m, `${name}_lantern`, mat("ashlar"), [[0.4, lanternY], [0.4, lanternY + 0.6], [0.3, lanternY + 0.7]], 8, { center: [cx, 0, cz], capBottom: false, capTop: false });
  spire(m, `${name}_spire`, cx, cz, lanternY + 0.7, 0.3, lanternY + 2.6, mat("lead"));
  return lanternY + 2.6;
};

// Pointed-arch stained-glass window on a wall plane facing +Z at z=zf.
const lancet = (m: ObjectMeshData, name: string, cx: number, y0: number, w: number, h: number, zf: number, glass: string) => {
  quad(m, `${name}_b`, glass, [cx - w, y0, zf], [cx + w, y0, zf], [cx + w, y0 + h, zf], [cx - w, y0 + h, zf], name);
  tri(m, `${name}_h`, glass, [cx - w, y0 + h, zf], [cx + w, y0 + h, zf], [cx, y0 + h + w, zf], name);
};

// ── Object wrapper ──────────────────────────────────────────────────────────
const sculpt = ({ id, name, materialKeys, footprint, build }: {
  id: string; name: string; materialKeys: MatKey[];
  footprint: [number, number][];
  build: (m: ObjectMeshData, rng: () => number) => void;
}): ObjectData => {
  const m = newMesh();
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) | 0;
  build(m, mulberry32(seed));
  const mesh = recomputeMeshNormals(m);
  mesh.material_slots = materialKeys.map(mat);
  mesh.groups = Array.from(new Set(mesh.faces.map((f) => f.group || "default")));
  return {
    id, display_name: name, category: "setpiece",
    tags: ["prop", "setpiece", "structure", "landmark"],
    origin: "center_floor", bounds: getMeshBounds(mesh),
    materials: materialKeys.map(mat),
    material_settings: materialKeys.map((k) => CITY_MATERIALS[k]),
    model_kind: "mesh", parts: [], mesh, decals: [], reference_images: [],
    collision: { profile: "custom_footprint", footprint },
  };
};

const rectFootprint = (w: number, d: number): [number, number][] => {
  const out: [number, number][] = [];
  const hw = Math.floor(w / 2), hd = Math.floor(d / 2);
  for (let x = -hw; x <= hw; x++) for (let z = -hd; z <= hd; z++) out.push([x, z]);
  return out;
};

// ── Grand domed cathedral ───────────────────────────────────────────────────
const grandCathedral = () =>
  sculpt({
    id: "obj_c_cathedral",
    name: "Grand Cathedral",
    materialKeys: ["ashlar", "ashlarShadow", "lead", "verdigris", "gold", "obsidian", "glassRose", "glassBlue", "glassGold", "glassViolet"],
    footprint: rectFootprint(9, 13),
    build: (m, rng) => {
      const zFront = 6, zBack = -6;
      // Grand entrance stair (front, +z).
      for (let i = 0; i < 3; i++) box(m, `stair_${i}`, mat("ashlarShadow"), [-2.4 + i * 0, zFront + 0.6 - i * 0.2, zFront + 0.2 + i * 0.5], [2.4, zFront + 0.8 - i * 0.2, zFront + 0.7 + i * 0.5], "stair");
      // Side aisles (lower).
      box(m, "aisle_w", mat("ashlar"), [-3.6, 0, zBack], [-2.4, 3.2, zFront], "aisle");
      box(m, "aisle_e", mat("ashlar"), [2.4, 0, zBack], [3.6, 3.2, zFront], "aisle");
      // Aisle lean-to roofs.
      quad(m, "aisle_roof_w", mat("lead"), [-3.7, 3.2, zBack], [-2.4, 4.6, zBack], [-2.4, 4.6, zFront], [-3.7, 3.2, zFront], "roof");
      quad(m, "aisle_roof_e", mat("lead"), [2.4, 4.6, zBack], [3.7, 3.2, zBack], [3.7, 3.2, zFront], [2.4, 4.6, zFront], "roof");
      // Nave clerestory body.
      box(m, "nave", mat("ashlar"), [-2.4, 0, zBack], [2.4, 5.2, zFront], "nave");
      // Clerestory stained-glass band (both sides).
      for (let i = 0; i < 5; i++) {
        const z = zBack + 1 + i * 2.2;
        lancet(m, `cl_w_${i}`, 0, 4.0, 0.18, 0.7, 0, GLASS[i % GLASS.length] && mat(GLASS[i % GLASS.length]) || mat("glassBlue"));
        // place west/east via direct quads on side planes
        quad(m, `clw_${i}`, mat(GLASS[i % GLASS.length]), [-2.41, 3.9, z - 0.25], [-2.41, 3.9, z + 0.25], [-2.41, 4.8, z + 0.25], [-2.41, 4.8, z - 0.25], "glass");
        quad(m, `cle_${i}`, mat(GLASS[(i + 2) % GLASS.length]), [2.41, 3.9, z - 0.25], [2.41, 4.8, z - 0.25], [2.41, 4.8, z + 0.25], [2.41, 3.9, z + 0.25], "glass");
      }
      // Steep gable nave roof.
      quad(m, "roof_w", mat("lead"), [-2.5, 5.2, zBack], [0, 7.0, zBack], [0, 7.0, zFront], [-2.5, 5.2, zFront], "roof");
      quad(m, "roof_e", mat("lead"), [0, 7.0, zBack], [2.5, 5.2, zBack], [2.5, 5.2, zFront], [0, 7.0, zFront], "roof");
      // Flying buttresses + pinnacles along the aisles.
      for (let i = 0; i < 4; i++) {
        const z = zBack + 1.2 + i * 2.4;
        tube(m, `fbw_${i}`, mat("ashlarShadow"), [[-3.5, 3.2, z], [-2.5, 4.6, z]], [0.12, 0.1], 4, { capEnds: false });
        tube(m, `fbe_${i}`, mat("ashlarShadow"), [[3.5, 3.2, z], [2.5, 4.6, z]], [0.12, 0.1], 4, { capEnds: false });
        spire(m, `pinw_${i}`, -3.6, z, 3.2, 0.18, 4.6, mat("ashlarShadow"), false);
        spire(m, `pine_${i}`, 3.6, z, 3.2, 0.18, 4.6, mat("ashlarShadow"), false);
      }
      // West front: gable wall + huge rose window + portal.
      box(m, "front", mat("ashlar"), [-2.6, 0, zFront - 0.2], [2.6, 5.4, zFront], "front");
      tri(m, "front_gable", mat("ashlar"), [-2.6, 5.4, zFront], [2.6, 5.4, zFront], [0, 7.4, zFront], "front");
      // Rose window (disc of glass petals).
      const cy = 3.4, zf = zFront + 0.02, rr = 1.1, seg = 12;
      const ringF = circleProfile(seg, rr).map(([x, y]) => addV(m, [x, cy + y, zf]));
      const center = addV(m, [0, cy, zf]);
      for (let i = 0; i < seg; i++) addFace(m, `rose_${i}`, [center, ringF[i], ringF[(i + 1) % seg]], mat(GLASS[i % GLASS.length]), "rose");
      lathe(m, "rose_rim", mat("gold"), [[rr, -0.05], [rr + 0.12, 0], [rr, 0.05]], seg, { center: [0, cy, zf - 0.05], scaleZ: 0.2, capBottom: false, capTop: false });
      // Pointed portal.
      box(m, "portal", mat("obsidian"), [-0.7, 0, zf], [0.7, 1.8, zf + 0.02], "portal");
      tri(m, "portal_arch", mat("obsidian"), [-0.7, 1.8, zf], [0.7, 1.8, zf], [0, 2.5, zf], "portal");
      // Front flanking pinnacle towers.
      box(m, "ftw_w", mat("ashlar"), [-2.6, 0, zFront - 0.6], [-1.9, 6.2, zFront], "ftw");
      box(m, "ftw_e", mat("ashlar"), [1.9, 0, zFront - 0.6], [2.6, 6.2, zFront], "ftw");
      spire(m, "ftw_w_sp", -2.25, zFront - 0.3, 6.2, 0.35, 8.4, mat("lead"));
      spire(m, "ftw_e_sp", 2.25, zFront - 0.3, 6.2, 0.35, 8.4, mat("lead"));
      // Crossing dome (rear-center), the signature.
      dome(m, "dome", 0, zBack + 2.5, 5.2, 2.2, 1.6, 1.8, 12);
      void rng;
    },
  });

// ── Glass conservatory ──────────────────────────────────────────────────────
const glassConservatory = () =>
  sculpt({
    id: "obj_c_glass_dome",
    name: "Glass Conservatory",
    materialKeys: ["ashlar", "iron", "gold", "glassBlue", "glassGreen", "glassRose", "glassGold", "glassViolet"],
    footprint: rectFootprint(7, 9),
    build: (m, rng) => {
      const x0 = -3, x1 = 3, z0 = -4, z1 = 4;
      // Stone plinth.
      box(m, "plinth", mat("ashlar"), [x0 - 0.2, 0, z0 - 0.2], [x1 + 0.2, 0.6, z1 + 0.2], "plinth");
      // Barrel-vault glass roof: arches across X lofted along Z.
      const archAt = (z: number): V3[] => {
        const pts: V3[] = [];
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI * (i / steps);
          pts.push([Math.cos(a) * 2.8, 0.6 + Math.sin(a) * 2.6, z]);
        }
        return pts;
      };
      const arches: V3[][] = [];
      for (let z = z0; z <= z1; z++) arches.push(archAt(z));
      for (let s = 0; s < arches.length - 1; s++) {
        const a = arches[s], b = arches[s + 1];
        for (let i = 0; i < a.length - 1; i++) {
          const g = mat(GLASS[(s + i) % GLASS.length]);
          addFace(m, `vault_${s}_${i}`, [addV(m, a[i]), addV(m, a[i + 1]), addV(m, b[i + 1]), addV(m, b[i])], g, "vault");
        }
      }
      // Iron ribs at both ends + middle.
      for (const z of [z0, 0, z1]) {
        const a = archAt(z);
        for (let i = 0; i < a.length - 1; i++) {
          tube(m, `rib_${z}_${i}`, mat("iron"), [a[i], a[i + 1]], [0.05, 0.05], 3, { capEnds: false });
        }
      }
      // End gables (glass tympanum).
      const endGlass = (z: number, nz: number) => {
        const a = archAt(z);
        for (let i = 0; i < a.length - 1; i++) {
          addFace(m, `end_${z}_${i}`, [addV(m, [a[i][0], a[i][1], z + nz * 0.01]), addV(m, [a[i + 1][0], a[i + 1][1], z + nz * 0.01]), addV(m, [0, 0.6, z + nz * 0.01])], mat("glassGreen"), "endglass");
        }
      };
      endGlass(z0, -1);
      endGlass(z1, 1);
      // Central raised octagonal dome.
      dome(m, "cdome", 0, 0, 3.2, 1.4, 1.0, 1.2, 8);
      void rng;
    },
  });

// ── Obelisk plaza island ────────────────────────────────────────────────────
const obeliskPlaza = () =>
  sculpt({
    id: "obj_c_obelisk_plaza",
    name: "Obelisk of the Mouthstone",
    materialKeys: ["wetMarble", "ashlarShadow", "obsidian", "gold", "iron", "ember"],
    footprint: rectFootprint(5, 5),
    build: (m, rng) => {
      // Circular stepped plinth.
      lathe(m, "step0", mat("ashlarShadow"), [[2.4, 0], [2.4, 0.25]], 16, { capBottom: true, capTop: false });
      lathe(m, "step1", mat("wetMarble"), [[2.0, 0.25], [2.0, 0.5]], 16, { capBottom: false, capTop: false });
      lathe(m, "step2", mat("ashlarShadow"), [[1.6, 0.5], [1.6, 0.72]], 16, { capBottom: false, capTop: true });
      // Central black obelisk, tapered, gold-banded, pyramidion cap.
      const oy0 = 0.72, oy1 = 5.4;
      const hb = 0.5, ht = 0.28;
      const corners = (h: number, y: number): V3[] => [
        [-h, y, -h], [h, y, -h], [h, y, h], [-h, y, h],
      ];
      const cb = corners(hb, oy0).map((v) => addV(m, v));
      const ct = corners(ht, oy1).map((v) => addV(m, v));
      for (let i = 0; i < 4; i++) addFace(m, `ob_${i}`, [cb[i], cb[(i + 1) % 4], ct[(i + 1) % 4], ct[i]], mat("obsidian"), "obelisk");
      // Gold engraving bands.
      for (const y of [1.6, 2.8, 4.0]) {
        const t = (y - oy0) / (oy1 - oy0);
        const h = hb + (ht - hb) * t + 0.02;
        const r = corners(h, y).map((v) => addV(m, v));
        const r2 = corners(h, y + 0.12).map((v) => addV(m, v));
        for (let i = 0; i < 4; i++) addFace(m, `band_${y}_${i}`, [r[i], r[(i + 1) % 4], r2[(i + 1) % 4], r2[i]], mat("gold"), "band");
      }
      // Pyramidion.
      const apex = addV(m, [0, oy1 + 0.6, 0]);
      for (let i = 0; i < 4; i++) addFace(m, `pyr_${i}`, [ct[i], ct[(i + 1) % 4], apex], mat("gold"), "pyramidion");
      // Four braziers at the platform rim.
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const bx = Math.cos(a) * 1.3, bz = Math.sin(a) * 1.3;
        tube(m, `brz_${i}`, mat("iron"), [[bx, 0.72, bz], [bx, 1.3, bz]], [0.06, 0.05], 5);
        lathe(m, `cup_${i}`, mat("iron"), [[0.12, 1.3], [0.2, 1.42], [0.16, 1.46]], 7, { center: [bx, 0, bz], capBottom: true, capTop: false });
        blob(m, `flame_${i}`, mat("ember"), [bx, 1.6, bz], [0.18, 0.36, 0.18], rng, 5, 2, 0.05);
      }
    },
  });

// ── Twin-spire church ───────────────────────────────────────────────────────
const twinSpireChurch = () =>
  sculpt({
    id: "obj_c_twin_spire",
    name: "Twin-Spire Church",
    materialKeys: ["ashlar", "ashlarShadow", "lead", "gold", "obsidian", "glassRose", "glassBlue", "glassGold", "glassViolet"],
    footprint: rectFootprint(7, 9),
    build: (m, rng) => {
      const zFront = 4, zBack = -4;
      box(m, "nave", mat("ashlar"), [-1.8, 0, zBack], [1.8, 4.6, zFront], "nave");
      // Steep gable roof.
      quad(m, "roof_w", mat("lead"), [-1.9, 4.6, zBack], [0, 6.4, zBack], [0, 6.4, zFront], [-1.9, 4.6, zFront], "roof");
      quad(m, "roof_e", mat("lead"), [0, 6.4, zBack], [1.9, 4.6, zBack], [1.9, 4.6, zFront], [0, 6.4, zFront], "roof");
      tri(m, "gable", mat("ashlar"), [-1.8, 4.6, zFront], [1.8, 4.6, zFront], [0, 6.4, zFront], "gable");
      // Twin towers flanking the front.
      box(m, "tw_w", mat("ashlar"), [-3.0, 0, zFront - 1.6], [-1.8, 7.0, zFront], "tower");
      box(m, "tw_e", mat("ashlar"), [1.8, 0, zFront - 1.6], [3.0, 7.0, zFront], "tower");
      // Belfry openings.
      quad(m, "blf_w", mat("obsidian"), [-2.9, 5.2, zFront + 0.01], [-1.9, 5.2, zFront + 0.01], [-1.9, 6.4, zFront + 0.01], [-2.9, 6.4, zFront + 0.01], "belfry");
      quad(m, "blf_e", mat("obsidian"), [1.9, 5.2, zFront + 0.01], [2.9, 5.2, zFront + 0.01], [2.9, 6.4, zFront + 0.01], [1.9, 6.4, zFront + 0.01], "belfry");
      // Tall octagonal spires.
      lathe(m, "sp_w", mat("lead"), [[0.62, 7.0], [0.4, 9.5], [0.18, 11.5], [0.04, 12.6]], 8, { center: [-2.4, 0, zFront - 0.8], capBottom: false, capTop: false });
      lathe(m, "sp_e", mat("lead"), [[0.62, 7.0], [0.4, 9.5], [0.18, 11.5], [0.04, 12.6]], 8, { center: [2.4, 0, zFront - 0.8], capBottom: false, capTop: false });
      box(m, "fin_w", mat("gold"), [-2.45, 12.6, zFront - 0.85], [-2.35, 13.1, zFront - 0.75], "fin");
      box(m, "fin_e", mat("gold"), [2.35, 12.6, zFront - 0.85], [2.45, 13.1, zFront - 0.75], "fin");
      // Rose window + portal on the front.
      const cy = 3.0, zf = zFront + 0.02, rr = 0.8, seg = 12;
      const ringF = circleProfile(seg, rr).map(([x, y]) => addV(m, [x, cy + y, zf]));
      const center = addV(m, [0, cy, zf]);
      for (let i = 0; i < seg; i++) addFace(m, `rose_${i}`, [center, ringF[i], ringF[(i + 1) % seg]], mat(GLASS[(i + 1) % GLASS.length]), "rose");
      box(m, "portal", mat("obsidian"), [-0.55, 0, zf], [0.55, 1.5, zf + 0.02], "portal");
      tri(m, "portal_arch", mat("obsidian"), [-0.55, 1.5, zf], [0.55, 1.5, zf], [0, 2.1, zf], "portal");
      void rng;
    },
  });

// ── Stone arch bridge ───────────────────────────────────────────────────────
const archBridge = () =>
  sculpt({
    id: "obj_c_arch_bridge",
    name: "Stone Arch Bridge",
    materialKeys: ["ashlar", "ashlarShadow", "wetMarble"],
    footprint: [[0, 0]],
    build: (m) => {
      // Spans along X over a canal running along Z.
      const seg = 8;
      const archPt = (x: number): number => 0.2 + Math.sin(Math.PI * ((x + 1.5) / 3)) * 0.55; // underside curve
      // Deck.
      box(m, "deck", mat("wetMarble"), [-1.5, 0.62, -0.5], [1.5, 0.74, 0.5], "deck");
      // Arch underside (two faces, front/back).
      for (let i = 0; i < seg; i++) {
        const xa = -1.5 + (i / seg) * 3, xb = -1.5 + ((i + 1) / seg) * 3;
        const ya = archPt(xa), yb = archPt(xb);
        quad(m, `arch_${i}`, mat("ashlarShadow"), [xa, ya, -0.5], [xb, yb, -0.5], [xb, yb, 0.5], [xa, ya, 0.5], "arch");
        // Spandrel face front.
        quad(m, `spf_${i}`, mat("ashlar"), [xa, ya, 0.5], [xb, yb, 0.5], [xb, 0.62, 0.5], [xa, 0.62, 0.5], "spandrel");
        quad(m, `spb_${i}`, mat("ashlar"), [xb, yb, -0.5], [xa, ya, -0.5], [xa, 0.62, -0.5], [xb, 0.62, -0.5], "spandrel");
      }
      // Parapets.
      box(m, "par_f", mat("ashlar"), [-1.5, 0.74, 0.42], [1.5, 1.1, 0.5], "parapet");
      box(m, "par_b", mat("ashlar"), [-1.5, 0.74, -0.5], [1.5, 1.1, -0.42], "parapet");
    },
  });

export const createCityKit = (): ObjectData[] => [
  grandCathedral(),
  glassConservatory(),
  obeliskPlaza(),
  twinSpireChurch(),
  archBridge(),
];

import type {
  ObjectData,
  ObjectMaterialData,
  ObjectMeshData,
  ObjectPart,
} from "../schema/game";
import {
  createMeshFromParts,
  getMeshBounds,
  recomputeMeshNormals,
} from "./meshModel";

// Alderamontico favors readable silhouettes over busy surface detail:
// Greek plinths and columns crossed with gothic lancets, stained glass, and
// clean low-poly masses that still feel like a strange, colorful world.
type Vec3 = [number, number, number];
type Shape = ObjectPart["shape"];
type MaterialKey = keyof typeof ALDERAMONTICO_MATERIALS;

const makeMaterial = (
  id: string,
  name: string,
  color: string,
  texture_kind: ObjectMaterialData["texture_kind"],
  options: Partial<
    Pick<
      ObjectMaterialData,
      | "emissive"
      | "emissive_intensity"
      | "opacity"
      | "transparent"
      | "roughness"
      | "metalness"
      | "texture_scale"
      | "texture_strength"
      | "texture_image_url"
    >
  > = {},
): ObjectMaterialData => ({
  id,
  name,
  color,
  emissive: options.emissive || "#000000",
  emissive_intensity: options.emissive_intensity ?? 0,
  opacity: options.opacity ?? 1,
  transparent: options.transparent ?? false,
  roughness: options.roughness ?? 0.68,
  metalness: options.metalness ?? 0.03,
  texture_kind,
  texture_scale: options.texture_scale ?? 1.05,
  texture_strength: options.texture_strength ?? 0.36,
  texture_image_url: options.texture_image_url,
});

const BUILDING_TEXTURE_ROOT = "/textures/alderamontico/buildings/cropped";
const buildingTexture = (file: string) => `${BUILDING_TEXTURE_ROOT}/${file}.png`;
const GROUND_TEXTURE_ROOT = "/textures/alderamontico/ground/cropped";
const groundTexture = (file: string) => `${GROUND_TEXTURE_ROOT}/${file}.png`;
const BUILDING_TEXTURES = {
  wallBlackAshlar: buildingTexture("wall_exterior_black_ashlar"),
  wallSootVioletBrick: buildingTexture("wall_exterior_soot_violet_brick"),
  wallFieldstone: buildingTexture("wall_exterior_fieldstone_plaster"),
  wallTimber: buildingTexture("wall_exterior_timber_plaster"),
  wallChurch: buildingTexture("wall_exterior_church_marble"),
  wallLowBoundary: buildingTexture("wall_exterior_low_boundary_stone"),
  wallOssuary: buildingTexture("wall_exterior_ossuary_bone_stone"),
  wallCatacomb: buildingTexture("wall_interior_catacomb_black_bone"),
  roofSlate: buildingTexture("roof_black_glass_slate"),
  roofClay: buildingTexture("roof_ochre_clay_violet"),
  roofFlat: buildingTexture("roof_flat_courtyard_iridescent"),
  roofHip: buildingTexture("roof_hip_diagonal_seams"),
} as const;
const GROUND_TEXTURES = {
  wetBlackMarble: groundTexture("wet_black_marble_paving"),
  paleChurchStone: groundTexture("pale_church_stone_plaza"),
  muddyParishGround: groundTexture("muddy_parish_ground"),
  darkSacredGrassSoil: groundTexture("dark_sacred_grass_soil"),
  dampCaveFloorStone: groundTexture("damp_cave_floor_stone"),
  glassTouchedContamination: groundTexture("glass_touched_contamination"),
} as const;

const ALDERAMONTICO_MATERIALS = {
  blackGlass: makeMaterial("ald_black_glass", "Violet Obsidian Rain Glass", "#28213E", "glass_facets", {
    emissive: "#140E2A",
    emissive_intensity: 0.1,
    roughness: 0.38,
    metalness: 0.1,
    texture_scale: 1.55,
    texture_strength: 0.38,
  }),
  blackStone: makeMaterial("ald_black_stone", "Storm-Lavender Basilica Stone", "#46516D", "stone_grain", {
    roughness: 0.8,
    texture_scale: 1.65,
    texture_strength: 0.34,
  }),
  ashlar: makeMaterial("ald_ashlar", "Violet Ashlar Marble", "#B4A9BD", "marble_veins", {
    roughness: 0.68,
    texture_scale: 1.45,
    texture_strength: 0.28,
  }),
  paleMarble: makeMaterial("ald_pale_marble", "Pale Shrine Marble", "#E6D7BD", "marble_veins", {
    roughness: 0.66,
    texture_scale: 1.5,
    texture_strength: 0.3,
  }),
  wetPaving: makeMaterial("ald_wet_paving", "Iridescent Processional Paving", "#4F586D", "marble_veins", {
    emissive: "#172B3B",
    emissive_intensity: 0.12,
    roughness: 0.38,
    texture_scale: 1.6,
    texture_strength: 0.36,
  }),
  soil: makeMaterial("ald_soil", "Violet Processional Soil", "#4A3653", "soil_grit", {
    roughness: 0.9,
    texture_scale: 1.55,
    texture_strength: 0.32,
  }),
  moss: makeMaterial("ald_moss", "Bright Rain Moss", "#668C55", "soil_grit", {
    roughness: 0.82,
    texture_scale: 1.35,
    texture_strength: 0.3,
  }),
  darkWood: makeMaterial("ald_dark_wood", "Rose-Violet Cedar", "#653B52", "wood_grain", {
    roughness: 0.74,
    texture_scale: 1.45,
    texture_strength: 0.34,
  }),
  oldWood: makeMaterial("ald_old_wood", "Warm Processional Cedar", "#A8693E", "wood_grain", {
    roughness: 0.68,
    texture_scale: 1.35,
    texture_strength: 0.32,
  }),
  parchment: makeMaterial("ald_parchment", "Honey Parchment", "#D9BE83", "paper_fiber", {
    roughness: 0.82,
    texture_scale: 1.45,
    texture_strength: 0.3,
  }),
  brass: makeMaterial("ald_brass", "Warm Brass", "#D6A84F", "metal_scratches", {
    roughness: 0.34,
    metalness: 0.72,
    texture_scale: 1.2,
    texture_strength: 0.28,
  }),
  oldGold: makeMaterial("ald_old_gold", "Sacred Sun Gold", "#FFD56E", "metal_scratches", {
    emissive: "#2A1904",
    emissive_intensity: 0.1,
    roughness: 0.38,
    metalness: 0.7,
    texture_scale: 1.25,
    texture_strength: 0.28,
  }),
  iron: makeMaterial("ald_black_iron", "Blue Tempered Iron", "#344358", "metal_scratches", {
    roughness: 0.5,
    metalness: 0.68,
    texture_scale: 1.35,
    texture_strength: 0.3,
  }),
  copper: makeMaterial("ald_verdigris_copper", "Verdigris Copper", "#4F8C7C", "metal_scratches", {
    roughness: 0.46,
    metalness: 0.54,
    texture_scale: 1.25,
    texture_strength: 0.26,
  }),
  glassCyan: makeMaterial("ald_glass_cyan", "Cyan Stained Glass", "#43D6DF", "glass_facets", {
    emissive: "#20B8CC",
    emissive_intensity: 0.62,
    opacity: 0.82,
    transparent: true,
    roughness: 0.2,
    texture_scale: 1.65,
    texture_strength: 0.42,
  }),
  glassViolet: makeMaterial("ald_glass_violet", "Violet Stained Glass", "#9B63E6", "glass_facets", {
    emissive: "#5A2BA6",
    emissive_intensity: 0.5,
    opacity: 0.8,
    transparent: true,
    roughness: 0.2,
    texture_scale: 1.65,
    texture_strength: 0.42,
  }),
  glassRed: makeMaterial("ald_glass_red", "Rose Stained Glass", "#D24B62", "glass_facets", {
    emissive: "#8A1B35",
    emissive_intensity: 0.4,
    opacity: 0.82,
    transparent: true,
    roughness: 0.22,
    texture_scale: 1.65,
    texture_strength: 0.4,
  }),
  flame: makeMaterial("ald_flame", "Candle Flame", "#FFC365", "none", {
    emissive: "#FF8C2B",
    emissive_intensity: 1.5,
    roughness: 0.2,
  }),
  candle: makeMaterial("ald_candle_wax", "Prayer Wax", "#E7D7B2", "cloth_weave", {
    roughness: 0.78,
    texture_scale: 1.05,
    texture_strength: 0.2,
  }),
  blood: makeMaterial("ald_witness_blood", "Witness Blood", "#B51F3F", "blood_sheen", {
    roughness: 0.28,
    texture_scale: 1.25,
    texture_strength: 0.38,
  }),
  bone: makeMaterial("ald_bone", "Old Ivory Bone", "#D2C4A4", "bone_pores", {
    roughness: 0.76,
    texture_scale: 1.45,
    texture_strength: 0.28,
  }),
  water: makeMaterial("ald_oily_water", "Oily Star Water", "#205766", "water_shimmer", {
    emissive: "#15566C",
    emissive_intensity: 0.22,
    opacity: 0.9,
    transparent: true,
    roughness: 0.22,
    texture_scale: 1.8,
    texture_strength: 0.46,
  }),
  soot: makeMaterial("ald_soot", "Sooted Purple Brick", "#493445", "soil_grit", {
    roughness: 0.9,
    texture_scale: 1.55,
    texture_strength: 0.28,
  }),
  leafDark: makeMaterial("ald_dark_leaf", "Deep Cypress Green", "#376A44", "soil_grit", {
    roughness: 0.82,
    texture_scale: 1.45,
    texture_strength: 0.3,
  }),
  deadBark: makeMaterial("ald_dead_bark", "Grey-Violet Dead Bark", "#7A6B76", "wood_grain", {
    roughness: 0.82,
    texture_scale: 1.35,
    texture_strength: 0.28,
  }),
} as const;

const materialId = (key: MaterialKey) => ALDERAMONTICO_MATERIALS[key].id;

const part = (
  shape: Shape,
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  rotation: Vec3 = [0, 0, 0],
  segments?: number,
): ObjectPart => ({
  shape,
  name,
  position,
  rotation,
  size,
  material: materialId(material),
  ...(segments ? { segments } : {}),
});

const box = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  rotation: Vec3 = [0, 0, 0],
) => part("box", name, position, size, material, rotation);

const slab = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  rotation: Vec3 = [0, 0, 0],
) => part("slab", name, position, size, material, rotation);

const cylinder = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  segments = 8,
  rotation: Vec3 = [0, 0, 0],
) => part("cylinder", name, position, size, material, rotation, segments);

const cone = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  segments = 8,
  rotation: Vec3 = [0, 0, 0],
) => part("cone", name, position, size, material, rotation, segments);

const sphere = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  segments = 10,
) => part("sphere", name, position, size, material, [0, 0, 0], segments);

const plane = (
  name: string,
  position: Vec3,
  size: Vec3,
  material: MaterialKey,
  rotation: Vec3 = [0, 0, 0],
) => part("plane", name, position, size, material, rotation);

const withGlassPanel = (
  prefix: string,
  z: number,
  y: number,
  width: number,
  height: number,
  glass: MaterialKey = "glassCyan",
) => [
  plane(`${prefix}_glass`, [0, y, z], [width, 0.02, height], glass),
  box(`${prefix}_sill`, [0, y - height / 2 - 0.04, z + 0.016], [width + 0.18, 0.08, 0.045], "paleMarble"),
  box(`${prefix}_frame_l`, [-width / 2, y, z + 0.018], [0.05, height, 0.04], "oldGold"),
  box(`${prefix}_frame_r`, [width / 2, y, z + 0.018], [0.05, height, 0.04], "oldGold"),
  box(`${prefix}_mullion`, [0, y, z + 0.02], [0.035, height * 0.82, 0.04], "iron"),
  box(`${prefix}_gable_l`, [-width * 0.2, y + height / 2 + 0.08, z + 0.022], [width * 0.54, 0.05, 0.04], "oldGold", [0, 0, 0.5]),
  box(`${prefix}_gable_r`, [width * 0.2, y + height / 2 + 0.08, z + 0.022], [width * 0.54, 0.05, 0.04], "oldGold", [0, 0, -0.5]),
];

const materialSettings = (
  keys: MaterialKey[],
  plain = false,
  imageTextures: Partial<Record<MaterialKey, string>> = {},
) =>
  Array.from(new Set(keys)).map((key) => {
    const material = ALDERAMONTICO_MATERIALS[key];
    const base = plain
      ? {
          ...material,
          texture_kind: "none" as const,
          texture_scale: 1,
          texture_strength: 0,
        }
      : material;
    const textureImageUrl = imageTextures[key];
    const isWallTexture =
      Boolean(textureImageUrl) &&
      /\/wall_|wall_/.test(textureImageUrl || "");
    const isGroundTexture =
      Boolean(textureImageUrl) &&
      /\/ground\//.test(textureImageUrl || "");
    return textureImageUrl
      ? {
          ...base,
          color: "#FFFFFF",
          emissive: isWallTexture ? "#24202A" : base.emissive,
          emissive_intensity: isWallTexture ? 0.28 : base.emissive_intensity,
          texture_kind: "none" as const,
          texture_scale: isWallTexture ? 1.35 : isGroundTexture ? 1 : 1,
          texture_strength: 0,
          texture_image_url: textureImageUrl,
        }
      : base;
  });

const makeMeshModel = (
  base: ObjectData,
  parts: ObjectPart[],
  keys: MaterialKey[],
  boundsOverride?: Vec3,
  plainMaterials = false,
  imageTextures: Partial<Record<MaterialKey, string>> = {},
): ObjectData => {
  const materials = Array.from(new Set(keys.map(materialId)));
  const source = {
    ...base,
    materials,
    material_settings: materialSettings(keys, plainMaterials, imageTextures),
    model_kind: "parts" as const,
    parts,
  } as ObjectData;
  const mesh = recomputeMeshNormals(createMeshFromParts(source));
  const next = {
    ...base,
    bounds: boundsOverride || getMeshBounds(mesh),
    materials,
    material_settings: materialSettings(keys, plainMaterials, imageTextures),
    model_kind: "mesh" as const,
    parts: [],
    mesh,
    decals: base.decals || [],
    reference_images: base.reference_images || [],
  } as ObjectData;

  delete (next as any).asset;
  return next;
};

const emptyMesh = (): ObjectMeshData => ({
  vertices: [],
  faces: [],
  material_slots: [],
  groups: [],
});

const pushMeshFace = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  vertices: Vec3[],
  group = "roof",
) => {
  const start = mesh.vertices.length;
  vertices.forEach((vertex) => mesh.vertices.push(vertex));
  mesh.faces.push({
    name,
    vertices: vertices.map((_, index) => start + index),
    material: materialId(material),
    group,
  });
};

const makeDirectMeshModel = (
  base: ObjectData,
  mesh: ObjectMeshData,
  keys: MaterialKey[],
  boundsOverride?: Vec3,
  plainMaterials = false,
  imageTextures: Partial<Record<MaterialKey, string>> = {},
): ObjectData => {
  const materialSlots = Array.from(new Set(keys.map(materialId)));
  const normalizedMesh = recomputeMeshNormals({
    ...mesh,
    material_slots: materialSlots,
    groups: Array.from(new Set(mesh.faces.map((face) => face.group || "mesh"))),
  });
  const next = {
    ...base,
    bounds: boundsOverride || getMeshBounds(normalizedMesh),
    materials: materialSlots,
    material_settings: materialSettings(keys, plainMaterials, imageTextures),
    model_kind: "mesh" as const,
    parts: [],
    mesh: normalizedMesh,
    decals: base.decals || [],
    reference_images: base.reference_images || [],
  } as ObjectData;

  delete (next as any).asset;
  return next;
};

const sculptedSlab = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  center: Vec3,
  size: Vec3,
  taper = 0.035,
  lean: Vec3 = [0, 0, 0],
  group = "sculpt",
) => {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  const hx = sx / 2;
  const hz = sz / 2;
  const y0 = cy - sy / 2;
  const y1 = cy + sy / 2;
  const t = Math.min(hx * 0.45, hz * 0.45, taper);
  const bottom: Vec3[] = [
    [cx - hx, y0, cz - hz],
    [cx + hx, y0, cz - hz],
    [cx + hx, y0, cz + hz],
    [cx - hx, y0, cz + hz],
  ];
  const top: Vec3[] = [
    [cx - hx + t + lean[0], y1 + lean[1], cz - hz + t + lean[2]],
    [cx + hx - t + lean[0], y1 + lean[1], cz - hz + t + lean[2]],
    [cx + hx - t + lean[0], y1 + lean[1], cz + hz - t + lean[2]],
    [cx - hx + t + lean[0], y1 + lean[1], cz + hz - t + lean[2]],
  ];

  pushMeshFace(mesh, `${name}_top`, material, top, group);
  pushMeshFace(mesh, `${name}_bottom`, material, [...bottom].reverse(), group);
  for (let i = 0; i < 4; i += 1) {
    const next = (i + 1) % 4;
    pushMeshFace(mesh, `${name}_side_${i}`, material, [bottom[i], bottom[next], top[next], top[i]], group);
  }
};

const sculptRing = (
  center: Vec3,
  rx: number,
  rz: number,
  count = 8,
  phase = 0,
  irregularity = 0.04,
) => {
  const [cx, cy, cz] = center;
  return Array.from({ length: count }, (_, index): Vec3 => {
    const angle = (Math.PI * 2 * index) / count + phase;
    const wobble = 1 + irregularity * Math.sin(index * 2.37 + phase * 4.1);
    return [
      cx + Math.cos(angle) * rx * wobble,
      cy,
      cz + Math.sin(angle) * rz * (1 + irregularity * Math.cos(index * 1.73 + phase)),
    ];
  });
};

const loftRings = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  rings: Vec3[][],
  group = "sculpt",
) => {
  for (let r = 0; r < rings.length - 1; r += 1) {
    const a = rings[r];
    const b = rings[r + 1];
    const count = Math.min(a.length, b.length);
    for (let i = 0; i < count; i += 1) {
      const next = (i + 1) % count;
      pushMeshFace(mesh, `${name}_side_${r}_${i}`, material, [a[i], a[next], b[next], b[i]], group);
    }
  }
  if (rings[0]?.length >= 3) {
    pushMeshFace(mesh, `${name}_cap_bottom`, material, [...rings[0]].reverse(), group);
  }
  const last = rings[rings.length - 1];
  if (last?.length >= 3) {
    pushMeshFace(mesh, `${name}_cap_top`, material, last, group);
  }
};

const sculptedColumn = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  center: Vec3,
  height: number,
  radius: number,
  count = 8,
  lean: Vec3 = [0, 0, 0],
  group = "sculpt",
) => {
  const [cx, cy, cz] = center;
  const bottomY = cy - height / 2;
  const topY = cy + height / 2;
  loftRings(
    mesh,
    name,
    material,
    [
      sculptRing([cx, bottomY, cz], radius * 1.08, radius * 0.92, count, 0, 0.03),
      sculptRing([cx + lean[0] * 0.35, cy, cz + lean[2] * 0.35], radius * 0.9, radius, count, 0.12, 0.05),
      sculptRing([cx + lean[0], topY + lean[1], cz + lean[2]], radius * 0.72, radius * 0.82, count, 0.2, 0.05),
    ],
    group,
  );
};

const sculptedOvoid = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  center: Vec3,
  size: Vec3,
  count = 8,
  group = "sculpt",
) => {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  loftRings(
    mesh,
    name,
    material,
    [
      sculptRing([cx, cy - sy * 0.44, cz], sx * 0.08, sz * 0.08, count, 0.1, 0.08),
      sculptRing([cx - sx * 0.03, cy - sy * 0.18, cz + sz * 0.02], sx * 0.38, sz * 0.34, count, 0.35, 0.1),
      sculptRing([cx + sx * 0.02, cy + sy * 0.12, cz - sz * 0.01], sx * 0.48, sz * 0.42, count, 0.55, 0.09),
      sculptRing([cx, cy + sy * 0.42, cz], sx * 0.12, sz * 0.1, count, 0.8, 0.08),
    ],
    group,
  );
};

const sculptedPyramid = (
  mesh: ObjectMeshData,
  name: string,
  material: MaterialKey,
  center: Vec3,
  size: Vec3,
  group = "sculpt",
) => {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  const y0 = cy - sy / 2;
  const apex: Vec3 = [cx, cy + sy / 2, cz];
  const base: Vec3[] = [
    [cx - sx / 2, y0, cz - sz / 2],
    [cx + sx / 2, y0, cz - sz / 2],
    [cx + sx / 2, y0, cz + sz / 2],
    [cx - sx / 2, y0, cz + sz / 2],
  ];
  pushMeshFace(mesh, `${name}_base`, material, [...base].reverse(), group);
  for (let i = 0; i < 4; i += 1) {
    const next = (i + 1) % 4;
    pushMeshFace(mesh, `${name}_face_${i}`, material, [base[i], base[next], apex], group);
  }
};

const terrainModel = (
  base: ObjectData,
  material: MaterialKey,
  accent?: MaterialKey,
  textureImageUrl?: string,
) => {
  const keys = textureImageUrl || !accent ? [material] : [material, accent];
  const details = accent && !textureImageUrl
    ? [
        box("procession_axis_a", [0, 0.024, 0], [0.78, 0.012, 0.035], accent),
        box("procession_axis_b", [0, 0.026, 0], [0.035, 0.012, 0.78], accent),
        box("center_tessera", [0, 0.028, 0], [0.14, 0.014, 0.14], accent, [0, 0.78, 0]),
      ]
    : [];
  return makeMeshModel(
    base,
    [plane("surface", [0, 0.01, 0], [1, 0.01, 1], material, [-Math.PI / 2, 0, 0]), ...details],
    keys,
    [1, 0.04, 1],
    Boolean(textureImageUrl),
    textureImageUrl ? { [material]: textureImageUrl } : {},
  );
};

const flatWallModel = (
  base: ObjectData,
  material: MaterialKey,
  textureImageUrl: string,
  height = base.tags?.includes("low_wall") ? 1.08 : 2.06,
) =>
  makeMeshModel(
    base,
    [box("texture_wall_block", [0, height / 2, 0], [1, height, 1], material)],
    [material],
    [1, height, 1],
    true,
    { [material]: textureImageUrl },
  );

const gothicStoneWall = (base: ObjectData) =>
  flatWallModel(base, "blackStone", BUILDING_TEXTURES.wallBlackAshlar);

const sootBrickWall = (base: ObjectData) =>
  flatWallModel(base, "soot", BUILDING_TEXTURES.wallSootVioletBrick);

const networkWall = (base: ObjectData, ossuary = false) =>
  flatWallModel(
    base,
    ossuary ? "bone" : "blackStone",
    ossuary ? BUILDING_TEXTURES.wallOssuary : BUILDING_TEXTURES.wallCatacomb,
  );

const parishFieldstoneWall = (base: ObjectData) =>
  flatWallModel(base, "ashlar", BUILDING_TEXTURES.wallFieldstone);

const parishTimberWall = (base: ObjectData) =>
  flatWallModel(base, "oldWood", BUILDING_TEXTURES.wallTimber);

const parishChurchWall = (base: ObjectData) =>
  flatWallModel(base, "paleMarble", BUILDING_TEXTURES.wallChurch);

const parishLowWall = (base: ObjectData) =>
  flatWallModel(base, "blackStone", BUILDING_TEXTURES.wallLowBoundary, 1.08);

type RoofPiece = "flat" | "n" | "s" | "e" | "w" | "nw" | "ne" | "se" | "sw";

const ROOF_RIDGE_Y = 0.94;
const ROOF_EAVE_Y = 0.06;
const ROOF_OVERHANG = 0.08;

const rotateRoofPoint = (point: Vec3, rotQuarters: number): Vec3 => {
  const normalized = ((rotQuarters % 4) + 4) % 4;
  const c = [1, 0, -1, 0][normalized];
  const s = [0, 1, 0, -1][normalized];
  return [point[0] * c - point[2] * s, point[1], point[0] * s + point[2] * c];
};

const roofSlopeRotation: Record<Exclude<RoofPiece, "flat" | "nw" | "ne" | "se" | "sw">, number> = {
  s: 0,
  w: 1,
  n: 2,
  e: 3,
};

const roofHipRotation: Record<Extract<RoofPiece, "nw" | "ne" | "se" | "sw">, number> = {
  nw: 0,
  ne: 1,
  se: 2,
  sw: 3,
};

const buildRoofSlopeMesh = (surface: MaterialKey, direction: keyof typeof roofSlopeRotation) => {
  const mesh = emptyMesh();
  const hx = 0.5 + ROOF_OVERHANG;
  const lowZ = 0.5 + ROOF_OVERHANG;
  const highZ = -0.5;
  const rot = roofSlopeRotation[direction];
  const r = (point: Vec3) => rotateRoofPoint(point, rot);
  const tA: Vec3 = [-hx, ROOF_RIDGE_Y, highZ];
  const tB: Vec3 = [hx, ROOF_RIDGE_Y, highZ];
  const tC: Vec3 = [hx, ROOF_EAVE_Y, lowZ];
  const tD: Vec3 = [-hx, ROOF_EAVE_Y, lowZ];

  pushMeshFace(mesh, "slope_top", surface, [r(tA), r(tB), r(tC), r(tD)]);

  return mesh;
};

const buildRoofHipMesh = (surface: MaterialKey, corner: keyof typeof roofHipRotation) => {
  const mesh = emptyMesh();
  const o = 0.5 + ROOF_OVERHANG;
  const rot = roofHipRotation[corner];
  const r = (point: Vec3) => rotateRoofPoint(point, rot);
  const NW: Vec3 = [-o, ROOF_EAVE_Y, -o];
  const NE: Vec3 = [0.5, ROOF_EAVE_Y, -o];
  const SE: Vec3 = [0.5, ROOF_RIDGE_Y, 0.5];
  const SW: Vec3 = [-o, ROOF_EAVE_Y, 0.5];

  pushMeshFace(mesh, "hip_corner_top_a", surface, [r(NW), r(NE), r(SE)]);
  pushMeshFace(mesh, "hip_corner_top_b", surface, [r(NW), r(SE), r(SW)]);

  return mesh;
};

const buildRoofFlatMesh = (surface: MaterialKey) => {
  const mesh = emptyMesh();
  const o = 0.5 + ROOF_OVERHANG;
  const topY = ROOF_RIDGE_Y;
  pushMeshFace(mesh, "flat_top", surface, [[-o, topY, -o], [o, topY, -o], [o, topY, o], [-o, topY, o]]);
  return mesh;
};

const roofModel = (base: ObjectData, clay = false, piece: RoofPiece = "flat") => {
  const roof = clay ? "oldWood" : "blackGlass";
  const textureImageUrl =
    piece === "flat"
      ? clay
        ? BUILDING_TEXTURES.roofClay
        : BUILDING_TEXTURES.roofFlat
      : piece === "n" || piece === "s" || piece === "e" || piece === "w"
        ? clay
          ? BUILDING_TEXTURES.roofClay
          : BUILDING_TEXTURES.roofSlate
        : clay
          ? BUILDING_TEXTURES.roofClay
          : BUILDING_TEXTURES.roofHip;
  const mesh =
    piece === "flat"
      ? buildRoofFlatMesh(roof)
      : piece === "n" || piece === "s" || piece === "e" || piece === "w"
        ? buildRoofSlopeMesh(roof, piece)
        : buildRoofHipMesh(roof, piece);

  const next = makeDirectMeshModel(base, mesh, [roof], [1.2, 1.02, 1.2], true, {
    [roof]: textureImageUrl,
  });

  return {
    ...next,
    tags: Array.from(new Set([...(base.tags || []).filter((tag) => tag !== "floor"), "roof"])),
    collision:
      base.collision.profile === "none"
        ? { profile: "single" as const, footprint: [[0, 0]] as [number, number][] }
        : base.collision,
  };
};

const doorwayModel = (base: ObjectData) =>
  makeMeshModel(
    {
      ...base,
      tags: Array.from(new Set([...(base.tags || []), "door", "interactable"])),
      collision: { profile: "none", footprint: [[0, 0]] },
    },
    [
      box("pale_threshold_slab", [0, 0.05, 0], [1.06, 0.1, 0.38], "paleMarble"),
      box("left_violet_jamb", [-0.46, 0.98, 0], [0.16, 1.86, 0.24], "ashlar"),
      box("right_violet_jamb", [0.46, 0.98, 0], [0.16, 1.86, 0.24], "ashlar"),
      box("warm_lintel", [0, 1.85, 0], [1.08, 0.16, 0.28], "paleMarble"),
      cone("gold_pointed_arch", [0, 2.02, 0], [0.6, 0.34, 0.2], "oldGold", 4, [0, 0, Math.PI / 4]),
      box("cedar_leaf", [0, 0.86, 0.05], [0.66, 1.48, 0.08], "oldWood"),
      box("left_rose_plank", [-0.2, 0.85, 0.105], [0.09, 1.34, 0.035], "darkWood"),
      box("right_rose_plank", [0.2, 0.85, 0.105], [0.09, 1.34, 0.035], "darkWood"),
      box("center_split", [0, 0.88, 0.13], [0.035, 1.38, 0.03], "brass"),
      box("low_brass_strap", [0, 0.48, 0.14], [0.54, 0.055, 0.035], "brass"),
      box("high_brass_strap", [0, 1.2, 0.14], [0.54, 0.055, 0.035], "brass"),
      box("gold_pull_plate", [0.22, 0.88, 0.15], [0.12, 0.2, 0.04], "oldGold"),
      box("stained_slit", [0, 1.48, 0.145], [0.16, 0.32, 0.026], "glassCyan"),
      box("violet_transom", [0, 1.68, 0.15], [0.34, 0.055, 0.026], "glassViolet"),
    ],
    ["paleMarble", "ashlar", "oldWood", "darkWood", "brass", "oldGold", "glassCyan", "glassViolet"],
    [1, 2.16, 0.34],
    true,
  );

const lanternPost = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "pale_round_plinth", "paleMarble", [0, 0.12, 0], 0.24, 0.2, 9);
  sculptedColumn(mesh, "verdigris_stem", "copper", [0, 0.92, 0], 1.62, 0.052, 7, [0.04, 0, -0.02]);
  sculptedSlab(mesh, "wide_brass_arm", "brass", [0.32, 1.7, 0], [0.72, 0.08, 0.09], 0.02, [0.04, 0.02, 0]);
  sculptedPyramid(mesh, "little_arch_finial", "oldGold", [0.02, 1.84, 0], [0.2, 0.34, 0.2]);
  sculptedColumn(mesh, "chain_drop", "brass", [0.66, 1.5, 0], 0.42, 0.025, 5, [0.012, 0, 0.006]);
  sculptedSlab(mesh, "lantern_floor", "oldGold", [0.66, 0.94, 0], [0.34, 0.09, 0.34], 0.025);
  sculptedSlab(mesh, "lantern_roof", "oldGold", [0.66, 1.43, 0], [0.38, 0.09, 0.38], 0.03);
  for (const [x, z] of [[0.5, -0.14], [0.82, -0.14], [0.82, 0.14], [0.5, 0.14]] as [number, number][]) {
    sculptedColumn(mesh, `cage_post_${x}_${z}`, "brass", [x, 1.16, z], 0.46, 0.022, 4);
  }
  sculptedSlab(mesh, "cyan_glass_face", "glassCyan", [0.66, 1.16, 0.165], [0.24, 0.36, 0.02], 0.006);
  sculptedSlab(mesh, "violet_glass_back", "glassViolet", [0.66, 1.16, -0.165], [0.24, 0.36, 0.02], 0.006);
  sculptedSlab(mesh, "rose_glass_side", "glassRed", [0.49, 1.16, 0], [0.02, 0.34, 0.24], 0.006);
  sculptedOvoid(mesh, "large_visible_flame", "flame", [0.66, 1.1, 0], [0.18, 0.32, 0.14], 7);
  sculptedPyramid(mesh, "violet_glass_cap", "glassViolet", [0.66, 1.58, 0], [0.38, 0.25, 0.38]);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "copper", "brass", "oldGold", "glassCyan", "glassViolet", "glassRed", "flame"]);
};

const reliquaryChest = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "cedar_body_bowed", "darkWood", [0, 0.32, 0], [0.84, 0.48, 0.58], 0.055, [0.01, 0, -0.01]);
  sculptedSlab(mesh, "heavy_lid", "oldWood", [0, 0.62, 0], [0.9, 0.16, 0.64], 0.07, [-0.015, 0.01, 0.01]);
  sculptedSlab(mesh, "front_gold_band", "oldGold", [0, 0.43, 0.31], [0.74, 0.065, 0.035], 0.01);
  sculptedSlab(mesh, "lock_plate", "brass", [0, 0.36, 0.34], [0.18, 0.2, 0.045], 0.012);
  sculptedSlab(mesh, "etched_cross_v", "oldGold", [0, 0.47, 0.365], [0.03, 0.32, 0.018], 0.004);
  sculptedSlab(mesh, "etched_cross_h", "oldGold", [0, 0.47, 0.37], [0.3, 0.03, 0.018], 0.004);
  sculptedSlab(mesh, "left_hinge", "iron", [-0.27, 0.64, -0.32], [0.14, 0.055, 0.04], 0.006);
  sculptedSlab(mesh, "right_hinge", "iron", [0.27, 0.64, -0.32], [0.14, 0.055, 0.04], 0.006);
  return makeDirectMeshModel(base, mesh, ["darkWood", "oldWood", "oldGold", "brass", "iron"]);
};

const tableModel = (base: ObjectData, desk = false) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "bowed_tabletop", "oldWood", [0, 0.72, 0], [1.18, 0.13, 0.74], 0.05, [0.015, 0.01, -0.012]);
  sculptedSlab(mesh, "marble_apron", "paleMarble", [0, 0.62, 0.39], [1.02, 0.2, 0.06], 0.02);
  sculptedColumn(mesh, "left_carved_leg", "darkWood", [-0.4, 0.36, -0.18], 0.68, 0.075, 6, [-0.015, 0, 0.01]);
  sculptedColumn(mesh, "right_carved_leg", "darkWood", [0.4, 0.36, 0.18], 0.68, 0.075, 6, [0.015, 0, -0.01]);
  sculptedColumn(mesh, "rear_left_leg", "darkWood", [-0.4, 0.34, 0.22], 0.64, 0.055, 5);
  sculptedColumn(mesh, "rear_right_leg", "darkWood", [0.4, 0.34, -0.22], 0.64, 0.055, 5);
  sculptedSlab(mesh, "thin_case_map", "parchment", [-0.12, 0.805, 0.02], [0.52, 0.024, 0.32], 0.012);
  sculptedSlab(mesh, "brass_compass", "brass", [0.28, 0.845, 0.14], [0.36, 0.035, 0.045], 0.006, [0.02, 0, 0.02]);
  sculptedOvoid(mesh, "obsidian_inkwell", "blackGlass", [0.24, 0.85, -0.18], [0.12, 0.1, 0.12], 6);
  if (desk) {
    sculptedSlab(mesh, "front_desk_panel", "darkWood", [0, 0.48, 0.35], [0.84, 0.25, 0.07], 0.022);
    sculptedSlab(mesh, "gold_pull", "oldGold", [0, 0.5, 0.4], [0.18, 0.045, 0.035], 0.005);
  }
  return makeDirectMeshModel(base, mesh, ["oldWood", "darkWood", "paleMarble", "parchment", "blackGlass", "brass", "oldGold"]);
};

const shelfModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "warped_back", "darkWood", [0, 1.0, -0.2], [0.98, 1.98, 0.08], 0.04, [0.02, 0, 0]);
  sculptedColumn(mesh, "left_side_stile", "oldWood", [-0.52, 1, 0], 2.0, 0.055, 6, [-0.01, 0, 0.02]);
  sculptedColumn(mesh, "right_side_stile", "oldWood", [0.52, 1, 0], 2.0, 0.055, 6, [0.015, 0, -0.01]);
  [0.38, 0.92, 1.46].forEach((y, i) => {
    sculptedSlab(mesh, `shelf_${i}`, "oldWood", [0, y, 0.02], [1.08, 0.075, 0.5], 0.025, [i % 2 ? -0.012 : 0.012, 0.004, 0]);
  });
  sculptedSlab(mesh, "open_codex_block", "parchment", [-0.16, 1.12, 0.22], [0.4, 0.38, 0.13], 0.025);
  sculptedSlab(mesh, "rose_volume", "glassRed", [0.25, 1.12, 0.22], [0.2, 0.44, 0.13], 0.018);
  sculptedSlab(mesh, "reliquary_cross_v", "oldGold", [0.24, 1.7, 0.25], [0.07, 0.44, 0.035], 0.004);
  sculptedSlab(mesh, "reliquary_cross_h", "oldGold", [0.24, 1.82, 0.26], [0.3, 0.055, 0.035], 0.004);
  return makeDirectMeshModel(base, mesh, ["darkWood", "oldWood", "parchment", "glassRed", "oldGold"]);
};

const noticeModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "left_post", "darkWood", [-0.42, 0.75, 0], 1.5, 0.045, 6, [-0.015, 0, 0.005]);
  sculptedColumn(mesh, "right_post", "darkWood", [0.42, 0.75, 0], 1.5, 0.045, 6, [0.012, 0, -0.006]);
  sculptedSlab(mesh, "arched_board", "oldWood", [0, 1.0, 0.03], [0.94, 0.88, 0.08], 0.055, [0.01, 0.015, 0]);
  sculptedPyramid(mesh, "small_pediment", "oldWood", [0, 1.49, 0.03], [0.74, 0.22, 0.08]);
  sculptedSlab(mesh, "single_decree", "parchment", [0, 1.04, 0.095], [0.54, 0.5, 0.022], 0.012);
  sculptedSlab(mesh, "gold_header", "oldGold", [0, 1.25, 0.12], [0.36, 0.04, 0.024], 0.004);
  sculptedOvoid(mesh, "rose_seal", "glassRed", [0.18, 0.88, 0.125], [0.11, 0.1, 0.035], 6);
  return makeDirectMeshModel(base, mesh, ["darkWood", "oldWood", "parchment", "oldGold", "glassRed"]);
};

const candleCluster = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "hammered_tray", "brass", [0, 0.05, 0], [0.84, 0.08, 0.4], 0.04);
  [-0.24, -0.03, 0.2].forEach((x, i) => {
    const height = 0.34 + i * 0.08;
    sculptedColumn(mesh, `soft_wax_${i}`, "candle", [x, 0.14 + height / 2, i === 1 ? -0.02 : 0.03], height, 0.04, 7);
    sculptedOvoid(mesh, `flame_${i}`, "flame", [x, 0.33 + height, i === 1 ? -0.02 : 0.03], [0.06, 0.13, 0.05], 6);
  });
  sculptedSlab(mesh, "rose_wax_tile", "glassRed", [0, 0.105, 0.12], [0.24, 0.025, 0.16], 0.008);
  return makeDirectMeshModel(base, mesh, ["brass", "candle", "flame", "glassRed"]);
};

const altarModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "violet_step", "blackStone", [0, 0.16, 0], [1.08, 0.32, 0.72], 0.06);
  sculptedSlab(mesh, "marble_cella", "paleMarble", [0, 0.56, 0], [0.8, 0.6, 0.54], 0.05, [0.01, 0.008, 0]);
  sculptedSlab(mesh, "gold_entablature", "oldGold", [0, 0.93, 0], [1.08, 0.18, 0.72], 0.05);
  sculptedColumn(mesh, "left_votive_column", "ashlar", [-0.34, 0.6, 0.29], 0.66, 0.055, 7);
  sculptedColumn(mesh, "right_votive_column", "ashlar", [0.34, 0.6, 0.29], 0.66, 0.055, 7);
  sculptedSlab(mesh, "cross_inlay_v", "oldGold", [0, 1.035, 0.03], [0.04, 0.045, 0.5], 0.005);
  sculptedSlab(mesh, "cross_inlay_h", "oldGold", [0, 1.045, 0.03], [0.56, 0.04, 0.04], 0.005);
  sculptedOvoid(mesh, "cyan_relic", "glassCyan", [0, 1.18, 0], [0.24, 0.24, 0.22], 7);
  sculptedOvoid(mesh, "rose_side_relic", "glassRed", [-0.26, 1.04, 0.1], [0.1, 0.12, 0.08], 6);
  return makeDirectMeshModel(base, mesh, ["blackStone", "paleMarble", "ashlar", "oldGold", "glassCyan", "glassRed"]);
};

const statueModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "pale_chipped_plinth", "paleMarble", [0, 0.16, 0], [0.76, 0.32, 0.58], 0.055);
  sculptedOvoid(mesh, "folded_robe_mass", "ashlar", [0, 0.78, 0], [0.54, 1.02, 0.46], 7);
  sculptedSlab(mesh, "robe_front_fold", "paleMarble", [0, 0.75, 0.25], [0.32, 0.84, 0.055], 0.02, [0, 0.01, 0.005]);
  sculptedOvoid(mesh, "abstract_head", "paleMarble", [0, 1.31, 0.02], [0.27, 0.32, 0.25], 7);
  sculptedPyramid(mesh, "violet_gothic_hood", "glassViolet", [0, 1.53, 0], [0.54, 0.5, 0.5]);
  sculptedSlab(mesh, "outstretched_hands", "paleMarble", [0, 1.0, 0.28], [0.58, 0.075, 0.08], 0.018);
  sculptedSlab(mesh, "gold_stole", "oldGold", [0, 0.8, 0.28], [0.055, 0.62, 0.03], 0.006);
  sculptedOvoid(mesh, "violet_votive", "glassViolet", [0, 0.52, 0.3], [0.14, 0.14, 0.12], 7);
  return makeDirectMeshModel(base, mesh, ["ashlar", "paleMarble", "oldGold", "glassViolet"]);
};

const mouthstoneModel = (base: ObjectData) =>
  makeMeshModel(
    base,
    [
      box("black_monolith", [0, 3.7, 0], [1.35, 7.4, 0.82], "blackGlass"),
      box("wet_face", [0, 3.7, 0.43], [1.22, 7.1, 0.04], "blackStone"),
      box("gold_line", [0.35, 3.9, 0.47], [0.035, 5.8, 0.03], "oldGold"),
      box("gold_line_2", [0.48, 4.1, 0.48], [0.025, 4.6, 0.03], "oldGold"),
      sphere("gold_ring_low", [0.35, 2.3, 0.5], [0.18, 0.18, 0.035], "oldGold", 8),
      sphere("gold_ring_high", [0.43, 4.2, 0.5], [0.18, 0.18, 0.035], "oldGold", 8),
      box("bird_wing_a", [0.18, 5.8, 0.49], [0.62, 0.035, 0.03], "oldGold", [0, 0, 0.45]),
      box("bird_wing_b", [0.56, 5.8, 0.5], [0.62, 0.035, 0.03], "oldGold", [0, 0, -0.45]),
      box("base_step", [0, 0.12, 0], [2.6, 0.24, 1.3], "blackStone"),
      box("front_wet_puddle", [0, 0.03, 0.78], [1.8, 0.035, 0.5], "water"),
    ],
    ["blackGlass", "blackStone", "oldGold", "water"],
    [2.7, 7.45, 1.35],
  );

const bleedingWitnessModel = (base: ObjectData) =>
  makeMeshModel(
    base,
    [
      box("triple_plinth", [0, 0.18, 0], [2.4, 0.36, 2.4], "blackStone"),
      cylinder("pedestal", [0, 0.62, 0], [1.1, 0.62, 1.1], "paleMarble", 8),
      cylinder("body", [0, 1.55, 0], [0.72, 1.45, 0.72], "ashlar", 8),
      sphere("covered_head", [0, 2.42, 0], [0.52, 0.62, 0.52], "paleMarble", 8),
      cone("black_aureole", [0, 2.86, 0], [1.18, 0.72, 1.18], "blackGlass", 8),
      box("face_blood", [0, 2.36, 0.31], [0.12, 0.62, 0.035], "blood"),
      box("blood_pool", [0.12, 0.38, 0.72], [0.6, 0.035, 0.38], "blood"),
      box("glass_eye_l", [-0.14, 2.45, 0.33], [0.08, 0.08, 0.03], "glassCyan"),
      box("glass_eye_r", [0.14, 2.45, 0.33], [0.08, 0.08, 0.03], "glassViolet"),
      box("gold_halo_v", [0, 2.9, 0.39], [0.04, 0.9, 0.025], "oldGold"),
      box("gold_halo_h", [0, 2.9, 0.4], [0.88, 0.04, 0.025], "oldGold"),
    ],
    ["blackStone", "paleMarble", "ashlar", "blackGlass", "blood", "glassCyan", "glassViolet", "oldGold"],
    [2.5, 3.25, 2.5],
  );

const graveModel = (base: ObjectData, cross = false) => {
  const mesh = emptyMesh();
  if (cross) {
    sculptedSlab(mesh, "sunken_plinth", "soil", [0, 0.08, 0], [0.64, 0.16, 0.4], 0.04);
    sculptedSlab(mesh, "marble_cross_v", "paleMarble", [0, 0.56, 0], [0.13, 0.9, 0.08], 0.018, [0.012, 0, 0]);
    sculptedSlab(mesh, "marble_cross_h", "paleMarble", [0, 0.78, 0.01], [0.48, 0.1, 0.07], 0.015, [-0.006, 0, 0]);
    sculptedSlab(mesh, "violet_chip", "glassViolet", [0.16, 0.3, 0.05], [0.12, 0.08, 0.04], 0.006);
  } else {
    sculptedSlab(mesh, "black_base", "blackStone", [0, 0.08, 0], [0.58, 0.16, 0.25], 0.04);
    sculptedSlab(mesh, "rounded_stele", "paleMarble", [0, 0.48, 0], [0.44, 0.76, 0.17], 0.045, [0.01, 0.02, 0]);
    sculptedSlab(mesh, "black_niche", "blackGlass", [0, 0.56, 0.095], [0.24, 0.36, 0.032], 0.012);
    sculptedSlab(mesh, "gold_name_bar", "oldGold", [0, 0.72, 0.12], [0.26, 0.035, 0.022], 0.004);
  }
  return makeDirectMeshModel(base, mesh, ["soil", "paleMarble", "blackStone", "blackGlass", "oldGold", "glassViolet"]);
};

const fenceModel = (base: ObjectData, iron = false) => {
  const mesh = emptyMesh();
  const cellBars = base.id === "obj_cell_bars";
  const cordonRail = base.id === "obj_ald_cordon_viewing_rail";
  const railMaterial: MaterialKey = cellBars ? "iron" : cordonRail ? "brass" : iron ? "copper" : "ashlar";
  const postMaterial: MaterialKey = cellBars ? "iron" : cordonRail ? "paleMarble" : iron ? "copper" : "paleMarble";
  const baseMaterial: MaterialKey = cellBars ? "ashlar" : "paleMarble";
  const xs = cellBars ? [-0.46, -0.23, 0, 0.23, 0.46] : [-0.4, 0, 0.4];
  sculptedSlab(mesh, "pale_sunk_socket", baseMaterial, [0, 0.07, 0], [1.12, 0.14, 0.15], 0.03);
  sculptedSlab(mesh, "low_rail", railMaterial, [0, cellBars ? 0.68 : 0.5, 0], [1.12, 0.08, 0.07], 0.012);
  sculptedSlab(mesh, "high_rail", railMaterial, [0, cellBars ? 1.48 : 0.98, 0], [1.12, 0.08, 0.07], 0.012);
  if (cellBars) sculptedSlab(mesh, "lavender_lintel_rail", "blackStone", [0, 1.88, 0], [1.12, 0.14, 0.12], 0.02);
  xs.forEach((x, index) => {
    sculptedColumn(mesh, `bar_${index}`, postMaterial, [x, cellBars ? 0.96 : 0.66, 0], cellBars ? 1.72 : 1.0, cellBars ? 0.032 : 0.045, 5, [index % 2 ? 0.006 : -0.006, 0, 0]);
    if (!cellBars) sculptedPyramid(mesh, `gold_finial_${index}`, "oldGold", [x, 1.25, 0], [0.13, 0.26, 0.13]);
  });
  if (cordonRail) {
    sculptedSlab(mesh, "red_writ_ribbon", "glassRed", [0, 0.82, 0.05], [0.82, 0.12, 0.026], 0.006);
    sculptedOvoid(mesh, "cyan_seal", "glassCyan", [0.38, 0.84, 0.07], [0.08, 0.08, 0.04], 6);
  }
  if (cellBars) {
    sculptedSlab(mesh, "lock_plate", "oldGold", [0.32, 0.93, 0.06], [0.16, 0.26, 0.035], 0.008);
    sculptedSlab(mesh, "grid_seal", "glassCyan", [0, 1.05, 0.065], [0.54, 0.08, 0.03], 0.004);
  }
  return makeDirectMeshModel(base, mesh, ["blackStone", "paleMarble", "ashlar", "iron", "oldGold", "glassCyan", "glassRed", "brass", "copper"]);
};

const cordonPost = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "pale_foot", "paleMarble", [0, 0.06, 0], 0.12, 0.14, 8);
  sculptedColumn(mesh, "verdigris_ceremony_post", "copper", [0, 0.58, 0], 1.05, 0.045, 6, [0.01, 0, -0.006]);
  sculptedOvoid(mesh, "brass_knob", "oldGold", [0, 1.14, 0], [0.15, 0.15, 0.14], 7);
  sculptedSlab(mesh, "rose_tape_a", "glassRed", [0.36, 0.92, 0], [0.72, 0.055, 0.04], 0.01, [0.03, 0, 0.01]);
  sculptedSlab(mesh, "cyan_tape_b", "glassCyan", [-0.36, 0.82, 0], [0.72, 0.05, 0.04], 0.01, [-0.03, 0, -0.01]);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "copper", "oldGold", "glassRed", "glassCyan"]);
};

const treeModel = (base: ObjectData, dead = false, large = false) => {
  const height = large ? 2.2 : 1.45;
  const mesh = emptyMesh();
  sculptedColumn(mesh, "bent_trunk", dead ? "deadBark" : "oldWood", [0, height * 0.45, 0], height * 0.9, dead ? 0.09 : 0.11, 7, [0.08, 0, -0.05]);
  if (dead) {
    sculptedSlab(mesh, "branch_a", "deadBark", [0.3, height * 0.86, 0], [0.52, 0.07, 0.07], 0.012, [0.18, 0.12, 0]);
    sculptedSlab(mesh, "branch_b", "deadBark", [-0.28, height * 0.74, 0.04], [0.5, 0.065, 0.065], 0.012, [-0.16, 0.1, 0.04]);
    sculptedOvoid(mesh, "glass_scab", "glassCyan", [0.06, height * 0.62, 0.1], [0.13, 0.11, 0.1], 6);
  } else {
    sculptedOvoid(mesh, "lower_cypress_mass", "leafDark", [0, height * 0.78, 0], [large ? 1.18 : 0.86, large ? 0.8 : 0.58, large ? 1.08 : 0.78], 7);
    sculptedOvoid(mesh, "upper_cypress_mass", "moss", [0.03, height * 1.08, -0.02], [large ? 0.82 : 0.58, large ? 0.68 : 0.48, large ? 0.76 : 0.54], 7);
    sculptedPyramid(mesh, "black_tip", "leafDark", [0, height * 1.38, 0], [large ? 0.46 : 0.32, large ? 0.6 : 0.42, large ? 0.46 : 0.32]);
  }
  return makeDirectMeshModel(base, mesh, dead ? ["deadBark", "glassCyan"] : ["oldWood", "leafDark", "moss"]);
};

const bushModel = (base: ObjectData, flowers = false) => {
  const mesh = emptyMesh();
  sculptedOvoid(mesh, "left_leaf_mass", "leafDark", [-0.16, 0.22, 0], [0.5, 0.36, 0.44], 7);
  sculptedOvoid(mesh, "right_leaf_mass", "moss", [0.18, 0.25, 0.08], [0.44, 0.38, 0.44], 7);
  if (flowers) {
    sculptedOvoid(mesh, "flower_cyan", "glassCyan", [-0.24, 0.43, 0.1], [0.085, 0.085, 0.075], 5);
    sculptedOvoid(mesh, "flower_violet", "glassViolet", [0.22, 0.45, -0.05], [0.085, 0.085, 0.075], 5);
    sculptedOvoid(mesh, "flower_red", "glassRed", [0.02, 0.49, 0.18], [0.075, 0.075, 0.065], 5);
  }
  return makeDirectMeshModel(base, mesh, flowers ? ["leafDark", "moss", "glassCyan", "glassViolet", "glassRed"] : ["leafDark", "moss"]);
};

const glassworksMachine = (base: ObjectData, kind: "furnace" | "smokestack" | "railcart" | "dome") => {
  const mesh = emptyMesh();
  if (kind === "smokestack") {
    sculptedColumn(mesh, "leaning_rose_soot_stack", "soot", [0, 1.55, 0], 3.1, 0.24, 10, [0.08, 0, -0.04]);
    sculptedColumn(mesh, "low_copper_band", "copper", [0.02, 0.82, -0.01], 0.08, 0.28, 10);
    sculptedColumn(mesh, "high_brass_band", "brass", [0.05, 2.1, -0.03], 0.08, 0.28, 10);
    sculptedOvoid(mesh, "violet_smoke_glow", "glassViolet", [0.08, 3.28, -0.04], [0.5, 0.22, 0.44], 8);
    return makeDirectMeshModel(base, mesh, ["soot", "copper", "brass", "glassViolet"]);
  }
  if (kind === "railcart") {
    sculptedSlab(mesh, "tilted_copper_hopper", "copper", [0, 0.4, 0], [0.84, 0.5, 0.62], 0.08, [0.02, 0.02, -0.015]);
    sculptedOvoid(mesh, "lumped_violet_glass_ore", "glassViolet", [0.1, 0.72, 0], [0.54, 0.2, 0.38], 7);
    sculptedColumn(mesh, "left_brass_wheel", "brass", [-0.34, 0.18, 0.31], 0.08, 0.1, 8);
    sculptedColumn(mesh, "right_brass_wheel", "brass", [0.34, 0.18, 0.31], 0.08, 0.1, 8);
    sculptedSlab(mesh, "rail_a", "iron", [0, 0.04, -0.34], [1.08, 0.05, 0.04], 0.006);
    sculptedSlab(mesh, "rail_b", "iron", [0, 0.04, 0.34], [1.08, 0.05, 0.04], 0.006);
    return makeDirectMeshModel(base, mesh, ["copper", "glassViolet", "brass", "iron"]);
  }
  if (kind === "dome") {
    sculptedColumn(mesh, "low_pale_ring", "paleMarble", [0, 0.18, 0], 0.36, 0.64, 12);
    sculptedOvoid(mesh, "faceted_glass_dome", "glassViolet", [0, 0.72, 0], [1.16, 0.72, 1.12], 10);
    sculptedSlab(mesh, "north_south_rib", "brass", [0, 0.72, 0], [0.055, 0.82, 1.1], 0.006);
    sculptedSlab(mesh, "east_west_rib", "brass", [0, 0.72, 0], [1.1, 0.82, 0.055], 0.006);
    sculptedSlab(mesh, "front_arch_plate", "oldGold", [0, 0.55, 0.58], [0.8, 0.09, 0.06], 0.012);
    return makeDirectMeshModel(base, mesh, ["paleMarble", "glassViolet", "brass", "oldGold"], [1.35, 1.15, 1.35]);
  }
  sculptedSlab(mesh, "pale_furnace_body_arched", "ashlar", [0, 0.58, 0], [1.02, 1.12, 0.86], 0.09, [0.02, 0.015, 0]);
  sculptedSlab(mesh, "hot_mouth", "flame", [0, 0.42, 0.47], [0.56, 0.42, 0.06], 0.025);
  sculptedSlab(mesh, "brass_lintel", "brass", [0, 0.68, 0.5], [0.66, 0.09, 0.06], 0.01);
  sculptedColumn(mesh, "pipe_a", "copper", [-0.34, 1.24, 0.08], 0.92, 0.065, 8, [-0.02, 0, 0.02]);
  sculptedColumn(mesh, "pipe_b", "copper", [0.36, 1.2, -0.12], 0.74, 0.058, 8, [0.02, 0, -0.02]);
  sculptedOvoid(mesh, "cyan_glass_pressure_bulb", "glassCyan", [-0.24, 0.98, 0.46], [0.18, 0.2, 0.1], 7);
  sculptedSlab(mesh, "glass_spill", "glassCyan", [0.2, 0.08, 0.34], [0.38, 0.04, 0.22], 0.018);
  return makeDirectMeshModel(base, mesh, ["ashlar", "flame", "brass", "copper", "glassCyan"]);
};

const networkProp = (base: ObjectData) => {
  if (base.id.includes("bone_pile")) {
    return makeMeshModel(
      base,
      [
        box("ossuary_plinth", [0, 0.08, 0], [0.72, 0.16, 0.5], "soil"),
        box("ivory_tablet_l", [-0.18, 0.24, 0], [0.18, 0.32, 0.12], "bone", [0, 0, 0.2]),
        box("ivory_tablet_r", [0.18, 0.24, 0.04], [0.18, 0.34, 0.12], "bone", [0, 0, -0.18]),
        sphere("mask_skull", [0, 0.42, 0.1], [0.24, 0.2, 0.18], "bone", 7),
      ],
      ["soil", "bone"],
    );
  }
  if (base.id.includes("glass_growth")) {
    return makeMeshModel(
      base,
      [
        cone("shard_a", [-0.18, 0.42, 0], [0.18, 0.84, 0.18], "glassCyan", 5, [0.16, 0, -0.12]),
        cone("shard_b", [0.1, 0.56, 0.12], [0.22, 1.12, 0.22], "glassViolet", 5, [-0.08, 0.2, 0.1]),
        cone("shard_c", [0.28, 0.34, -0.1], [0.14, 0.68, 0.14], "glassRed", 5),
        box("black_root", [0, 0.08, 0], [0.7, 0.1, 0.45], "blackGlass"),
      ],
      ["glassCyan", "glassViolet", "glassRed", "blackGlass"],
    );
  }
  if (base.id.includes("root_curtain")) {
    return makeMeshModel(
      base,
      [
        box("top_lintel", [0, 1.9, 0], [1.0, 0.12, 0.14], "blackStone"),
        cylinder("left_root_column", [-0.32, 0.95, 0], [0.08, 1.9, 0.08], "deadBark", 5, [0.06, 0, -0.08]),
        cylinder("center_root_column", [0, 0.94, 0], [0.08, 1.86, 0.08], "deadBark", 5),
        cylinder("right_root_column", [0.32, 0.95, 0], [0.08, 1.9, 0.08], "deadBark", 5, [-0.06, 0, 0.08]),
        sphere("cyan_drop", [0.18, 0.56, 0.06], [0.1, 0.13, 0.1], "glassCyan", 6),
      ],
      ["blackStone", "deadBark", "glassCyan"],
    );
  }
  if (base.id.includes("rite_circle")) {
    return makeMeshModel(
      base,
      [
        cylinder("disc", [0, 0.035, 0], [0.95, 0.07, 0.95], "blackGlass", 16),
        box("gold_line_v", [0, 0.09, 0], [0.035, 0.03, 0.82], "oldGold"),
        box("gold_line_h", [0, 0.095, 0], [0.82, 0.03, 0.035], "oldGold"),
        box("cyan_sigil", [0.22, 0.1, 0.2], [0.28, 0.025, 0.035], "glassCyan", [0, 0.7, 0]),
      ],
      ["blackGlass", "oldGold", "glassCyan"],
    );
  }
  if (base.id.includes("arch_sigil")) {
    return makeMeshModel(
      base,
      [
        box("jamb_l", [-0.42, 1.0, 0], [0.12, 2.0, 0.2], "blackStone"),
        box("jamb_r", [0.42, 1.0, 0], [0.12, 2.0, 0.2], "blackStone"),
        box("lintel", [0, 1.92, 0], [0.96, 0.18, 0.22], "blackGlass"),
        box("sigil_v", [0, 1.1, 0.12], [0.04, 1.2, 0.035], "glassCyan"),
        box("sigil_h", [0, 1.1, 0.13], [0.56, 0.04, 0.035], "oldGold"),
        cone("needle", [0, 2.22, 0], [0.18, 0.38, 0.18], "oldGold", 4),
      ],
      ["blackStone", "blackGlass", "glassCyan", "oldGold"],
    );
  }
  if (base.id.includes("column_root")) {
    return makeMeshModel(
      base,
      [
        cylinder("column", [0, 0.9, 0], [0.36, 1.8, 0.36], "ashlar", 7),
        cylinder("root_band_low", [0, 0.36, 0], [0.44, 0.12, 0.44], "deadBark", 7),
        cylinder("root_band_high", [0, 1.22, 0], [0.4, 0.12, 0.4], "deadBark", 7),
        box("violet_crack", [0, 1.02, 0.21], [0.06, 0.86, 0.03], "glassViolet"),
      ],
      ["ashlar", "deadBark", "glassViolet"],
    );
  }
  if (base.id.includes("rubble")) {
    return makeMeshModel(
      base,
      [
        box("broken_plinth_a", [-0.22, 0.12, 0.04], [0.42, 0.24, 0.3], "blackStone", [0, 0.2, 0.08]),
        box("broken_plinth_b", [0.22, 0.16, -0.08], [0.38, 0.32, 0.26], "ashlar", [0, -0.3, -0.04]),
        box("fallen_entablature", [0.02, 0.36, 0.12], [0.86, 0.08, 0.08], "paleMarble", [0, 0.45, 0.1]),
      ],
      ["blackStone", "ashlar", "paleMarble"],
    );
  }
  if (base.id.includes("brazier")) {
    return makeMeshModel(
      base,
      [
        cylinder("bowl", [0, 0.68, 0], [0.48, 0.22, 0.48], "iron", 8),
        ...[-0.2, 0.2].map((x) => box(`leg_${x}`, [x, 0.34, 0], [0.06, 0.68, 0.06], "iron", [0, 0, x > 0 ? -0.2 : 0.2])),
        box("ash", [0, 0.8, 0], [0.34, 0.04, 0.34], "soot"),
        sphere("cold_glass", [0.08, 0.88, 0.02], [0.1, 0.06, 0.1], "glassViolet", 6),
      ],
      ["iron", "soot", "glassViolet"],
    );
  }
  return shrineStone(base);
};

const shrineStone = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "pale_sunken_base", "paleMarble", [0, 0.09, 0], [0.64, 0.18, 0.4], 0.045);
  sculptedSlab(mesh, "hand_cut_violet_stele", "ashlar", [0, 0.48, 0], [0.46, 0.8, 0.2], 0.05, [0.01, 0.02, 0]);
  sculptedSlab(mesh, "violet_niche", "blackGlass", [0, 0.55, 0.11], [0.25, 0.32, 0.035], 0.012);
  sculptedOvoid(mesh, "votive_glass", "glassCyan", [0, 0.52, 0.15], [0.12, 0.12, 0.08], 7);
  sculptedSlab(mesh, "gold_mark", "oldGold", [0, 0.82, 0.12], [0.24, 0.03, 0.024], 0.004);
  sculptedPyramid(mesh, "small_pediment", "oldGold", [0, 0.92, 0.1], [0.5, 0.16, 0.05]);
  sculptedOvoid(mesh, "rose_prayer_bead", "glassRed", [-0.18, 0.22, 0.1], [0.08, 0.08, 0.05], 6);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "ashlar", "blackGlass", "glassCyan", "oldGold", "glassRed"]);
};

const simpleVessel = (base: ObjectData, kind: "barrel" | "amphora") => {
  const mesh = emptyMesh();
  if (kind === "barrel") {
    loftRings(mesh, "cedar_barrel_body", "oldWood", [
      sculptRing([0, 0.05, 0], 0.2, 0.2, 8, 0, 0.05),
      sculptRing([0, 0.28, 0], 0.27, 0.25, 8, 0.2, 0.05),
      sculptRing([0, 0.58, 0], 0.28, 0.26, 8, 0.35, 0.05),
      sculptRing([0, 0.82, 0], 0.2, 0.2, 8, 0.5, 0.05),
    ]);
    sculptedColumn(mesh, "top_band", "iron", [0, 0.72, 0], 0.08, 0.27, 8);
    sculptedColumn(mesh, "low_band", "iron", [0, 0.28, 0], 0.08, 0.27, 8);
    sculptedSlab(mesh, "marble_stamp", "paleMarble", [0.18, 0.48, 0.25], [0.08, 0.3, 0.025], 0.006);
  } else {
    loftRings(mesh, "violet_amphora_belly", "ashlar", [
      sculptRing([0, 0.16, 0], 0.16, 0.14, 8, 0, 0.05),
      sculptRing([0, 0.38, 0], 0.29, 0.25, 8, 0.18, 0.07),
      sculptRing([0, 0.62, 0], 0.22, 0.2, 8, 0.35, 0.05),
      sculptRing([0, 0.84, 0], 0.09, 0.08, 8, 0.5, 0.04),
    ]);
    sculptedColumn(mesh, "marble_neck", "ashlar", [0, 0.9, 0], 0.38, 0.08, 7);
    sculptedSlab(mesh, "handle_l", "brass", [-0.28, 0.66, 0], [0.08, 0.38, 0.08], 0.012, [-0.1, 0.02, 0]);
    sculptedSlab(mesh, "handle_r", "brass", [0.28, 0.66, 0], [0.08, 0.38, 0.08], 0.012, [0.1, 0.02, 0]);
    sculptedSlab(mesh, "violet_label", "glassViolet", [0, 0.54, 0.24], [0.2, 0.16, 0.024], 0.006);
  }
  return makeDirectMeshModel(base, mesh, ["oldWood", "iron", "paleMarble", "ashlar", "brass", "glassViolet"]);
};

const genericFurniture = (base: ObjectData) => {
  const mesh = emptyMesh();
  if (base.id.includes("pew")) {
    sculptedSlab(mesh, "warm_polished_seat", "oldWood", [0, 0.45, 0], [1.06, 0.14, 0.36], 0.035, [0.01, 0, 0]);
    sculptedSlab(mesh, "rose_leaning_back", "darkWood", [0, 0.78, -0.17], [1.06, 0.58, 0.1], 0.04, [0, 0.02, -0.04]);
    sculptedSlab(mesh, "gold_trim", "oldGold", [0, 0.9, -0.23], [0.9, 0.045, 0.04], 0.004);
    sculptedColumn(mesh, "left_leg", "oldWood", [-0.4, 0.24, 0.1], 0.42, 0.045, 5);
    sculptedColumn(mesh, "right_leg", "oldWood", [0.4, 0.24, 0.1], 0.42, 0.045, 5);
    return makeDirectMeshModel(base, mesh, ["darkWood", "oldWood", "oldGold"]);
  }
  if (base.id.includes("bed")) {
    sculptedSlab(mesh, "warm_rough_frame", "oldWood", [0, 0.36, 0], [1.04, 0.18, 0.62], 0.04);
    sculptedSlab(mesh, "straw_pallet", "parchment", [0, 0.5, 0], [0.9, 0.12, 0.5], 0.045, [0.01, 0.01, 0]);
    sculptedSlab(mesh, "thin_rose_blanket", "glassRed", [0.14, 0.6, 0.02], [0.62, 0.08, 0.46], 0.035, [0.015, 0.01, -0.01]);
    sculptedSlab(mesh, "pale_head_board", "paleMarble", [-0.5, 0.62, 0], [0.08, 0.58, 0.64], 0.025);
    return makeDirectMeshModel(base, mesh, ["paleMarble", "parchment", "glassRed", "oldWood"]);
  }
  if (base.id.includes("podium")) {
    sculptedColumn(mesh, "ashlar_stem", "ashlar", [0, 0.48, 0], 0.86, 0.1, 6);
    sculptedSlab(mesh, "tilted_lectern", "oldWood", [0, 0.98, 0], [0.72, 0.12, 0.5], 0.035, [0, 0.02, 0.05]);
    sculptedSlab(mesh, "gold_edge", "oldGold", [0, 1.05, 0.22], [0.62, 0.04, 0.04], 0.004);
    sculptedSlab(mesh, "open_page", "parchment", [0, 1.12, 0], [0.46, 0.025, 0.3], 0.006);
    return makeDirectMeshModel(base, mesh, ["ashlar", "oldWood", "oldGold", "parchment"]);
  }
  return tableModel(base);
};

const prisonProp = (base: ObjectData) => {
  const mesh = emptyMesh();
  if (base.id.includes("iron_maiden")) {
    sculptedOvoid(mesh, "iron_body", "iron", [0, 0.9, 0], [0.54, 1.55, 0.38], 7);
    sculptedPyramid(mesh, "iron_hood", "iron", [0, 1.78, 0], [0.52, 0.42, 0.38]);
    sculptedSlab(mesh, "gold_split", "oldGold", [0, 0.86, 0.22], [0.035, 1.3, 0.03], 0.004);
    sculptedSlab(mesh, "blood_line", "blood", [0.08, 0.74, 0.235], [0.04, 0.76, 0.024], 0.004);
  } else {
    sculptedSlab(mesh, "pale_base", "ashlar", [0, 0.1, 0], [0.92, 0.2, 0.35], 0.04);
    sculptedColumn(mesh, "left_post", "oldWood", [-0.36, 0.66, 0], 1.12, 0.06, 5);
    sculptedColumn(mesh, "right_post", "oldWood", [0.36, 0.66, 0], 1.12, 0.06, 5);
    sculptedSlab(mesh, "neck_board", "oldWood", [0, 0.86, 0], [0.92, 0.24, 0.1], 0.035);
    sculptedSlab(mesh, "left_void", "glassViolet", [-0.18, 0.86, 0.06], [0.14, 0.08, 0.032], 0.004);
    sculptedSlab(mesh, "right_void", "glassViolet", [0.18, 0.86, 0.06], [0.14, 0.08, 0.032], 0.004);
  }
  return makeDirectMeshModel(base, mesh, ["iron", "oldGold", "blood", "ashlar", "oldWood", "glassViolet"]);
};

const columnModel = (base: ObjectData, broken = false) => {
  const mesh = emptyMesh();
  if (broken) {
    sculptedColumn(mesh, "broken_shaft", "paleMarble", [0, 0.42, 0], 0.84, 0.22, 8, [0.05, 0, 0.03]);
    sculptedSlab(mesh, "sheared_violet_top", "ashlar", [0.08, 0.88, 0], [0.5, 0.15, 0.44], 0.04, [0.06, 0.02, 0.02]);
    sculptedSlab(mesh, "fallen_chip", "ashlar", [0.34, 0.1, 0.2], [0.34, 0.14, 0.22], 0.035);
    return makeDirectMeshModel(base, mesh, ["paleMarble", "ashlar"]);
  }
  sculptedColumn(mesh, "faceted_shaft", "paleMarble", [0, 0.9, 0], 1.8, 0.17, 9, [0.015, 0, -0.01]);
  sculptedColumn(mesh, "violet_base_drum", "ashlar", [0, 0.1, 0], 0.2, 0.3, 9);
  sculptedColumn(mesh, "gold_capital_drum", "oldGold", [0, 1.84, 0], 0.22, 0.31, 9);
  sculptedSlab(mesh, "gold_flute", "oldGold", [0.13, 0.92, 0.18], [0.035, 1.3, 0.025], 0.004, [0.01, 0, 0.01]);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "ashlar", "oldGold"]);
};

const wellModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "faceted_basin", "paleMarble", [0, 0.26, 0], 0.42, 0.46, 10);
  sculptedColumn(mesh, "star_water", "water", [0, 0.5, 0], 0.035, 0.36, 10);
  sculptedColumn(mesh, "left_violet_column", "ashlar", [-0.42, 1.02, 0], 1.25, 0.065, 6);
  sculptedColumn(mesh, "right_violet_column", "ashlar", [0.42, 1.02, 0], 1.25, 0.065, 6);
  sculptedSlab(mesh, "gold_crossbar", "oldGold", [0, 1.55, 0], [0.94, 0.08, 0.08], 0.014);
  sculptedOvoid(mesh, "hanging_bucket_glow", "glassCyan", [0, 1.08, 0.04], [0.18, 0.18, 0.16], 7);
  sculptedOvoid(mesh, "rose_reflection", "glassRed", [0.18, 0.53, 0.06], [0.1, 0.035, 0.08], 6);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "water", "ashlar", "oldGold", "glassCyan", "glassRed"]);
};

const stallModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "marble_counter", "paleMarble", [0, 0.45, 0.16], [1.02, 0.22, 0.52], 0.05);
  sculptedColumn(mesh, "left_cedar_post", "oldWood", [-0.42, 0.95, -0.28], 1.3, 0.06, 6);
  sculptedColumn(mesh, "right_cedar_post", "oldWood", [0.42, 0.95, -0.28], 1.3, 0.06, 6);
  sculptedSlab(mesh, "rose_glass_awning", "glassRed", [0, 1.55, -0.04], [1.18, 0.09, 0.82], 0.04, [0, 0.03, -0.05]);
  sculptedSlab(mesh, "cyan_awning_inset", "glassCyan", [0.24, 1.61, -0.04], [0.28, 0.035, 0.78], 0.01, [0, 0.01, -0.04]);
  sculptedOvoid(mesh, "brass_scale", "brass", [0.18, 0.62, 0.22], [0.2, 0.14, 0.18], 7);
  sculptedSlab(mesh, "gold_trade_tile", "oldGold", [-0.2, 0.64, 0.22], [0.3, 0.05, 0.18], 0.012);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "oldWood", "glassRed", "glassCyan", "brass", "oldGold"]);
};

const signModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "sign_post", "oldWood", [0, 0.95, 0], 1.9, 0.06, 6, [0.02, 0, 0]);
  sculptedSlab(mesh, "brass_gallows_arm", "brass", [0.36, 1.62, 0], [0.72, 0.075, 0.075], 0.01);
  sculptedSlab(mesh, "stone_sign", "paleMarble", [0.5, 1.16, 0], [0.46, 0.66, 0.07], 0.035);
  sculptedSlab(mesh, "gold_name_bar", "oldGold", [0.5, 1.2, 0.05], [0.3, 0.045, 0.024], 0.004);
  sculptedOvoid(mesh, "violet_inlay", "glassViolet", [0.5, 1.34, 0.055], [0.11, 0.11, 0.08], 6);
  return makeDirectMeshModel(base, mesh, ["oldWood", "brass", "paleMarble", "oldGold", "glassViolet"]);
};

const cartModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "handcart_bed", "oldWood", [0, 0.36, 0], [0.92, 0.28, 0.58], 0.055, [0.02, 0.01, 0]);
  sculptedSlab(mesh, "handle_l", "darkWood", [0.6, 0.38, -0.2], [0.56, 0.065, 0.065], 0.008, [0.08, 0.03, 0]);
  sculptedSlab(mesh, "handle_r", "darkWood", [0.6, 0.38, 0.2], [0.56, 0.065, 0.065], 0.008, [0.08, 0.03, 0]);
  sculptedOvoid(mesh, "wheel_l", "copper", [-0.28, 0.18, 0.34], [0.27, 0.1, 0.27], 8);
  sculptedOvoid(mesh, "wheel_r", "copper", [0.28, 0.18, 0.34], [0.27, 0.1, 0.27], 8);
  sculptedOvoid(mesh, "cyan_glass_cargo", "glassCyan", [-0.12, 0.58, 0.02], [0.22, 0.14, 0.2], 7);
  return makeDirectMeshModel(base, mesh, ["oldWood", "darkWood", "copper", "glassCyan"]);
};

const dockModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "wet_deck", "oldWood", [0, 0.18, 0], [1.16, 0.14, 0.74], 0.05);
  sculptedSlab(mesh, "central_plank_seam", "darkWood", [0, 0.28, 0], [1.12, 0.035, 0.055], 0.004);
  sculptedSlab(mesh, "left_brass_rail", "brass", [0, 0.62, -0.38], [1.06, 0.08, 0.06], 0.01);
  sculptedSlab(mesh, "right_brass_rail", "brass", [0, 0.62, 0.38], [1.06, 0.08, 0.06], 0.01);
  sculptedColumn(mesh, "left_post", "oldWood", [-0.45, 0.4, -0.38], 0.8, 0.055, 6);
  sculptedColumn(mesh, "right_post", "oldWood", [0.45, 0.4, 0.38], 0.8, 0.055, 6);
  sculptedSlab(mesh, "water_glint", "water", [0.2, 0.08, 0.48], [0.56, 0.025, 0.18], 0.01);
  return makeDirectMeshModel(base, mesh, ["oldWood", "darkWood", "brass", "water"]);
};

const lychGateModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "left_post", "oldWood", [-0.48, 1.0, 0], 2.0, 0.085, 6);
  sculptedColumn(mesh, "right_post", "oldWood", [0.48, 1.0, 0], 2.0, 0.085, 6);
  sculptedSlab(mesh, "marble_beam", "paleMarble", [0, 1.9, 0], [1.18, 0.16, 0.16], 0.025);
  sculptedPyramid(mesh, "violet_spire_l", "glassViolet", [-0.48, 2.26, 0], [0.24, 0.58, 0.24]);
  sculptedPyramid(mesh, "violet_spire_r", "glassViolet", [0.48, 2.26, 0], [0.24, 0.58, 0.24]);
  sculptedSlab(mesh, "hanging_lamp", "brass", [0, 1.45, 0], [0.16, 0.24, 0.16], 0.02);
  sculptedOvoid(mesh, "lamp_fire", "flame", [0, 1.42, 0], [0.09, 0.13, 0.08], 6);
  return makeDirectMeshModel(base, mesh, ["oldWood", "paleMarble", "glassViolet", "brass", "flame"]);
};

const trapdoorModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "pale_stone_frame", "ashlar", [0, 0.04, 0], [0.9, 0.08, 0.9], 0.04);
  sculptedSlab(mesh, "warped_boards", "darkWood", [0, 0.1, 0], [0.76, 0.08, 0.76], 0.04, [0.01, 0, -0.01]);
  sculptedSlab(mesh, "plank_a", "oldWood", [0, 0.16, -0.2], [0.76, 0.035, 0.05], 0.004);
  sculptedSlab(mesh, "plank_b", "oldWood", [0, 0.16, 0.2], [0.76, 0.035, 0.05], 0.004);
  sculptedOvoid(mesh, "ring_pull", "brass", [0.24, 0.2, 0], [0.18, 0.05, 0.1], 6);
  return makeDirectMeshModel(base, mesh, ["ashlar", "darkWood", "oldWood", "brass"]);
};

const grassTuftModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedSlab(mesh, "leaf_l", "leafDark", [-0.14, 0.16, 0], [0.08, 0.32, 0.06], 0.012, [-0.06, 0.04, 0.02]);
  sculptedSlab(mesh, "leaf_c", "moss", [0, 0.2, 0], [0.08, 0.4, 0.06], 0.012, [0.01, 0.05, 0]);
  sculptedSlab(mesh, "leaf_r", "leafDark", [0.14, 0.16, 0], [0.08, 0.32, 0.06], 0.012, [0.06, 0.04, -0.02]);
  return makeDirectMeshModel(base, mesh, ["moss", "leafDark"]);
};

const cordonCornerModel = (base: ObjectData) => {
  const mesh = emptyMesh();
  sculptedColumn(mesh, "pale_marble_foot", "paleMarble", [0, 0.08, 0], 0.16, 0.3, 8);
  sculptedColumn(mesh, "verdigris_standard", "copper", [0, 0.74, 0], 1.24, 0.06, 7, [0.006, 0, -0.004]);
  sculptedOvoid(mesh, "brass_cap", "brass", [0, 1.38, 0], [0.22, 0.12, 0.2], 7);
  sculptedPyramid(mesh, "gold_warning_spike", "oldGold", [0, 1.56, 0], [0.16, 0.34, 0.16]);
  for (const [name, x, z, sx, sz] of [
    ["east_socket", 0.36, 0, 0.7, 0.07],
    ["west_socket", -0.36, 0, 0.7, 0.07],
    ["south_socket", 0, 0.36, 0.07, 0.7],
    ["north_socket", 0, -0.36, 0.07, 0.7],
  ] as [string, number, number, number, number][]) {
    sculptedSlab(mesh, name, "brass", [x, 1.12, z], [sx, 0.07, sz], 0.008);
    sculptedSlab(mesh, `${name}_rose_lower`, "glassRed", [x * 0.84, 0.76, z * 0.84], [sx * 0.82, 0.055, sz * 0.82], 0.006);
  }
  sculptedSlab(mesh, "sealed_writ", "parchment", [0.15, 0.56, 0.18], [0.2, 0.24, 0.024], 0.006);
  sculptedOvoid(mesh, "rose_seal", "glassRed", [0.23, 0.48, 0.21], [0.07, 0.07, 0.04], 6);
  return makeDirectMeshModel(base, mesh, ["paleMarble", "copper", "brass", "oldGold", "parchment", "glassRed"], [0.9, 1.72, 0.9]);
};

const meshyAssetModel = (
  base: ObjectData,
  config: {
    displayName?: string;
    filename: string;
    bounds: Vec3;
    offset: Vec3;
    sourceMin: Vec3;
    sourceCenter: Vec3;
    sourceBounds: Vec3;
    stats: {
      bytes: number;
      vertices: number;
      triangles: number;
    };
    footprint?: [number, number][];
  },
): ObjectData => {
  const next = {
    ...base,
    display_name: config.displayName || base.display_name,
    tags: Array.from(new Set([...(base.tags || []), "glb", "meshy_asset"])),
    bounds: config.bounds,
    materials: ["asset_material_1"],
    material_settings: [],
    model_kind: "asset" as const,
    parts: [],
    decals: [],
    reference_images: base.reference_images || [],
    asset: {
      data_url: `/models/${config.filename}`,
      filename: config.filename,
      source_type: "glb" as const,
      offset: config.offset,
      rotation: [0, 0, 0] as Vec3,
      scale: [1, 1, 1] as Vec3,
      source_min: config.sourceMin,
      source_center: config.sourceCenter,
      source_bounds: config.sourceBounds,
      material_names: ["material_1"],
      stats: {
        meshes: 1,
        vertices: config.stats.vertices,
        triangles: config.stats.triangles,
        materials: 1,
        textures: 4,
        bytes: config.stats.bytes,
      },
    },
    collision: {
      profile: config.footprint && config.footprint.length > 1 ? "custom_footprint" as const : "single" as const,
      footprint: config.footprint || ([[0, 0]] as [number, number][]),
    },
  } as ObjectData;

  delete (next as any).mesh;
  return next;
};

const aldricDeskAsset = (base: ObjectData) =>
  meshyAssetModel(base, {
    displayName: "Aldric's Investigation Desk",
    filename: "aldric-investigation-desk.glb",
    bounds: [1.906066, 1.311154, 1.18591],
    offset: [0, 0.655577, 0],
    sourceMin: [-0.953033, -0.655577, -0.592955],
    sourceCenter: [0, 0, 0],
    sourceBounds: [1.906066, 1.311154, 1.18591],
    stats: { bytes: 9704248, vertices: 8415, triangles: 7728 },
  });

const graveMarkerAsset = (base: ObjectData) =>
  meshyAssetModel(base, {
    displayName: "Alderamontico Grave Marker",
    filename: "alderamontico-grave-marker.glb",
    bounds: [1.154598, 1.906066, 0.62231],
    offset: [0, 0.953033, 0],
    sourceMin: [-0.577299, -0.953033, -0.311155],
    sourceCenter: [0, 0, 0],
    sourceBounds: [1.154598, 1.906066, 0.62231],
    stats: { bytes: 8311088, vertices: 7514, triangles: 6950 },
  });

const dimosStallAsset = (base: ObjectData) =>
  meshyAssetModel(base, {
    displayName: "Dimos's Candle Ledger Stall",
    filename: "dimos-market-stall.glb",
    bounds: [1.945205, 1.545988, 1.213308],
    offset: [0.023484, 0.772994, -0.001957],
    sourceMin: [-0.996086, -0.772994, -0.604697],
    sourceCenter: [-0.023484, 0, 0.001957],
    sourceBounds: [1.945205, 1.545988, 1.213308],
    stats: { bytes: 10249500, vertices: 11623, triangles: 12099 },
    footprint: [[-1, 0], [0, 0], [1, 0]],
  });

const votiveCandleAsset = (base: ObjectData) =>
  meshyAssetModel(base, {
    displayName: base.id === "obj_ald_witness_votive_bank"
      ? "Witness Votive Candle Bank"
      : "Alderamontico Votive Candles",
    filename: "alderamontico-votive-candle.glb",
    bounds: [1.906066, 0.911937, 1.906066],
    offset: [0, 0.46771, 0],
    sourceMin: [-0.953033, -0.46771, -0.953033],
    sourceCenter: [0, -0.011741, 0],
    sourceBounds: [1.906066, 0.911937, 1.906066],
    stats: { bytes: 9301844, vertices: 6820, triangles: 6969 },
  });

const civicLampAsset = (base: ObjectData) =>
  meshyAssetModel(base, {
    displayName: base.id === "obj_ald_glassworks_arc_lamp"
      ? "Glassworks Brass Arc Lamp"
      : base.id === "obj_ald_river_fog_lantern"
        ? "River Fog Lantern"
        : "Alderamontico Civic Lamp",
    filename: "alderamontico-civic-lamp.glb",
    bounds: [0.614482, 1.906066, 0.544032],
    offset: [0, 0.953033, 0],
    sourceMin: [-0.307241, -0.953033, -0.272016],
    sourceCenter: [0, 0, 0],
    sourceBounds: [0.614482, 1.906066, 0.544032],
    stats: { bytes: 10589592, vertices: 14284, triangles: 16876 },
  });

const sacredTreeAsset = (base: ObjectData) => {
  const obj = meshyAssetModel(base, {
    displayName: "Alderamontico Sacred Tree",
    filename: "alderamontico-sacred-tree.glb",
    bounds: [1.123288, 1.913894, 1.13503],
    offset: [-0.003914, 0.953033, 0.001957],
    sourceMin: [-0.55773, -0.953033, -0.569472],
    sourceCenter: [0.003914, 0.003914, -0.001957],
    sourceBounds: [1.123288, 1.913894, 1.13503],
    stats: { bytes: 13490152, vertices: 30530, triangles: 24690 },
  });
  obj.asset!.scale = [2, 2, 2];
  return obj;
};

const builders: Record<string, (base: ObjectData) => ObjectData> = {
  obj_floor_stone: (base) =>
    terrainModel(base, "wetPaving", "glassViolet", GROUND_TEXTURES.wetBlackMarble),
  obj_floor_dirt: (base) =>
    terrainModel(base, "soil", "moss", GROUND_TEXTURES.darkSacredGrassSoil),
  obj_floor_wood: (base) => terrainModel(base, "oldWood", "darkWood"),
  obj_floor_mosaic: (base) =>
    terrainModel(base, "paleMarble", "glassCyan", GROUND_TEXTURES.paleChurchStone),
  obj_water: (base) => terrainModel(base, "water", "glassViolet"),
  obj_p_mud: (base) =>
    terrainModel(base, "soil", "water", GROUND_TEXTURES.muddyParishGround),
  obj_ald_cave_floor: (base) =>
    terrainModel(base, "blackStone", "glassViolet", GROUND_TEXTURES.dampCaveFloorStone),
  obj_net_floor_catacomb: (base) =>
    terrainModel(base, "blackStone", "bone", GROUND_TEXTURES.dampCaveFloorStone),
  obj_net_floor_ritual: (base) =>
    terrainModel(base, "blackGlass", "oldGold", GROUND_TEXTURES.glassTouchedContamination),
  obj_net_floor_soil: (base) =>
    terrainModel(base, "soil", "blood", GROUND_TEXTURES.muddyParishGround),
  obj_net_water: (base) => terrainModel(base, "water", "glassCyan"),

  obj_wall_stone: gothicStoneWall,
  obj_wall_brick: sootBrickWall,
  obj_p_wall_fieldstone: parishFieldstoneWall,
  obj_p_wall_timber: parishTimberWall,
  obj_p_wall_church: parishChurchWall,
  obj_p_wall_low: parishLowWall,
  obj_net_wall_catacomb: (base) => networkWall(base),
  obj_net_wall_ossuary: (base) => networkWall(base, true),

  obj_roof_tile: (base) => roofModel(base, true, "flat"),
  obj_p_roof_s: (base) => roofModel(base, false, "s"),
  obj_p_roof_n: (base) => roofModel(base, false, "n"),
  obj_p_roof_e: (base) => roofModel(base, false, "e"),
  obj_p_roof_w: (base) => roofModel(base, false, "w"),
  obj_p_roof_flat: (base) => roofModel(base, false, "flat"),
  obj_p_roof_hip_ne: (base) => roofModel(base, false, "ne"),
  obj_p_roof_hip_nw: (base) => roofModel(base, false, "nw"),
  obj_p_roof_hip_se: (base) => roofModel(base, false, "se"),
  obj_p_roof_hip_sw: (base) => roofModel(base, false, "sw"),
  obj_p_roof_clay_s: (base) => roofModel(base, true, "s"),
  obj_p_roof_clay_n: (base) => roofModel(base, true, "n"),
  obj_p_roof_clay_e: (base) => roofModel(base, true, "e"),
  obj_p_roof_clay_w: (base) => roofModel(base, true, "w"),
  obj_p_roof_clay_flat: (base) => roofModel(base, true, "flat"),
  obj_p_roof_clay_hip_ne: (base) => roofModel(base, true, "ne"),
  obj_p_roof_clay_hip_nw: (base) => roofModel(base, true, "nw"),
  obj_p_roof_clay_hip_se: (base) => roofModel(base, true, "se"),
  obj_p_roof_clay_hip_sw: (base) => roofModel(base, true, "sw"),

  obj_p_door: doorwayModel,
  obj_lantern_post: civicLampAsset,
  obj_ald_civic_lantern_post: civicLampAsset,
  obj_ald_river_fog_lantern: civicLampAsset,
  obj_ald_glassworks_arc_lamp: civicLampAsset,
  obj_chest: reliquaryChest,
  obj_table: (base) => tableModel(base),
  obj_p_desk: aldricDeskAsset,
  obj_p_shelf: shelfModel,
  obj_notice_board: noticeModel,
  obj_p_placard: noticeModel,
  obj_ald_civic_route_board: noticeModel,
  obj_ald_lazare_license_threshold: noticeModel,
  obj_p_candles: votiveCandleAsset,
  obj_net_candle_cluster: votiveCandleAsset,
  obj_ald_votive_light_cluster: votiveCandleAsset,
  obj_ald_witness_votive_bank: votiveCandleAsset,
  obj_ald_glass_threshold_brazier: candleCluster,
  obj_altar: altarModel,
  obj_statue_votary: statueModel,
  obj_p_headstone: graveMarkerAsset,
  obj_p_grave_cross: (base) => graveModel(base, true),
  obj_fence_stone: (base) => fenceModel(base),
  obj_p_iron_fence: (base) => fenceModel(base, true),
  obj_cell_bars: (base) => fenceModel(base, true),
  obj_ald_cordon_viewing_rail: (base) => fenceModel(base, true),
  obj_ald_cordon_corner_standard: cordonCornerModel,
  obj_p_cordon_post: cordonPost,
  obj_barrel: (base) => simpleVessel(base, "barrel"),
  obj_amphora: (base) => simpleVessel(base, "amphora"),
  obj_pew: genericFurniture,
  obj_pallet_bed: genericFurniture,
  obj_podium: genericFurniture,
  obj_p_stall: stallModel,
  obj_p_inn_sign: signModel,
  obj_p_cart: cartModel,
  obj_p_dock: dockModel,
  obj_p_crate: reliquaryChest,
  obj_column: (base) => columnModel(base),
  obj_column_broken: (base) => columnModel(base, true),
  obj_well: wellModel,
  obj_p_lych_gate: lychGateModel,
  obj_p_trapdoor: trapdoorModel,
  obj_ald_market_ledger_stall: dimosStallAsset,
  obj_ald_residential_well_shrine: wellModel,
  obj_ald_processional_marker: shrineStone,
  obj_ald_mouthstone_field_marker: shrineStone,
  obj_ald_cave_evidence_shrine: shrineStone,
  obj_ald_river_votive_landing: dockModel,
  obj_p_votive_token: shrineStone,
  obj_p_shrine_stone: shrineStone,
  obj_net_shrine_family: shrineStone,
  obj_net_votive_heap: candleCluster,
  obj_net_stele: shrineStone,
  obj_net_krater: (base) => simpleVessel(base, "amphora"),
  obj_net_omphalos: shrineStone,
  obj_net_arch_sigil: networkProp,
  obj_net_bone_pile: networkProp,
  obj_net_brazier_cold: networkProp,
  obj_net_column_root: networkProp,
  obj_net_glass_growth: networkProp,
  obj_net_glass_kneeler: (base) =>
    makeMeshModel(
      base,
      [
        cylinder("kneeler_body", [0, 0.42, 0], [0.34, 0.84, 0.34], "glassViolet", 6, [0.28, 0, 0]),
        sphere("faceted_head", [0.16, 0.92, 0], [0.24, 0.24, 0.24], "glassCyan", 6),
        box("shadow_plinth", [0, 0.06, 0], [0.72, 0.1, 0.44], "blackGlass"),
      ],
      ["glassViolet", "glassCyan", "blackGlass"],
    ),
  obj_net_rite_circle: networkProp,
  obj_net_root_curtain: networkProp,
  obj_net_rubble: networkProp,
  obj_p_furnace: (base) => glassworksMachine(base, "furnace"),
  obj_p_smokestack: (base) => glassworksMachine(base, "smokestack"),
  obj_p_railcart: (base) => glassworksMachine(base, "railcart"),
  obj_c_glass_dome: (base) => glassworksMachine(base, "dome"),
  obj_ald_glassworks_furnace_bank: (base) => glassworksMachine(base, "furnace"),
  obj_ald_smokestack_cluster: (base) => glassworksMachine(base, "smokestack"),
  obj_iron_maiden: prisonProp,
  obj_pillory: prisonProp,
  obj_tree: sacredTreeAsset,
  obj_pine: sacredTreeAsset,
  obj_pine_large: sacredTreeAsset,
  obj_dead_tree: sacredTreeAsset,
  obj_cypress: sacredTreeAsset,
  obj_fig_tree: sacredTreeAsset,
  obj_p_oak: sacredTreeAsset,
  obj_p_yew: sacredTreeAsset,
  obj_bush: (base) => bushModel(base),
  obj_flower_bush: (base) => bushModel(base, true),
  obj_grass_tuft: grassTuftModel,
};

export const applyAlderamonticoModelKit = (object: ObjectData): ObjectData => {
  const builder = builders[object.id];
  return builder ? builder(object) : object;
};

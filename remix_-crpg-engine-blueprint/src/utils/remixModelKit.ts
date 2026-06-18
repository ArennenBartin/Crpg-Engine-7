import type { ObjectData, ObjectMaterialData, ObjectPart } from "../schema/game";

type Vec3 = [number, number, number];
type MatKey = keyof typeof MATERIALS;
type PartShape = ObjectPart["shape"];

const material = (
  id: string,
  name: string,
  color: string,
  texture_kind: ObjectMaterialData["texture_kind"],
  options: Partial<
    Pick<
      ObjectMaterialData,
      "emissive" | "emissive_intensity" | "opacity" | "transparent" | "roughness" | "metalness" | "texture_scale" | "texture_strength"
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
  metalness: options.metalness ?? 0.05,
  texture_kind,
  texture_scale: options.texture_scale ?? 1.25,
  texture_strength: options.texture_strength ?? 0.28,
});

const MATERIALS = {
  wetBlack: material("rmk_wet_black", "Wet Black Marble", "#111421", "marble_veins", {
    emissive: "#161f38",
    emissive_intensity: 0.16,
    roughness: 0.32,
    metalness: 0.12,
    texture_strength: 0.42,
  }),
  churchStone: material("rmk_church_stone", "White Church Stone", "#CFC8B8", "stone_grain", {
    roughness: 0.72,
    texture_strength: 0.34,
  }),
  violetStone: material("rmk_violet_stone", "Violet Weathered Stone", "#776779", "stone_grain", {
    roughness: 0.78,
    texture_strength: 0.32,
  }),
  darkWood: material("rmk_dark_wood", "Dark Licensed Timber", "#34222B", "wood_grain", {
    roughness: 0.74,
    texture_strength: 0.36,
  }),
  oldWood: material("rmk_old_wood", "Old Market Cedar", "#7A4F38", "wood_grain", {
    roughness: 0.68,
    texture_strength: 0.32,
  }),
  iron: material("rmk_black_iron", "Black Iron", "#11131B", "metal_scratches", {
    roughness: 0.45,
    metalness: 0.68,
  }),
  brass: material("rmk_brass", "Warm Brass", "#C3913D", "metal_scratches", {
    roughness: 0.34,
    metalness: 0.72,
  }),
  parchment: material("rmk_parchment", "Waxed Parchment", "#D7BE85", "paper_fiber", {
    roughness: 0.84,
  }),
  glassCyan: material("rmk_glass_cyan", "Cyan Holy Glass", "#4EDDE6", "glass_facets", {
    emissive: "#1FB8CF",
    emissive_intensity: 0.56,
    opacity: 0.82,
    transparent: true,
    roughness: 0.22,
  }),
  glassViolet: material("rmk_glass_violet", "Violet Holy Glass", "#8A54D6", "glass_facets", {
    emissive: "#4B2495",
    emissive_intensity: 0.52,
    opacity: 0.82,
    transparent: true,
    roughness: 0.22,
  }),
  glassRose: material("rmk_glass_rose", "Rose Witness Glass", "#C3476A", "glass_facets", {
    emissive: "#7C1734",
    emissive_intensity: 0.38,
    opacity: 0.84,
    transparent: true,
    roughness: 0.24,
  }),
  blood: material("rmk_blood", "Blackened Witness Blood", "#761726", "blood_sheen", {
    roughness: 0.28,
    texture_strength: 0.4,
  }),
  soot: material("rmk_soot", "Glassworks Soot", "#1E1B24", "soil_grit", {
    roughness: 0.9,
  }),
  bone: material("rmk_bone", "Ossuary Bone", "#C9BFA6", "bone_pores", {
    roughness: 0.78,
  }),
  water: material("rmk_oily_water", "Oily River Water", "#1F5966", "water_shimmer", {
    emissive: "#143B4A",
    emissive_intensity: 0.18,
    opacity: 0.86,
    transparent: true,
    roughness: 0.24,
  }),
  leaf: material("rmk_dark_leaf", "Black Cypress Green", "#284B34", "soil_grit", {
    roughness: 0.8,
  }),
  flame: material("rmk_flame", "Low Holy Flame", "#FFB05D", "none", {
    emissive: "#FF7630",
    emissive_intensity: 1.7,
    roughness: 0.2,
  }),
};

const mat = (key: MatKey) => MATERIALS[key].id;

const part = (
  shape: PartShape,
  name: string,
  position: Vec3,
  size: Vec3,
  materialKey: MatKey,
  rotation: Vec3 = [0, 0, 0],
  segments?: number,
): ObjectPart => ({
  shape,
  name,
  position,
  rotation,
  size,
  material: mat(materialKey),
  ...(segments ? { segments } : {}),
});

const box = (name: string, position: Vec3, size: Vec3, materialKey: MatKey, rotation: Vec3 = [0, 0, 0]) =>
  part("box", name, position, size, materialKey, rotation);
const slab = (name: string, position: Vec3, size: Vec3, materialKey: MatKey, rotation: Vec3 = [0, 0, 0]) =>
  part("slab", name, position, size, materialKey, rotation);
const cylinder = (
  name: string,
  position: Vec3,
  size: Vec3,
  materialKey: MatKey,
  segments = 8,
  rotation: Vec3 = [0, 0, 0],
) => part("cylinder", name, position, size, materialKey, rotation, segments);
const cone = (name: string, position: Vec3, size: Vec3, materialKey: MatKey, segments = 6, rotation: Vec3 = [0, 0, 0]) =>
  part("cone", name, position, size, materialKey, rotation, segments);
const sphere = (name: string, position: Vec3, size: Vec3, materialKey: MatKey, segments = 8) =>
  part("sphere", name, position, size, materialKey, [0, 0, 0], segments);

const footprintRect = (x0: number, z0: number, x1: number, z1: number): [number, number][] => {
  const cells: [number, number][] = [];
  for (let x = x0; x <= x1; x += 1) {
    for (let z = z0; z <= z1; z += 1) cells.push([x, z]);
  }
  return cells;
};

const object = (
  id: string,
  display_name: string,
  parts: ObjectPart[],
  materialKeys: MatKey[],
  bounds: Vec3,
  footprint: [number, number][] = [[0, 0]],
  extraTags: string[] = [],
): ObjectData => ({
  id,
  display_name,
  category: "setpiece",
  tags: ["alderamontico", "remix", "setpiece", ...extraTags],
  origin: "center_floor",
  bounds,
  materials: materialKeys.map(mat),
  material_settings: materialKeys.map((key) => MATERIALS[key]),
  model_kind: "parts",
  parts,
  decals: [],
  reference_images: [],
  collision: {
    profile: footprint.length ? "custom_footprint" : "none",
    footprint,
  },
});

const candles = (prefix: string, xs: number[], z: number, y = 0.28): ObjectPart[] =>
  xs.flatMap((x, i) => [
    cylinder(`${prefix}_wax_${i}`, [x, y, z], [0.08, 0.38, 0.08], "parchment", 7),
    sphere(`${prefix}_flame_${i}`, [x, y + 0.24, z], [0.08, 0.12, 0.08], "flame", 6),
  ]);

const civicRouteBoard = () =>
  object(
    "obj_ald_civic_route_board",
    "Civic Route Ledger",
    [
      box("black_marble_base", [0, 0.08, 0], [1.4, 0.16, 0.36], "wetBlack"),
      box("left_post", [-0.58, 0.8, 0], [0.1, 1.45, 0.1], "iron"),
      box("right_post", [0.58, 0.8, 0], [0.1, 1.45, 0.1], "iron"),
      box("stone_board", [0, 1.0, 0.02], [1.18, 0.9, 0.08], "churchStone"),
      box("ledger_slip_a", [-0.22, 1.12, 0.08], [0.38, 0.3, 0.025], "parchment", [0, 0, 0.04]),
      box("ledger_slip_b", [0.24, 0.92, 0.08], [0.42, 0.34, 0.025], "parchment", [0, 0, -0.06]),
      box("brass_crossbar", [0, 1.55, 0.06], [1.28, 0.06, 0.08], "brass"),
      sphere("violet_seal", [0, 0.72, 0.09], [0.11, 0.11, 0.06], "glassViolet", 7),
    ],
    ["wetBlack", "iron", "churchStone", "parchment", "brass", "glassViolet"],
    [1.5, 1.65, 0.5],
  );

const marketLedgerStall = () =>
  object(
    "obj_ald_market_ledger_stall",
    "Candle Ledger Market Stall",
    [
      box("stone_counter", [0, 0.42, 0.24], [1.65, 0.26, 0.62], "wetBlack"),
      box("cedar_underframe", [0, 0.24, 0.12], [1.4, 0.28, 0.52], "oldWood"),
      cylinder("left_post", [-0.72, 1.0, -0.24], [0.08, 1.42, 0.08], "darkWood", 6),
      cylinder("right_post", [0.72, 1.0, -0.24], [0.08, 1.42, 0.08], "darkWood", 6),
      slab("stained_canopy", [0, 1.66, 0], [1.82, 0.09, 1.0], "glassRose", [0.18, 0, 0]),
      box("ledger_open", [-0.2, 0.62, 0.36], [0.52, 0.04, 0.34], "parchment", [0, 0.1, 0]),
      cylinder("brass_scale", [0.42, 0.68, 0.32], [0.18, 0.2, 0.18], "brass", 8),
      ...candles("stall", [-0.62, 0.62], 0.42, 0.7),
      box("glass_gloves", [0.12, 0.64, 0.02], [0.36, 0.06, 0.18], "glassCyan", [0, 0.3, 0]),
    ],
    ["wetBlack", "oldWood", "darkWood", "glassRose", "parchment", "brass", "glassCyan", "flame"],
    [1.9, 1.8, 1.1],
    footprintRect(-1, 0, 1, 0),
    ["light_source", "light_warm", "light_small"],
  );

const cordonViewingRail = () =>
  object(
    "obj_ald_cordon_viewing_rail",
    "Church Cordon Viewing Rail",
    [
      box("black_base", [0, 0.07, 0], [2.0, 0.14, 0.18], "wetBlack"),
      ...[-0.82, -0.28, 0.28, 0.82].map((x, i) => cylinder(`post_${i}`, [x, 0.68, 0], [0.07, 1.18, 0.07], "iron", 6)),
      box("upper_rail", [0, 1.2, 0], [2.05, 0.08, 0.08], "brass"),
      box("lower_rail", [0, 0.76, 0], [2.05, 0.06, 0.06], "iron"),
      box("warning_writ", [0, 0.94, 0.06], [0.46, 0.3, 0.025], "parchment"),
      box("blood_thread", [-0.02, 0.94, 0.08], [0.04, 0.3, 0.02], "blood"),
    ],
    ["wetBlack", "iron", "brass", "parchment", "blood"],
    [2.15, 1.32, 0.28],
    footprintRect(-1, 0, 1, 0),
  );

const cordonCornerStandard = () =>
  object(
    "obj_ald_cordon_corner_standard",
    "Church Cordon Corner Standard",
    [
      box("black_marble_foot", [0, 0.08, 0], [0.54, 0.16, 0.54], "wetBlack"),
      cylinder("iron_standard", [0, 0.72, 0], [0.1, 1.22, 0.1], "iron", 7),
      cylinder("brass_cap", [0, 1.36, 0], [0.2, 0.1, 0.2], "brass", 8),
      cone("warning_spike", [0, 1.54, 0], [0.16, 0.34, 0.16], "iron", 6),
      box("brass_socket_e", [0.36, 1.12, 0], [0.7, 0.07, 0.07], "brass"),
      box("brass_socket_w", [-0.36, 1.12, 0], [0.7, 0.07, 0.07], "brass"),
      box("brass_socket_s", [0, 1.12, 0.36], [0.07, 0.07, 0.7], "brass"),
      box("brass_socket_n", [0, 1.12, -0.36], [0.07, 0.07, 0.7], "brass"),
      box("iron_socket_e", [0.3, 0.76, 0], [0.58, 0.055, 0.055], "iron"),
      box("iron_socket_w", [-0.3, 0.76, 0], [0.58, 0.055, 0.055], "iron"),
      box("iron_socket_s", [0, 0.76, 0.3], [0.055, 0.055, 0.58], "iron"),
      box("iron_socket_n", [0, 0.76, -0.3], [0.055, 0.055, 0.58], "iron"),
      box("sealed_writ_a", [0.15, 0.56, 0.17], [0.2, 0.24, 0.025], "parchment", [0, 0.2, 0]),
      sphere("rose_seal", [0.23, 0.48, 0.2], [0.07, 0.07, 0.04], "glassRose", 6),
    ],
    ["wetBlack", "iron", "brass", "parchment", "glassRose"],
    [0.9, 1.72, 0.9],
  );

const witnessVotiveBank = () =>
  object(
    "obj_ald_witness_votive_bank",
    "Witness Votive Evidence Bank",
    [
      slab("marble_slab", [0, 0.08, 0], [1.25, 0.12, 0.82], "churchStone"),
      box("black_cloth", [0, 0.17, 0], [1.08, 0.035, 0.62], "wetBlack"),
      ...candles("witness", [-0.42, -0.18, 0.18, 0.42], -0.12, 0.34),
      cone("glass_evidence_a", [-0.28, 0.34, 0.18], [0.12, 0.42, 0.12], "glassCyan", 5, [0.12, 0, -0.08]),
      cone("glass_evidence_b", [0.26, 0.32, 0.16], [0.1, 0.36, 0.1], "glassViolet", 5, [-0.08, 0, 0.1]),
      box("evidence_marker", [0, 0.36, 0.3], [0.46, 0.08, 0.025], "brass"),
    ],
    ["churchStone", "wetBlack", "parchment", "flame", "glassCyan", "glassViolet", "brass"],
    [1.35, 0.58, 0.9],
    [[0, 0]],
    ["light_source", "light_warm", "light_small"],
  );

const residentialWellShrine = () =>
  object(
    "obj_ald_residential_well_shrine",
    "Residential Well Shrine",
    [
      cylinder("basin", [0, 0.26, 0], [0.82, 0.38, 0.82], "violetStone", 9),
      cylinder("water", [0, 0.48, 0], [0.62, 0.04, 0.62], "water", 9),
      cylinder("left_pier", [-0.52, 0.94, 0], [0.08, 1.18, 0.08], "churchStone", 6),
      cylinder("right_pier", [0.52, 0.94, 0], [0.08, 1.18, 0.08], "churchStone", 6),
      box("crossbar", [0, 1.46, 0], [1.18, 0.08, 0.08], "brass"),
      box("tiny_shrine", [0, 0.88, -0.58], [0.52, 0.7, 0.12], "churchStone"),
      sphere("glass_offering", [0, 0.82, -0.66], [0.11, 0.11, 0.06], "glassCyan", 7),
    ],
    ["violetStone", "water", "churchStone", "brass", "glassCyan"],
    [1.3, 1.55, 1.3],
  );

const lazareLicenseThreshold = () =>
  object(
    "obj_ald_lazare_license_threshold",
    "Licensed Blood-House Threshold",
    [
      box("black_step", [0, 0.08, 0.18], [1.55, 0.16, 0.56], "wetBlack"),
      box("dark_door_shadow", [0, 0.85, -0.1], [1.12, 1.5, 0.12], "darkWood"),
      box("iron_chain_a", [0, 1.16, -0.02], [1.2, 0.06, 0.06], "iron", [0, 0, 0.2]),
      box("iron_chain_b", [0, 0.82, -0.01], [1.2, 0.06, 0.06], "iron", [0, 0, -0.18]),
      box("license_plaque", [0.42, 1.02, -0.18], [0.3, 0.46, 0.035], "brass"),
      box("seal_black", [0.42, 1.02, -0.15], [0.14, 0.14, 0.025], "wetBlack"),
      sphere("threshold_candle", [-0.48, 0.36, 0.44], [0.09, 0.16, 0.09], "flame", 7),
      cylinder("threshold_wax", [-0.48, 0.25, 0.44], [0.08, 0.28, 0.08], "parchment", 7),
    ],
    ["wetBlack", "darkWood", "iron", "brass", "flame", "parchment"],
    [1.65, 1.62, 0.72],
    footprintRect(-1, 0, 1, 0),
    ["light_source", "light_warm", "light_small"],
  );

const glassworksFurnaceBank = () =>
  object(
    "obj_ald_glassworks_furnace_bank",
    "Gothic Glassworks Furnace Bank",
    [
      box("main_furnace", [0, 0.7, 0], [2.25, 1.32, 0.9], "soot"),
      box("church_arch_frame", [0, 1.1, 0.48], [1.2, 1.2, 0.08], "churchStone"),
      box("fire_mouth", [0, 0.56, 0.54], [0.82, 0.42, 0.06], "flame"),
      box("brass_lintel", [0, 1.05, 0.58], [1.0, 0.08, 0.06], "brass"),
      cylinder("left_pressure_pipe", [-0.92, 1.42, 0.12], [0.1, 1.15, 0.1], "iron", 8),
      cylinder("right_pressure_pipe", [0.92, 1.38, -0.1], [0.1, 1.05, 0.1], "brass", 8),
      cylinder("gauge_a", [-0.55, 1.42, 0.5], [0.16, 0.06, 0.16], "brass", 8, [Math.PI / 2, 0, 0]),
      cylinder("gauge_b", [0.55, 1.34, 0.5], [0.16, 0.06, 0.16], "brass", 8, [Math.PI / 2, 0, 0]),
      cone("cyan_glass_spill", [-0.36, 0.12, 0.72], [0.22, 0.12, 0.42], "glassCyan", 5, [Math.PI / 2, 0, 0.2]),
      cone("violet_glass_spill", [0.34, 0.12, 0.7], [0.2, 0.1, 0.34], "glassViolet", 5, [Math.PI / 2, 0, -0.1]),
    ],
    ["soot", "churchStone", "flame", "brass", "iron", "glassCyan", "glassViolet"],
    [2.35, 2.05, 1.15],
    footprintRect(-1, 0, 1, 0),
    ["light_source", "light_warm", "light_large"],
  );

const smokestackCluster = () =>
  object(
    "obj_ald_smokestack_cluster",
    "Glassworks Smokestack Cluster",
    [
      box("shared_base", [0, 0.14, 0], [1.35, 0.28, 0.58], "soot"),
      ...[-0.45, 0, 0.45].flatMap((x, i) => [
        cylinder(`stack_${i}`, [x, 1.32 + i * 0.15, 0], [0.17, 2.42 + i * 0.3, 0.17], "soot", 9),
        cylinder(`band_${i}`, [x, 1.92 + i * 0.18, 0], [0.2, 0.06, 0.2], "iron", 9),
        sphere(`smoke_${i}`, [x + 0.06 * i, 2.65 + i * 0.34, 0.02], [0.24, 0.16, 0.24], i % 2 ? "glassViolet" : "glassCyan", 7),
      ]),
    ],
    ["soot", "iron", "glassViolet", "glassCyan"],
    [1.45, 3.25, 0.7],
  );

const processionalMarker = () =>
  object(
    "obj_ald_processional_marker",
    "Old Processional Marker",
    [
      box("black_road_stone", [0, 0.08, 0], [0.76, 0.16, 0.48], "wetBlack"),
      box("white_marker", [0, 0.62, 0], [0.46, 0.9, 0.2], "churchStone"),
      box("brass_line", [0, 0.76, 0.12], [0.28, 0.04, 0.025], "brass"),
      box("prayer_tag_a", [-0.28, 0.56, 0.14], [0.18, 0.26, 0.02], "parchment", [0, 0, 0.18]),
      box("prayer_tag_b", [0.26, 0.48, 0.14], [0.18, 0.22, 0.02], "parchment", [0, 0, -0.14]),
      cylinder("tag_pin", [0, 0.93, 0.14], [0.05, 0.12, 0.05], "brass", 6),
    ],
    ["wetBlack", "churchStone", "brass", "parchment"],
    [0.9, 1.12, 0.55],
  );

const glassThresholdBrazier = () =>
  object(
    "obj_ald_glass_threshold_brazier",
    "Glass-Touched Threshold Brazier",
    [
      cylinder("iron_bowl", [0, 0.58, 0], [0.54, 0.24, 0.54], "iron", 8),
      ...[-0.28, 0.28].map((x) => box(`leg_${x}`, [x, 0.3, 0], [0.06, 0.56, 0.06], "iron", [0, 0, x > 0 ? -0.18 : 0.18])),
      cone("cyan_shard", [-0.18, 0.96, 0.02], [0.13, 0.54, 0.13], "glassCyan", 5, [0.12, 0, -0.1]),
      cone("violet_shard", [0.16, 0.9, -0.02], [0.12, 0.48, 0.12], "glassViolet", 5, [-0.06, 0, 0.1]),
      box("black_root_a", [0, 0.18, 0.32], [0.7, 0.06, 0.06], "darkWood", [0, 0.4, 0]),
      box("black_root_b", [0.16, 0.16, -0.24], [0.58, 0.05, 0.05], "darkWood", [0, -0.55, 0]),
    ],
    ["iron", "glassCyan", "glassViolet", "darkWood"],
    [0.92, 1.28, 0.9],
    [[0, 0]],
    ["light_source", "light_cyan", "light_small"],
  );

const civicLanternPost = () =>
  object(
    "obj_ald_civic_lantern_post",
    "Alderamontico Civic Lantern Post",
    [
      cylinder("black_marble_foot", [0, 0.09, 0], [0.36, 0.18, 0.36], "wetBlack", 8),
      cylinder("iron_post", [0, 0.82, 0], [0.08, 1.45, 0.08], "iron", 7),
      box("brass_collar_low", [0, 0.42, 0], [0.24, 0.06, 0.24], "brass"),
      box("brass_collar_high", [0, 1.18, 0], [0.22, 0.06, 0.22], "brass"),
      box("gothic_hook", [0, 1.48, 0.18], [0.08, 0.08, 0.42], "iron", [0, 0, 0.1]),
      cylinder("lantern_cage", [0, 1.38, 0.42], [0.34, 0.42, 0.34], "iron", 8),
      sphere("warm_glass_core", [0, 1.38, 0.42], [0.22, 0.26, 0.22], "flame", 8),
      cone("cage_roof", [0, 1.66, 0.42], [0.38, 0.28, 0.38], "brass", 8),
      cone("needle_finial", [0, 1.86, 0.42], [0.12, 0.28, 0.12], "iron", 6),
    ],
    ["wetBlack", "iron", "brass", "flame"],
    [0.7, 2.02, 0.95],
    [[0, 0]],
    ["light_source", "light_warm", "light_medium"],
  );

const votiveLightCluster = () =>
  object(
    "obj_ald_votive_light_cluster",
    "Alderamontico Votive Light Cluster",
    [
      slab("stone_plate", [0, 0.06, 0], [0.82, 0.1, 0.66], "churchStone"),
      box("black_cloth_strip", [0, 0.13, 0], [0.72, 0.035, 0.48], "wetBlack"),
      ...candles("votive_cluster", [-0.28, 0, 0.28], -0.04, 0.26),
      cone("cyan_chip", [-0.2, 0.26, 0.18], [0.08, 0.24, 0.08], "glassCyan", 5, [0.1, 0, -0.1]),
      cone("rose_chip", [0.24, 0.24, 0.16], [0.08, 0.22, 0.08], "glassRose", 5, [-0.08, 0, 0.08]),
    ],
    ["churchStone", "wetBlack", "parchment", "flame", "glassCyan", "glassRose"],
    [0.92, 0.56, 0.72],
    [],
    ["light_source", "light_warm", "light_small"],
  );

const glassworksArcLamp = () =>
  object(
    "obj_ald_glassworks_arc_lamp",
    "Glassworks Brass Arc Lamp",
    [
      cylinder("soot_base", [0, 0.08, 0], [0.44, 0.16, 0.44], "soot", 8),
      cylinder("brass_stand", [0, 0.78, 0], [0.08, 1.36, 0.08], "brass", 8),
      box("iron_arm", [0.34, 1.42, 0], [0.72, 0.08, 0.08], "iron", [0, 0, -0.08]),
      cylinder("pressure_gauge", [0.08, 1.18, 0.08], [0.16, 0.06, 0.16], "brass", 8, [Math.PI / 2, 0, 0]),
      cylinder("lamp_ring", [0.72, 1.34, 0], [0.34, 0.16, 0.34], "iron", 8),
      sphere("cyan_arc_glass", [0.72, 1.34, 0], [0.24, 0.24, 0.24], "glassCyan", 8),
      cone("violet_spark", [0.72, 1.56, 0], [0.09, 0.22, 0.09], "glassViolet", 5),
    ],
    ["soot", "brass", "iron", "glassCyan", "glassViolet"],
    [1.18, 1.72, 0.6],
    [[0, 0]],
    ["light_source", "light_cyan", "light_medium"],
  );

const riverFogLantern = () =>
  object(
    "obj_ald_river_fog_lantern",
    "River Fog Lantern",
    [
      cylinder("short_black_post", [0, 0.42, 0], [0.08, 0.82, 0.08], "iron", 7),
      box("wooden_yoke", [0, 0.84, 0.16], [0.08, 0.08, 0.4], "darkWood", [0, 0, 0.05]),
      cylinder("hanging_cage", [0, 0.68, 0.4], [0.28, 0.34, 0.28], "brass", 7),
      sphere("cold_cyan_flame", [0, 0.68, 0.4], [0.18, 0.22, 0.18], "glassCyan", 7),
      box("wet_foot", [0, 0.04, 0], [0.42, 0.08, 0.42], "wetBlack"),
    ],
    ["iron", "darkWood", "brass", "glassCyan", "wetBlack"],
    [0.58, 1.0, 0.78],
    [[0, 0]],
    ["light_source", "light_cyan", "light_small"],
  );

const caveEvidenceShrine = () =>
  object(
    "obj_ald_cave_evidence_shrine",
    "Cave Evidence Shrine",
    [
      box("tally_slab", [0, 0.08, 0], [1.2, 0.16, 0.76], "wetBlack"),
      box("upright_tally", [-0.36, 0.56, -0.1], [0.24, 0.9, 0.12], "violetStone", [0, 0, 0.08]),
      box("upright_bowl_shelf", [0.22, 0.4, 0.06], [0.54, 0.14, 0.24], "churchStone"),
      cylinder("under_rite_bowl", [0.22, 0.56, 0.06], [0.24, 0.16, 0.24], "brass", 8),
      cone("glass_splinter", [0.54, 0.42, 0.18], [0.1, 0.42, 0.1], "glassCyan", 5),
      box("bone_marker", [-0.08, 0.24, 0.24], [0.5, 0.07, 0.09], "bone", [0, 0.28, 0]),
      ...candles("cave", [-0.48, 0.48], 0.24, 0.28),
    ],
    ["wetBlack", "violetStone", "churchStone", "brass", "glassCyan", "bone", "parchment", "flame"],
    [1.3, 1.08, 0.85],
    [[0, 0]],
    ["light_source", "light_warm", "light_small"],
  );

const riverVotiveLanding = () =>
  object(
    "obj_ald_river_votive_landing",
    "River Votive Landing",
    [
      box("wet_planks", [0, 0.16, 0], [1.5, 0.14, 0.86], "oldWood"),
      box("black_stair", [0.42, 0.06, 0.58], [0.82, 0.12, 0.28], "wetBlack"),
      box("rail_back", [0, 0.62, -0.42], [1.45, 0.08, 0.06], "iron"),
      cylinder("post_l", [-0.62, 0.42, -0.42], [0.08, 0.78, 0.08], "darkWood", 6),
      cylinder("post_r", [0.62, 0.42, -0.42], [0.08, 0.78, 0.08], "darkWood", 6),
      box("water_glint", [-0.32, 0.08, 0.52], [0.56, 0.025, 0.22], "water"),
      ...candles("river", [-0.42, 0.0, 0.42], 0.0, 0.32),
      box("rope_coil", [0.48, 0.32, -0.06], [0.34, 0.06, 0.28], "brass", [0, 0.3, 0]),
    ],
    ["oldWood", "wetBlack", "iron", "darkWood", "water", "parchment", "flame", "brass"],
    [1.62, 0.78, 1.05],
    footprintRect(-1, 0, 1, 0),
    ["light_source", "light_warm", "light_small"],
  );

const networkFamilyAltar = () =>
  object(
    "obj_ald_network_family_altar",
    "Domestic Under-Rite Family Altar",
    [
      box("family_table", [0, 0.38, 0], [1.25, 0.22, 0.64], "darkWood"),
      box("black_runner", [0, 0.52, 0], [1.04, 0.04, 0.5], "wetBlack"),
      box("family_stone_l", [-0.34, 0.82, -0.08], [0.24, 0.56, 0.12], "churchStone"),
      box("family_stone_r", [0.34, 0.78, -0.08], [0.24, 0.48, 0.12], "violetStone"),
      box("child_token", [0, 0.62, 0.2], [0.24, 0.08, 0.18], "bone"),
      sphere("cyan_vow", [0, 0.74, 0.1], [0.12, 0.12, 0.08], "glassCyan", 7),
      ...candles("family", [-0.48, 0.48], 0.24, 0.58),
    ],
    ["darkWood", "wetBlack", "churchStone", "violetStone", "bone", "glassCyan", "parchment", "flame"],
    [1.35, 1.12, 0.78],
    [[0, 0]],
    ["light_source", "light_warm", "light_small"],
  );

const networkOmphalosRing = () =>
  object(
    "obj_ald_network_omphalos_ring",
    "Deep Omphalos Rite Ring",
    [
      cylinder("black_disc", [0, 0.06, 0], [1.25, 0.12, 1.25], "wetBlack", 16),
      cylinder("omphalos", [0, 0.45, 0], [0.42, 0.78, 0.42], "violetStone", 9),
      box("gold_axis_ns", [0, 0.14, 0], [0.06, 0.04, 1.08], "brass"),
      box("gold_axis_ew", [0, 0.15, 0], [1.08, 0.04, 0.06], "brass"),
      ...[-0.62, 0.62].flatMap((x) => candles(`ring_${x}`, [x], 0, 0.26)),
      cone("violet_flaw", [0.18, 0.82, 0.12], [0.1, 0.38, 0.1], "glassViolet", 5, [0.08, 0, 0.08]),
    ],
    ["wetBlack", "violetStone", "brass", "parchment", "flame", "glassViolet"],
    [1.35, 1.05, 1.35],
    [[0, 0]],
    ["light_source", "light_violet", "light_medium"],
  );

const mouthstoneFieldMarker = () =>
  object(
    "obj_ald_mouthstone_field_marker",
    "Mouthstone Exile Road Marker",
    [
      box("sunken_step", [0, 0.04, 0], [0.9, 0.08, 0.62], "wetBlack"),
      box("leaning_black_marker", [0.05, 0.6, 0], [0.34, 1.05, 0.22], "violetStone", [0.08, 0, -0.12]),
      box("gold_notch", [0.04, 0.88, 0.13], [0.22, 0.05, 0.025], "brass"),
      box("white_lime_edge", [-0.2, 0.28, 0.12], [0.08, 0.42, 0.025], "churchStone"),
    ],
    ["wetBlack", "violetStone", "brass", "churchStone"],
    [1.0, 1.18, 0.72],
  );

const caveFloorTile = () =>
  object(
    "obj_ald_cave_floor",
    "Damp Cave Floor",
    [
      box("wet_cave_floor", [0, 0.01, 0], [1, 0.02, 1], "violetStone"),
    ],
    ["violetStone"],
    [1, 0.04, 1],
    [],
    ["floor"],
  );

export const createAlderamonticoRemixKit = (): ObjectData[] => [
  caveFloorTile(),
  civicRouteBoard(),
  marketLedgerStall(),
  cordonViewingRail(),
  cordonCornerStandard(),
  witnessVotiveBank(),
  residentialWellShrine(),
  lazareLicenseThreshold(),
  glassworksFurnaceBank(),
  smokestackCluster(),
  processionalMarker(),
  glassThresholdBrazier(),
  civicLanternPost(),
  votiveLightCluster(),
  glassworksArcLamp(),
  riverFogLantern(),
  caveEvidenceShrine(),
  riverVotiveLanding(),
  networkFamilyAltar(),
  networkOmphalosRing(),
  mouthstoneFieldMarker(),
];

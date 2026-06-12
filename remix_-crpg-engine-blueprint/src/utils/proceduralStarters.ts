import type {
  ObjectData,
  ObjectDecalData,
  ObjectMaterialData,
  ObjectMeshData,
  ObjectMeshFace,
  ObjectPart,
} from "../schema/game";
import {
  createMeshFromParts,
  getMeshBounds,
  recomputeMeshNormals,
  type Vec3,
} from "./meshModel";

export type ProceduralStarterKind =
  | "monolith"
  | "statue"
  | "shrine"
  | "church_wall"
  | "marble_path"
  | "river_altar"
  | "glass_growth"
  | "basement_clutter";

export const PROCEDURAL_STARTERS: {
  kind: ProceduralStarterKind;
  label: string;
}[] = [
  { kind: "monolith", label: "Monolith" },
  { kind: "statue", label: "Statue" },
  { kind: "shrine", label: "Shrine" },
  { kind: "church_wall", label: "Church Wall" },
  { kind: "marble_path", label: "Marble Path" },
  { kind: "river_altar", label: "River Altar" },
  { kind: "glass_growth", label: "Glass Growth" },
  { kind: "basement_clutter", label: "Basement Clutter" },
];

const MATERIALS = {
  blackStone: {
    id: "mat_black_star_stone",
    name: "Black-Star Stone",
    color: "#100D14",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.82,
    metalness: 0.03,
    texture_kind: "stone_grain",
    texture_scale: 1.75,
    texture_strength: 0.62,
  },
  oldMarble: {
    id: "mat_old_marble",
    name: "Old Marble",
    color: "#C4C8EA",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.55,
    metalness: 0.02,
    texture_kind: "marble_veins",
    texture_scale: 1.15,
    texture_strength: 0.58,
  },
  paleMarble: {
    id: "mat_pale_marble",
    name: "Pale Marble",
    color: "#EDF1FF",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.48,
    metalness: 0.02,
    texture_kind: "paper_fiber",
    texture_scale: 1.35,
    texture_strength: 0.34,
  },
  gridGlow: {
    id: "mat_grid_glow",
    name: "Grid Glow",
    color: "#8CF6FF",
    emissive: "#8CF6FF",
    emissive_intensity: 1.7,
    opacity: 0.72,
    transparent: true,
    roughness: 0.2,
    metalness: 0,
    texture_kind: "glass_facets",
    texture_scale: 1.4,
    texture_strength: 0.72,
  },
  riverWater: {
    id: "mat_river_teal_water",
    name: "River Teal Water",
    color: "#22D3C5",
    emissive: "#22D3C5",
    emissive_intensity: 0.55,
    opacity: 0.62,
    transparent: true,
    roughness: 0.18,
    metalness: 0,
    texture_kind: "water_shimmer",
    texture_scale: 1.2,
    texture_strength: 0.66,
  },
  churchGold: {
    id: "mat_church_gold",
    name: "Church Gold",
    color: "#FFC95A",
    emissive: "#FFC95A",
    emissive_intensity: 0.5,
    opacity: 1,
    transparent: false,
    roughness: 0.36,
    metalness: 0.25,
    texture_kind: "metal_scratches",
    texture_scale: 1.35,
    texture_strength: 0.5,
  },
  blood: {
    id: "mat_old_blood",
    name: "Old Blood",
    color: "#FF1E4D",
    emissive: "#5A0016",
    emissive_intensity: 0.3,
    opacity: 1,
    transparent: false,
    roughness: 0.74,
    metalness: 0,
    texture_kind: "blood_sheen",
    texture_scale: 1.1,
    texture_strength: 0.62,
  },
  deadWood: {
    id: "mat_dead_wood",
    name: "Dead Wood",
    color: "#6A4A5C",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.86,
    metalness: 0,
    texture_kind: "wood_grain",
    texture_scale: 1.65,
    texture_strength: 0.7,
  },
  blackSoil: {
    id: "mat_black_soil",
    name: "Black Soil",
    color: "#261C2B",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.94,
    metalness: 0,
    texture_kind: "soil_grit",
    texture_scale: 1.9,
    texture_strength: 0.76,
  },
  bone: {
    id: "mat_bone",
    name: "Bone",
    color: "#DDD6EE",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.72,
    metalness: 0,
    texture_kind: "bone_pores",
    texture_scale: 1.25,
    texture_strength: 0.5,
  },
  robePurple: {
    id: "mat_robe_purple",
    name: "Robe Purple",
    color: "#6320EE",
    emissive: "#000000",
    emissive_intensity: 0,
    opacity: 1,
    transparent: false,
    roughness: 0.7,
    metalness: 0.02,
    texture_kind: "cloth_weave",
    texture_scale: 1.55,
    texture_strength: 0.58,
  },
} satisfies Record<string, ObjectMaterialData>;

const material = (key: keyof typeof MATERIALS) => MATERIALS[key].id;

const box = (
  name: string,
  position: Vec3,
  size: Vec3,
  materialKey: keyof typeof MATERIALS,
  rotation: Vec3 = [0, 0, 0],
): ObjectPart => ({
  shape: "box",
  name,
  position,
  rotation,
  size,
  material: material(materialKey),
});

const cylinder = (
  name: string,
  position: Vec3,
  diameter: number,
  height: number,
  materialKey: keyof typeof MATERIALS,
  segments = 10,
  rotation: Vec3 = [0, 0, 0],
): ObjectPart => ({
  shape: "cylinder",
  name,
  position,
  rotation,
  size: [diameter, height, diameter],
  segments,
  material: material(materialKey),
});

const cone = (
  name: string,
  position: Vec3,
  diameter: number,
  height: number,
  materialKey: keyof typeof MATERIALS,
  segments = 5,
  rotation: Vec3 = [0, 0, 0],
): ObjectPart => ({
  shape: "cone",
  name,
  position,
  rotation,
  size: [diameter, height, diameter],
  segments,
  material: material(materialKey),
});

const sphere = (
  name: string,
  position: Vec3,
  size: Vec3,
  materialKey: keyof typeof MATERIALS,
  rotation: Vec3 = [0, 0, 0],
): ObjectPart => ({
  shape: "sphere",
  name,
  position,
  rotation,
  size,
  material: material(materialKey),
});

const rectFootprint = (width: number, depth: number) => {
  const minX = -Math.floor(width / 2);
  const minZ = -Math.floor(depth / 2);
  const footprint: [number, number][] = [];

  for (let x = minX; x < minX + width; x++) {
    for (let z = minZ; z < minZ + depth; z++) {
      footprint.push([x, z]);
    }
  }

  return footprint;
};

const decal = (
  id: string,
  kind: ObjectDecalData["kind"],
  position: Vec3,
  rotation: Vec3,
  size: [number, number],
  color: string,
  opacity: number,
  emissive = false,
): ObjectDecalData => ({
  id,
  name: id.replace(/^decal_/, "").replace(/_/g, " "),
  kind,
  position,
  rotation,
  size,
  color,
  opacity,
  emissive,
});

const baseObject = ({
  id,
  kind,
  displayName,
  category = "procedural",
  tags,
  parts,
  decals,
  materialKeys,
  footprint,
  collisionProfile = "custom_footprint",
}: {
  id?: string;
  kind: ProceduralStarterKind;
  displayName: string;
  category?: string;
  tags: string[];
  parts: ObjectPart[];
  decals: ObjectDecalData[];
  materialKeys: (keyof typeof MATERIALS)[];
  footprint: [number, number][];
  collisionProfile?: ObjectData["collision"]["profile"];
}): ObjectData => {
  const unique = Date.now();
  const materials = materialKeys.map(material);
  const sourceObject: ObjectData = {
    id: id || `obj_${kind}_${unique}`,
    display_name: displayName,
    category,
    tags: ["procedural", kind, ...tags],
    origin: "center_floor",
    bounds: [1, 1, 1],
    materials,
    material_settings: materialKeys.map((key) => MATERIALS[key]),
    model_kind: "mesh",
    parts,
    decals,
    reference_images: [],
    collision: {
      profile: collisionProfile,
      footprint,
    },
  };
  const mesh = createMeshFromParts(sourceObject);

  return {
    ...sourceObject,
    bounds: getMeshBounds(mesh),
    mesh,
  };
};

const meshFace = (
  name: string,
  vertices: number[],
  materialRef: string,
  group: string,
): ObjectMeshFace => ({
  name,
  vertices,
  material: materialRef,
  group,
});

const baseMeshObject = ({
  id,
  kind,
  displayName,
  category = "procedural",
  tags,
  mesh,
  decals,
  materialKeys,
  footprint,
  collisionProfile = "custom_footprint",
}: {
  id?: string;
  kind: ProceduralStarterKind;
  displayName: string;
  category?: string;
  tags: string[];
  mesh: ObjectMeshData;
  decals: ObjectDecalData[];
  materialKeys: (keyof typeof MATERIALS)[];
  footprint: [number, number][];
  collisionProfile?: ObjectData["collision"]["profile"];
}): ObjectData => {
  const normalizedMesh = recomputeMeshNormals(mesh);
  const materials = materialKeys.map(material);

  return {
    id: id || `obj_${kind}_${Date.now()}`,
    display_name: displayName,
    category,
    tags: ["procedural", kind, ...tags],
    origin: "center_floor",
    bounds: getMeshBounds(normalizedMesh),
    materials,
    material_settings: materialKeys.map((key) => MATERIALS[key]),
    model_kind: "mesh",
    parts: [],
    mesh: normalizedMesh,
    decals,
    reference_images: [],
    collision: {
      profile: collisionProfile,
      footprint,
    },
  };
};

const createLowPolyWitnessStatueMesh = (): ObjectMeshData => {
  const marble = material("paleMarble");
  const shade = material("oldMarble");
  const mesh: ObjectMeshData = {
    vertices: [],
    faces: [],
    material_slots: [marble, shade],
    groups: [],
  };
  const groups = new Set<string>();
  const ringShape: [number, number][] = [
    [0, 1],
    [0.72, 0.62],
    [0.9, -0.22],
    [0, -0.86],
    [-0.9, -0.22],
    [-0.72, 0.62],
  ];

  const addVertex = (vertex: Vec3) => {
    mesh.vertices.push(vertex);
    return mesh.vertices.length - 1;
  };

  const addFace = (
    name: string,
    vertices: number[],
    materialRef = marble,
    group = name.replace(/_\d+$/, ""),
  ) => {
    groups.add(group);
    mesh.faces.push(meshFace(name, vertices, materialRef, group));
  };

  const addFaceFromPoints = (
    name: string,
    points: Vec3[],
    materialRef = shade,
    group = "front_facets",
  ) => addFace(name, points.map(addVertex), materialRef, group);

  const addRing = (
    group: string,
    center: Vec3,
    width: number,
    depth: number,
  ) =>
    ringShape.map(([x, z]) =>
      addVertex([
        center[0] + x * width * 0.5,
        center[1],
        center[2] + z * depth * 0.5,
      ]),
    );

  const connectRings = (
    group: string,
    lower: number[],
    upper: number[],
    materialRef = marble,
  ) => {
    lower.forEach((vertexId, index) => {
      const next = (index + 1) % lower.length;
      const panelMaterial = index === 2 || index === 3 ? shade : materialRef;
      addFace(
        `${group}_panel_${index}`,
        [vertexId, lower[next], upper[next], upper[index]],
        panelMaterial,
        group,
      );
    });
  };

  const capRing = (
    name: string,
    ring: number[],
    materialRef = marble,
    reverse = false,
  ) => addFace(name, reverse ? [...ring].reverse() : ring, materialRef, name);

  const addTaperedPrism = (
    name: string,
    start: Vec3,
    end: Vec3,
    startWidth: number,
    startDepth: number,
    endWidth: number,
    endDepth: number,
    materialRef = marble,
  ) => {
    const startRing = [
      addVertex([start[0] - startWidth / 2, start[1], start[2] + startDepth / 2]),
      addVertex([start[0] + startWidth / 2, start[1], start[2] + startDepth / 2]),
      addVertex([start[0] + startWidth / 2, start[1], start[2] - startDepth / 2]),
      addVertex([start[0] - startWidth / 2, start[1], start[2] - startDepth / 2]),
    ];
    const endRing = [
      addVertex([end[0] - endWidth / 2, end[1], end[2] + endDepth / 2]),
      addVertex([end[0] + endWidth / 2, end[1], end[2] + endDepth / 2]),
      addVertex([end[0] + endWidth / 2, end[1], end[2] - endDepth / 2]),
      addVertex([end[0] - endWidth / 2, end[1], end[2] - endDepth / 2]),
    ];

    for (let index = 0; index < 4; index += 1) {
      const next = (index + 1) % 4;
      addFace(
        `${name}_side_${index}`,
        [startRing[index], startRing[next], endRing[next], endRing[index]],
        materialRef,
        name,
      );
    }
    addFace(`${name}_broken_cap`, endRing, shade, name);
  };

  const baseBottom = addRing("small_base", [0, 0.02, 0.02], 0.78, 0.42);
  const baseTop = addRing("small_base", [-0.03, 0.16, 0.04], 0.64, 0.34);
  connectRings("small_base", baseBottom, baseTop, shade);
  capRing("base_bottom", baseBottom, shade, true);
  capRing("base_top", baseTop, marble);

  const foot = addRing("draped_figure", [0.05, 0.18, 0.03], 0.32, 0.22);
  const lowerLeg = addRing("draped_figure", [0.02, 0.56, 0.01], 0.28, 0.2);
  const knee = addRing("draped_figure", [-0.04, 0.98, 0.02], 0.38, 0.25);
  const hip = addRing("draped_figure", [-0.15, 1.36, 0.03], 0.56, 0.31);
  const waist = addRing("torso", [-0.02, 1.68, 0.04], 0.38, 0.24);
  const chest = addRing("torso", [0.07, 2.07, 0.04], 0.5, 0.28);
  const shoulder = addRing("torso", [0.11, 2.37, 0.02], 0.6, 0.28);
  const neck = addRing("neck", [-0.04, 2.55, 0.03], 0.2, 0.16);

  connectRings("base_to_robe", baseTop, foot, marble);
  connectRings("lower_drapery", foot, lowerLeg, marble);
  connectRings("lower_drapery", lowerLeg, knee, marble);
  connectRings("hip_drapery", knee, hip, marble);
  connectRings("waist_twist", hip, waist, marble);
  connectRings("bare_torso", waist, chest, marble);
  connectRings("bare_torso", chest, shoulder, marble);
  connectRings("neck", shoulder, neck, marble);

  const headLower = addRing("faceted_head", [-0.13, 2.67, 0.04], 0.24, 0.18);
  const headMid = addRing("faceted_head", [-0.22, 2.9, 0.04], 0.34, 0.24);
  const headTop = addRing("faceted_head", [-0.25, 3.12, 0.02], 0.24, 0.19);

  connectRings("faceted_head", neck, headLower, marble);
  connectRings("faceted_head", headLower, headMid, marble);
  connectRings("faceted_head", headMid, headTop, marble);
  capRing("head_top_plane", headTop, shade);

  addTaperedPrism(
    "left_broken_arm",
    [-0.31, 2.27, 0.02],
    [-0.46, 1.98, 0.11],
    0.18,
    0.14,
    0.12,
    0.1,
  );
  addTaperedPrism(
    "right_shoulder_stump",
    [0.42, 2.27, 0],
    [0.34, 2.06, 0.1],
    0.18,
    0.14,
    0.1,
    0.1,
  );

  addFaceFromPoints("chest_left_plane", [
    [-0.25, 2.24, 0.18],
    [0.05, 2.12, 0.22],
    [-0.06, 1.92, 0.24],
  ]);
  addFaceFromPoints("chest_right_plane", [
    [0.3, 2.24, 0.16],
    [0.05, 2.12, 0.22],
    [0.18, 1.92, 0.23],
  ]);
  addFaceFromPoints("waist_sharp_fold", [
    [-0.27, 1.47, 0.24],
    [0.18, 1.55, 0.26],
    [-0.02, 1.33, 0.28],
  ]);
  addFaceFromPoints("front_skirt_left_facet", [
    [-0.25, 1.26, 0.26],
    [0.02, 0.88, 0.23],
    [-0.12, 0.34, 0.18],
  ]);
  addFaceFromPoints("front_skirt_right_facet", [
    [0.2, 1.2, 0.24],
    [0.02, 0.88, 0.23],
    [0.15, 0.26, 0.17],
  ]);

  mesh.groups = Array.from(groups);
  return mesh;
};

const createMonolith = () => {
  const parts: ObjectPart[] = [
    box("base_slab", [0, 0.1, 0], [1.8, 0.2, 1.2], "blackStone"),
    box("lower_step", [0, 0.28, 0], [1.45, 0.16, 0.9], "oldMarble"),
    box("standing_black_star", [0, 1.62, 0], [0.92, 2.68, 0.42], "blackStone"),
    box("left_edge_rib", [-0.54, 1.55, 0.03], [0.08, 2.42, 0.5], "oldMarble"),
    box("right_edge_rib", [0.54, 1.55, 0.03], [0.08, 2.42, 0.5], "oldMarble"),
    box("top_cap", [0, 3.02, 0], [1.04, 0.18, 0.5], "blackStone"),
    box("grid_inlay", [0, 1.66, 0.235], [0.56, 1.82, 0.035], "gridGlow"),
  ];

  return baseObject({
    kind: "monolith",
    displayName: "Black-Star Monolith Starter",
    tags: ["monolith", "interactable", "grid"],
    parts,
    decals: [
      decal("decal_grid_lines", "grid_glow", [0, 1.7, 0.264], [0, 0, 0], [0.62, 1.72], "#8CF6FF", 0.82, true),
      decal("decal_gold_inscription", "inscription", [0, 2.44, 0.266], [0, 0, 0], [0.48, 0.34], "#FFC95A", 0.78, true),
    ],
    materialKeys: ["blackStone", "oldMarble", "gridGlow", "churchGold"],
    footprint: rectFootprint(2, 2),
  });
};

const createStatue = () =>
  baseMeshObject({
    kind: "statue",
    displayName: "Low Poly Witness Statue Starter",
    tags: ["statue", "interactable", "church", "low_poly", "hand_modeled"],
    mesh: createLowPolyWitnessStatueMesh(),
    decals: [
      decal(
        "decal_subtle_front_marble_grain",
        "marble_vein",
        [-0.02, 1.32, 0.31],
        [0.08, 0, -0.08],
        [0.34, 0.12],
        "#9A96B8",
        0.22,
      ),
      decal(
        "decal_small_age_crack",
        "crack",
        [0.1, 0.9, 0.27],
        [0.08, 0, 0.12],
        [0.24, 0.08],
        "#100D14",
        0.34,
      ),
    ],
    materialKeys: ["paleMarble", "oldMarble"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createShrine = () => {
  const parts: ObjectPart[] = [
    box("shrine_floor", [0, 0.08, 0], [2.4, 0.16, 1.4], "blackStone"),
    box("altar_block", [0, 0.42, 0.15], [1.05, 0.48, 0.56], "oldMarble"),
    cylinder("left_column", [-0.78, 0.9, -0.2], 0.18, 1.45, "paleMarble", 8),
    cylinder("right_column", [0.78, 0.9, -0.2], 0.18, 1.45, "paleMarble", 8),
    box("lintel", [0, 1.66, -0.2], [1.84, 0.22, 0.3], "blackStone"),
    cone("left_flame", [-0.4, 0.82, 0.42], 0.18, 0.34, "gridGlow", 6),
    cone("right_flame", [0.4, 0.82, 0.42], 0.18, 0.34, "gridGlow", 6),
    box("gold_bowl", [0, 0.72, 0.42], [0.42, 0.12, 0.2], "churchGold"),
  ];

  return baseObject({
    kind: "shrine",
    displayName: "Black-Star Shrine Starter",
    tags: ["shrine", "altar", "interactable"],
    parts,
    decals: [
      decal("decal_altar_blood", "blood", [0, 0.97, 0.43], [-Math.PI / 2, 0, 0], [0.46, 0.28], "#FF1E4D", 0.78),
      decal("decal_lintel_inscription", "inscription", [0, 1.66, -0.045], [0, 0, 0], [0.72, 0.2], "#FFC95A", 0.7, true),
    ],
    materialKeys: ["blackStone", "oldMarble", "paleMarble", "gridGlow", "churchGold", "blood"],
    footprint: rectFootprint(3, 2),
  });
};

const createChurchWall = () => {
  const parts: ObjectPart[] = [
    box("wall_core", [0, 1.0, 0], [3.05, 2.0, 0.32], "blackStone"),
    box("left_buttress", [-1.28, 0.92, 0.08], [0.28, 1.84, 0.56], "oldMarble"),
    box("right_buttress", [1.28, 0.92, 0.08], [0.28, 1.84, 0.56], "oldMarble"),
    box("top_course", [0, 2.08, 0.02], [3.24, 0.24, 0.44], "oldMarble"),
    box("window_glow", [0, 1.18, 0.18], [0.62, 1.04, 0.035], "gridGlow"),
    box("window_bar_v", [0, 1.18, 0.225], [0.07, 1.0, 0.06], "blackStone"),
    box("window_bar_h", [0, 1.18, 0.226], [0.62, 0.07, 0.06], "blackStone"),
  ];

  return baseObject({
    kind: "church_wall",
    displayName: "Black-Star Church Wall Starter",
    tags: ["wall", "church", "blocking"],
    parts,
    decals: [
      decal("decal_wall_crack_left", "crack", [-0.8, 1.36, 0.185], [0, 0, 0.2], [0.68, 0.2], "#100D14", 0.66),
      decal("decal_window_grid", "grid_glow", [0, 1.18, 0.24], [0, 0, 0], [0.62, 1.02], "#8CF6FF", 0.78, true),
    ],
    materialKeys: ["blackStone", "oldMarble", "gridGlow"],
    footprint: rectFootprint(3, 1),
  });
};

const createMarblePath = () => {
  const parts: ObjectPart[] = [
    box("path_slab_left", [-1, 0.04, 0], [0.96, 0.08, 0.96], "paleMarble"),
    box("path_slab_center", [0, 0.045, 0], [0.98, 0.09, 0.98], "oldMarble"),
    box("path_slab_right", [1, 0.04, 0], [0.96, 0.08, 0.96], "paleMarble"),
    box("dark_mortar_left", [-0.5, 0.09, 0], [0.04, 0.035, 1.0], "blackStone"),
    box("dark_mortar_right", [0.5, 0.09, 0], [0.04, 0.035, 1.0], "blackStone"),
  ];

  return baseObject({
    kind: "marble_path",
    displayName: "Veined Marble Path Starter",
    tags: ["path", "floor", "walkable"],
    parts,
    decals: [
      decal("decal_vein_left", "marble_vein", [-1, 0.102, 0.05], [-Math.PI / 2, 0, -0.2], [0.82, 0.2], "#9A8FD6", 0.5),
      decal("decal_vein_center", "marble_vein", [0, 0.108, -0.04], [-Math.PI / 2, 0, 0.16], [0.86, 0.18], "#9A8FD6", 0.48),
      decal("decal_vein_right", "marble_vein", [1, 0.102, 0.02], [-Math.PI / 2, 0, -0.34], [0.76, 0.16], "#9A8FD6", 0.44),
    ],
    materialKeys: ["paleMarble", "oldMarble", "blackStone"],
    footprint: rectFootprint(3, 1),
    collisionProfile: "walkable_support",
  });
};

const createRiverAltar = () => {
  const parts: ObjectPart[] = [
    cylinder("round_base", [0, 0.12, 0], 1.8, 0.24, "blackStone", 12),
    cylinder("marble_ring", [0, 0.28, 0], 1.42, 0.18, "oldMarble", 12),
    cylinder("water_basin", [0, 0.42, 0], 1.0, 0.12, "riverWater", 12),
    box("front_step", [0, 0.15, 0.92], [1.08, 0.18, 0.48], "paleMarble"),
    cylinder("left_marker", [-0.68, 0.62, -0.34], 0.16, 0.7, "churchGold", 7),
    cylinder("right_marker", [0.68, 0.62, -0.34], 0.16, 0.7, "churchGold", 7),
    cone("river_spark", [0, 0.68, 0], 0.3, 0.42, "gridGlow", 7),
  ];

  return baseObject({
    kind: "river_altar",
    displayName: "River Altar Starter",
    tags: ["altar", "river", "interactable"],
    parts,
    decals: [
      decal("decal_basin_grid", "grid_glow", [0, 0.5, 0], [-Math.PI / 2, 0, 0], [0.88, 0.88], "#8CF6FF", 0.64, true),
      decal("decal_step_blood", "blood", [0.08, 0.26, 0.93], [-Math.PI / 2, 0, -0.18], [0.34, 0.2], "#FF1E4D", 0.62),
    ],
    materialKeys: ["blackStone", "oldMarble", "paleMarble", "riverWater", "churchGold", "gridGlow", "blood"],
    footprint: rectFootprint(2, 2),
  });
};

const createGlassGrowth = () => {
  const parts: ObjectPart[] = [
    box("black_soil_clump", [0, 0.08, 0], [1.12, 0.16, 0.92], "blackSoil"),
    cone("main_shard", [0, 0.78, 0], 0.42, 1.4, "gridGlow", 5, [0.12, 0, 0.08]),
    cone("left_shard", [-0.32, 0.48, 0.12], 0.28, 0.9, "gridGlow", 5, [-0.18, 0.1, -0.28]),
    cone("right_shard", [0.34, 0.42, -0.16], 0.24, 0.78, "gridGlow", 5, [0.22, -0.2, 0.3]),
    cone("rear_shard", [0.08, 0.36, -0.36], 0.22, 0.7, "gridGlow", 5, [0.28, 0.12, 0]),
    cylinder("old_stone_root", [0.04, 0.18, 0.12], 0.22, 0.32, "blackStone", 6, [Math.PI / 2, 0.2, 0]),
  ];

  return baseObject({
    kind: "glass_growth",
    displayName: "Grid Glass Growth Starter",
    tags: ["glass", "grid", "hazard"],
    parts,
    decals: [
      decal("decal_soil_glow", "grid_glow", [0, 0.18, 0], [-Math.PI / 2, 0, 0], [0.92, 0.72], "#8CF6FF", 0.58, true),
    ],
    materialKeys: ["blackSoil", "gridGlow", "blackStone"],
    footprint: rectFootprint(1, 1),
  });
};

const createBasementClutter = () => {
  const parts: ObjectPart[] = [
    box("dark_floor_scrap", [0, 0.04, 0], [1.7, 0.08, 1.2], "blackSoil"),
    box("broken_crate", [-0.42, 0.28, -0.2], [0.58, 0.4, 0.48], "deadWood", [0, 0.18, 0]),
    box("crate_lid", [-0.44, 0.52, -0.2], [0.64, 0.08, 0.52], "deadWood", [0.08, 0.28, -0.12]),
    cylinder("left_candle", [0.34, 0.28, 0.22], 0.12, 0.38, "paleMarble", 6),
    cone("left_candle_flame", [0.34, 0.58, 0.22], 0.11, 0.2, "churchGold", 6),
    cylinder("jar", [0.62, 0.24, -0.2], 0.26, 0.38, "oldMarble", 7),
    box("bone_one", [0.0, 0.16, 0.42], [0.58, 0.07, 0.08], "bone", [0, 0.44, 0]),
    box("bone_two", [0.18, 0.18, 0.5], [0.5, 0.06, 0.07], "bone", [0, -0.58, 0]),
    box("purple_cloth", [0.18, 0.115, -0.32], [0.78, 0.05, 0.44], "robePurple", [0, -0.18, 0]),
  ];

  return baseObject({
    kind: "basement_clutter",
    displayName: "Pagan Basement Clutter Starter",
    tags: ["clutter", "basement", "ritual"],
    parts,
    decals: [
      decal("decal_blood_smear", "blood", [0.02, 0.13, 0.1], [-Math.PI / 2, 0, 0.32], [0.48, 0.3], "#FF1E4D", 0.7),
      decal("decal_floor_scratch", "crack", [-0.36, 0.13, 0.34], [-Math.PI / 2, 0, -0.2], [0.5, 0.16], "#100D14", 0.56),
    ],
    materialKeys: ["blackSoil", "deadWood", "paleMarble", "churchGold", "oldMarble", "bone", "robePurple", "blood"],
    footprint: rectFootprint(2, 2),
  });
};

export const createProceduralStarter = (
  kind: ProceduralStarterKind,
): ObjectData => {
  switch (kind) {
    case "monolith":
      return createMonolith();
    case "statue":
      return createStatue();
    case "shrine":
      return createShrine();
    case "church_wall":
      return createChurchWall();
    case "marble_path":
      return createMarblePath();
    case "river_altar":
      return createRiverAltar();
    case "glass_growth":
      return createGlassGrowth();
    case "basement_clutter":
    default:
      return createBasementClutter();
  }
};

const overrideObject = (
  object: ObjectData,
  updates: Partial<ObjectData> & { id: string; display_name: string },
): ObjectData => ({
  ...object,
  ...updates,
  tags: updates.tags || object.tags,
  materials: updates.materials || object.materials,
  material_settings: updates.material_settings || object.material_settings,
  parts: updates.parts || object.parts,
  decals: updates.decals || object.decals,
  mesh: updates.mesh || object.mesh,
  reference_images: updates.reference_images || object.reference_images,
  collision: updates.collision || object.collision,
});

const createFloorStone = () => {
  const base = createMarblePath();
  return overrideObject(base, {
    id: "obj_floor_stone",
    display_name: "Veined Marble Pathway",
    category: "structure",
    tags: ["tile", "floor", "path", "marble"],
    collision: { profile: "none", footprint: [[0, 0]] },
  });
};

const createFloorDirt = () =>
  baseObject({
    id: "obj_floor_dirt",
    kind: "basement_clutter",
    displayName: "Black Soil Floor",
    category: "structure",
    tags: ["tile", "floor", "soil"],
    parts: [
      box("soil_slab", [0, 0.035, 0], [1, 0.07, 1], "blackSoil"),
      box("buried_root", [-0.18, 0.085, 0.16], [0.54, 0.025, 0.06], "deadWood", [0, 0.52, 0]),
      box("dull_stone", [0.31, 0.09, -0.26], [0.18, 0.035, 0.14], "blackStone", [0, -0.28, 0]),
    ],
    decals: [
      decal("decal_soil_scratch", "crack", [-0.18, 0.104, 0.06], [-Math.PI / 2, 0, 0.34], [0.5, 0.14], "#100D14", 0.46),
    ],
    materialKeys: ["blackSoil", "deadWood", "blackStone"],
    footprint: [[0, 0]],
    collisionProfile: "none",
  });

const createFloorWood = () =>
  baseObject({
    id: "obj_floor_wood",
    kind: "basement_clutter",
    displayName: "Dark Wooden Floor",
    category: "structure",
    tags: ["tile", "floor", "wood"],
    parts: [
      box("board_west", [-0.26, 0.035, 0], [0.48, 0.07, 1], "deadWood"),
      box("board_east", [0.25, 0.038, 0], [0.48, 0.075, 1], "deadWood"),
      box("black_gap", [0, 0.08, 0], [0.04, 0.035, 1], "blackStone"),
      box("north_board_gap", [-0.26, 0.085, -0.33], [0.45, 0.018, 0.035], "blackStone"),
      box("south_board_gap", [0.25, 0.087, 0.31], [0.45, 0.018, 0.035], "blackStone"),
      box("cross_scar", [0.18, 0.092, -0.18], [0.52, 0.02, 0.04], "blackStone", [0, 0.36, 0]),
      cylinder("nail_nw", [-0.43, 0.104, -0.42], 0.035, 0.014, "blackStone", 5),
      cylinder("nail_sw", [-0.43, 0.104, 0.42], 0.032, 0.014, "blackStone", 5),
      cylinder("nail_ne", [0.42, 0.104, -0.42], 0.032, 0.014, "blackStone", 5),
      cylinder("nail_se", [0.42, 0.104, 0.42], 0.035, 0.014, "blackStone", 5),
    ],
    decals: [
      decal("decal_old_blood_smear", "blood", [-0.2, 0.104, 0.28], [-Math.PI / 2, 0, -0.22], [0.28, 0.16], "#FF1E4D", 0.48),
    ],
    materialKeys: ["deadWood", "blackStone", "blood"],
    footprint: [[0, 0]],
    collisionProfile: "none",
  });

const createWaterTile = () =>
  baseObject({
    id: "obj_water",
    kind: "river_altar",
    displayName: "Black River Water",
    category: "structure",
    tags: ["tile", "water", "river"],
    parts: [
      box("black_depth", [0, 0.015, 0], [1, 0.03, 1], "blackStone"),
      box("teal_surface", [0, 0.04, 0], [0.96, 0.018, 0.96], "riverWater"),
      box("blood_thread", [0.22, 0.06, -0.22], [0.48, 0.012, 0.05], "blood", [0, -0.34, 0]),
      box("cold_sheen", [-0.18, 0.065, 0.18], [0.52, 0.012, 0.04], "gridGlow", [0, 0.28, 0]),
    ],
    decals: [
      decal("decal_water_grid_reflection", "grid_glow", [-0.05, 0.078, 0.02], [-Math.PI / 2, 0, 0.18], [0.72, 0.34], "#8CF6FF", 0.38, true),
    ],
    materialKeys: ["blackStone", "riverWater", "blood", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createWallBrick = () => {
  const base = createChurchWall();
  const scaleParts = base.parts.map((part) => ({
    ...part,
    position: [part.position[0] * 0.34, part.position[1], part.position[2] * 0.75] as Vec3,
    size: [part.size[0] * 0.34, part.size[1], part.size[2] * 0.75] as Vec3,
  }));
  return baseObject({
    id: "obj_wall_brick",
    kind: "church_wall",
    displayName: "Black-Star Church Wall",
    category: "structure",
    tags: ["tile", "wall", "church"],
    parts: scaleParts,
    decals: base.decals.map((item) => ({
      ...item,
      position: [item.position[0] * 0.34, item.position[1], item.position[2] * 0.75] as Vec3,
      size: [item.size[0] * 0.55, item.size[1]] as [number, number],
    })),
    materialKeys: ["blackStone", "oldMarble", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });
};

const createWallStone = () =>
  baseObject({
    id: "obj_wall_stone",
    kind: "church_wall",
    displayName: "Old Stone Wall",
    category: "structure",
    tags: ["tile", "wall", "old_stone"],
    parts: [
      box("rough_core", [0, 0.9, 0], [1, 1.8, 0.52], "blackStone"),
      box("pale_patch", [-0.25, 1.16, 0.28], [0.38, 0.2, 0.05], "oldMarble"),
      box("broken_patch", [0.28, 0.72, 0.29], [0.32, 0.18, 0.05], "deadWood"),
      box("left_chipped_block", [-0.42, 1.52, 0.31], [0.2, 0.26, 0.055], "oldMarble", [0, 0, 0.06]),
      box("lower_mortar_line", [0.02, 0.42, 0.31], [0.86, 0.035, 0.04], "oldMarble"),
      box("upper_mortar_line", [0.12, 1.38, 0.31], [0.62, 0.028, 0.04], "oldMarble", [0, 0, -0.04]),
      box("glass_vein", [-0.34, 0.78, 0.32], [0.055, 0.64, 0.04], "gridGlow", [0, 0, 0.22]),
      box("fallen_chip_a", [-0.32, 0.06, 0.26], [0.18, 0.08, 0.16], "blackStone", [0, 0.42, 0]),
      box("fallen_chip_b", [0.36, 0.055, 0.18], [0.12, 0.07, 0.12], "oldMarble", [0, -0.3, 0]),
    ],
    decals: [
      decal("decal_old_wall_crack", "crack", [0.12, 1.08, 0.35], [0, 0, -0.2], [0.62, 0.16], "#100D14", 0.62),
    ],
    materialKeys: ["blackStone", "oldMarble", "deadWood", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createMouthstoneGatePreset = () =>
  overrideObject(createMonolith(), {
    id: "obj_mouthstone_gate",
    display_name: "Mouthstone Exile Gate",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable", "monolith", "grid"],
    collision: {
      profile: "custom_footprint",
      footprint: rectFootprint(3, 3),
    },
  });

const createBleedingWitnessPreset = () => {
  const statue = createStatue();

  return overrideObject(statue, {
    id: "obj_bleeding_witness",
    display_name: "Bleeding Witness Statue",
    category: "setpiece",
    tags: ["prop", "setpiece", "interactable", "statue", "church", "low_poly", "hand_modeled"],
    decals: [
      ...statue.decals,
      decal("decal_witness_chest_blood", "blood", [-0.05, 1.94, 0.31], [0.12, 0, -0.06], [0.16, 0.3], "#FF1E4D", 0.72),
      decal("decal_base_blood", "blood", [0.15, 0.18, 0.22], [-Math.PI / 2, 0, -0.16], [0.28, 0.14], "#FF1E4D", 0.58),
    ],
    material_settings: [
      ...statue.material_settings,
      MATERIALS.blood,
    ],
    materials: [
      ...statue.materials,
      material("blood"),
    ],
    collision: {
      profile: "single",
      footprint: [[0, 0]],
    },
  });
};

const createTree = () =>
  baseObject({
    id: "obj_tree",
    kind: "glass_growth",
    displayName: "Black Pine With Glass Sap",
    category: "nature",
    tags: ["prop", "nature", "tree"],
    parts: [
      cylinder("split_trunk", [0, 0.52, 0], 0.22, 1.04, "deadWood", 7, [0.05, 0, -0.06]),
      cone("lower_needles", [0, 1.0, 0], 0.95, 0.9, "blackSoil", 7),
      cone("middle_needles", [0.02, 1.42, -0.03], 0.72, 0.74, "blackSoil", 7),
      cone("top_needles", [-0.02, 1.78, 0.02], 0.48, 0.58, "blackSoil", 7),
      cone("glass_sap", [0.16, 1.18, 0.22], 0.15, 0.42, "gridGlow", 5, [0.22, 0, -0.1]),
    ],
    decals: [
      decal("decal_tree_grid_sap", "grid_glow", [0.17, 1.26, 0.28], [0.08, 0, -0.1], [0.2, 0.42], "#8CF6FF", 0.5, true),
    ],
    materialKeys: ["deadWood", "blackSoil", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createBush = () =>
  baseObject({
    id: "obj_bush",
    kind: "glass_growth",
    displayName: "Thorned Black Shrub",
    category: "nature",
    tags: ["prop", "nature", "bush"],
    parts: [
      sphere("main_shrub", [0, 0.34, 0], [0.62, 0.52, 0.62], "blackSoil"),
      sphere("left_shrub", [-0.26, 0.28, 0.1], [0.42, 0.34, 0.42], "blackSoil"),
      sphere("right_shrub", [0.25, 0.26, -0.12], [0.38, 0.32, 0.38], "blackSoil"),
      cone("glass_thorn", [0.1, 0.66, 0.14], 0.12, 0.36, "gridGlow", 5, [0.25, 0.1, -0.1]),
    ],
    decals: [],
    materialKeys: ["blackSoil", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createPew = () =>
  baseObject({
    id: "obj_pew",
    kind: "basement_clutter",
    displayName: "Dark Church Pew",
    category: "prop",
    tags: ["prop", "furniture", "church"],
    parts: [
      box("long_seat", [0, 0.28, 0.08], [1.1, 0.12, 0.42], "deadWood"),
      box("high_back", [0, 0.58, -0.16], [1.1, 0.58, 0.12], "deadWood", [-0.08, 0, 0]),
      box("left_end", [-0.58, 0.36, 0], [0.12, 0.54, 0.54], "blackStone"),
      box("right_end", [0.58, 0.36, 0], [0.12, 0.54, 0.54], "blackStone"),
      box("seat_front_lip", [0, 0.35, 0.31], [1.04, 0.06, 0.045], "blackStone"),
      box("back_top_rail", [0, 0.88, -0.205], [1.08, 0.07, 0.05], "blackStone"),
      box("under_brace_left", [-0.28, 0.2, 0.02], [0.08, 0.28, 0.52], "deadWood", [0.18, 0, 0.28]),
      box("under_brace_right", [0.28, 0.2, 0.02], [0.08, 0.28, 0.52], "deadWood", [0.18, 0, -0.28]),
      box("gold_wound", [0, 0.68, -0.225], [0.36, 0.05, 0.035], "churchGold"),
      cylinder("left_end_pin", [-0.58, 0.64, 0.22], 0.045, 0.018, "churchGold", 6, [Math.PI / 2, 0, 0]),
      cylinder("right_end_pin", [0.58, 0.64, 0.22], 0.045, 0.018, "churchGold", 6, [Math.PI / 2, 0, 0]),
    ],
    decals: [
      decal("decal_pew_scratch", "crack", [0.18, 0.68, -0.248], [0, 0, 0.1], [0.5, 0.12], "#100D14", 0.55),
    ],
    materialKeys: ["deadWood", "blackStone", "churchGold"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createPodium = () =>
  baseObject({
    id: "obj_podium",
    kind: "shrine",
    displayName: "Witness Reading Podium",
    category: "prop",
    tags: ["prop", "furniture", "interactable"],
    parts: [
      box("black_foot", [0, 0.08, 0], [0.58, 0.16, 0.5], "blackStone"),
      cylinder("marble_stem", [0, 0.55, 0], 0.2, 0.9, "oldMarble", 7),
      box("slanted_top", [0, 1.05, -0.04], [0.72, 0.12, 0.48], "deadWood", [0.28, 0, 0]),
      box("open_book", [0, 1.16, -0.02], [0.52, 0.045, 0.34], "paleMarble", [0.28, 0, 0]),
      box("gold_marker", [0.16, 1.2, 0.02], [0.05, 0.02, 0.3], "churchGold", [0.28, 0.08, 0]),
    ],
    decals: [
      decal("decal_podium_inscription", "inscription", [-0.04, 1.205, 0.005], [0.28, 0, 0], [0.36, 0.14], "#FFC95A", 0.58, true),
    ],
    materialKeys: ["blackStone", "oldMarble", "deadWood", "paleMarble", "churchGold"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createChest = () =>
  baseObject({
    id: "obj_chest",
    kind: "basement_clutter",
    displayName: "Blackwood Reliquary Chest",
    category: "prop",
    tags: ["prop", "container", "reliquary"],
    parts: [
      box("chest_body", [0, 0.28, 0], [0.74, 0.46, 0.48], "deadWood"),
      box("stone_lid", [0, 0.56, 0], [0.8, 0.14, 0.54], "blackStone"),
      box("gold_lock", [0, 0.38, 0.26], [0.16, 0.2, 0.05], "churchGold"),
      box("left_band", [-0.25, 0.38, 0.27], [0.06, 0.44, 0.05], "churchGold"),
      box("right_band", [0.25, 0.38, 0.27], [0.06, 0.44, 0.05], "churchGold"),
      box("back_hinge_left", [-0.25, 0.58, -0.29], [0.18, 0.05, 0.05], "churchGold"),
      box("back_hinge_right", [0.25, 0.58, -0.29], [0.18, 0.05, 0.05], "churchGold"),
      cylinder("left_handle", [-0.44, 0.36, 0], 0.16, 0.035, "churchGold", 8, [0, 0, Math.PI / 2]),
      cylinder("right_handle", [0.44, 0.36, 0], 0.16, 0.035, "churchGold", 8, [0, 0, Math.PI / 2]),
    ],
    decals: [
      decal("decal_chest_grid_lock", "grid_glow", [0, 0.39, 0.296], [0, 0, 0], [0.22, 0.22], "#8CF6FF", 0.68, true),
    ],
    materialKeys: ["deadWood", "blackStone", "churchGold", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createBarrel = () =>
  baseObject({
    id: "obj_barrel",
    kind: "basement_clutter",
    displayName: "Tarred River Barrel",
    category: "prop",
    tags: ["prop", "container"],
    parts: [
      cylinder("barrel_body", [0, 0.36, 0], 0.54, 0.72, "deadWood", 9),
      cylinder("top_hoop", [0, 0.67, 0], 0.58, 0.06, "blackStone", 9),
      cylinder("lower_hoop", [0, 0.22, 0], 0.58, 0.06, "blackStone", 9),
      box("front_stave_seam", [0, 0.36, 0.285], [0.035, 0.56, 0.035], "blackStone"),
      box("left_stave_seam", [-0.22, 0.36, 0.18], [0.028, 0.52, 0.03], "blackStone", [0, 0.62, 0]),
      box("right_stave_seam", [0.22, 0.36, 0.18], [0.028, 0.52, 0.03], "blackStone", [0, -0.62, 0]),
      box("teal_leak", [0.22, 0.33, 0.25], [0.1, 0.28, 0.035], "riverWater", [0, 0, -0.1]),
    ],
    decals: [
      decal("decal_barrel_blood", "blood", [0.2, 0.26, 0.285], [0, 0, -0.1], [0.16, 0.28], "#FF1E4D", 0.52),
    ],
    materialKeys: ["deadWood", "blackStone", "riverWater", "blood"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createTable = () =>
  baseObject({
    id: "obj_table",
    kind: "basement_clutter",
    displayName: "Investigator's Dark Table",
    category: "prop",
    tags: ["prop", "furniture"],
    parts: [
      box("table_top", [0, 0.62, 0], [1.08, 0.12, 0.74], "deadWood"),
      box("leg_nw", [-0.45, 0.3, -0.28], [0.1, 0.6, 0.1], "deadWood"),
      box("leg_ne", [0.45, 0.3, -0.28], [0.1, 0.6, 0.1], "deadWood"),
      box("leg_sw", [-0.45, 0.3, 0.28], [0.1, 0.6, 0.1], "deadWood"),
      box("leg_se", [0.45, 0.3, 0.28], [0.1, 0.6, 0.1], "deadWood"),
      box("front_crossbrace", [0, 0.38, 0.34], [0.86, 0.06, 0.05], "blackStone"),
      box("back_crossbrace", [0, 0.38, -0.34], [0.86, 0.06, 0.05], "blackStone"),
      box("left_side_brace", [-0.52, 0.38, 0], [0.05, 0.06, 0.56], "blackStone"),
      box("right_side_brace", [0.52, 0.38, 0], [0.05, 0.06, 0.56], "blackStone"),
      box("paper_stack", [-0.18, 0.71, 0.04], [0.34, 0.04, 0.28], "paleMarble", [0, 0.12, 0]),
      box("loose_note", [0.06, 0.725, 0.16], [0.28, 0.022, 0.18], "paleMarble", [0, -0.24, 0]),
      cylinder("ink_bottle", [0.12, 0.78, -0.2], 0.11, 0.12, "blackStone", 7),
      cylinder("ink_glint", [0.12, 0.85, -0.2], 0.07, 0.014, "gridGlow", 7),
      box("candle_stub", [0.32, 0.82, -0.16], [0.12, 0.22, 0.12], "paleMarble"),
      cone("candle_flame", [0.32, 1.0, -0.16], 0.1, 0.18, "churchGold", 6),
    ],
    decals: [
      decal("decal_table_inscription", "inscription", [-0.16, 0.745, 0.05], [-Math.PI / 2, 0, 0.12], [0.24, 0.12], "#100D14", 0.5),
    ],
    materialKeys: ["deadWood", "paleMarble", "churchGold", "blackStone"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createGrassTuft = () =>
  baseObject({
    id: "obj_grass_tuft",
    kind: "glass_growth",
    displayName: "Glass-Sick Grass Tuft",
    category: "nature",
    tags: ["prop", "nature", "grass"],
    parts: [
      cone("blade_a", [-0.16, 0.2, 0], 0.08, 0.42, "blackSoil", 4, [0.18, 0, 0.22]),
      cone("blade_b", [0.04, 0.25, 0.1], 0.08, 0.52, "blackSoil", 4, [-0.12, 0, -0.1]),
      cone("blade_c", [0.17, 0.22, -0.08], 0.07, 0.45, "blackSoil", 4, [0.14, 0, -0.24]),
      cone("glass_blade", [-0.02, 0.28, -0.03], 0.06, 0.58, "gridGlow", 4, [0.26, 0, 0.08]),
    ],
    decals: [],
    materialKeys: ["blackSoil", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "none",
  });

const createDeadTree = () =>
  baseObject({
    id: "obj_dead_tree",
    kind: "glass_growth",
    displayName: "Petrified Dead Tree",
    category: "nature",
    tags: ["prop", "nature", "dead_tree"],
    parts: [
      cylinder("crooked_trunk", [0, 0.62, 0], 0.22, 1.18, "deadWood", 7, [0.1, 0, -0.08]),
      box("branch_east", [0.28, 0.92, 0.02], [0.62, 0.09, 0.1], "deadWood", [0, 0.2, 0.48]),
      box("branch_west", [-0.22, 1.13, 0.08], [0.52, 0.08, 0.09], "deadWood", [0.2, -0.35, -0.38]),
      box("branch_back", [0.02, 1.28, -0.22], [0.1, 0.08, 0.48], "deadWood", [-0.42, 0.1, 0.1]),
      cone("glass_canker", [0.16, 0.72, 0.16], 0.12, 0.34, "gridGlow", 5, [0.2, 0, -0.1]),
    ],
    decals: [
      decal("decal_dead_tree_crack", "crack", [0.06, 0.84, 0.13], [0.08, 0, -0.08], [0.16, 0.58], "#100D14", 0.58),
    ],
    materialKeys: ["deadWood", "gridGlow", "blackStone"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createFenceStone = () =>
  baseObject({
    id: "obj_fence_stone",
    kind: "church_wall",
    displayName: "Mouthstone Boundary Fence",
    category: "structure",
    tags: ["prop", "fence", "mouthstone"],
    parts: [
      box("low_wall", [0, 0.28, 0], [1.08, 0.42, 0.28], "blackStone"),
      box("capstone", [0, 0.54, 0], [1.14, 0.14, 0.34], "oldMarble"),
      cylinder("left_post", [-0.44, 0.52, 0], 0.2, 0.86, "oldMarble", 7),
      cylinder("right_post", [0.44, 0.52, 0], 0.2, 0.86, "oldMarble", 7),
      box("grid_wire", [0, 0.62, 0.19], [0.64, 0.04, 0.035], "gridGlow"),
    ],
    decals: [
      decal("decal_fence_crack", "crack", [0.08, 0.5, 0.19], [0, 0, 0.12], [0.56, 0.12], "#100D14", 0.5),
    ],
    materialKeys: ["blackStone", "oldMarble", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createCellBars = () =>
  baseObject({
    id: "obj_cell_bars",
    kind: "church_wall",
    displayName: "Consecrated Cell Bars",
    category: "structure",
    tags: ["prop", "bars", "cell", "interactable", "blocking"],
    parts: [
      box("floor_socket", [0, 0.06, 0], [1.06, 0.12, 0.18], "blackStone"),
      box("top_socket", [0, 1.92, 0], [1.06, 0.14, 0.18], "blackStone"),
      box("left_jamb", [-0.51, 0.99, 0], [0.1, 1.86, 0.2], "blackStone"),
      box("right_jamb", [0.51, 0.99, 0], [0.1, 1.86, 0.2], "blackStone"),
      cylinder("bar_left", [-0.34, 0.98, 0], 0.08, 1.82, "blackStone", 6),
      cylinder("bar_mid_left", [-0.12, 0.98, 0], 0.07, 1.82, "blackStone", 6),
      cylinder("bar_mid_right", [0.12, 0.98, 0], 0.07, 1.82, "blackStone", 6),
      cylinder("bar_right", [0.34, 0.98, 0], 0.08, 1.82, "blackStone", 6),
      box("middle_crossbar", [0, 0.94, 0.07], [1.0, 0.09, 0.06], "blackStone"),
      box("lock_plate", [0.33, 0.86, 0.12], [0.18, 0.24, 0.045], "churchGold"),
      cylinder("keyhole", [0.33, 0.86, 0.15], 0.05, 0.018, "blackStone", 6, [Math.PI / 2, 0, 0]),
      cylinder("hinge_top", [-0.51, 1.42, 0.12], 0.16, 0.045, "churchGold", 8, [Math.PI / 2, 0, 0]),
      cylinder("hinge_bottom", [-0.51, 0.52, 0.12], 0.16, 0.045, "churchGold", 8, [Math.PI / 2, 0, 0]),
      box("grid_seal", [0, 1.04, 0.09], [0.54, 0.08, 0.04], "gridGlow"),
    ],
    decals: [
      decal("decal_bar_grid", "grid_glow", [0, 1.04, 0.12], [0, 0, 0], [0.58, 0.18], "#8CF6FF", 0.56, true),
    ],
    materialKeys: ["blackStone", "gridGlow", "churchGold"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createPalletBed = () =>
  baseObject({
    id: "obj_pallet_bed",
    kind: "basement_clutter",
    displayName: "Thin Prison Pallet",
    category: "prop",
    tags: ["prop", "furniture", "bed", "cell"],
    parts: [
      box("wood_frame", [0, 0.18, 0], [0.92, 0.18, 1.18], "deadWood"),
      box("slat_left", [-0.28, 0.31, 0], [0.09, 0.08, 1.08], "blackStone"),
      box("slat_mid", [0, 0.31, 0], [0.08, 0.08, 1.08], "blackStone"),
      box("slat_right", [0.28, 0.31, 0], [0.09, 0.08, 1.08], "blackStone"),
      box("thin_mattress", [0, 0.32, 0], [0.78, 0.16, 1.02], "bone"),
      box("folded_cloth", [-0.16, 0.45, -0.28], [0.42, 0.08, 0.34], "robePurple"),
      box("cloth_ridge", [-0.16, 0.51, -0.28], [0.38, 0.035, 0.04], "blackStone", [0, 0.18, 0]),
      box("rope_head", [0, 0.45, -0.52], [0.86, 0.045, 0.04], "deadWood"),
      box("rope_foot", [0, 0.45, 0.52], [0.86, 0.045, 0.04], "deadWood"),
      box("thin_pillow", [0.22, 0.48, -0.36], [0.32, 0.09, 0.25], "bone", [0, -0.18, 0]),
    ],
    decals: [
      decal("decal_pallet_stain", "blood", [0.18, 0.41, 0.18], [-Math.PI / 2, 0, 0.16], [0.28, 0.18], "#FF1E4D", 0.32),
    ],
    materialKeys: ["deadWood", "bone", "robePurple", "blood", "blackStone"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createMarketStall = () =>
  baseObject({
    id: "obj_market_stall",
    kind: "basement_clutter",
    displayName: "Covered Market Stall",
    category: "prop",
    tags: ["prop", "market", "shop"],
    parts: [
      box("stall_counter", [0, 0.46, 0], [1.18, 0.24, 0.58], "deadWood"),
      cylinder("post_left", [-0.52, 0.98, -0.22], 0.08, 1.2, "deadWood", 6),
      cylinder("post_right", [0.52, 0.98, -0.22], 0.08, 1.2, "deadWood", 6),
      cylinder("front_post_left", [-0.52, 0.9, 0.28], 0.07, 1.02, "deadWood", 6),
      cylinder("front_post_right", [0.52, 0.9, 0.28], 0.07, 1.02, "deadWood", 6),
      box("cloth_roof", [0, 1.55, -0.05], [1.34, 0.12, 0.86], "robePurple", [0.05, 0, 0]),
      box("roof_ridge", [0, 1.63, -0.08], [1.28, 0.045, 0.06], "blackStone", [0.05, 0, 0]),
      box("cloth_stripe_left", [-0.3, 1.625, 0.01], [0.08, 0.035, 0.78], "churchGold", [0.05, 0, 0]),
      box("cloth_stripe_right", [0.3, 1.625, 0.01], [0.08, 0.035, 0.78], "churchGold", [0.05, 0, 0]),
      box("gold_trim", [0, 1.62, 0.38], [1.18, 0.05, 0.04], "churchGold"),
      box("crate_left", [-0.32, 0.68, 0.12], [0.24, 0.2, 0.22], "deadWood"),
      box("crate_slat", [-0.32, 0.72, 0.245], [0.22, 0.035, 0.03], "blackStone"),
      box("glass_goods", [0.24, 0.64, 0.12], [0.22, 0.12, 0.18], "gridGlow"),
      sphere("wrapped_goods", [0.02, 0.69, 0.15], [0.2, 0.16, 0.2], "robePurple"),
      box("hanging_sign", [0, 1.24, 0.36], [0.42, 0.22, 0.045], "paleMarble"),
    ],
    decals: [],
    materialKeys: ["deadWood", "robePurple", "churchGold", "gridGlow", "blackStone", "paleMarble"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createNoticeBoard = () =>
  baseObject({
    id: "obj_notice_board",
    kind: "basement_clutter",
    displayName: "Church Notice Board",
    category: "prop",
    tags: ["prop", "notice", "interactable"],
    parts: [
      cylinder("left_post", [-0.38, 0.7, 0], 0.08, 1.28, "deadWood", 6),
      cylinder("right_post", [0.38, 0.7, 0], 0.08, 1.28, "deadWood", 6),
      box("board", [0, 1.0, 0.02], [0.92, 0.68, 0.08], "deadWood"),
      box("paper_left", [-0.22, 1.08, 0.075], [0.28, 0.34, 0.03], "paleMarble"),
      box("paper_right", [0.18, 0.92, 0.076], [0.34, 0.26, 0.03], "paleMarble"),
      box("paper_torn_low", [0.02, 0.77, 0.078], [0.24, 0.18, 0.028], "paleMarble", [0, 0, -0.06]),
      box("black_seal", [0.0, 1.22, 0.09], [0.18, 0.06, 0.035], "blackStone"),
      cylinder("pin_left", [-0.32, 1.22, 0.1], 0.045, 0.016, "churchGold", 6, [Math.PI / 2, 0, 0]),
      cylinder("pin_right", [0.31, 1.02, 0.1], 0.045, 0.016, "churchGold", 6, [Math.PI / 2, 0, 0]),
    ],
    decals: [
      decal("decal_notice_inscription", "inscription", [-0.18, 1.08, 0.095], [0, 0, 0], [0.22, 0.22], "#100D14", 0.56),
    ],
    materialKeys: ["deadWood", "paleMarble", "blackStone", "churchGold"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createLanternPost = () =>
  baseObject({
    id: "obj_lantern_post",
    kind: "shrine",
    displayName: "Grid Lantern Post",
    category: "prop",
    tags: ["prop", "light", "grid"],
    parts: [
      box("black_base", [0, 0.08, 0], [0.36, 0.16, 0.36], "blackStone"),
      cylinder("thin_post", [0, 0.72, 0], 0.1, 1.28, "blackStone", 7),
      box("lantern_cage", [0, 1.42, 0], [0.34, 0.42, 0.34], "churchGold"),
      box("glow_core", [0, 1.42, 0], [0.22, 0.32, 0.22], "gridGlow"),
      box("cage_front_bar_left", [-0.13, 1.42, 0.19], [0.035, 0.44, 0.035], "blackStone"),
      box("cage_front_bar_right", [0.13, 1.42, 0.19], [0.035, 0.44, 0.035], "blackStone"),
      box("cage_back_bar_left", [-0.13, 1.42, -0.19], [0.035, 0.44, 0.035], "blackStone"),
      box("cage_back_bar_right", [0.13, 1.42, -0.19], [0.035, 0.44, 0.035], "blackStone"),
      box("cage_bottom_ring", [0, 1.2, 0], [0.42, 0.04, 0.42], "churchGold"),
      box("cage_top_ring", [0, 1.64, 0], [0.42, 0.04, 0.42], "churchGold"),
      cone("roof_cap", [0, 1.72, 0], 0.46, 0.22, "blackStone", 5),
      cylinder("roof_finial", [0, 1.88, 0], 0.08, 0.16, "churchGold", 6),
    ],
    decals: [
      decal("decal_lantern_grid", "grid_glow", [0, 1.42, 0.18], [0, 0, 0], [0.25, 0.34], "#8CF6FF", 0.72, true),
    ],
    materialKeys: ["blackStone", "churchGold", "gridGlow"],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

const createWell = () =>
  baseObject({
    id: "obj_well",
    kind: "river_altar",
    displayName: "Old Black River Well",
    category: "prop",
    tags: ["prop", "structure", "water"],
    parts: [
      cylinder("stone_ring", [0, 0.36, 0], 0.92, 0.62, "blackStone", 12),
      cylinder("dark_water", [0, 0.72, 0], 0.72, 0.08, "riverWater", 12),
      box("left_post", [-0.44, 0.9, 0], [0.12, 0.86, 0.12], "deadWood"),
      box("right_post", [0.44, 0.9, 0], [0.12, 0.86, 0.12], "deadWood"),
      box("crossbeam", [0, 1.32, 0], [1.08, 0.12, 0.16], "deadWood"),
      cylinder("rope_spool", [0, 1.21, 0], 0.18, 0.44, "blackStone", 10, [0, 0, Math.PI / 2]),
      box("hanging_rope", [0.02, 1.04, 0.06], [0.035, 0.36, 0.035], "deadWood"),
      box("small_bucket", [0.02, 0.95, 0.08], [0.28, 0.28, 0.24], "churchGold"),
      box("bucket_handle", [0.02, 1.11, 0.08], [0.24, 0.035, 0.035], "blackStone"),
      box("broken_stone_a", [-0.38, 0.52, 0.42], [0.18, 0.1, 0.12], "oldMarble", [0, 0.32, 0]),
      box("broken_stone_b", [0.3, 0.5, -0.4], [0.14, 0.09, 0.16], "oldMarble", [0, -0.2, 0]),
    ],
    decals: [
      decal("decal_well_grid_reflection", "grid_glow", [0, 0.78, 0], [-Math.PI / 2, 0, 0], [0.62, 0.62], "#8CF6FF", 0.52, true),
      decal("decal_well_blood", "blood", [0.34, 0.74, 0.2], [-Math.PI / 2, 0, 0.4], [0.24, 0.16], "#FF1E4D", 0.52),
    ],
    materialKeys: [
      "blackStone",
      "riverWater",
      "deadWood",
      "churchGold",
      "gridGlow",
      "blood",
      "oldMarble",
    ],
    footprint: [[0, 0]],
    collisionProfile: "single",
  });

export const createReplacementObjectLibrary = (): ObjectData[] => [
  createWallBrick(),
  createFloorStone(),
  createFloorDirt(),
  createWallStone(),
  createFloorWood(),
  createWaterTile(),
  createMouthstoneGatePreset(),
  createBleedingWitnessPreset(),
  createTree(),
  createBush(),
  createPew(),
  createPodium(),
  createChest(),
  createBarrel(),
  createTable(),
  createGrassTuft(),
  createDeadTree(),
  createFenceStone(),
  createCellBars(),
  createPalletBed(),
  createMarketStall(),
  createNoticeBoard(),
  createLanternPost(),
  createWell(),
];

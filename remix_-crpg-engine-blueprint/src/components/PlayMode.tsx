import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEngineStore } from "../store/engineStore";
import {
  usePlayStore,
  SAVE_SLOT_COUNT,
  readSaveSlot,
  deleteSaveSlot,
} from "../store/playStore";
import { GameRenderer, playerStateRef } from "./GameRenderer";
import { ScreenFX } from "./ScreenFX";
import {
  MapData,
  CellData,
  ContainerPlacementData,
  ScheduleEntryData,
  TriggerData,
  GamePackage,
  ObjectPlacementData,
} from "../schema/game";
import { MapDelta, PlaySave } from "../schema/save";
import {
  buildConditionContext,
  computeShopPrice,
  evaluateCondition,
  getClockPhaseId,
  CLOCK_PHASE_LABELS,
} from "../utils/conditions";
import {
  playMusic,
  playSound,
  stopMusic,
  getCurrentMusicUrl,
} from "../utils/audioManager";
import { useFxStore } from "../store/fxStore";
import {
  THREAT_RADIUS,
  CHASE_RADIUS,
  rollMeleeDamage,
  rollSkillDamage,
} from "../utils/combat";
import {
  LEVEL_UP_CHOICES,
  getEnemyXpReward,
  getPendingLevelUps,
  getSaveExperience,
  getSaveLevel,
  getXpRemainingForNextLevel,
  getXpRequiredForLevel,
} from "../utils/leveling";
import type { ExperienceGrantResult, LevelUpStat } from "../utils/leveling";
import {
  getPlacementFootprint,
  placementOccupiesCell,
} from "../utils/objectFootprint";
import {
  doorPlacementKey,
  isBuildingDoorPlacement,
  isDoorPlacementOpen,
} from "../utils/doorPlacement";
import { entityStateKey } from "../utils/entityState";
import {
  Briefcase,
  BookOpen,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Hand,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Sparkles,
  Save,
  Swords,
  Trash2,
  Heart,
  Zap,
  Droplet,
} from "lucide-react";

const ISO_CAMERA_BASE_AZIMUTH = Math.PI / 4;
const ISO_CAMERA_HEIGHT = 30;
const ISO_CAMERA_HORIZONTAL_DISTANCE = Math.sqrt(30 * 30 + 30 * 30);
const ISO_CAMERA_FOV = 22;
const CAMERA_ROTATION_DAMPING = 7.5;
const CAMERA_FOLLOW_DAMPING = 10;
const CAMERA_FOLLOW_SNAP_DISTANCE = 6;
const PLAYER_STEP_READY_DISTANCE = 0.18;
const MOVEMENT_REPEAT_START_MS = 105;
const MOVEMENT_REPEAT_INTERVAL_MS = 105;
const COMBAT_ACTOR_SWITCH_INPUT_DELAY_MS = 180;
const PLAY_RENDER_RADIUS = 20;
const PLAY_NATIVE_DPR = Math.max(
  1,
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
);
const PLAY_DPR_MIN = Math.min(1.25, PLAY_NATIVE_DPR);
// Render at native DPR or a modest supersample where there is headroom, while
// keeping the adaptive floor high enough that character art does not turn soft.
const PLAY_DPR_MAX = Math.max(
  1.5,
  Math.min(PLAY_NATIVE_DPR + 0.25, 2.25),
);
const PLAY_DPR_DROP = 0.08;
const PLAY_DPR_RAISE = 0.04;
const NPC_SIMULATION_RADIUS = 16;
const NPC_SCHEDULE_PATH_LIMIT = 96;
const TWO_PI = Math.PI * 2;

// ── Ambient barks ────────────────────────────────────────────────────────────
// Two NPCs bark at each other when within this Manhattan distance, but only if
// the player is close enough to overhear (earshot). Each exchange holds a
// cooldown in in-game minutes so the same gossip doesn't loop, plus a real-time
// floor so back-to-back player turns don't stack exchanges on top of each other.
const BARK_TALK_RADIUS = 2;
const BARK_EARSHOT = 9;
const BARK_DEFAULT_COOLDOWN_MIN = 480;
const BARK_MIN_REAL_INTERVAL_MS = 5000;

const MOVEMENT_COMMAND_KEYS = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
  "z",
  ".",
]);

const isMovementCommandKey = (key: string) => MOVEMENT_COMMAND_KEYS.has(key);
const isCombatCommandKey = (key: string) =>
  isMovementCommandKey(key) || key === " " || key === "enter" || /^[1-6]$/.test(key);
const inputNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

type DialoguePortraitConfig = {
  id: string;
  src: string;
  alt: string;
  side: "left" | "right";
  active: boolean;
  flipX?: boolean;
};

const PLAYER_PORTRAIT = {
  id: "player",
  src: "/portraits/player-pilgrim.png",
  alt: "Player Pilgrim",
  flipX: true,
};

const SPEAKER_PORTRAITS: Record<string, Omit<DialoguePortraitConfig, "side" | "active">> = {
  "high clerk": {
    id: "high-clerk",
    src: "/portraits/npcs/high-clerk.png",
    alt: "High Clerk",
  },
  "brother aldric": {
    id: "aldric",
    src: "/portraits/brother-aldric.png",
    alt: "Brother Aldric",
  },
  aldric: {
    id: "aldric",
    src: "/portraits/brother-aldric.png",
    alt: "Brother Aldric",
  },
  "acolyte nessa": {
    id: "nessa",
    src: "/portraits/acolyte-nessa.png",
    alt: "Acolyte Nessa",
  },
  nessa: {
    id: "nessa",
    src: "/portraits/acolyte-nessa.png",
    alt: "Acolyte Nessa",
  },
  "warden sefa": {
    id: "warden-sefa",
    src: "/portraits/npcs/warden-sefa.png",
    alt: "Warden Sefa",
  },
  "cordon guard bren": {
    id: "cordon-guard-bren",
    src: "/portraits/npcs/cordon-guard-bren.png",
    alt: "Cordon Guard Bren",
  },
  "gate guard holt": {
    id: "gate-guard-holt",
    src: "/portraits/npcs/gate-guard-holt.png",
    alt: "Gate Guard Holt",
  },
  "father imre": {
    id: "father-imre",
    src: "/portraits/npcs/father-imre.png",
    alt: "Father Imre",
  },
  "sister vela": {
    id: "sister-vela",
    src: "/portraits/npcs/sister-vela-mouthstone.png",
    alt: "Sister Vela of the Mouthstone",
  },
  "sister vela of the mouthstone": {
    id: "sister-vela",
    src: "/portraits/npcs/sister-vela-mouthstone.png",
    alt: "Sister Vela of the Mouthstone",
  },
  maro: {
    id: "maro-counted-cup",
    src: "/portraits/npcs/maro-counted-cup.png",
    alt: "Maro of the Counted Cup",
  },
  "maro of the counted cup": {
    id: "maro-counted-cup",
    src: "/portraits/npcs/maro-counted-cup.png",
    alt: "Maro of the Counted Cup",
  },
  sela: {
    id: "sela",
    src: "/portraits/npcs/sela.png",
    alt: "Sela, the Widow's Cousin",
  },
  "sela, the widow's cousin": {
    id: "sela",
    src: "/portraits/npcs/sela.png",
    alt: "Sela, the Widow's Cousin",
  },
  petra: {
    id: "petra-stonecutter",
    src: "/portraits/npcs/petra-stonecutter.png",
    alt: "Petra the Stonecutter",
  },
  "petra the stonecutter": {
    id: "petra-stonecutter",
    src: "/portraits/npcs/petra-stonecutter.png",
    alt: "Petra the Stonecutter",
  },
  orin: {
    id: "orin-glassworks-hand",
    src: "/portraits/npcs/orin-glassworks-hand.png",
    alt: "Orin, Glassworks Hand",
  },
  "orin, glassworks hand": {
    id: "orin-glassworks-hand",
    src: "/portraits/npcs/orin-glassworks-hand.png",
    alt: "Orin, Glassworks Hand",
  },
  liss: {
    id: "liss",
    src: "/portraits/npcs/liss.png",
    alt: "Liss",
  },
  marta: {
    id: "marta-lower-graves",
    src: "/portraits/npcs/marta-lower-graves.png",
    alt: "Marta of the Lower Graves",
  },
  "marta of the lower graves": {
    id: "marta-lower-graves",
    src: "/portraits/npcs/marta-lower-graves.png",
    alt: "Marta of the Lower Graves",
  },
  cosmas: {
    id: "cosmas-pilgrim",
    src: "/portraits/npcs/cosmas-pilgrim.png",
    alt: "Cosmas the Pilgrim",
  },
  "cosmas the pilgrim": {
    id: "cosmas-pilgrim",
    src: "/portraits/npcs/cosmas-pilgrim.png",
    alt: "Cosmas the Pilgrim",
  },
  riverman: {
    id: "riverman",
    src: "/portraits/npcs/riverman.png",
    alt: "The Riverman",
  },
  "the riverman": {
    id: "riverman",
    src: "/portraits/npcs/riverman.png",
    alt: "The Riverman",
  },
  "provisioner dimos": {
    id: "provisioner-dimos",
    src: "/portraits/npcs/provisioner-dimos.png",
    alt: "Provisioner Dimos",
  },
  cyberghost: {
    id: "cyberghost",
    src: "/portraits/npcs/cyberghost.png",
    alt: "Cyberghost",
  },
  "the grid-sick": {
    id: "bound-remnant",
    src: "/portraits/enemies/bound-remnant.png",
    alt: "The Grid-Sick / Bound Remnant",
  },
  "the grid sick": {
    id: "bound-remnant",
    src: "/portraits/enemies/bound-remnant.png",
    alt: "The Grid-Sick / Bound Remnant",
  },
  "bound remnant": {
    id: "bound-remnant",
    src: "/portraits/enemies/bound-remnant.png",
    alt: "The Grid-Sick / Bound Remnant",
  },
  "wayside candle": {
    id: "wayside-candle",
    src: "/portraits/npcs/wayside-candle.png",
    alt: "Wayside Candle",
  },
  lazare: {
    id: "lazare-vampire",
    src: "/portraits/npcs/the lonely vampire.png",
    alt: "Lazare Behind the Shutters",
  },
  "lazare behind the shutters": {
    id: "lazare-vampire",
    src: "/portraits/npcs/the lonely vampire.png",
    alt: "Lazare Behind the Shutters",
  },
};

const NON_PERSON_DIALOGUE_SPEAKERS = new Set([
  "scene",
  "system",
  "notice",
  "stele",
  "wayside candle",
]);

const playCellKey = (x: number, z: number) => `${x}:${z}`;
const pathCellKey = (x: number, z: number) => `${x},${z}`;

const wrapRadians = (angle: number) =>
  THREE.MathUtils.euclideanModulo(angle + Math.PI, TWO_PI) - Math.PI;

// Hotbar accents per skill element.
const ELEMENT_STYLES: Record<string, string> = {
  fire: "border-orange-500/70 text-orange-200",
  shock: "border-yellow-400/70 text-yellow-100",
  water: "border-sky-500/70 text-sky-200",
  cold: "border-cyan-400/70 text-cyan-100",
  poison: "border-green-500/70 text-green-200",
  physical: "border-stone-400/70 text-stone-200",
  none: "border-indigo-500/70 text-indigo-200",
};

// ── World item / container helpers ─────────────────────────────────────────

type EffectiveWorldItem = {
  id: string;
  item_id: string;
  cell: [number, number];
  count: number;
  dropped: boolean;
};

// Items currently on the ground for a map: authored placements the player
// hasn't taken, plus everything dropped there this run.
const getEffectiveWorldItems = (
  map: MapData,
  delta: MapDelta | undefined,
): EffectiveWorldItem[] => {
  const taken = new Set(delta?.taken_items || []);
  return [
    ...(map.item_placements || [])
      .filter((p) => !taken.has(p.id))
      .map((p) => ({
        id: p.id,
        item_id: p.item_id,
        cell: [p.cell[0], p.cell[1]] as [number, number],
        count: p.count ?? 1,
        dropped: false,
      })),
    ...((delta?.dropped_items || []).map((d) => ({
      id: d.id,
      item_id: d.item_id,
      cell: d.cell,
      count: d.count,
      dropped: true,
    }))),
  ];
};

// Authored container values overridden by anything the save remembers.
const getContainerRuntimeState = (
  container: ContainerPlacementData,
  save: PlaySave | null,
  mapId: string,
) => {
  const state = save?.map_deltas?.[mapId]?.containers?.[container.id];
  return {
    items: state?.items ?? container.items.map((entry) => ({ ...entry })),
    locked: state?.locked ?? container.locked ?? false,
    opened: state?.opened ?? false,
  };
};

// ── Game clock ──────────────────────────────────────────────────────────────

// Minutes that pass per simulation tick, calibrated so a baseline-speed
// (10) actor's turn (100 ticks) advances `minutes_per_turn` game minutes.
const clockMinutesPerTick = (settings: Record<string, any> | undefined) =>
  ((settings?.minutes_per_turn as number) ?? 2) / 100;

// A trigger fires only when its legacy switch conditions AND its general
// condition (see ConditionSchema) all pass.
const isTriggerEligible = (trigger: TriggerData, save: PlaySave | null) => {
  const flags = save?.flags || {};
  const legacyOk = (trigger.conditions || []).every(
    (c) => !!flags[c.switch_id] === c.expected_value,
  );
  if (!legacyOk) return false;
  return evaluateCondition(trigger.condition, buildConditionContext(save));
};

// Cap on branch jumps per cutscene run so a bad label loop can't spin forever.
const MAX_CUTSCENE_JUMPS = 200;

// ── Threat detection ────────────────────────────────────────────────────────
// Living hostiles within `radius` (Manhattan) of the player. Drives the
// danger HUD, combat music, engaged HP bars, and step-by-step movement.

type NearbyHostile = {
  key: string;
  name: string;
  cell: [number, number];
  hp: number;
  maxHp: number;
  speed: number;
  dist: number;
};

const getNearbyHostiles = (
  save: PlaySave | null,
  map: MapData | null,
  gp: { entities: { id: string; [k: string]: any }[] },
  radius: number,
): NearbyHostile[] => {
  if (!save || !map) return [];
  const px = save.player.cell[0];
  const pz = save.player.cell[1];
  const result: NearbyHostile[] = [];

  (map.entity_placements || []).forEach((p, i) => {
    if ((save.party_members || []).includes(p.entity_id)) return;
    const key = entityStateKey(map.id, p.entity_id, i);
    const state = save.entity_states?.[key];
    if (state?.dead || state?.hidden) return;

    const ex = state?.cell ? state.cell[0] : p.cell[0];
    const ez = state?.cell ? state.cell[1] : p.cell[1];
    const dist = Math.abs(px - ex) + Math.abs(pz - ez);
    if (dist > radius) return;

    const def = gp.entities.find((e) => e.id === p.entity_id);
    if (!def || def.is_npc) return;

    result.push({
      key,
      name: def.display_name,
      cell: [ex, ez],
      hp: state?.hp ?? def.max_hp,
      maxHp: def.max_hp,
      speed: def.speed ?? 8,
      dist,
    });
  });

  return result.sort((a, b) => a.dist - b.dist);
};

// ── The controlled actor ────────────────────────────────────────────────────
// Out of combat the input always drives the player. In combat it drives
// whoever owns the current turn — the player on theirs, a party member
// (Aldric) on theirs, and nobody while an enemy acts.

type ControlledActor = {
  key: string; // "player" or a party entity id
  isPlayer: boolean;
  name: string;
  cell: [number, number];
  facing: [number, number];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  mp: number;
  maxMp: number;
  skills: string[];
};

const getControlledActor = (
  save: PlaySave | null,
  gp: { entities: { id: string; [k: string]: any }[] },
): ControlledActor | null => {
  if (!save) return null;
  const playerActor: ControlledActor = {
    key: "player",
    isPlayer: true,
    name: "You",
    cell: save.player.cell,
    facing: save.player.facing,
    hp: save.playerStats.hp,
    maxHp: save.playerStats.max_hp,
    attack: save.playerStats.attack,
    defense: save.playerStats.defense,
    mp: save.playerStats.mp ?? 10,
    maxMp: save.playerStats.max_mp ?? 10,
    skills: save.known_skills || [],
  };
  if (!save.in_combat) return playerActor;
  const turn = save.active_turn_id;
  if (!turn || turn === "player") return playerActor;
  if (!(save.party_members || []).includes(turn)) return null; // enemy turn
  const def = gp.entities.find((e) => e.id === turn);
  if (!def) return null;
  const est = save.entity_states?.[turn] || {};
  if (est.dead) return null;
  return {
    key: turn,
    isPlayer: false,
    name: def.display_name,
    cell: (est.cell as [number, number]) || save.player.cell,
    facing: (est.facing as [number, number]) || [0, 1],
    hp: est.hp ?? def.max_hp ?? 10,
    maxHp: def.max_hp ?? 10,
    attack: def.attack ?? 2,
    defense: def.defense ?? 0,
    mp: est.mp ?? def.max_mp ?? 0,
    maxMp: def.max_mp ?? 0,
    skills: def.skills || [],
  };
};

// The schedule entry in effect at `hour`: the latest entry whose hour has
// passed, wrapping to the last entry of the day before the first one starts.
const getActiveScheduleEntry = (
  schedule: ScheduleEntryData[] | undefined,
  hour: number,
) => {
  if (!schedule || schedule.length === 0) return null;
  const sorted = [...schedule].sort((a, b) => a.hour - b.hour);
  let active = sorted[sorted.length - 1];
  for (const entry of sorted) {
    if (entry.hour <= hour) active = entry;
  }
  return active;
};

const getIsometricCameraPosition = (
  playerPos: [number, number],
  azimuth: number,
): [number, number, number] => [
  playerPos[0] + Math.cos(azimuth) * ISO_CAMERA_HORIZONTAL_DISTANCE,
  ISO_CAMERA_HEIGHT,
  playerPos[1] + Math.sin(azimuth) * ISO_CAMERA_HORIZONTAL_DISTANCE,
];

const dampAngle = (
  current: number,
  target: number,
  damping: number,
  delta: number,
) => {
  const amount = 1 - Math.exp(-damping * delta);
  return current + wrapRadians(target - current) * amount;
};

const getCameraRelativeGridMove = (
  ax: number,
  az: number,
  cameraAzimuth: number,
): [number, number] => {
  const sin = Math.sin(cameraAzimuth);
  const cos = Math.cos(cameraAzimuth);

  return [
    Math.round(ax * sin + az * cos),
    Math.round(-ax * cos + az * sin),
  ];
};

const isRenderedPlayerReadyForStep = (cell: [number, number]) => {
  if (!playerStateRef.ready) return true;

  const dx = playerStateRef.px - cell[0];
  const dz = playerStateRef.pz - cell[1];
  return dx * dx + dz * dz <= PLAYER_STEP_READY_DISTANCE * PLAYER_STEP_READY_DISTANCE;
};

function IsometricCameraRig({
  playerPos,
  azimuth,
  focusOverride,
  glide,
}: {
  playerPos: [number, number];
  azimuth: number;
  // Cutscene camera_pan target; null follows the player as usual.
  focusOverride?: [number, number] | null;
  // Suppress snap-to-target so long pans glide instead of cutting.
  glide?: boolean;
}) {
  const { camera } = useThree();
  const focusRef = useRef(new THREE.Vector3(playerPos[0], 0, playerPos[1]));
  const azimuthRef = useRef(azimuth);

  useEffect(() => {
    const focus = focusRef.current;
    const [x, y, z] = getIsometricCameraPosition(
      [focus.x, focus.z],
      azimuthRef.current,
    );
    camera.position.set(x, y, z);
    camera.lookAt(focus.x, focus.y, focus.z);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05);
    const focus = focusRef.current;
    let targetFocus: THREE.Vector3;
    if (focusOverride) {
      targetFocus = _cameraTargetVec.set(focusOverride[0], 0, focusOverride[1]);
    } else {
      targetFocus = playerStateRef.ready
        ? _cameraTargetVec.set(
            playerStateRef.px,
            playerStateRef.py,
            playerStateRef.pz,
          )
        : _cameraTargetVec.set(playerPos[0], 0, playerPos[1]);

      if (
        targetFocus.distanceTo(
          _cameraSavedTargetVec.set(playerPos[0], targetFocus.y, playerPos[1]),
        ) >
        CAMERA_FOLLOW_SNAP_DISTANCE
      ) {
        targetFocus.copy(_cameraSavedTargetVec);
      }
    }

    if (!glide && focus.distanceTo(targetFocus) > CAMERA_FOLLOW_SNAP_DISTANCE) {
      focus.copy(targetFocus);
    } else {
      focus.x = THREE.MathUtils.damp(
        focus.x,
        targetFocus.x,
        CAMERA_FOLLOW_DAMPING,
        delta,
      );
      focus.y = THREE.MathUtils.damp(
        focus.y,
        targetFocus.y,
        CAMERA_FOLLOW_DAMPING,
        delta,
      );
      focus.z = THREE.MathUtils.damp(
        focus.z,
        targetFocus.z,
        CAMERA_FOLLOW_DAMPING,
        delta,
      );
    }

    const nextAzimuth = dampAngle(
      azimuthRef.current,
      azimuth,
      CAMERA_ROTATION_DAMPING,
      delta,
    );
    azimuthRef.current =
      Math.abs(wrapRadians(azimuth - nextAzimuth)) < 0.0005
        ? azimuth
        : nextAzimuth;

    const [x, y, z] = getIsometricCameraPosition(
      [focus.x, focus.z],
      azimuthRef.current,
    );
    camera.position.set(x, y, z);
    camera.lookAt(focus.x, focus.y, focus.z);
  });

  return null;
}

// The dark lights are awake tonight. Keep the psychedelic color, but keep
// the light count low: point lights are paid for by every lit material.
function BlackStarLightRig({ playerPos }: { playerPos: [number, number] }) {
  const lightRigRef = useRef<THREE.Group>(null);
  const chromaRef = useRef<THREE.PointLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const counterRef = useRef<THREE.DirectionalLight>(null);
  const lastLightUpdateRef = useRef(0);

  useFrame((state, frameDelta) => {
    const rig = lightRigRef.current;
    if (!rig) return;

    const delta = Math.min(frameDelta, 0.05);
    const t = state.clock.elapsedTime;
    const targetX = playerStateRef.ready ? playerStateRef.px : playerPos[0];
    const targetZ = playerStateRef.ready ? playerStateRef.pz : playerPos[1];
    rig.position.x = THREE.MathUtils.damp(rig.position.x, targetX, 7, delta);
    rig.position.z = THREE.MathUtils.damp(rig.position.z, targetZ, 7, delta);

    if (t - lastLightUpdateRef.current > 0.12) {
      lastLightUpdateRef.current = t;
      if (chromaRef.current) {
        chromaRef.current.color.setHSL((t * 0.075 + 0.03) % 1, 0.92, 0.6);
        chromaRef.current.intensity = 3.15 + Math.sin(t * 1.05) * 0.45;
        chromaRef.current.position.x = Math.sin(t * 0.45) * 1.25;
        chromaRef.current.position.y = 5.1 + Math.sin(t * 0.65) * 0.75;
        chromaRef.current.position.z = Math.cos(t * 0.38) * 1.25;
      }
      if (moonRef.current) {
        moonRef.current.color.setHSL(
          (0.62 + Math.sin(t * 0.07) * 0.16 + 1) % 1,
          0.45,
          0.74,
        );
      }
      if (counterRef.current) {
        counterRef.current.color.setHSL(
          (0.95 + Math.sin(t * 0.05) * 0.2 + 1) % 1,
          0.6,
          0.5,
        );
      }
    }
  });

  return (
    <>
      <hemisphereLight color="#7F94E0" groundColor="#2A213E" intensity={0.62} />
      <ambientLight color="#5D5485" intensity={0.34} />
      {/* The moon, drifting between ice-blue and violet */}
      <directionalLight
        ref={moonRef}
        position={[-9, 20, -7]}
        color="#C2CCFF"
        intensity={0.98}
        castShadow
      />
      {/* Counter-fill that wanders the warm side of the wheel */}
      <directionalLight
        ref={counterRef}
        position={[10, 10, 8]}
        color="#A05E9C"
        intensity={0.44}
      />
      <group ref={lightRigRef} position={[playerPos[0], 0, playerPos[1]]}>
        {/* One carried black-star light; the color moves, not the shader count. */}
        <pointLight
          ref={chromaRef}
          position={[0, 5.1, 0]}
          color="#ff2fb3"
          intensity={2.35}
          distance={16}
          decay={2}
        />
      </group>
    </>
  );
}

function AdaptiveQualityProbe({
  dpr,
  setDpr,
}: {
  dpr: number;
  setDpr: React.Dispatch<React.SetStateAction<number>>;
}) {
  const samplesRef = useRef<number[]>([]);
  const lastFrameMsRef = useRef<number | null>(null);
  const lastCheckMsRef = useRef(0);
  const stableChecksRef = useRef(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000;
    const lastFrameMs = lastFrameMsRef.current;
    if (lastFrameMs !== null) {
      const frameMs = now - lastFrameMs;
      if (frameMs > 0 && frameMs < 1000) samplesRef.current.push(frameMs);
    }
    lastFrameMsRef.current = now;

    if (now - lastCheckMsRef.current < 1500 || samplesRef.current.length < 12) {
      return;
    }

    const samples = samplesRef.current;
    const avg = samples.reduce((sum, frameMs) => sum + frameMs, 0) / samples.length;
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    const max = sorted[sorted.length - 1];
    const tooSlow = avg > 20.5 || p95 > 24 || max > 95;
    const comfortablyStable = avg < 18.7 && p95 < 20 && max < 48;

    if (tooSlow && dpr > PLAY_DPR_MIN) {
      stableChecksRef.current = 0;
      setDpr((current) =>
        Math.max(PLAY_DPR_MIN, Number((current - PLAY_DPR_DROP).toFixed(2))),
      );
    } else if (comfortablyStable && dpr < PLAY_DPR_MAX) {
      stableChecksRef.current += 1;
      if (stableChecksRef.current >= 4) {
        stableChecksRef.current = 0;
        setDpr((current) =>
          Math.min(PLAY_DPR_MAX, Number((current + PLAY_DPR_RAISE).toFixed(2))),
        );
      }
    } else {
      stableChecksRef.current = 0;
    }

    samplesRef.current = [];
    lastCheckMsRef.current = now;
  });

  return null;
}

function FramePerfProbe({
  enabled,
  dpr,
}: {
  enabled: boolean;
  dpr: number;
}) {
  const samplesRef = useRef<number[]>([]);
  const lastFrameMsRef = useRef<number | null>(null);
  const lastEmitMsRef = useRef(0);

  useFrame((state) => {
    if (!enabled) return;

    const now = state.clock.elapsedTime * 1000;
    const lastFrameMs = lastFrameMsRef.current;
    if (lastFrameMs !== null) {
      const frameMs = now - lastFrameMs;
      if (frameMs > 0 && frameMs < 1000) samplesRef.current.push(frameMs);
    }
    lastFrameMsRef.current = now;

    if (now - lastEmitMsRef.current < 1000 || samplesRef.current.length === 0) {
      return;
    }

    const samples = samplesRef.current;
    const avg = samples.reduce((sum, frameMs) => sum + frameMs, 0) / samples.length;
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    const max = sorted[sorted.length - 1];
    const fps = avg > 0 ? 1000 / avg : 0;
    const displayDpr = Number.isFinite(dpr) ? dpr : PLAY_DPR_MAX;
    const hud = document.getElementById("play-perf-hud");
    if (hud) {
      hud.textContent = `FPS ${fps.toFixed(0)} | avg ${avg.toFixed(1)}ms | p95 ${p95.toFixed(1)}ms | max ${max.toFixed(1)}ms | DPR ${displayDpr.toFixed(2)}`;
    }

    samplesRef.current = [];
    lastEmitMsRef.current = now;
  });

  return null;
}

const normalizeDialogueSpeaker = (speaker: string) =>
  speaker.trim().toLowerCase();

const getDialoguePortraits = (speaker: string): DialoguePortraitConfig[] => {
  const normalized = normalizeDialogueSpeaker(speaker);
  const speakerPortrait = SPEAKER_PORTRAITS[normalized];

  if (speakerPortrait) {
    return [
      { ...speakerPortrait, side: "left", active: true },
      { ...PLAYER_PORTRAIT, side: "right", active: false },
    ];
  }

  if (
    !normalized ||
    NON_PERSON_DIALOGUE_SPEAKERS.has(normalized)
  ) {
    return [];
  }

  if (
    normalized === "player" ||
    normalized === "you" ||
    normalized === "intercessor" ||
    normalized === "player pilgrim"
  ) {
    return [{ ...PLAYER_PORTRAIT, side: "right", active: true }];
  }

  return [{ ...PLAYER_PORTRAIT, side: "left", active: false, flipX: false }];
};

function DialoguePortraitStage({ speaker }: { speaker: string }) {
  const portraits = getDialoguePortraits(speaker);
  if (portraits.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 -top-[18rem] sm:-top-[24rem] md:-top-[28rem] bottom-0 z-10 overflow-hidden">
      {portraits.map((portrait) => {
        const leftSide = portrait.side === "left";
        return (
          <div
            key={`${portrait.id}_${portrait.side}`}
            className={`absolute bottom-0 sm:bottom-[-2.5rem] ${
              leftSide
                ? "left-[-1.5rem] sm:left-4"
                : "right-[-1.5rem] sm:right-4"
            }`}
            style={{
              transform: leftSide ? "translateX(-5%)" : "translateX(5%)",
            }}
          >
            <img
              src={portrait.src}
              alt=""
              aria-hidden="true"
              className={`h-[28rem] sm:h-[32rem] md:h-[36rem] max-w-none object-contain object-bottom select-none drop-shadow-[0_0_26px_rgba(0,0,0,0.9)] ${
                portrait.id === "player" ? "opacity-100" : (portrait.active ? "opacity-100" : "opacity-[0.58]")
              }`}
              style={{
                transform: portrait.flipX ? "scaleX(-1)" : undefined,
                transformOrigin: "bottom center",
              }}
              draggable={false}
            />
          </div>
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
    </div>
  );
}

function DialogueSceneImageStage({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <img
        src={src}
        alt={alt || ""}
        aria-hidden={alt ? undefined : true}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-95 select-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.18)_34%,rgba(0,0,0,0.14)_66%,rgba(0,0,0,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.90)_0%,rgba(0,0,0,0.54)_28%,rgba(0,0,0,0.12)_62%,rgba(0,0,0,0.36)_100%)]" />
    </div>
  );
}

const _cameraTargetVec = new THREE.Vector3();
const _cameraSavedTargetVec = new THREE.Vector3();

// Create a basic 5x5 test map for Milestone B
const createTestMap = (): MapData => {
  const cells: CellData[] = [];
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      // Make one cell blocked to test explaining why
      const isBlocked = x === 1 && z === 1;
      cells.push({
        x,
        y: 0,
        z,
        active: true,
        walkable: !isBlocked,
        blocks_los: isBlocked,
        height: 0,
        visual_height: isBlocked ? 1 : 0,
        terrain: "default",
        surface_tag: "none",
      });
    }
  }
  return {
    id: "map_test_01",
    display_name: "Test Grid",
    width: 5,
    height: 5,
    spawns: [{ id: "start", cell: [0, 0], facing: [0, -1] }],
    cells,
    props: [],
    custom_object_placements: [],
    entity_placements: [],
    item_placements: [],
    container_placements: [],
    triggers: [],
    exits: [],
  };
};

type QuestStepStatus = "done" | "current" | "locked";

interface QuestJournalStep {
  id: string;
  text: string;
  status: QuestStepStatus;
}

interface QuestJournalEntry {
  id: string;
  title: string;
  state: string;
  description: string;
  steps: QuestJournalStep[];
}

const stateLabel = (state: string) =>
  state
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const hasDeadEntity = (save: PlaySave, mapId: string, entityId: string) =>
  Object.entries(save.entity_states || {}).some(
    ([key, value]) =>
      key.includes(`_${mapId}_${entityId}_`) && Boolean((value as any)?.dead),
  );

const firstCurrentStep = (steps: QuestJournalStep[]) =>
  steps.find((step) => step.status === "current") ||
  steps.find((step) => step.status === "locked") ||
  steps[steps.length - 1];

const hasAllVampireTestimonies = (flags: Record<string, any>) =>
  Boolean(
    flags.testimonies_gathered ||
      (flags.testimony_dimos &&
        flags.testimony_orin &&
        flags.testimony_marta &&
        flags.testimony_holt),
  );

const canInterviewLazareAtDoor = (flags: Record<string, any>) =>
  Boolean(
    flags.vampire_cleared ||
      flags.lazare_talked ||
      (flags.act1_assigned && hasAllVampireTestimonies(flags)),
  );

const isLazareInterviewDoor = (
  map: MapData | null | undefined,
  placement: Pick<ObjectPlacementData, "object_id" | "dialogue_id"> | undefined,
) =>
  map?.id === "map_lazare_house" &&
  placement?.object_id === "obj_p_door" &&
  placement.dialogue_id === "dia_lazare_vampire";

const buildQuestJournal = (
  save: PlaySave,
  gamePackage: GamePackage,
): { entries: QuestJournalEntry[]; activeStep: QuestJournalStep | null } => {
  const flags = save.flags || {};
  const quests = save.quests || {};
  const questById = new Map(gamePackage.quests.map((quest) => [quest.id, quest]));
    const caveRemnantDefeated =
      flags.cyberghost_defeated ||
      hasDeadEntity(save, "map_cave_deep", "ent_bound_remnant");
  const readAnyCaveLog =
    flags.found_log_1 || flags.found_log_2 || flags.found_log_3 || flags.found_log_4;
  const allTestimony = hasAllVampireTestimonies(flags);
  const vampireActive =
    quests.quest_vampire ||
    flags.opening_ceremony_complete ||
    flags.act1_assigned ||
    flags.lazare_talked ||
    readAnyCaveLog ||
    flags.vampire_cleared;
  const nessaActive =
    quests.quest_investigate ||
    flags.nessa_thread_started ||
    flags.met_nessa ||
    flags.seen_cellar ||
    flags.first_descent_done ||
    flags.act1_rite_text;

  const entries: QuestJournalEntry[] = [];

  if (vampireActive) {
    const quest = questById.get("quest_vampire");
    const state = String(quests.quest_vampire || (flags.vampire_cleared ? "cleared" : "sworn"));
    const readyForCaves = flags.lazare_talked && allTestimony;
    const steps: QuestJournalStep[] = [
      {
        id: "briefing",
        text: "Report to Aldric at the scriptorium.",
        status: flags.act1_assigned || flags.office_briefed || state !== "sworn" ? "done" : "current",
      },
      {
        id: "dimos",
        text: "Record Dimos's market testimony.",
        status: flags.testimony_dimos ? "done" : flags.act1_assigned ? "current" : "locked",
      },
      {
        id: "orin",
        text: "Record Orin's Glassworks testimony.",
        status: flags.testimony_orin ? "done" : flags.act1_assigned ? "current" : "locked",
      },
      {
        id: "holt",
        text: "Record Holt's gate tally.",
        status: flags.testimony_holt ? "done" : flags.act1_assigned ? "current" : "locked",
      },
      {
        id: "marta",
        text: "Record Marta's lower-graves testimony.",
        status: flags.testimony_marta ? "done" : flags.act1_assigned ? "current" : "locked",
      },
      {
        id: "lazare",
        text: "Knock at Lazare's shuttered front door.",
        status: flags.lazare_talked ? "done" : allTestimony ? "current" : "locked",
      },
      {
        id: "caves",
        text: "Enter the eastern caves.",
        status: readAnyCaveLog || caveRemnantDefeated ? "done" : readyForCaves ? "current" : "locked",
      },
      {
        id: "logs",
        text: "Find the cave logs, including the grotto record.",
        status: flags.found_log_4 ? "done" : readAnyCaveLog || readyForCaves ? "current" : "locked",
      },
      {
        id: "remnant",
        text: "Confront the Grid-sick remnant in the depths.",
        status: caveRemnantDefeated || flags.vampire_cleared ? "done" : flags.found_log_3 || flags.found_log_4 ? "current" : "locked",
      },
      {
        id: "verdict",
        text: "Return to Aldric with the cave evidence.",
        status: flags.vampire_cleared ? "done" : flags.found_log_4 && caveRemnantDefeated ? "current" : "locked",
      },
    ];
    entries.push({
      id: "quest_vampire",
      title: quest?.display_name || "The Lonely Vampire",
      state,
      description: quest?.description || "",
      steps,
    });
  }

  if (nessaActive) {
    const quest = questById.get("quest_investigate");
    const state = String(quests.quest_investigate || "opened");
    const steps: QuestJournalStep[] = [
      {
        id: "clear_lazare",
        text: "Clear the vampire case enough to open the Hall of Custody.",
        status: flags.vampire_cleared ? "done" : "current",
      },
      {
        id: "nessa",
        text: "Speak with Nessa through the bars.",
        status: flags.met_nessa ? "done" : flags.vampire_cleared ? "current" : "locked",
      },
      {
        id: "cellar",
        text: "Inspect the Counted Cup cellar seal.",
        status: flags.seen_cellar ? "done" : flags.met_nessa ? "current" : "locked",
      },
      {
        id: "under",
        text: "Descend beneath the town from the sealed trapdoor.",
        status: flags.first_descent_done ? "done" : flags.seen_cellar && flags.act1_assigned ? "current" : "locked",
      },
      {
        id: "rite_text",
        text: "Find where Mara learned the under-rite.",
        status: flags.act1_rite_text ? "done" : flags.first_descent_done ? "current" : "locked",
      },
      {
        id: "second_leaf",
        text: "Look for the second leaf in the ossuary route.",
        status: flags.found_second_leaf ? "done" : flags.act1_rite_text ? "current" : "locked",
      },
    ];
    entries.push({
      id: "quest_investigate",
      title: quest?.display_name || "The Witness Investigation",
      state,
      description: quest?.description || "",
      steps,
    });
  }

  const activeEntry =
    entries.find((entry) => entry.steps.some((step) => step.status === "current")) ||
    entries[0];
  return {
    entries,
    activeStep: activeEntry ? firstCurrentStep(activeEntry.steps) : null,
  };
};

function LevelUpOverlay({
  level,
  pending,
  onChoose,
}: {
  level: number;
  pending: number;
  onChoose: (stat: LevelUpStat) => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md border-2 border-[var(--color-sacred-gold)] bg-sacred-stone px-5 py-5 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-sacred-gold-dark)]/60 pb-3">
          <div>
            <div className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-widest text-[var(--color-sacred-gold)]">
              Level {level}
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[var(--color-sacred-ink)]">
              Choose a stat
            </h2>
          </div>
          {pending > 1 && (
            <div className="rounded-sm border border-[var(--color-sacred-gold-dark)] bg-black/25 px-2 py-1 font-serif text-xs font-bold text-[var(--color-sacred-gold)]">
              {pending} choices
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEVEL_UP_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice.id)}
              className="min-h-16 border border-[var(--color-sacred-gold-dark)] bg-black/20 px-3 py-3 text-left transition-colors hover:bg-[var(--color-sacred-gold-dark)]/25 active:scale-[0.99]"
            >
              <span className="block font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-[var(--color-sacred-gold)]">
                {choice.label}
              </span>
              <span className="mt-1 block font-serif text-sm font-bold text-[var(--color-sacred-ink)]">
                {choice.effectLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlayEngine({ onGameEnd }: { onGameEnd?: () => void } = {}) {
  // Kept in a ref so the cutscene runner's closure always calls the latest
  // callback (the runner effect is long-lived and would otherwise capture a
  // stale prop).
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;
  const { gamePackage } = useEngineStore();
  const {
    saveData,
    logMessages,
    initSave,
    updatePlayer,
    movePlayer,
    addLog,
    resetRun,
    activeDialogueId,
    activeDialogueNodeId,
    advanceDialogue,
    endDialogue,
    setQuestState,
    updatePlayerHp,
    activeShopId,
    openShop,
    closeShop,
    updateMoney,
    activeContainerId,
    closeContainer,
    chooseLevelUpStat,
  } = usePlayStore();
  const [activeMap, setActiveMap] = useState<MapData | null>(null);

  const [activeCutscene, setActiveCutscene] = useState<any | null>(null);
  const [cutsceneActionIndex, setCutsceneActionIndex] = useState(0);

  const [showInventory, setShowInventory] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showCaseFile, setShowCaseFile] = useState(false);
  // Bumped after slot writes/deletes so the menu re-reads localStorage.
  const [saveSlotRevision, setSaveSlotRevision] = useState(0);
  const [targetingSkillId, setTargetingSkillId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [cameraQuarterTurns, setCameraQuarterTurns] = useState(0);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [cameraFocusOverride, setCameraFocusOverride] = useState<
    [number, number] | null
  >(null);
  const [screenFade, setScreenFade] = useState({
    color: "#000000",
    opacity: 0,
    duration: 600,
  });
  const [playDpr, setPlayDpr] = useState(PLAY_DPR_MAX);
  const cutsceneJumpsRef = useRef(0);
  const cameraAzimuth =
    ISO_CAMERA_BASE_AZIMUTH + cameraQuarterTurns * (Math.PI / 2);
  const activeCellByCoord = useMemo(() => {
    const lookup = new Map<string, CellData>();
    activeMap?.cells.forEach((cell) => {
      const key = playCellKey(cell.x, cell.z);
      const existing = lookup.get(key);
      if (
        !existing ||
        (cell.walkable && !existing.walkable) ||
        (cell.walkable === existing.walkable && (cell.y || 0) < (existing.y || 0))
      ) {
        lookup.set(key, cell);
      }
    });
    return lookup;
  }, [activeMap?.cells]);
  const getActiveCell = useCallback(
    (x: number, z: number) => activeCellByCoord.get(playCellKey(x, z)),
    [activeCellByCoord],
  );
  const objectByIdForPlay = useMemo(
    () =>
      new Map(
        gamePackage.object_library.map((object) => [
          object.id,
          object,
        ]),
      ),
    [gamePackage.object_library],
  );
  const activeMapDelta = activeMap
    ? saveData?.map_deltas?.[activeMap.id]
    : undefined;
  const lazareDoorReady = canInterviewLazareAtDoor(saveData?.flags || {});
  const isDoorOpenForPlay = useCallback(
    (placement: ObjectPlacementData) => {
      if (isLazareInterviewDoor(activeMap, placement) && !lazareDoorReady) {
        return false;
      }
      return isDoorPlacementOpen(activeMapDelta, placement);
    },
    [activeMap?.id, activeMapDelta, lazareDoorReady],
  );
  useEffect(() => {
    if (!activeMap || lazareDoorReady) return;
    const lazareDoor = activeMap.custom_object_placements.find((placement) =>
      isLazareInterviewDoor(activeMap, placement),
    );
    if (!lazareDoor || !isDoorPlacementOpen(activeMapDelta, lazareDoor)) return;
    usePlayStore.getState().closeDoor(activeMap.id, doorPlacementKey(lazareDoor));
  }, [
    activeMap,
    activeMapDelta?.opened_doors,
    lazareDoorReady,
  ]);
  const blockingPlacementCells = useMemo(() => {
    const blocked = new Set<string>();
    activeMap?.custom_object_placements?.forEach((placement) => {
      const objDef = objectByIdForPlay.get(placement.object_id);
      if (isBuildingDoorPlacement(placement)) {
        if (isDoorOpenForPlay(placement)) return;
        getPlacementFootprint(placement, objDef).forEach(([x, z]) => {
          blocked.add(playCellKey(x, z));
        });
        return;
      }
      if (!objDef || objDef.collision?.profile === "none") return;
      getPlacementFootprint(placement, objDef).forEach(([x, z]) => {
        blocked.add(playCellKey(x, z));
      });
    });
    return blocked;
  }, [activeMap?.custom_object_placements, isDoorOpenForPlay, objectByIdForPlay]);
  const containerByCoord = useMemo(() => {
    const lookup = new Map<string, ContainerPlacementData>();
    activeMap?.container_placements?.forEach((container) => {
      lookup.set(playCellKey(container.cell[0], container.cell[1]), container);
    });
    return lookup;
  }, [activeMap?.container_placements]);
  const getContainerAtCell = useCallback(
    (x: number, z: number) => containerByCoord.get(playCellKey(x, z)),
    [containerByCoord],
  );
  const isBlockedByPlacement = useCallback(
    (x: number, z: number) => blockingPlacementCells.has(playCellKey(x, z)),
    [blockingPlacementCells],
  );
  const baseWalkableCells = useMemo(() => {
    const walkable = new Set<string>();
    activeMap?.cells.forEach((cell) => {
      if (cell.walkable === false) return;
      if (cell.object_id) {
        const objDef = objectByIdForPlay.get(cell.object_id);
        if (objDef && objDef.collision?.profile !== "none") return;
      }
      walkable.add(pathCellKey(cell.x, cell.z));
    });

    activeMap?.custom_object_placements?.forEach((placement) => {
      const objDef = objectByIdForPlay.get(placement.object_id);
      if (isBuildingDoorPlacement(placement)) {
        if (isDoorOpenForPlay(placement)) return;
        getPlacementFootprint(placement, objDef).forEach(([x, z]) => {
          walkable.delete(pathCellKey(x, z));
        });
        return;
      }
      if (!objDef || objDef.collision?.profile === "none") return;
      getPlacementFootprint(placement, objDef).forEach(([x, z]) => {
        walkable.delete(pathCellKey(x, z));
      });
    });
    activeMap?.container_placements?.forEach((container) => {
      walkable.delete(pathCellKey(container.cell[0], container.cell[1]));
    });

    return walkable;
  }, [
    activeMap?.cells,
    activeMap?.custom_object_placements,
    activeMap?.container_placements,
    isDoorOpenForPlay,
    objectByIdForPlay,
  ]);

  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeMapRef = useRef<MapData | null>(null);
  const latestPartyFollowersRef = useRef<{ entity_id: string; cell: [number, number] }[]>([]);
  const inputBlockedRef = useRef(false);
  // bark id -> in-game minute it last played; throttles repeat gossip.
  const barkCooldownRef = useRef<Map<string, number>>(new Map());
  const lastBarkRealRef = useRef(0);
  const cameraAzimuthRef = useRef(cameraAzimuth);
  const handleMoveRef = useRef<((dx: number, dz: number) => void) | null>(null);
  const handleActRef = useRef<(() => void) | null>(null);
  const waitRef = useRef<(() => void) | null>(null);
  const pendingLevelUps = getPendingLevelUps(saveData);
  const levelUpOpen = pendingLevelUps > 0;
  const levelUpOpenRef = useRef(false);
  const playSfx = useCallback(
    (
      idOrUrl: string | undefined,
      opts: { volume?: number; playbackRate?: number; cooldownMs?: number } = {},
    ) => {
      const settings = useEngineStore.getState().gamePackage.settings || {};
      playSound(idOrUrl, {
        ...opts,
        customSounds: settings.sound_effects || {},
      });
    },
    [],
  );

  const logExperienceGrant = useCallback(
    (result: ExperienceGrantResult | null) => {
      if (!result || result.awarded <= 0) return;
      addLog(`Gained ${result.awarded} XP.`);
      if (result.levelUps > 0) {
        playSfx("level_up", { volume: 0.65, cooldownMs: 400 });
        addLog(`Level ${result.level} reached. Choose a stat.`);
      } else {
        playSfx("coin", { volume: 0.35, cooldownMs: 160 });
      }
    },
    [addLog, playSfx],
  );

  const handleEnemyDefeatedExperience = useCallback(
    (entityData: GamePackage["entities"][number] | undefined | null) => {
      if (entityData?.id === "ent_bound_remnant") {
        usePlayStore.getState().setFlag("cyberghost_defeated", true);
      }
      const xp = getEnemyXpReward(entityData);
      if (xp <= 0) return;
      const store = usePlayStore.getState();
      if (store.saveData?.in_combat) {
        store.queueCombatExperience(xp);
        return;
      }
      logExperienceGrant(store.grantExperience(xp));
    },
    [logExperienceGrant],
  );

  const handleLevelUpChoice = useCallback(
    (stat: LevelUpStat) => {
      const choice = LEVEL_UP_CHOICES.find((candidate) => candidate.id === stat);
      if (chooseLevelUpStat(stat)) {
        playSfx("level_up", { volume: 0.55, cooldownMs: 500 });
        addLog(`${choice?.label || "Stat"} increased.`);
      }
    },
    [addLog, chooseLevelUpStat, playSfx],
  );

  const computeTargetPattern = useCallback(
    (targetX?: number, targetZ?: number) => {
      if (!targetingSkillId || !saveData) return [];
      const skill = gamePackage.abilities.find(
        (s) => s.id === targetingSkillId,
      );
      if (!skill) return [];

      // Patterns originate from whoever is being commanded (player, or a
      // party member on their combat turn).
      const caster = getControlledActor(saveData, gamePackage);
      if (!caster) return [];
      const cx = caster.cell[0];
      const cz = caster.cell[1];
      const hx = targetX !== undefined ? targetX : hoveredCell?.[0];
      const hz = targetZ !== undefined ? targetZ : hoveredCell?.[1];

      if (hx === undefined || hz === undefined) return [];

      const dist = Math.abs(cx - hx) + Math.abs(cz - hz);
      if (dist > skill.range) return []; // Out of range

      const pattern: { x: number; z: number }[] = [];

      if (skill.targeting === "single") {
        pattern.push({ x: hx, z: hz });
      } else if (skill.targeting === "cross") {
        pattern.push(
          { x: hx, z: hz },
          { x: hx - 1, z: hz },
          { x: hx + 1, z: hz },
          { x: hx, z: hz - 1 },
          { x: hx, z: hz + 1 },
        );
      } else if (skill.targeting === "block") {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            pattern.push({ x: hx + dx, z: hz + dz });
          }
        }
      } else if (skill.targeting === "line") {
        const dx = Math.sign(hx - cx);
        const dz = Math.sign(hz - cz);
        for (let i = 1; i <= skill.range; i++) {
          pattern.push({ x: cx + dx * i, z: cz + dz * i });
        }
      } else if (skill.targeting === "cone") {
        // Simple cone: if facing north (dz=-1), widen along x
        const dx = Math.sign(hx - cx);
        const dz = Math.sign(hz - cz);
        if (Math.abs(dx) > Math.abs(dz)) {
          // Horizontal cone
          for (let i = 1; i <= skill.range; i++) {
            for (let w = -i; w <= i; w++)
              pattern.push({ x: cx + dx * i, z: cz + w });
          }
        } else {
          // Vertical cone
          for (let i = 1; i <= skill.range; i++) {
            for (let w = -i; w <= i; w++)
              pattern.push({ x: cx + w, z: cz + dz * i });
          }
        }
      }
      return pattern;
    },
    [targetingSkillId, hoveredCell, saveData, gamePackage],
  );

  const handleCellHover = useCallback(
    (x: number, z: number) => {
      if (targetingSkillId) setHoveredCell([x, z]);
    },
    [targetingSkillId],
  );

  const handlePointerOut = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleCellClick = useCallback(
    (x: number, z: number) => {
      if (!targetingSkillId || !saveData || !activeMap) return;
      if (levelUpOpenRef.current) return;
      const skill = gamePackage.abilities.find(
        (s) => s.id === targetingSkillId,
      );
      if (!skill) return;

      // Require a tap to select first if using touch, or allow direct click if hovered
      if (hoveredCell?.[0] !== x || hoveredCell?.[1] !== z) {
        setHoveredCell([x, z]);
        return;
      }

      const inCombat = !!saveData.in_combat;
      const caster = getControlledActor(saveData, gamePackage);
      if (!caster) return;

      const pattern = computeTargetPattern(x, z);
      if (pattern.length === 0) {
        playSfx("warning", { volume: 0.35, cooldownMs: 200 });
        addLog("Invalid target or out of range.");
        setTargetingSkillId(null);
        return;
      }

      // Check Costs
      if (
        !inCombat &&
        caster.isPlayer &&
        (saveData.playerStats.energy || 0) < skill.ap_cost
      ) {
        playSfx("warning", { volume: 0.35, cooldownMs: 200 });
        addLog("Not enough AP/Energy to cast.");
        setTargetingSkillId(null);
        return;
      }
      if (caster.mp < skill.mp_cost) {
        playSfx("warning", { volume: 0.35, cooldownMs: 200 });
        addLog("Not enough MP to cast.");
        setTargetingSkillId(null);
        return;
      }

      // Pay for it: MP from the caster's own pool, energy only when the
      // overworld clock is running.
      if (caster.isPlayer) {
        if (!inCombat) {
          usePlayStore.getState().updatePlayerStats({
            energy: (saveData.playerStats.energy || 0) - skill.ap_cost,
          });
        }
        if (saveData.playerStats.mp === undefined) {
          usePlayStore.getState().updatePlayerStats({ mp: 10, max_mp: 10 });
        }
        usePlayStore.getState().updatePlayerMp(-skill.mp_cost);
      } else {
        usePlayStore.getState().updateEntityState(caster.key, {
          mp: Math.max(0, caster.mp - skill.mp_cost),
        });
      }

      addLog(
        caster.isPlayer
          ? `You cast ${skill.display_name}!`
          : `${caster.name} casts ${skill.display_name}!`,
      );
      playSfx("spell_cast", { volume: 0.45, cooldownMs: 180 });
      const fx = useFxStore.getState();

      // Apply Payloads to all valid cells in pattern
      const nextSavedEntities = {
        ...(usePlayStore.getState().saveData?.entity_states || {}),
      };
      let hasEntityUpdate = false;
      let struckAnything = false;

      pattern.forEach((targetCell) => {
        const cellDef = getActiveCell(targetCell.x, targetCell.z);
        if (!cellDef) return; // Optional logic: Surface Tag reactions

        // Element + Surface Reaction (placeholder for 4.2 Environmental Chemistry)

        // Apply to entities
        activeMap.entity_placements?.forEach((e, idx) => {
          if ((saveData.party_members || []).includes(e.entity_id)) return;

          const key = entityStateKey(activeMap.id, e.entity_id, idx);
          const est = { ...(nextSavedEntities[key] || { cell: [...e.cell] }) };
          const eData = gamePackage.entities.find(
            (ent) => ent.id === e.entity_id,
          );
          const estCell = est.cell || e.cell;

          if (
            !est.dead &&
            !est.hidden &&
            estCell[0] === targetCell.x &&
            estCell[1] === targetCell.z
          ) {
            let curHp = est.hp !== undefined ? est.hp : eData?.max_hp || 10;
            const cellTuple: [number, number] = [targetCell.x, targetCell.z];

            for (const payload of skill.payloads) {
              if (payload.type === "damage" && payload.value) {
                const { dmg, crit } = rollSkillDamage(
                  payload.value,
                  caster.attack,
                  eData?.defense ?? 0,
                );
                curHp -= dmg;
                struckAnything = true;
                fx.addPopup(
                  cellTuple,
                  `${dmg}${crit ? "!" : ""}`,
                  crit ? "#fbbf24" : "#c4b5fd",
                );
                fx.flashEntity(key);
                playSfx("spell_hit", { volume: crit ? 0.58 : 0.42, cooldownMs: 80 });
                addLog(
                  crit
                    ? `Critical! ${skill.display_name} hits ${eData?.display_name} for ${dmg}!`
                    : `${skill.display_name} hits ${eData?.display_name} for ${dmg}.`,
                );
              } else if (payload.type === "heal" && payload.value) {
                curHp = Math.min(eData?.max_hp || 10, curHp + payload.value);
                struckAnything = true;
                fx.addPopup(cellTuple, `+${payload.value}`, "#4ade80");
                playSfx("heal", { volume: 0.42, cooldownMs: 120 });
                addLog(
                  `Healed ${eData?.display_name} for ${payload.value} HP.`,
                );
              }
            }

            if (curHp <= 0) {
              est.dead = true;
              curHp = 0;
              fx.addPopup(cellTuple, "✕", "#f87171");
              playSfx("enemy_defeat", { volume: 0.45, cooldownMs: 180 });
              addLog(`${eData?.display_name} is defeated!`);
              handleEnemyDefeatedExperience(eData);
            }
            est.hp = curHp;
            nextSavedEntities[key] = est;
            hasEntityUpdate = true;
          }
        });

        // Party members in the pattern: heals mend them, careless damage
        // spells hurt them. This is how Aldric's Brother's Oath reaches you
        // and how your line spell can clip him.
        (saveData.party_members || []).forEach((pid) => {
          const pDef = gamePackage.entities.find((e) => e.id === pid);
          const pEst = { ...((nextSavedEntities[pid] || {}) as any) };
          if (!pDef || !pEst.cell || pEst.dead) return;
          if (pEst.cell[0] !== targetCell.x || pEst.cell[1] !== targetCell.z)
            return;
          const cellTuple: [number, number] = [targetCell.x, targetCell.z];
          for (const payload of skill.payloads) {
            if (payload.type === "damage" && payload.value) {
              const dmg = Math.max(
                1,
                payload.value - (pDef.defense ?? 0),
              );
              pEst.hp = Math.max(0, (pEst.hp ?? pDef.max_hp) - dmg);
              struckAnything = true;
              fx.addPopup(cellTuple, `${dmg}`, "#f87171");
              fx.flashEntity(pid);
              playSfx("spell_hit", { volume: 0.45, cooldownMs: 80 });
              addLog(`${pDef.display_name} is caught in it for ${dmg}!`);
              if (pEst.hp <= 0) {
                pEst.dead = true;
                fx.addPopup(cellTuple, "✕", "#f87171");
                playSfx("enemy_defeat", { volume: 0.35, cooldownMs: 180 });
                addLog(`${pDef.display_name} is down!`);
              }
            } else if (payload.type === "heal" && payload.value) {
              pEst.hp = Math.min(
                pDef.max_hp,
                (pEst.hp ?? pDef.max_hp) + payload.value,
              );
              struckAnything = true;
              fx.addPopup(cellTuple, `+${payload.value}`, "#4ade80");
              playSfx("heal", { volume: 0.42, cooldownMs: 120 });
              addLog(`${pDef.display_name} is mended for ${payload.value}.`);
            }
          }
          nextSavedEntities[pid] = pEst;
          hasEntityUpdate = true;
        });

        // Look for player hit
        if (
          saveData.player.cell[0] === targetCell.x &&
          saveData.player.cell[1] === targetCell.z
        ) {
          for (const payload of skill.payloads) {
            if (payload.type === "damage" && payload.value) {
              usePlayStore.getState().updatePlayerHp(-payload.value);
              fx.addPopup(
                [targetCell.x, targetCell.z],
                `${payload.value}`,
                "#f87171",
              );
              fx.markPlayerHurt();
              playSfx("spell_hit", { volume: 0.5, cooldownMs: 80 });
              addLog(
                `You were hit for ${payload.value} damage by your own spell!`,
              );
              struckAnything = true;
            } else if (payload.type === "heal" && payload.value) {
              usePlayStore.getState().updatePlayerHp(payload.value);
              fx.addPopup(
                [targetCell.x, targetCell.z],
                `+${payload.value}`,
                "#4ade80",
              );
              playSfx("heal", { volume: 0.42, cooldownMs: 120 });
              addLog(`Restored ${payload.value} HP.`);
              struckAnything = true;
            }
          }
        }
      });

      if (!struckAnything) {
        playSfx("warning", { volume: 0.28, cooldownMs: 200 });
        addLog("It strikes nothing but air.");
      }

      if (hasEntityUpdate) {
        usePlayStore.setState((state) => ({
          saveData: state.saveData
            ? {
                ...state.saveData,
                entity_states: nextSavedEntities,
              }
            : null,
        }));
      }

      setTargetingSkillId(null);
      setHoveredCell(null);

      // A cast is a full combat action.
      if (inCombat) usePlayStore.getState().advanceTurn();
    },
    [
      targetingSkillId,
      saveData,
      activeMap,
      computeTargetPattern,
      gamePackage,
      hoveredCell,
      addLog,
      getActiveCell,
      handleEnemyDefeatedExperience,
      playSfx,
    ],
  );

  const computeTargetPatternMemo = useMemo(
    () => (targetingSkillId ? computeTargetPattern() : undefined),
    [targetingSkillId, computeTargetPattern],
  );

  // Enter targeting mode for a skill (from the hotbar, hotkeys 1-6, or the
  // skills panel). Checks costs up front so the player learns "can't afford"
  // before aiming, not after.
  const beginTargeting = useCallback(
    (skillId: string) => {
      const save = usePlayStore.getState().saveData;
      if (!save || save.playerStats.hp <= 0) return;
      if (getPendingLevelUps(save) > 0) return;
      const actor = getControlledActor(save, gamePackage);
      if (!actor) return; // an enemy is acting
      const skill = gamePackage.abilities.find((s) => s.id === skillId);
      if (!skill) return;
      if (!actor.skills.includes(skillId)) return;
      if (
        !save.in_combat &&
        actor.isPlayer &&
        (save.playerStats.energy || 0) < skill.ap_cost
      ) {
        playSfx("warning", { volume: 0.35, cooldownMs: 200 });
        addLog("Not ready to act yet.");
        return;
      }
      if (actor.mp < skill.mp_cost) {
        playSfx("warning", { volume: 0.35, cooldownMs: 200 });
        addLog(`Not enough MP for ${skill.display_name}.`);
        return;
      }
      clearInputState();
      setShowSkills(false);
      setHoveredCell(null);
      setTargetingSkillId(skillId);
      playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
      addLog(
        `${actor.isPlayer ? "Aiming" : `${actor.name} readies`} ${skill.display_name} — tap a tile, tap again to cast.`,
      );
    },
    [gamePackage, addLog, playSfx],
  );

  const beginTargetingRef = useRef(beginTargeting);
  useEffect(() => {
    beginTargetingRef.current = beginTargeting;
  }, [beginTargeting]);

  const targetingSkillIdRef = useRef<string | null>(null);
  useEffect(() => {
    targetingSkillIdRef.current = targetingSkillId;
  }, [targetingSkillId]);

  const isEnemyNearbyRef = useRef<(() => boolean) & { getNearbyEnemyIds?: () => string[] } | null>(null);
  const keysDownRef = useRef<Set<string>>(new Set());
  const combatInputLockUntilRef = useRef(0);
  const combatInputNeedsReleaseRef = useRef(false);
  const combatInputHeldKeysRef = useRef<Set<string>>(new Set());
  const activeCombatTurnRef = useRef<string | null>(null);
  const repeatStateRef = useRef({
    dx: 0,
    dz: 0,
    startTime: 0,
    lastTick: 0,
    bufferStart: 0,
    active: false,
  });
  const resetRepeatInputState = useCallback(() => {
    repeatStateRef.current.active = false;
    repeatStateRef.current.bufferStart = 0;
  }, []);
  const releaseCombatInputGateIfReady = useCallback((time = inputNow()) => {
    if (!combatInputNeedsReleaseRef.current) {
      return time >= combatInputLockUntilRef.current;
    }
    if (time < combatInputLockUntilRef.current) return false;
    if (combatInputHeldKeysRef.current.size > 0) return false;
    combatInputNeedsReleaseRef.current = false;
    return true;
  }, []);
  const isCombatInputGateActive = useCallback(
    (time = inputNow()) => !releaseCombatInputGateIfReady(time),
    [releaseCombatInputGateIfReady],
  );

  useEffect(() => {
    activeMapRef.current = activeMap;
  }, [activeMap]);

  // Fresh jump budget each time a cutscene starts.
  useEffect(() => {
    cutsceneJumpsRef.current = 0;
  }, [activeCutscene]);

  useEffect(() => {
    cameraAzimuthRef.current = cameraAzimuth;
  }, [cameraAzimuth]);

  useEffect(() => {
    levelUpOpenRef.current = levelUpOpen;
    inputBlockedRef.current = Boolean(
      activeCutscene?.is_blocking ||
        levelUpOpen ||
        showInventory ||
        showSkills ||
        showSaveMenu ||
        showCaseFile ||
        targetingSkillId ||
        activeDialogueId ||
        activeShopId ||
        activeDocumentId ||
        activeContainerId,
    );
    if (inputBlockedRef.current) resetRepeatInputState();
    if (levelUpOpen) keysDownRef.current.clear();
  }, [
    activeCutscene,
    levelUpOpen,
    showInventory,
    showSkills,
    showSaveMenu,
    showCaseFile,
    targetingSkillId,
    activeDialogueId,
    activeShopId,
    activeDocumentId,
    activeContainerId,
    resetRepeatInputState,
  ]);

  const simulateKey = useCallback((key: string, isDown: boolean) => {
    const normalizedKey = key.toLowerCase();
    if (isMovementCommandKey(normalizedKey)) {
      if (isDown && isCombatInputGateActive()) {
        combatInputHeldKeysRef.current.add(normalizedKey);
        combatInputNeedsReleaseRef.current = true;
        keysDownRef.current.delete(normalizedKey);
        resetRepeatInputState();
        return;
      }
      if (!isDown) {
        combatInputHeldKeysRef.current.delete(normalizedKey);
        releaseCombatInputGateIfReady();
      }
    }
    if (isDown) keysDownRef.current.add(normalizedKey);
    else keysDownRef.current.delete(normalizedKey);
  }, [isCombatInputGateActive, releaseCombatInputGateIfReady, resetRepeatInputState]);

  // ── Virtual Joystick ──────────────────────────────────────────────────────
  const JOYSTICK_DEAD = 14;
  const JOYSTICK_MAX = 54;

  const joystickActive = useRef(false);
  const joystickPointerId = useRef<number | null>(null);
  const joystickBase = useRef({ x: 0, y: 0 });
  const joystickKeysRef = useRef(new Set<string>());
  const joystickOverlayRef = useRef<HTMLDivElement>(null);

  // Flush all held keys and joystick state — call before opening any blocking panel so
  // inputs can't re-fire the moment the panel closes.
  const clearInputState = () => {
    keysDownRef.current.clear();
    joystickKeysRef.current.forEach((k) => simulateKey(k, false));
    joystickKeysRef.current.clear();
    joystickActive.current = false;
    joystickPointerId.current = null;
    resetRepeatInputState();
    setJoystickVis({ visible: false, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0 });
  };

  useEffect(() => {
    const activeTurn = saveData?.in_combat
      ? (saveData.active_turn_id ?? null)
      : null;
    const previousTurn = activeCombatTurnRef.current;

    if (!activeTurn) {
      activeCombatTurnRef.current = null;
      combatInputLockUntilRef.current = 0;
      combatInputNeedsReleaseRef.current = false;
      combatInputHeldKeysRef.current.clear();
      return;
    }

    if (previousTurn === activeTurn) return;

    // Only gate on keyboard keys physically held at the turn boundary.
    // Joystick keys live in combatInputHeldKeysRef (not keysDownRef) and are
    // continuously re-fired by pointer events, so including them here would
    // permanently lock the gate — the joystick never "releases".
    const heldKeyboardKeys = new Set(
      [...keysDownRef.current].filter(isMovementCommandKey),
    );
    activeCombatTurnRef.current = activeTurn;
    clearInputState();
    combatInputHeldKeysRef.current = heldKeyboardKeys;
    combatInputNeedsReleaseRef.current = heldKeyboardKeys.size > 0;
    combatInputLockUntilRef.current =
      inputNow() + COMBAT_ACTOR_SWITCH_INPUT_DELAY_MS;
  }, [saveData?.in_combat, saveData?.active_turn_id]);

  // Non-passive touchmove on document so preventDefault() actually stops iOS page scroll
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => { if (joystickActive.current) e.preventDefault(); };
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', onTouchMove);
  }, []);
  const [joystickVis, setJoystickVis] = useState<{
    visible: boolean; baseX: number; baseY: number; thumbX: number; thumbY: number;
  }>({ visible: false, baseX: 0, baseY: 0, thumbX: 0, thumbY: 0 });

  const joystickStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (joystickActive.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    joystickActive.current = true;
    joystickPointerId.current = e.pointerId;
    joystickBase.current = { x, y };
    setJoystickVis({ visible: true, baseX: x, baseY: y, thumbX: x, thumbY: y });
  }, []);

  const joystickMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!joystickActive.current || e.pointerId !== joystickPointerId.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = cx - joystickBase.current.x;
    const dy = cy - joystickBase.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = dist > JOYSTICK_MAX ? JOYSTICK_MAX / dist : 1;
    const thumbX = joystickBase.current.x + dx * clamp;
    const thumbY = joystickBase.current.y + dy * clamp;
    setJoystickVis({ visible: true, baseX: joystickBase.current.x, baseY: joystickBase.current.y, thumbX, thumbY });

    const prev = joystickKeysRef.current;
    const next = new Set<string>();
    if (dist >= JOYSTICK_DEAD) {
      const deg = Math.atan2(dy, dx) * (180 / Math.PI);
      // Snap to one of 8 fixed 45° sectors so diagonal zones never jitter at boundaries.
      // Math.round(deg/45) gives -4..4; normalise to 0-7.
      // Sector map (screen coords, y-axis down):
      //   0=E  1=SE  2=S  3=SW  4=W  5=NW  6=N  7=NE
      const s = ((Math.round(deg / 45) % 8) + 8) % 8;
      if (s === 5 || s === 6 || s === 7) next.add("arrowup");    // NW, N, NE
      if (s === 1 || s === 2 || s === 3) next.add("arrowdown");  // SE, S, SW
      if (s === 7 || s === 0 || s === 1) next.add("arrowright"); // NE, E, SE
      if (s === 3 || s === 4 || s === 5) next.add("arrowleft");  // SW, W, NW
    }
    prev.forEach(k => { if (!next.has(k)) simulateKey(k, false); });
    next.forEach(k => { if (!prev.has(k)) simulateKey(k, true); });
    joystickKeysRef.current = next;
  }, [simulateKey]);

  const joystickEnd = useCallback(() => {
    joystickActive.current = false;
    joystickPointerId.current = null;
    joystickKeysRef.current.forEach(k => simulateKey(k, false));
    joystickKeysRef.current.clear();
    setJoystickVis(v => ({ ...v, visible: false }));
  }, [simulateKey]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    isEnemyNearbyRef.current = () => {
      const currentSave = usePlayStore.getState().saveData;
      const currentMap = activeMapRef.current;
      if (!currentSave || !currentMap) return false;
      const px = currentSave.player.cell[0];
      const pz = currentSave.player.cell[1];

      for (let i = 0; i < currentMap.entity_placements.length; i++) {
        const p = currentMap.entity_placements[i];
        if ((currentSave.party_members || []).includes(p.entity_id)) continue;
        const key = entityStateKey(currentMap.id, p.entity_id, i);
        const state = currentSave.entity_states?.[key];
        if (state?.dead || state?.hidden) continue;

        const ex = state?.cell ? state.cell[0] : p.cell[0];
        const ez = state?.cell ? state.cell[1] : p.cell[1];

        const dist = Math.abs(px - ex) + Math.abs(pz - ez);
        if (dist <= 2) {
          const entityData = useEngineStore
            .getState()
            .gamePackage.entities.find((e) => e.id === p.entity_id);
          if (entityData && !entityData.is_npc) {
            return true;
          }
        }
      }
      return false;
    };
  }, []);

  // Combat / ambient music switcher. Engaging any living hostile swaps to the
  // combat track; disengaging restores whatever ambient track was playing
  // before (map music set by on_load cutscenes survives the fight).
  const ambientMusicRef = useRef<string | null>(null);
  useEffect(() => {
    const COMBAT_TRACK = "/music/le-verre-en-spleen.mp3";
    const TOWN_TRACK = "/music/l-ombre-des-bles.mp3";
    const interval = setInterval(() => {
      if (activeCutscene) return;

      const save = usePlayStore.getState().saveData;
      const map = activeMapRef.current;
      const gp = useEngineStore.getState().gamePackage;
      const engaged =
        getNearbyHostiles(save, map, gp, THREAT_RADIUS).length > 0;
      const current = getCurrentMusicUrl();

      if (engaged) {
        if (current !== COMBAT_TRACK) {
          ambientMusicRef.current = current;
          playMusic(COMBAT_TRACK, { loop: true });
        }
      } else if (current === COMBAT_TRACK) {
        playMusic(ambientMusicRef.current || TOWN_TRACK, { loop: true });
      } else if (!current) {
        playMusic(TOWN_TRACK, { loop: true });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeCutscene]);

  // ── Combat orchestration ──────────────────────────────────────────────────
  // Engage when a living hostile closes to THREAT_RADIUS: party followers
  // become positioned combatants and initiative is rolled from speed
  // (player, party, and enemies all in one queue). Reinforcements join the
  // back of the order; combat ends when nothing hostile remains within
  // CHASE_RADIUS.
  useEffect(() => {
    if (!saveData || !activeMap || activeCutscene) return;
    if (saveData.playerStats.hp <= 0) return;
    const gp = useEngineStore.getState().gamePackage;
    const store = usePlayStore.getState();
    const partyIds = saveData.party_members || [];

    if (!saveData.in_combat) {
      const hostiles = getNearbyHostiles(saveData, activeMap, gp, THREAT_RADIUS);
      if (hostiles.length === 0) return;

      (latestPartyFollowersRef.current || []).forEach((follower) => {
        const def = gp.entities.find((e) => e.id === follower.entity_id);
        const est = (saveData.entity_states || {})[follower.entity_id] || {};
        store.updateEntityState(follower.entity_id, {
          cell: est.cell || follower.cell,
          facing: est.facing || saveData.player.facing,
          hp: est.hp ?? def?.max_hp ?? 10,
          mp: est.mp ?? def?.max_mp ?? 0,
          dead: false,
        });
      });

      const members: { id: string; speed: number }[] = [
        { id: "player", speed: saveData.playerStats.speed || 10 },
        ...partyIds.map((id) => ({
          id,
          speed: gp.entities.find((e) => e.id === id)?.speed ?? 10,
        })),
        ...hostiles.map((h) => ({ id: h.key, speed: h.speed })),
      ];
      members.sort((a, b) => b.speed - a.speed);
      store.startCombat(members.map((m) => m.id));
      playSfx("warning", { volume: 0.3, cooldownMs: 180 });
      store.addLog("⚔ Battle joined — initiative follows speed.");
      return;
    }

    // Already fighting: end it, or fold in latecomers.
    const inRange = getNearbyHostiles(saveData, activeMap, gp, CHASE_RADIUS);
    if (inRange.length === 0) {
      const xpResult = store.endCombat(partyIds);
      store.addLog("The dark settles. You regroup.");
      playSfx("ui_back", { volume: 0.2, cooldownMs: 180 });
      logExperienceGrant(xpResult);
      return;
    }
    const queue = saveData.combat_queue || [];
    const newcomers = inRange
      .filter((h) => !queue.includes(h.key))
      .map((h) => h.key);
    if (newcomers.length > 0) {
      store.extendCombatQueue(newcomers);
      playSfx("warning", { volume: 0.22, cooldownMs: 180 });
      store.addLog("Something else has noticed you.");
    }
  }, [saveData, activeMap, activeCutscene, logExperienceGrant, playSfx]);

  // ── Enemy turns ───────────────────────────────────────────────────────────
  // Resolved automatically after a short beat so the order stays readable:
  // strike an adjacent opponent (player or party member), otherwise take one
  // step toward the nearest one.
  useEffect(() => {
    if (!saveData?.in_combat || !activeMap) return;
    if (saveData.playerStats.hp <= 0) return;
    // Cutscenes own the stage — enemies hold their turn until the scene ends.
    if (activeCutscene) return;
    const turnId = saveData.active_turn_id;
    if (!turnId || turnId === "player") return;
    if ((saveData.party_members || []).includes(turnId)) return;

    const timer = setTimeout(() => {
      const store = usePlayStore.getState();
      const save = store.saveData;
      if (!save?.in_combat || save.active_turn_id !== turnId) return;
      const gp = useEngineStore.getState().gamePackage;
      const fx = useFxStore.getState();

      let placementIndex = -1;
      activeMap.entity_placements?.forEach((p, idx) => {
        if (entityStateKey(activeMap.id, p.entity_id, idx) === turnId) {
          placementIndex = idx;
        }
      });
      if (placementIndex < 0) {
        store.advanceTurn();
        return;
      }
      const placement = activeMap.entity_placements[placementIndex];
      const def = gp.entities.find((e) => e.id === placement.entity_id);
      const est = { ...((save.entity_states || {})[turnId] || {}) } as any;
      const cell: [number, number] = est.cell || placement.cell;
      if (!def || est.dead || est.hidden) {
        store.advanceTurn();
        return;
      }

      // Opponents: the player plus standing party members.
      const opponents: {
        id: string;
        cell: [number, number];
        defense: number;
        isPlayer: boolean;
      }[] = [
        {
          id: "player",
          cell: save.player.cell,
          defense: save.playerStats.defense,
          isPlayer: true,
        },
      ];
      (save.party_members || []).forEach((pid) => {
        const pDef = gp.entities.find((e) => e.id === pid);
        const pEst = (save.entity_states || {})[pid];
        if (!pDef || !pEst?.cell || pEst.dead) return;
        opponents.push({
          id: pid,
          cell: pEst.cell as [number, number],
          defense: pDef.defense ?? 0,
          isPlayer: false,
        });
      });
      const manhattan = (a: [number, number], b: [number, number]) =>
        Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      opponents.sort((a, b) => manhattan(a.cell, cell) - manhattan(b.cell, cell));
      const target = opponents[0];
      const dist = manhattan(target.cell, cell);

      if (dist === 1) {
        const { dmg, crit } = rollMeleeDamage(def.attack ?? 2, target.defense);
        est.facing = [target.cell[0] - cell[0], target.cell[1] - cell[1]];
        store.updateEntityState(turnId, est);
        playSfx("melee_swing", { volume: 0.24, playbackRate: 0.92, cooldownMs: 70 });
        playSfx(crit ? "melee_crit" : "melee_hit", {
          volume: crit ? 0.52 : 0.36,
          cooldownMs: 80,
        });
        if (target.isPlayer) {
          store.updatePlayerHp(-dmg);
          fx.addPopup(target.cell, `${dmg}${crit ? "!" : ""}`, "#f87171");
          fx.markPlayerHurt();
          store.addLog(
            `${def.display_name} hits you for ${dmg}${crit ? " — a vicious blow!" : "."}`,
          );
        } else {
          const tDef = gp.entities.find((e) => e.id === target.id);
          const tEst = { ...((save.entity_states || {})[target.id] || {}) } as any;
          tEst.hp = Math.max(0, (tEst.hp ?? tDef?.max_hp ?? 10) - dmg);
          fx.addPopup(target.cell, `${dmg}${crit ? "!" : ""}`, "#f87171");
          fx.flashEntity(target.id);
          store.addLog(`${def.display_name} strikes ${tDef?.display_name} for ${dmg}!`);
          if (tEst.hp <= 0) {
            tEst.dead = true;
            fx.addPopup(target.cell, "✕", "#f87171");
            playSfx("enemy_defeat", { volume: 0.35, cooldownMs: 180 });
            store.addLog(`${tDef?.display_name} is down!`);
          }
          store.updateEntityState(target.id, tEst);
        }
      } else {
        // One step toward the target through open ground.
        const occupied = new Set<string>();
        occupied.add(`${save.player.cell[0]},${save.player.cell[1]}`);
        (save.party_members || []).forEach((pid) => {
          const pEst = (save.entity_states || {})[pid];
          if (pEst?.cell && !pEst.dead) occupied.add(`${pEst.cell[0]},${pEst.cell[1]}`);
        });
        activeMap.entity_placements?.forEach((p, idx) => {
          const k = entityStateKey(activeMap.id, p.entity_id, idx);
          if (k === turnId) return;
          if ((save.party_members || []).includes(p.entity_id)) return;
          const oEst = (save.entity_states || {})[k];
          if (oEst?.dead || oEst?.hidden) return;
          const ox = oEst?.cell?.[0] ?? p.cell[0];
          const oz = oEst?.cell?.[1] ?? p.cell[1];
          occupied.add(`${ox},${oz}`);
        });
        const isOpen = (x: number, z: number) => {
          const c = getActiveCell(x, z);
          if (!c || !c.walkable) return false;
          if (c.object_id) {
            const objDef = gp.object_library.find((o) => o.id === c.object_id);
            if (objDef && objDef.collision?.profile !== "none") return false;
          }
          if (getContainerAtCell(x, z)) return false;
          if (isBlockedByPlacement(x, z)) return false;
          return !occupied.has(`${x},${z}`);
        };
        const dx = Math.sign(target.cell[0] - cell[0]);
        const dz = Math.sign(target.cell[1] - cell[1]);
        const tryOrder: [number, number][] =
          Math.abs(target.cell[0] - cell[0]) >= Math.abs(target.cell[1] - cell[1])
            ? [[dx, 0], [0, dz], [0, -dz], [-dx, 0]]
            : [[0, dz], [dx, 0], [-dx, 0], [0, -dz]];
        for (const [mx, mz] of tryOrder) {
          if (mx === 0 && mz === 0) continue;
          const nx = cell[0] + mx;
          const nz = cell[1] + mz;
          if (isOpen(nx, nz)) {
            est.cell = [nx, nz];
            est.facing = [mx, mz];
            store.updateEntityState(turnId, est);
            playSfx("footstep_stone", {
              volume: 0.18,
              playbackRate: 0.9,
              cooldownMs: 90,
            });
            break;
          }
        }
      }
      store.advanceTurn();
    }, 340);
    return () => clearTimeout(timer);
  }, [
    saveData?.active_turn_id,
    saveData?.in_combat,
    activeMap,
    activeCutscene,
    getActiveCell,
    getContainerAtCell,
    isBlockedByPlacement,
    playSfx,
  ]);

  // Cutscene Runner
  useEffect(() => {
    if (
      !activeCutscene ||
      activeDialogueId !== null ||
      activeDocumentId !== null ||
      activeShopId !== null ||
      activeContainerId !== null
    )
      return;

    let isCancelled = false;

    const runAction = async () => {
      const action = activeCutscene.actions[cutsceneActionIndex];
      if (!action) {
        setActiveCutscene(null);
        setCutsceneActionIndex(0);
        // A finished cutscene always hands the camera back to the player.
        setCameraFocusOverride(null);
        return;
      }

      const finishAction = () => {
        if (!isCancelled) setCutsceneActionIndex((prev) => prev + 1);
      };

      if (action.type === "wait") {
        setTimeout(finishAction, action.duration || 1000);
      } else if (action.type === "show_dialogue") {
        setScreenFade((current) => ({
          ...current,
          opacity: 0,
          duration: Math.min(current.duration, 250),
        }));
        const dialogue = useEngineStore
          .getState()
          .gamePackage.dialogue.find((d) => d.id === action.dialogue_id);
        const startNodeId = action.node_id || dialogue?.nodes[0]?.id || "start";
        usePlayStore
          .getState()
          .startDialogue(action.dialogue_id, startNodeId);
        playSfx("dialogue_open", { volume: action.volume ?? 0.34, cooldownMs: 120 });
        finishAction();
      } else if (action.type === "set_switch") {
        usePlayStore
          .getState()
          .setFlag(action.switch_id, action.switch_value ?? true);
        finishAction();
      } else if (action.type === "move_player") {
        usePlayStore
          .getState()
          .updatePlayer(
            action.cell,
            action.facing ||
              usePlayStore.getState().saveData?.player.facing || [0, 1],
          );
        finishAction();
      } else if (action.type === "move_entity") {
        if (action.entity_id && action.cell && activeMap) {
          const entityIndex = activeMap.entity_placements.findIndex(
            (placement) => placement.entity_id === action.entity_id,
          );
          if (entityIndex >= 0) {
            usePlayStore
              .getState()
              .updateEntityState(
                entityStateKey(activeMap.id, action.entity_id, entityIndex),
                {
                  cell: action.cell,
                  facing: action.facing,
                },
              );
          }
        }
        finishAction();
      } else if (action.type === "teleport_player") {
        playSfx("door_transition", {
          volume: action.volume ?? 0.42,
          cooldownMs: 140,
        });
        if (
          action.map_id &&
          action.map_id !== usePlayStore.getState().saveData?.current_map_id
        ) {
          usePlayStore
            .getState()
            .loadMap(
              action.map_id,
              action.cell || [0, 0],
              action.facing || [0, -1],
            );
        } else {
          usePlayStore
            .getState()
            .updatePlayer(action.cell || [0, 0], action.facing || [0, -1]);
        }
        finishAction();
      } else if (action.type === "give_item") {
        if (action.item_id) {
          usePlayStore.getState().giveItem(action.item_id, action.amount || 1);
          playSfx("item_pickup", {
            volume: action.volume ?? 0.4,
            cooldownMs: 120,
          });
          const item = useEngineStore
            .getState()
            .gamePackage.items.find((i) => i.id === action.item_id);
          if (item)
            usePlayStore
              .getState()
              .addLog(`Obtained ${action.amount || 1}x ${item.display_name}.`);
        }
        finishAction();
      } else if (action.type === "remove_item") {
        if (action.item_id) {
          usePlayStore
            .getState()
            .removeItem(action.item_id, action.amount || 1);
          playSfx("ui_back", { volume: 0.18, cooldownMs: 120 });
        }
        finishAction();
      } else if (action.type === "set_player_sprite") {
        usePlayStore.getState().setPlayerSprite(action.sprite_id);
        finishAction();
      } else if (action.type === "read_document") {
        if (action.document_id) {
          usePlayStore.getState().markDocumentRead(action.document_id);
          setActiveDocumentId(action.document_id);
          playSfx("document_open", {
            volume: action.volume ?? 0.34,
            cooldownMs: 120,
          });
        }
        finishAction();
      } else if (action.type === "heal_player") {
        usePlayStore.getState().updatePlayerHp(action.amount || 20);
        playSfx("heal", { volume: action.volume ?? 0.42, cooldownMs: 120 });
        finishAction();
      } else if (action.type === "give_currency") {
        usePlayStore.getState().updateMoney(action.amount || 1);
        playSfx("coin", { volume: action.volume ?? 0.35, cooldownMs: 100 });
        finishAction();
      } else if (action.type === "remove_currency") {
        usePlayStore.getState().updateMoney(-(action.amount || 1));
        playSfx("coin", { volume: action.volume ?? 0.3, cooldownMs: 100 });
        finishAction();
      } else if (action.type === "add_party_member") {
        if (action.entity_id) {
          const currentParty =
            usePlayStore.getState().saveData?.party_members || [];
          const alreadyInParty = currentParty.includes(action.entity_id);
          usePlayStore.getState().addPartyMember(action.entity_id);
          const entity = useEngineStore
            .getState()
            .gamePackage.entities.find((e) => e.id === action.entity_id);
          playSfx("ui_click", { volume: 0.2, cooldownMs: 120 });
          if (entity && !alreadyInParty)
            usePlayStore.getState().addLog(`${entity.display_name} joined the party.`);
        }
        finishAction();
      } else if (action.type === "remove_party_member") {
        if (action.entity_id) {
          usePlayStore.getState().removePartyMember(action.entity_id);
          playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
          const entity = useEngineStore
            .getState()
            .gamePackage.entities.find((e) => e.id === action.entity_id);
          if (entity) usePlayStore.getState().addLog(`${entity.display_name} left the party.`);
        }
        finishAction();
      } else if (action.type === "open_shop") {
        if (action.shop_id) {
          usePlayStore.getState().openShop(action.shop_id);
          playSfx("shop_open", {
            volume: action.volume ?? 0.34,
            cooldownMs: 120,
          });
        }
        finishAction();
      } else if (action.type === "label") {
        // No-op jump target.
        finishAction();
      } else if (action.type === "branch") {
        const save = usePlayStore.getState().saveData;
        const shouldJump = evaluateCondition(
          action.condition,
          buildConditionContext(save),
        );
        if (shouldJump && action.target_label) {
          const labelIndex = activeCutscene.actions.findIndex(
            (a: any) => a.type === "label" && a.label === action.target_label,
          );
          if (labelIndex >= 0 && cutsceneJumpsRef.current < MAX_CUTSCENE_JUMPS) {
            cutsceneJumpsRef.current += 1;
            if (!isCancelled) setCutsceneActionIndex(labelIndex);
            return;
          }
          if (labelIndex < 0) {
            console.warn(
              `Cutscene branch: label "${action.target_label}" not found.`,
            );
          } else {
            console.warn("Cutscene branch: jump limit reached; continuing.");
          }
        }
        finishAction();
      } else if (action.type === "play_music") {
        const settings = useEngineStore.getState().gamePackage.settings || {};
        const url =
          action.music_url ||
          (action.music_id
            ? (settings.music_tracks || {})[action.music_id]
            : undefined);
        if (url) {
          playMusic(url, { volume: action.volume });
        } else {
          stopMusic();
        }
        finishAction();
      } else if (action.type === "play_sound") {
        const settings = useEngineStore.getState().gamePackage.settings || {};
        const soundUrl =
          action.sound_id
            ? (settings.sound_effects || {})[action.sound_id] || action.sound_id
            : action.music_url;
        playSfx(soundUrl, {
          volume: action.volume,
          cooldownMs: 30,
        });
        finishAction();
      } else if (action.type === "screen_fade") {
        const duration = action.duration ?? 600;
        setScreenFade({
          color: action.color || "#000000",
          opacity: action.fade === "in" ? 0 : 1,
          duration,
        });
        setTimeout(finishAction, duration);
      } else if (action.type === "camera_pan") {
        setCameraFocusOverride(action.cell ? [action.cell[0], action.cell[1]] : null);
        setTimeout(finishAction, action.duration ?? 800);
      } else if (action.type === "adjust_faction_rep") {
        if (action.faction_id) {
          usePlayStore
            .getState()
            .adjustFactionRep(action.faction_id, action.amount ?? 0);
        }
        finishAction();
      } else if (action.type === "open_save_menu") {
        clearInputState();
        setShowSaveMenu(true);
        playSfx("save_candle", {
          volume: action.volume ?? 0.34,
          cooldownMs: 120,
        });
        finishAction();
      } else if (action.type === "advance_clock") {
        usePlayStore.getState().advanceClock(action.amount ?? 60);
        finishAction();
      } else if (action.type === "modify_player_stats") {
        if (action.stats) {
          usePlayStore.getState().modifyPlayerStats(action.stats);
        }
        finishAction();
      } else if (action.type === "learn_skill") {
        if (action.skill_id) {
          usePlayStore.getState().learnSkill(action.skill_id);
          playSfx("level_up", {
            volume: action.volume ?? 0.42,
            cooldownMs: 180,
          });
          const skill = useEngineStore
            .getState()
            .gamePackage.abilities.find((s) => s.id === action.skill_id);
          if (skill) {
            usePlayStore.getState().addLog(`Learned ${skill.display_name}.`);
          }
        }
        finishAction();
      } else if (action.type === "set_entity_hidden") {
        if (action.entity_id && activeMap) {
          const entityIndex = activeMap.entity_placements.findIndex(
            (placement) => placement.entity_id === action.entity_id,
          );
          if (entityIndex >= 0) {
            usePlayStore
              .getState()
              .updateEntityState(
                entityStateKey(activeMap.id, action.entity_id, entityIndex),
                { hidden: action.hidden ?? true },
              );
          }
        }
        finishAction();
      } else if (action.type === "game_end") {
        onGameEndRef.current?.();
        finishAction();
      } else {
        finishAction();
      }
    };

    runAction();

    return () => {
      isCancelled = true;
    };
  }, [
    activeCutscene,
    activeMap,
    cutsceneActionIndex,
    activeDialogueId,
    activeDocumentId,
    activeShopId,
    activeContainerId,
    playSfx,
  ]);

  useEffect(() => {
    let animId: number;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);

      if (inputBlockedRef.current) {
        resetRepeatInputState();
        return;
      }
      if (isCombatInputGateActive(time)) {
        resetRepeatInputState();
        return;
      }
      const currentSave = usePlayStore.getState().saveData;
      if (
        currentSave?.playerStats.hp !== undefined &&
        currentSave.playerStats.hp <= 0
      ) {
        resetRepeatInputState();
        return;
      }

      let ax = 0;
      let az = 0;
      let wait = false;
      const keys = keysDownRef.current;

      if (keys.has("arrowup") || keys.has("w")) az -= 1;
      if (keys.has("arrowdown") || keys.has("s")) az += 1;
      if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
      if (keys.has("arrowright") || keys.has("d")) ax += 1;
      if (keys.has("z") || keys.has(".")) wait = true;

      const isPressing = ax !== 0 || az !== 0 || wait;

      if (isPressing) {
        const [rx, rz] = getCameraRelativeGridMove(
          ax,
          az,
          cameraAzimuthRef.current,
        );
        const latestCell = currentSave?.player.cell;
        const canIssueMovement =
          wait ||
          (rx === 0 && rz === 0) ||
          !latestCell ||
          isRenderedPlayerReadyForStep(latestCell);

        if (!canIssueMovement) return;

        const state = repeatStateRef.current;
        
        // Input buffer for diagonal targeting (80ms)
        if (!state.active) {
          if (!state.bufferStart) {
            state.bufferStart = time;
            return;
          } else if (time - state.bufferStart < 80) {
            return;
          }
        }

        if (!state.active || state.dx !== rx || state.dz !== rz) {
          state.active = true;
          state.dx = rx;
          state.dz = rz;
          state.startTime = time;
          state.lastTick = time;
          if (wait) {
            if (waitRef.current) waitRef.current();
          } else {
            if (handleMoveRef.current && (rx !== 0 || rz !== 0))
              handleMoveRef.current(rx, rz);
          }
        } else {
          // Hold-to-move never repeats in combat (one deliberate step per
          // turn) or with a hostile in melee range.
          const isEnemy =
            usePlayStore.getState().saveData?.in_combat ||
            (isEnemyNearbyRef.current ? isEnemyNearbyRef.current() : false);
          if (!isEnemy) {
            const holdDuration = time - state.startTime;
            if (holdDuration > MOVEMENT_REPEAT_START_MS) {
              const tickDiff = time - state.lastTick;
              if (tickDiff >= MOVEMENT_REPEAT_INTERVAL_MS) {
                state.lastTick = time;
                if (wait) {
                  if (waitRef.current) waitRef.current();
                } else {
                  if (handleMoveRef.current && (rx !== 0 || rz !== 0))
                    handleMoveRef.current(rx, rz);
                }
              }
            }
          }
        }
      } else {
        resetRepeatInputState();
      }
    };

    animId = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        if (e.target === document.body) e.preventDefault();
      }
      const key = e.key.toLowerCase();

      if (levelUpOpenRef.current) {
        e.preventDefault();
        return;
      }

      if (isCombatCommandKey(key) && isCombatInputGateActive()) {
        if (isMovementCommandKey(key)) {
          combatInputHeldKeysRef.current.add(key);
          combatInputNeedsReleaseRef.current = true;
          keysDownRef.current.delete(key);
        }
        resetRepeatInputState();
        e.preventDefault();
        return;
      }

      if (key === "q" || key === "e") {
        if (e.target === document.body) e.preventDefault();
      } else {
        keysDownRef.current.add(key);
      }

      // single press actions
      if (!e.repeat) {
        // Targeting mode: Esc backs out without spending the turn.
        if (key === "escape" && targetingSkillIdRef.current) {
          setTargetingSkillId(null);
          setHoveredCell(null);
          return;
        }
        // Skill hotkeys 1-6 mirror the on-screen tactics bar — whoever is
        // being commanded right now (player or party member).
        if (/^[1-6]$/.test(key) && !inputBlockedRef.current) {
          const save = usePlayStore.getState().saveData;
          const gp = useEngineStore.getState().gamePackage;
          const actor = getControlledActor(save, gp);
          const known = actor
            ? gp.abilities.filter((a) => actor.skills.includes(a.id))
            : [];
          const skill = known[parseInt(key, 10) - 1];
          if (skill) beginTargetingRef.current?.(skill.id);
          return;
        }
        switch (key) {
          case " ":
          case "enter":
            if (!inputBlockedRef.current) handleActRef.current?.();
            break;
          case "i":
            setShowInventory((prev) => !prev);
            break;
          case "q":
            setCameraQuarterTurns((turns) => turns + 1);
            resetRepeatInputState();
            break;
          case "e":
            setCameraQuarterTurns((turns) => turns - 1);
            resetRepeatInputState();
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysDownRef.current.delete(key);
      if (isMovementCommandKey(key)) {
        combatInputHeldKeysRef.current.delete(key);
        releaseCombatInputGateIfReady();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isCombatInputGateActive,
    releaseCombatInputGateIfReady,
    resetRepeatInputState,
  ]);

  const didInitialMapLoadRef = useRef(false);

  useEffect(() => {
    // Resolve which map to play. Mid-session the save's current_map_id wins so
    // teleport_player and map exits can change maps without wiping the run.
    // On first entry an explicit editor selection wins, then a resumable save,
    // then the package's declared start map, then its first map, then the
    // built-in test map.
    const storeMapId = useEngineStore.getState().selectedMapId;
    const findMap = (id?: string | null) =>
      id ? gamePackage.maps.find((m) => m.id === id) || null : null;

    const versionOk =
      saveData?.package_version === gamePackage.metadata.version;
    const saveMap = versionOk ? findMap(saveData?.current_map_id) : null;
    const selectedMap = findMap(storeMapId);

    let mapToLoad = didInitialMapLoadRef.current
      ? saveMap || selectedMap
      : selectedMap || saveMap;
    if (!mapToLoad) {
      mapToLoad = findMap(gamePackage.metadata.start_map_id);
    }
    if (!mapToLoad) {
      mapToLoad = gamePackage.maps.length > 0 ? gamePackage.maps[0] : null;
    }
    if (!mapToLoad) {
      mapToLoad = createTestMap();
    }
    didInitialMapLoadRef.current = true;
    setActiveMap(mapToLoad);

    // Initialize save if missing, map mismatch, or package changed enough to
    // invalidate old story-event flags.
    if (!saveData || saveData.current_map_id !== mapToLoad.id || !versionOk) {
      // The package may name a specific spawn (the story start); otherwise
      // the map's first spawn is the door in.
      const declaredSpawn =
        mapToLoad.id === gamePackage.metadata.start_map_id
          ? mapToLoad.spawns.find(
              (s) => s.id === gamePackage.metadata.start_spawn_id,
            )
          : undefined;
      const spawn =
        declaredSpawn ||
        (mapToLoad.spawns.length > 0
          ? mapToLoad.spawns[0]
          : {
              cell: [0, 0] as [number, number],
              facing: [0, -1] as [number, number],
            });
      initSave(
        mapToLoad.id,
        spawn.cell as [number, number],
        spawn.facing as [number, number],
        gamePackage.metadata.version,
        gamePackage.settings?.player_stats,
        ((gamePackage.settings?.clock_start_hour as number) ?? 8) * 60,
      );
    }
  }, [
    gamePackage.maps,
    gamePackage.metadata.version,
    saveData?.current_map_id,
  ]);

  useEffect(() => {
    if (!activeMap) return;
    // A story cutscene may be mid-flight across the map change (the
    // trapdoor descent teleports, then keeps narrating). Ambient on_load
    // triggers must never clobber it.
    if (activeCutscene) return;
    const loadTriggers =
      activeMap.triggers?.filter((t) => t.type === "on_load") || [];
    for (const trigger of loadTriggers) {
      const save = usePlayStore.getState().saveData;
      const flags = save?.flags || {};
      const conditionsMet = isTriggerEligible(trigger, save);
      const runFlag = `trig_run_${trigger.id}`;
      if (conditionsMet && !(trigger.once && flags[runFlag])) {
        if (trigger.once) usePlayStore.getState().setFlag(runFlag, true);
        const cutscene = useEngineStore
          .getState()
          .gamePackage.cutscenes.find((c) => c.id === trigger.cutscene_id);
        if (cutscene) {
          setActiveCutscene(cutscene);
          break; // Only run one cutscene at a time
        }
      }
    }
  }, [activeMap?.id]);

  useEffect(() => {
    if (!saveData) return;

    const flags = saveData.flags || {};
    const introHasRun =
      !!flags.aldric_joined ||
      !!flags.opening_ceremony_complete ||
      !!flags.trig_run_trg_intro;
    const party = saveData.party_members || [];

    if (introHasRun && !party.includes("ent_aldric")) {
      const store = usePlayStore.getState();
      store.addPartyMember("ent_aldric");
      store.setFlag("aldric_joined", true);
      store.addLog("Aldric falls in beside you.");
    }
  }, [saveData]);

  // After the world has settled for the turn, see whether two NPCs ended up
  // standing together with the player in earshot, and play an overheard
  // exchange if one matches the current state of the investigation. Reads the
  // already-committed save so the NPC positions are final for this turn.
  const maybeFireBarks = () => {
    if (inputBlockedRef.current) return;
    const sData = usePlayStore.getState().saveData;
    const gp = useEngineStore.getState().gamePackage;
    const map = activeMapRef.current;
    if (!sData || !map || sData.in_combat) return;
    const barks = gp.barks;
    if (!barks || barks.length === 0) return;

    const nowReal = performance.now();
    if (nowReal - lastBarkRealRef.current < BARK_MIN_REAL_INTERVAL_MS) return;

    const clockMin = sData.clock_minutes ?? 0;
    const playerCell = sData.player.cell;
    const states = sData.entity_states || {};
    const partyMembers = sData.party_members || [];

    // Live, audible NPCs on this map with their final cell for the turn.
    const npcs = (map.entity_placements || [])
      .map((placement, index) => {
        const def = gp.entities.find((e) => e.id === placement.entity_id);
        const key = entityStateKey(map.id, placement.entity_id, index);
        const st = states[key] || {};
        return {
          id: placement.entity_id,
          def,
          cell: (st.cell || placement.cell) as [number, number],
          out: !!st.dead || !!st.hidden,
        };
      })
      .filter(
        (n) =>
          n.def &&
          n.def.is_npc &&
          !n.out &&
          !partyMembers.includes(n.id),
      );
    if (npcs.length < 2) return;

    const ctx = buildConditionContext(sData);

    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        const a = npcs[i];
        const b = npcs[j];
        const pairDist =
          Math.abs(a.cell[0] - b.cell[0]) + Math.abs(a.cell[1] - b.cell[1]);
        if (pairDist > BARK_TALK_RADIUS) continue;
        const earshot = Math.min(
          Math.abs(playerCell[0] - a.cell[0]) +
            Math.abs(playerCell[1] - a.cell[1]),
          Math.abs(playerCell[0] - b.cell[0]) +
            Math.abs(playerCell[1] - b.cell[1]),
        );
        if (earshot > BARK_EARSHOT) continue;

        const bark = barks.find((bk) => {
          const [s0, s1] = bk.speakers;
          const matchesPair =
            (s0 === a.id && s1 === b.id) || (s0 === b.id && s1 === a.id);
          if (!matchesPair) return false;
          if (!evaluateCondition(bk.condition, ctx)) return false;
          const last = barkCooldownRef.current.get(bk.id);
          const cd = bk.cooldown_minutes ?? BARK_DEFAULT_COOLDOWN_MIN;
          if (last !== undefined && clockMin - last < cd) return false;
          return true;
        });
        if (!bark) continue;

        barkCooldownRef.current.set(bark.id, clockMin);
        lastBarkRealRef.current = nowReal;
        const cellOf = (entityId: string) =>
          entityId === a.id ? a.cell : b.cell;
        useFxStore.getState().enqueueBark(
          bark.lines.map((line) => ({
            cell: cellOf(line.speaker),
            text: line.text,
            speaker:
              gp.entities.find((e) => e.id === line.speaker)?.display_name ||
              "",
          })),
        );
        return;
      }
    }
  };

  const pumpEngine = () => {
    usePlayStore.setState((state) => {
      const sData = state.saveData;
      const gp = useEngineStore.getState().gamePackage;
      if (!activeMap || !sData) return state;
      // In combat the explicit turn queue owns all actor scheduling — the
      // energy pump (and the world clock with it) holds its breath.
      if (sData.in_combat) return state;

      let playerHp = sData.playerStats.hp;
      let playerEnergy = sData.playerStats.energy || 0;
      const playerSpeed = Math.max(1, sData.playerStats.speed || 10);
      let playerCell = [...sData.player.cell];

      const messages: string[] = [];
      let nextEntities = { ...(sData.entity_states || {}) };

      const mapEntities =
        activeMap.entity_placements
          ?.map((p, index) => ({ p, index }))
          // Party members don't simulate — they follow the player and act
          // only on their combat turns.
          ?.filter(({ p }) => !(sData.party_members || []).includes(p.entity_id))
          ?.map(({ p, index }) => {
            const def = gp.entities.find((e) => e.id === p.entity_id);
            // Use instance key
            const key = entityStateKey(activeMap.id, p.entity_id, index);
            const saved = nextEntities[key] || {};
            return {
              key,
              def,
              placement: p,
              cell: saved.cell || p.cell,
              hp: saved.hp ?? def?.max_hp ?? 10,
              energy: saved.energy ?? 0,
              isDead: !!saved.dead || !!saved.hidden,
                    };
                  })
                  .filter((n) => {
                    if (!n.def || n.isDead) return false;
                    const dist =
                      Math.abs(playerCell[0] - n.cell[0]) +
                      Math.abs(playerCell[1] - n.cell[1]);
                    const hasSchedule = (n.placement.schedule?.length || 0) > 0;
                    return n.def.is_npc
                      ? hasSchedule || dist <= NPC_SIMULATION_RADIUS
                      : dist <= CHASE_RADIUS + 4;
                  }) || [];

      let walkableMapCache: Set<string> | null = null;
      const getTurnWalkableMap = () => {
        if (walkableMapCache) return walkableMapCache;
        walkableMapCache = baseWalkableCells;
        return walkableMapCache;
      };

      // One BFS step from (sx, sz) toward the first cell satisfying isGoal,
      // moving only through walkable, unoccupied cells. Returns the first
      // step of the path, or null when unreachable within maxPathLength.
      const findNextStep = (
        sx: number,
        sz: number,
        isGoal: (x: number, z: number) => boolean,
        walkableMap: Set<string>,
        occupiedMap: Set<string>,
        maxPathLength: number,
      ): [number, number] | null => {
        const moves: [number, number][] = [
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ];
        const queue: {
          x: number;
          z: number;
          firstStep: [number, number] | null;
          depth: number;
        }[] = [
          { x: sx, z: sz, firstStep: null, depth: 0 },
        ];
        const visited = new Set([pathCellKey(sx, sz)]);
        const maxExpansions = Math.max(300, maxPathLength * maxPathLength);
        let expansions = 0;
        let head = 0;

        while (head < queue.length && expansions++ < maxExpansions) {
          const current = queue[head++]!;
          if (isGoal(current.x, current.z)) {
            return current.firstStep;
          }
          if (current.depth >= maxPathLength) continue;

          for (const [mx, mz] of moves) {
            const nx = current.x + mx;
            const nz = current.z + mz;
            const cellKey = pathCellKey(nx, nz);
            if (visited.has(cellKey)) continue;
            visited.add(cellKey);
            if (walkableMap.has(cellKey) && !occupiedMap.has(cellKey)) {
              queue.push({
                x: nx,
                z: nz,
                firstStep: current.firstStep || [nx, nz],
                depth: current.depth + 1,
              });
            }
          }
        }
        return null;
      };

      const minutesPerTick = clockMinutesPerTick(gp.settings);
      const clockStart = sData.clock_minutes ?? 0;
      let elapsedTicks = 0;
      const currentHour = Math.floor(clockStart / 60) % 24;

      let iterations = 0;
      // Pump until the player has 1000 energy or dead
      while (iterations++ < 1000) {
        if (playerHp <= 0) break;

        // Find NPC ready to act
        const readyNpc = mapEntities.find((n) => n.energy >= 1000 && !n.isDead);

        if (playerEnergy >= 1000 && !readyNpc) break;

        if (readyNpc) {
          readyNpc.energy -= 1000;
          if (!readyNpc.def!.is_npc) {
            const dist =
              Math.abs(playerCell[0] - readyNpc.cell[0]) +
              Math.abs(playerCell[1] - readyNpc.cell[1]);
            if (dist === 1) {
              const dmg = Math.max(
                1,
                readyNpc.def!.attack - sData.playerStats.defense,
              );
              playerHp -= dmg;
              messages.push(
                `${readyNpc.def!.display_name} hits you for ${dmg}!`,
              );
              const fx = useFxStore.getState();
              fx.addPopup(
                [playerCell[0], playerCell[1]],
                `${dmg}`,
                "#f87171",
              );
              fx.markPlayerHurt();
              if (playerHp <= 0) {
                messages.push("You have died.");
                break;
              }
            } else if (dist <= CHASE_RADIUS) {
              const walkableMap = getTurnWalkableMap();
              const occupiedMap = new Set(
                mapEntities
                          .filter((n) => !n.isDead)
                          .map((n) => pathCellKey(n.cell[0], n.cell[1])),
                      );

              const nextStep = findNextStep(
                readyNpc.cell[0],
                readyNpc.cell[1],
                (x, z) =>
                  Math.abs(x - playerCell[0]) + Math.abs(z - playerCell[1]) ===
                  1,
                walkableMap,
                occupiedMap,
                9,
              );

              if (nextStep) {
                readyNpc.cell = [nextStep[0], nextStep[1]];
              } else {
                // Fallback to simple greedy move if path blocked
                const dx = playerCell[0] - readyNpc.cell[0];
                const dz = playerCell[1] - readyNpc.cell[1];
                const mx =
                  Math.abs(dx) > Math.abs(dz)
                    ? Math.sign(dx)
                    : dx !== 0
                      ? Math.sign(dx)
                      : 0;
                const mz =
                  Math.abs(dz) > Math.abs(dx)
                    ? Math.sign(dz)
                    : dz !== 0
                      ? Math.sign(dz)
                      : 0;
                let nx = readyNpc.cell[0] + mx;
                let nz = readyNpc.cell[1] + mz;

                if (mx !== 0 && mz !== 0) {
                  nz = readyNpc.cell[1];
                }

                if (
                          walkableMap.has(pathCellKey(nx, nz)) &&
                          !occupiedMap.has(pathCellKey(nx, nz)) &&
                          !(playerCell[0] === nx && playerCell[1] === nz)
                        ) {
                  readyNpc.cell = [nx, nz];
                }
              }
            }
          } else {
            // Friendly NPCs follow their placement schedule: walk one step
            // toward wherever this hour says they should be.
            const target = getActiveScheduleEntry(
              readyNpc.placement.schedule,
              currentHour,
            );
            if (
              target &&
              (readyNpc.cell[0] !== target.cell[0] ||
                readyNpc.cell[1] !== target.cell[1])
            ) {
              const walkableMap = getTurnWalkableMap();
              const occupiedMap = new Set(
                mapEntities
                          .filter((n) => !n.isDead && n !== readyNpc)
                          .map((n) => pathCellKey(n.cell[0], n.cell[1])),
                      );
                      occupiedMap.add(pathCellKey(playerCell[0], playerCell[1]));

              const nextStep = findNextStep(
                readyNpc.cell[0],
                readyNpc.cell[1],
                (x, z) => x === target.cell[0] && z === target.cell[1],
                walkableMap,
                occupiedMap,
                                NPC_SCHEDULE_PATH_LIMIT,
                      );
              if (nextStep) {
                readyNpc.cell = [nextStep[0], nextStep[1]];
              }
            }
          }
          nextEntities[readyNpc.key] = {
            cell: readyNpc.cell,
            energy: readyNpc.energy,
            hp: readyNpc.hp,
            dead: readyNpc.isDead,
          };
                } else {
                  const waits = [Math.ceil((1000 - playerEnergy) / playerSpeed)];
                  mapEntities.forEach((n) => {
                    if (n.isDead || n.energy >= 1000) return;
                    waits.push(Math.ceil((1000 - n.energy) / Math.max(1, n.def!.speed || 10)));
                  });
                  const ticks = Math.max(1, Math.min(...waits.filter((wait) => wait > 0)));

                  elapsedTicks += ticks;
                  playerEnergy += playerSpeed * ticks;
                  mapEntities.forEach((n) => {
                    n.energy += Math.max(1, n.def!.speed || 10) * ticks;
                    nextEntities[n.key] = {
                      cell: n.cell,
                      hp: n.hp,
                      energy: n.energy,
                      dead: n.isDead,
                    };
                  });
                }
      }

      return {
        saveData: {
          ...sData,
          playerStats: {
            ...sData.playerStats,
            hp: playerHp,
            energy: playerEnergy,
          },
          entity_states: nextEntities,
          clock_minutes: clockStart + elapsedTicks * minutesPerTick,
        },
        logMessages:
          messages.length > 0
            ? [...state.logMessages, ...messages].slice(-20)
            : state.logMessages,
      };
    });
    // World has settled for this turn — check for an overheard exchange.
    maybeFireBarks();
  };

  useEffect(() => {
    // Automatically pump engine if player energy drops below 1000.
    // The pump is suspended while the combat queue is running.
    if (
      saveData &&
      !saveData.in_combat &&
      (saveData.playerStats.energy || 0) < 1000 &&
      (saveData.playerStats.hp || 0) > 0
    ) {
      pumpEngine();
    }
  }, [saveData?.playerStats.energy, saveData?.playerStats.hp, activeMap, saveData?.in_combat]);

  const performWait = useCallback(() => {
    const save = usePlayStore.getState().saveData;
    if (!save) return;
    if (getPendingLevelUps(save) > 0) return;
    // In combat, Wait passes the controlled actor's turn — a real tactical
    // choice (let the enemy come to you), not a rest.
    if (save.in_combat) {
      const gp = useEngineStore.getState().gamePackage;
      const actor = getControlledActor(save, gp);
      if (!actor) return;
      playSfx("ui_click", { volume: 0.18, cooldownMs: 120 });
      usePlayStore
        .getState()
        .addLog(actor.isPlayer ? "You hold your ground." : `${actor.name} holds.`);
      usePlayStore.getState().advanceTurn();
      return;
    }
    const energy = save.playerStats.energy || 0;
    if (energy >= 1000) {
      usePlayStore.getState().updatePlayerStats({ energy: energy - 1000 });
      usePlayStore.getState().updatePlayerHp(1);
      usePlayStore.getState().updatePlayerMp(1);
      playSfx("heal", { volume: 0.36, cooldownMs: 180 });
      usePlayStore
        .getState()
        .addLog("You wait a turn. Restored 1 HP and 1 MP.");
    }
  }, [playSfx]);

  useEffect(() => {
    waitRef.current = performWait;
  }, [performWait]);

  const handlePartyTalk = useCallback(() => {
    const currentSave = usePlayStore.getState().saveData;
    if (
      !currentSave ||
      activeDialogueId ||
      activeShopId ||
      activeDocumentId ||
      activeContainerId
    )
      return;

    const partyMemberId = currentSave.party_members?.[0];
    if (!partyMemberId) return;

    const partyMember = gamePackage.entities.find((e) => e.id === partyMemberId);
    const partyDialogueId =
      partyMember?.party_dialogue_id || partyMember?.dialogue_id;
    const dialogue = gamePackage.dialogue.find((d) => d.id === partyDialogueId);

    if (dialogue?.nodes.length) {
      clearInputState();
      usePlayStore.getState().startDialogue(dialogue.id, dialogue.nodes[0].id);
      playSfx("dialogue_open", { volume: 0.32, cooldownMs: 120 });
      addLog(`Spoke with ${partyMember?.display_name || "party member"}.`);
    }
  }, [
    activeDialogueId,
    activeShopId,
    activeDocumentId,
    activeContainerId,
    gamePackage.entities,
    gamePackage.dialogue,
    addLog,
    playSfx,
  ]);

  // One melee strike from the controlled actor against a hostile, with crit
  // rolls, floating damage text, and hit flashes. Outside combat, party
  // members adjacent to the target pile on; inside combat they fight on
  // their own turns instead. Used by bump attacks and Act on a faced enemy.
  const executeMeleeAttack = useCallback(
    (
      attacker: { name: string; attack: number; isPlayer: boolean },
      targetKey: string,
      entityData: any,
      targetCell: [number, number],
    ) => {
      const currentSave = usePlayStore.getState().saveData;
      if (!currentSave) return;
      const fx = useFxStore.getState();
      const gp = useEngineStore.getState().gamePackage;

      const est = {
        ...((currentSave.entity_states || {})[targetKey] || {}),
      } as any;
      let hp = est.hp ?? entityData.max_hp;

      const { dmg, crit } = rollMeleeDamage(attacker.attack, entityData.defense);
      hp -= dmg;
      playSfx("melee_swing", { volume: 0.28, playbackRate: attacker.isPlayer ? 1 : 0.92, cooldownMs: 70 });
      playSfx(crit ? "melee_crit" : "melee_hit", {
        volume: crit ? 0.58 : 0.44,
        cooldownMs: 80,
      });
      fx.addPopup(
        targetCell,
        `${dmg}${crit ? "!" : ""}`,
        crit ? "#fbbf24" : attacker.isPlayer ? "#ffffff" : "#7dd3fc",
      );
      fx.flashEntity(targetKey);
      const verb = attacker.isPlayer ? "You hit" : `${attacker.name} hits`;
      addLog(
        crit
          ? `Critical! ${verb} ${entityData.display_name} for ${dmg}!`
          : `${verb} ${entityData.display_name} for ${dmg}.`,
      );

      // Outside combat, party members adjacent to the target join the attack.
      if (hp > 0 && !currentSave.in_combat) {
        for (const follower of latestPartyFollowersRef.current || []) {
          const fDef = gp.entities.find((e) => e.id === follower.entity_id);
          if (!fDef) continue;
          const d =
            Math.abs(follower.cell[0] - targetCell[0]) +
            Math.abs(follower.cell[1] - targetCell[1]);
          if (d !== 1) continue;
          const assist = rollMeleeDamage(fDef.attack, entityData.defense);
          hp -= assist.dmg;
          playSfx(assist.crit ? "melee_crit" : "melee_hit", {
            volume: assist.crit ? 0.52 : 0.36,
            cooldownMs: 80,
          });
          fx.addPopup(targetCell, `${assist.dmg}`, "#7dd3fc");
          fx.flashEntity(targetKey);
          addLog(`${fDef.display_name} follows up for ${assist.dmg}!`);
          if (hp <= 0) break;
        }
      }

      if (hp <= 0) {
        est.dead = true;
        hp = 0;
        fx.addPopup(targetCell, "✕", "#f87171");
        playSfx("enemy_defeat", { volume: 0.5, cooldownMs: 180 });
        addLog(`${entityData.display_name} is defeated!`);
        handleEnemyDefeatedExperience(entityData);
      }
      est.hp = hp;
      usePlayStore.getState().updateEntityState(targetKey, est);
    },
    [addLog, handleEnemyDefeatedExperience, playSfx],
  );

  const handleMove = useCallback(
    (dx: number, dz: number) => {
      const currentSave = usePlayStore.getState().saveData;
      if (!activeMap || !currentSave) return;
      if (currentSave.playerStats.hp <= 0) return;
      if (getPendingLevelUps(currentSave) > 0) return;
      
      // If targeting mode is active, directional bumps move the target cursor instead
      if (targetingSkillIdRef.current) {
        setHoveredCell((prev) => {
          const px = prev ? prev[0] : currentSave.player.cell[0];
          const pz = prev ? prev[1] : currentSave.player.cell[1];
          return [px + dx, pz + dz];
        });
        return;
      }

      const gp = useEngineStore.getState().gamePackage;
      const inCombat = !!currentSave.in_combat;
      const actor = getControlledActor(currentSave, gp);
      if (!actor) return; // an enemy is acting
      if (!inCombat && (currentSave.playerStats.energy || 0) < 1000) return;
      if (
        actor.isPlayer &&
        !isRenderedPlayerReadyForStep(currentSave.player.cell)
      )
        return;

      const actorCell = actor.cell;

      let turnConsumed = false;
      let turnEnergyConsumed = false;
      const newFacing = [dx, dz] as [number, number];
      const nx = actorCell[0] + dx;
      const nz = actorCell[1] + dz;

      const currentCell = getActiveCell(actorCell[0], actorCell[1]);
      const targetCell = getActiveCell(nx, nz);

      // Check collisions
      let blocked = false;
      if (
        !targetCell ||
        !targetCell.walkable ||
        (targetCell.visual_height || 0) - (currentCell?.visual_height || 0) > 1
      ) {
        blocked = true;
      }

      // Object Collisions
      if (targetCell?.object_id) {
        const cellObjDef = useEngineStore
          .getState()
          .gamePackage.object_library.find(
            (o) => o.id === targetCell.object_id,
          );
        if (cellObjDef && cellObjDef.collision?.profile !== "none")
          blocked = true;
      }
      if (isBlockedByPlacement(nx, nz)) blocked = true;

      // Containers occupy their tile.
      if (getContainerAtCell(nx, nz)) blocked = true;

      // In combat every combatant holds their cell: the player blocks party
      // members and vice versa.
      if (inCombat) {
        if (
          !actor.isPlayer &&
          currentSave.player.cell[0] === nx &&
          currentSave.player.cell[1] === nz
        )
          blocked = true;
        for (const pid of currentSave.party_members || []) {
          if (pid === actor.key) continue;
          const pEst = (currentSave.entity_states || {})[pid];
          if (
            pEst?.cell &&
            !pEst.dead &&
            pEst.cell[0] === nx &&
            pEst.cell[1] === nz
          )
            blocked = true;
        }
      }

      // Entity Collisions
      const entityIndex = activeMap.entity_placements?.findIndex((e, idx) => {
        if ((currentSave.party_members || []).includes(e.entity_id)) return false;
        const key = entityStateKey(activeMap.id, e.entity_id, idx);
        const est = (currentSave.entity_states || {})[key];
        const cx = est?.cell?.[0] ?? e.cell[0];
        const cz = est?.cell?.[1] ?? e.cell[1];
        return cx === nx && cz === nz && !est?.dead && !est?.hidden;
      });

      const entityPlacement =
        entityIndex !== undefined && entityIndex >= 0
          ? activeMap.entity_placements[entityIndex]
          : undefined;
      const entityKey = entityPlacement
        ? entityStateKey(activeMap.id, entityPlacement.entity_id, entityIndex)
        : "";

      // Turning in place / facing updates for whichever body we control.
      const faceActor = (facing: [number, number]) => {
        if (actor.isPlayer) {
          updatePlayer(currentSave.player.cell, facing);
        } else {
          const est = {
            ...((currentSave.entity_states || {})[actor.key] || {}),
          };
          est.facing = facing;
          usePlayStore.getState().updateEntityState(actor.key, est);
        }
      };

      if (entityPlacement) {
        const entityData = useEngineStore
          .getState()
          .gamePackage.entities.find((e) => e.id === entityPlacement.entity_id);
        if (entityData) {
          faceActor(newFacing);

          if (entityData.is_npc) {
            // Mid-combat there is no time for talk — the NPC just blocks.
            if (actor.isPlayer && !inCombat && entityData.dialogue_id) {
              const dialogue = useEngineStore
                .getState()
                .gamePackage.dialogue.find(
                  (d) => d.id === entityData.dialogue_id,
                );
              if (dialogue && dialogue.nodes.length > 0) {
                clearInputState();
                usePlayStore
                  .getState()
                  .startDialogue(dialogue.id, dialogue.nodes[0].id);
                playSfx("dialogue_open", { volume: 0.32, cooldownMs: 120 });
                addLog(`Started conversation with ${entityData.display_name}...`);
              }
            }
            turnConsumed = !inCombat;
          } else {
            // Bump attack — walking into a hostile strikes it instead.
            executeMeleeAttack(actor, entityKey, entityData, [nx, nz]);
            turnConsumed = true;
          }
        }
      }

      if (!entityPlacement) {
        if (blocked) {
          faceActor(newFacing);
          if (actor.isPlayer) {
            playSfx("bump", { volume: 0.24, cooldownMs: 90 });
          }
        } else {
          if (actor.isPlayer) {
            movePlayer([nx, nz], newFacing, inCombat ? 0 : -1000);
            playSfx("footstep_stone", { volume: 0.24, cooldownMs: 75 });
            turnEnergyConsumed = !inCombat;
          } else {
            const est = {
              ...((currentSave.entity_states || {})[actor.key] || {}),
            };
            est.cell = [nx, nz];
            est.facing = newFacing;
            usePlayStore.getState().updateEntityState(actor.key, est);
          }
          turnConsumed = true;

          // Map exits: stepping onto an exit cell travels to another map.
          // Only the player can lead the party out — fleeing ends the fight.
          if (actor.isPlayer) {
            const exit = activeMap.exits?.find(
              (e) =>
                e.cell?.[0] === nx &&
                e.cell?.[1] === nz &&
                evaluateCondition(
                  e.condition,
                  buildConditionContext(currentSave),
                ),
            );
            if (exit) {
              const targetMap = gp.maps.find(
                (m) => m.id === exit.target_map_id,
              );
              if (targetMap) {
                if (inCombat) {
                  const xpResult = usePlayStore
                    .getState()
                    .endCombat(currentSave.party_members || []);
                  logExperienceGrant(xpResult);
                  addLog("You flee through the passage!");
                }
                playSfx("door_transition", { volume: 0.42, cooldownMs: 140 });
                const spawn =
                  (exit.target_spawn_id
                    ? targetMap.spawns.find(
                        (s) => s.id === exit.target_spawn_id,
                      )
                    : undefined) || targetMap.spawns[0];
                usePlayStore
                  .getState()
                  .loadMap(
                    targetMap.id,
                    (spawn?.cell as [number, number]) || [0, 0],
                    (exit.facing ||
                      spawn?.facing || [0, -1]) as [number, number],
                  );
                return;
              }
              usePlayStore
                .getState()
                .addLog(`The way is sealed. (Missing map: ${exit.target_map_id})`);
              playSfx("warning", { volume: 0.24, cooldownMs: 120 });
            }

            // Check step triggers (player only). Several triggers may share
            // a cell with mutually exclusive conditions — take the first
            // one that is actually eligible right now.
            const save = usePlayStore.getState().saveData;
            const flags = save?.flags || {};
            const trigger = activeMap.triggers?.find(
              (t) =>
                t.type === "step" &&
                t.cell?.[0] === nx &&
                t.cell?.[1] === nz &&
                isTriggerEligible(t, save) &&
                !(t.once && flags[`trig_run_${t.id}`]),
            );
            if (trigger) {
              if (trigger.once)
                usePlayStore.getState().setFlag(`trig_run_${trigger.id}`, true);
              const cutscene = useEngineStore
                .getState()
                .gamePackage.cutscenes.find(
                  (c) => c.id === trigger.cutscene_id,
                );
              if (cutscene) setActiveCutscene(cutscene);
            }
          }
        }
      }

      if (turnConsumed) {
        if (inCombat) {
          // The queue owns pacing: hand the turn to the next combatant.
          usePlayStore.getState().advanceTurn();
        } else if (!turnEnergyConsumed) {
          usePlayStore.getState().updatePlayerStats({
            energy: (currentSave.playerStats.energy || 0) - 1000,
          });
        }
      }
    },
    [
      activeMap,
      movePlayer,
      updatePlayer,
      executeMeleeAttack,
      getActiveCell,
      getContainerAtCell,
      isBlockedByPlacement,
      logExperienceGrant,
      playSfx,
    ],
  );

  useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  const handleAct = () => {
    if (!activeMap || !saveData) return;
    if (saveData.playerStats.hp <= 0) return;
    if (getPendingLevelUps(saveData) > 0) return;
    if (activeCutscene && activeCutscene.is_blocking) return;
    
    const gp = useEngineStore.getState().gamePackage;
    const inCombat = !!saveData.in_combat;
    const actor = getControlledActor(saveData, gp);
    if (!actor) return; // an enemy is acting
    if (!inCombat && (saveData.playerStats.energy || 0) < 1000) return;

    const actorCell = actor.cell;
    const actorFacing = actor.facing;

    let turnConsumed = false;
    const tx = actorCell[0] + actorFacing[0];
    const tz = actorCell[1] + actorFacing[1];

    // In combat, Act is a strike: hit the faced hostile or whiff harmlessly.
    // The world's levers (triggers, chests, ground items) wait for peace.
    if (inCombat) {
      const enemyIndex = activeMap.entity_placements?.findIndex((e, idx) => {
        if ((saveData.party_members || []).includes(e.entity_id)) return false;
        const key = entityStateKey(activeMap.id, e.entity_id, idx);
        const est = (saveData.entity_states || {})[key];
        const cx = est?.cell?.[0] ?? e.cell[0];
        const cz = est?.cell?.[1] ?? e.cell[1];
        return cx === tx && cz === tz && !est?.dead && !est?.hidden;
      });
      if (enemyIndex !== undefined && enemyIndex >= 0) {
        const placement = activeMap.entity_placements[enemyIndex];
        const def = gp.entities.find((e) => e.id === placement.entity_id);
        if (def && !def.is_npc) {
          executeMeleeAttack(
            actor,
            entityStateKey(activeMap.id, placement.entity_id, enemyIndex),
            def,
            [tx, tz],
          );
          usePlayStore.getState().advanceTurn();
          return;
        }
      }
      addLog(
        actor.isPlayer
          ? "You swing at nothing."
          : `${actor.name} finds nothing to strike.`,
      );
      playSfx("warning", { volume: 0.22, cooldownMs: 120 });
      return; // a whiff costs nothing — reposition instead
    }

    // Check interact triggers on target cell. Several triggers may share a
    // cell with mutually exclusive conditions (a sealed door and its open
    // counterpart) — take the first one eligible right now.
    {
      const flags = saveData?.flags || {};
      const trigger = activeMap.triggers?.find(
        (t) =>
          t.type === "interact" &&
          t.cell?.[0] === tx &&
          t.cell?.[1] === tz &&
          isTriggerEligible(t, saveData) &&
          !(t.once && flags[`trig_run_${t.id}`]),
      );
      if (trigger) {
        if (trigger.once)
          usePlayStore.getState().setFlag(`trig_run_${trigger.id}`, true);
        const cutscene = useEngineStore
          .getState()
          .gamePackage.cutscenes.find((c) => c.id === trigger.cutscene_id);
        if (cutscene) {
          setActiveCutscene(cutscene);
          return;
        }
      }
    }

    // Check for entity interaction first
    const entityIndex = activeMap.entity_placements?.findIndex((e, idx) => {
      if ((saveData.party_members || []).includes(e.entity_id)) return false;
      const key = entityStateKey(activeMap.id, e.entity_id, idx);
      const est = (saveData.entity_states || {})[key];
      const cx = est?.cell?.[0] ?? e.cell[0];
      const cz = est?.cell?.[1] ?? e.cell[1];
      return cx === tx && cz === tz && !est?.dead && !est?.hidden;
    });

    const entityPlacement =
      entityIndex !== undefined && entityIndex >= 0
        ? activeMap.entity_placements[entityIndex]
        : undefined;
    if (entityPlacement) {
      const entityData = useEngineStore
        .getState()
        .gamePackage.entities.find((e) => e.id === entityPlacement.entity_id);
      if (entityData && !entityData.is_npc) {
        // Act on a faced hostile = melee attack.
        const entityKey = entityStateKey(
          activeMap.id,
          entityPlacement.entity_id,
          entityIndex!,
        );
        executeMeleeAttack(actor, entityKey, entityData, [tx, tz]);
        usePlayStore.getState().updatePlayerStats({
          energy: (saveData.playerStats.energy || 0) - 1000,
        });
        return;
      }
      if (entityData && entityData.is_npc) {
        if (entityData.dialogue_id) {
          const dialogue = useEngineStore
            .getState()
            .gamePackage.dialogue.find((d) => d.id === entityData.dialogue_id);
          if (dialogue && dialogue.nodes.length > 0) {
            clearInputState();
            usePlayStore
              .getState()
              .startDialogue(dialogue.id, dialogue.nodes[0].id);
            playSfx("dialogue_open", { volume: 0.32, cooldownMs: 120 });
            addLog(`Started conversation with ${entityData.display_name}...`);
          } else {
            playSfx("warning", { volume: 0.22, cooldownMs: 120 });
            addLog(`${entityData.display_name} has nothing to say.`);
          }
        } else {
          playSfx("warning", { volume: 0.22, cooldownMs: 120 });
          addLog(`${entityData.display_name} ignores you.`);
        }
        turnConsumed = true;
      }
      // The interaction is resolved — don't fall through to the empty-cell
      // "Nothing happened" branch below.
      if (turnConsumed) {
        usePlayStore.getState().updatePlayerStats({
          energy: (saveData.playerStats.energy || 0) - 1000,
        });
        return;
      }
    }

    // Containers: unlock or open the one we're facing.
    const container = getContainerAtCell(tx, tz);
    if (container) {
      const containerState = getContainerRuntimeState(
        container,
        saveData,
        activeMap.id,
      );
      const containerName =
        container.display_name ||
        gamePackage.object_library.find((o) => o.id === container.object_id)
          ?.display_name ||
        "Container";

      if (containerState.locked) {
        const hasKey =
          container.key_item_id &&
          (saveData.inventory || []).some(
            (entry) => entry.id === container.key_item_id && entry.count > 0,
          );
        if (hasKey) {
          usePlayStore
            .getState()
            .updateContainerState(activeMap.id, container.id, {
              locked: false,
            });
          if (container.consume_key && container.key_item_id) {
            usePlayStore.getState().removeItem(container.key_item_id, 1);
          }
          const keyName =
            gamePackage.items.find((i) => i.id === container.key_item_id)
              ?.display_name || "the key";
          playSfx("ui_click", { volume: 0.24, cooldownMs: 120 });
          addLog(`Unlocked ${containerName} with ${keyName}.`);
          usePlayStore.getState().updatePlayerStats({
            energy: (saveData.playerStats.energy || 0) - 1000,
          });
        } else {
          playSfx("warning", { volume: 0.24, cooldownMs: 120 });
          addLog(`${containerName} is locked.`);
        }
        return;
      }

      clearInputState();
      usePlayStore
        .getState()
        .updateContainerState(activeMap.id, container.id, { opened: true });
      usePlayStore.getState().openContainer(container.id);
      playSfx("ui_click", { volume: 0.24, cooldownMs: 120 });
      addLog(`Opened ${containerName}.`);
      usePlayStore.getState().updatePlayerStats({
        energy: (saveData.playerStats.energy || 0) - 1000,
      });
      return;
    }

    // World items: pick up from the faced cell, or the one underfoot.
    const worldItems = getEffectiveWorldItems(
      activeMap,
      saveData.map_deltas?.[activeMap.id],
    );
    const worldItem =
      worldItems.find((w) => w.cell[0] === tx && w.cell[1] === tz) ||
      worldItems.find(
        (w) => w.cell[0] === actorCell[0] && w.cell[1] === actorCell[1],
      );
    if (worldItem) {
      const itemDef = gamePackage.items.find((i) => i.id === worldItem.item_id);
      usePlayStore.getState().giveItem(worldItem.item_id, worldItem.count);
      if (worldItem.dropped) {
        usePlayStore.getState().removeDroppedItem(activeMap.id, worldItem.id);
      } else {
        usePlayStore
          .getState()
          .takeAuthoredWorldItem(activeMap.id, worldItem.id);
      }
      addLog(
        `Picked up ${worldItem.count > 1 ? `${worldItem.count}x ` : ""}${itemDef?.display_name || worldItem.item_id}.`,
      );
      playSfx("item_pickup", { volume: 0.38, cooldownMs: 120 });
      usePlayStore.getState().updatePlayerStats({
        energy: (saveData.playerStats.energy || 0) - 1000,
      });
      return;
    }

    // Check object placements
    const placement = activeMap.custom_object_placements.find((p) => {
      const objDef = useEngineStore
        .getState()
        .gamePackage.object_library.find((o) => o.id === p.object_id);
      return placementOccupiesCell(p, objDef, tx, tz);
    });
    const placementObject = placement
      ? gp.object_library.find((o) => o.id === placement.object_id)
      : undefined;
    if (
      placement &&
      isLazareInterviewDoor(activeMap, placement) &&
      !lazareDoorReady
    ) {
      const doorKey = doorPlacementKey(placement);
      if (isDoorPlacementOpen(saveData.map_deltas?.[activeMap.id], placement)) {
        usePlayStore.getState().closeDoor(activeMap.id, doorKey);
      }
      const waitDialogue = gp.dialogue.find((d) => d.id === "dia_lazare_door_not_ready");
      if (waitDialogue && waitDialogue.nodes.length > 0) {
        clearInputState();
        usePlayStore
          .getState()
          .startDialogue(waitDialogue.id, waitDialogue.nodes[0].id);
        playSfx("dialogue_open", { volume: 0.26, cooldownMs: 120 });
      } else {
        playSfx("warning", { volume: 0.22, cooldownMs: 120 });
        addLog("The shuttered door stays closed. The testimony is not ready.");
      }
      usePlayStore.getState().updatePlayerStats({
        energy: (saveData.playerStats.energy || 0) - 1000,
      });
      return;
    }
    if (
      placement &&
      isBuildingDoorPlacement(placement) &&
      !isDoorPlacementOpen(saveData.map_deltas?.[activeMap.id], placement)
    ) {
      const dialogue = placement.dialogue_id
        ? gp.dialogue.find((d) => d.id === placement.dialogue_id)
        : undefined;
      usePlayStore.getState().openDoor(activeMap.id, doorPlacementKey(placement));
      if (dialogue && dialogue.nodes.length > 0) {
        clearInputState();
        usePlayStore
          .getState()
          .startDialogue(dialogue.id, dialogue.nodes[0].id);
        playSfx("door_transition", { volume: 0.28, cooldownMs: 180 });
        playSfx("dialogue_open", { volume: 0.3, cooldownMs: 120 });
        addLog(`Knocked at ${placementObject?.display_name || "Doorway"}...`);
        usePlayStore.getState().updatePlayerStats({
          energy: (saveData.playerStats.energy || 0) - 1000,
        });
        return;
      }
      playSfx("door_transition", { volume: 0.32, cooldownMs: 180 });
      addLog(`${placementObject?.display_name || "Doorway"} opens.`);
      usePlayStore.getState().updatePlayerStats({
        energy: (saveData.playerStats.energy || 0) - 1000,
      });
      return;
    }
    if (placement && placement.dialogue_id) {
      const dialogue = useEngineStore
        .getState()
        .gamePackage.dialogue.find((d) => d.id === placement.dialogue_id);
      if (dialogue && dialogue.nodes.length > 0) {
        clearInputState();
        usePlayStore
          .getState()
          .startDialogue(dialogue.id, dialogue.nodes[0].id);
        playSfx("dialogue_open", { volume: 0.32, cooldownMs: 120 });
        addLog(`Started conversation with ${dialogue.nodes[0].speaker}...`);
        return;
      }
    }
    if (placement && isBuildingDoorPlacement(placement)) {
      playSfx("ui_click", { volume: 0.18, cooldownMs: 180 });
      addLog(`${placementObject?.display_name || "Doorway"} is already open.`);
      return;
    }
    if (placement && placementObject?.tags?.includes("door")) {
      playSfx("door_transition", { volume: 0.28, cooldownMs: 180 });
      addLog(`${placementObject.display_name || "Doorway"} opens onto the threshold.`);
      return;
    }

    const targetCell = activeMap.cells.find((c) => c.x === tx && c.z === tz);
    if (!targetCell) {
      playSfx("warning", { volume: 0.22, cooldownMs: 120 });
      addLog("Nothing there.");
      return;
    }

    playSfx("warning", { volume: 0.18, cooldownMs: 120 });
    addLog(`Interacted with [${tx}, ${tz}]. Nothing happened.`);
    turnConsumed = true;
    if (turnConsumed) {
      usePlayStore.getState().updatePlayerStats({
        energy: (saveData.playerStats.energy || 0) - 1000,
      });
    }
  };

  useEffect(() => {
    handleActRef.current = handleAct;
  });

  // Drop one of an inventory item onto the ground using deterministic
  // placement: faced tile first, then orthogonals, then diagonals.
  const handleDropItem = (itemId: string) => {
    const currentSave = usePlayStore.getState().saveData;
    if (!currentSave || !activeMap) return;
    if ((currentSave.playerStats.energy || 0) < 1000) {
      addLog("Not ready to act.");
      return;
    }

    const { cell, facing } = currentSave.player;
    const groundItems = getEffectiveWorldItems(
      activeMap,
      currentSave.map_deltas?.[activeMap.id],
    );

    const isFreeForItem = (x: number, z: number) => {
      const targetCell = activeMap.cells.find(
        (c) => c.x === x && c.z === z && c.walkable,
      );
      if (!targetCell) return false;
      if (getContainerAtCell(x, z)) return false;
      if (groundItems.some((w) => w.cell[0] === x && w.cell[1] === z))
        return false;
      if (isBlockedByPlacement(x, z)) return false;
      const entityThere = activeMap.entity_placements?.some((e, idx) => {
        if ((currentSave.party_members || []).includes(e.entity_id))
          return false;
        const key = entityStateKey(activeMap.id, e.entity_id, idx);
        const est = (currentSave.entity_states || {})[key];
        if (est?.dead || est?.hidden) return false;
        const cx = est?.cell?.[0] ?? e.cell[0];
        const cz = est?.cell?.[1] ?? e.cell[1];
        return cx === x && cz === z;
      });
      return !entityThere;
    };

    const candidates: [number, number][] = [
      [facing[0], facing[1]],
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ];
    let dropCell: [number, number] | null = null;
    for (const [dx, dz] of candidates) {
      if (dx === 0 && dz === 0) continue;
      const x = cell[0] + dx;
      const z = cell[1] + dz;
      if (isFreeForItem(x, z)) {
        dropCell = [x, z];
        break;
      }
    }

    if (!dropCell) {
      addLog("No space to drop.");
      return;
    }

    const itemDef = gamePackage.items.find((i) => i.id === itemId);
    usePlayStore.getState().removeItem(itemId, 1);
    usePlayStore.getState().addDroppedItem(activeMap.id, {
      id: `drop_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      item_id: itemId,
      cell: dropCell,
      count: 1,
    });
    usePlayStore.getState().updatePlayerStats({
      energy: (currentSave.playerStats.energy || 0) - 1000,
    });
    addLog(`Dropped ${itemDef?.display_name || itemId}.`);
  };

  // Stable render inputs for GameRenderer (recomputed only when the world
  // actually changes, not on every player step).
  const renderMapDelta = useMemo(() => {
    if (!activeMap || !activeMapDelta) return undefined;
    if (activeMap.id !== "map_lazare_house" || lazareDoorReady) return activeMapDelta;

    const lazareDoor = activeMap.custom_object_placements.find((placement) =>
      isLazareInterviewDoor(activeMap, placement),
    );
    if (!lazareDoor || !activeMapDelta.opened_doors?.length) return activeMapDelta;

    return {
      ...activeMapDelta,
      opened_doors: activeMapDelta.opened_doors.filter(
        (doorKey) => doorKey !== doorPlacementKey(lazareDoor),
      ),
    };
  }, [activeMap, activeMapDelta, lazareDoorReady]);
  const containerRenderPlacements = useMemo(
    () =>
      (activeMap?.container_placements || []).map((c) => ({
        object_id: c.object_id,
        cell: c.cell,
        facing: c.facing,
      })),
    [activeMap?.container_placements],
  );
  const worldItemsRender = useMemo(() => {
    if (!activeMap)
      return [] as { id: string; cell: [number, number]; icon: string }[];
    const iconOf = (itemId: string) =>
      gamePackage.items.find((i) => i.id === itemId)?.icon || "📦";
    return getEffectiveWorldItems(activeMap, renderMapDelta).map((w) => ({
      id: w.id,
      cell: w.cell,
      icon: iconOf(w.item_id),
    }));
  }, [activeMap, renderMapDelta, gamePackage.items]);

  const closeDialogueDoorForCurrentMap = useCallback(
    (dialogueId: string | null | undefined) => {
      if (!activeMap || !dialogueId) return;
      const door = activeMap.custom_object_placements.find(
        (placement) =>
          isBuildingDoorPlacement(placement) &&
          placement.dialogue_id === dialogueId,
      );
      if (!door) return;
      usePlayStore.getState().closeDoor(activeMap.id, doorPlacementKey(door));
    },
    [activeMap],
  );

  // Living hostiles in threat range — drives the danger HUD panel and the
  // engaged feel (HP bars + threat rings render in GameRenderer).
  const nearbyHostiles = useMemo(
    () => getNearbyHostiles(saveData, activeMap, gamePackage, THREAT_RADIUS),
    [saveData, activeMap, gamePackage],
  );

  // All cells inside the aimed skill's range, shown as a faint field while
  // targeting so reach is legible before committing.
  const targetingRangeCells = useMemo(() => {
    if (!targetingSkillId || !saveData)
      return undefined as { x: number; z: number }[] | undefined;
    const skill = gamePackage.abilities.find((s) => s.id === targetingSkillId);
    if (!skill) return undefined;
    const caster = getControlledActor(saveData, gamePackage);
    if (!caster) return undefined;
    const [cx, cz] = caster.cell;
    const cells: { x: number; z: number }[] = [];
    for (let dx = -skill.range; dx <= skill.range; dx++) {
      for (let dz = -skill.range; dz <= skill.range; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > skill.range) continue;
        cells.push({ x: cx + dx, z: cz + dz });
      }
    }
    return cells;
  }, [targetingSkillId, saveData, gamePackage]);

  // Timestamp of the last hit the player took; keys the red vignette flash.
  const playerHurtAt = useFxStore((s) => s.playerHurtAt);

  if (!activeMap || !saveData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  const inCombat = !!saveData.in_combat;
  const controlledActor = getControlledActor(saveData, gamePackage);
  const activeTurnId = inCombat ? (saveData.active_turn_id ?? null) : null;

  // The HUD bars and the camera follow whoever is being commanded — the
  // player normally, a party member on their combat turn.
  const commandingParty = Boolean(controlledActor && !controlledActor.isPlayer);
  const activeFocusPos: [number, number] =
    commandingParty && controlledActor
      ? controlledActor.cell
      : saveData.player.cell || [0, 0];
  const activeStats =
    commandingParty && controlledActor
      ? {
          hp: controlledActor.hp,
          max_hp: controlledActor.maxHp,
          mp: controlledActor.mp,
          max_mp: controlledActor.maxMp,
          energy: 1000,
          attack: controlledActor.attack,
          defense: controlledActor.defense,
          speed: 10,
        }
      : saveData.playerStats;

  const playerPos = saveData.player.cell || [0, 0];
  const playerFacing = saveData.player.facing || [0, -1];

  const cameraPosition = getIsometricCameraPosition(activeFocusPos, cameraAzimuth);
  const clockTotalMinutes = Math.floor(saveData.clock_minutes ?? 0);
  const clockDay = Math.floor(clockTotalMinutes / 1440) + 1;
  const clockHour = Math.floor(clockTotalMinutes / 60) % 24;
  const clockMinute = clockTotalMinutes % 60;
  const clockPhase = CLOCK_PHASE_LABELS[getClockPhaseId(clockHour)];
  const playerLevel = getSaveLevel(saveData);
  const playerExperience = getSaveExperience(saveData);
  const currentLevelXp = getXpRequiredForLevel(playerLevel);
  const nextLevelXp = getXpRequiredForLevel(playerLevel + 1);
  const xpSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const xpProgress = Math.max(
    0,
    Math.min(100, ((playerExperience - currentLevelXp) / xpSpan) * 100),
  );
  const xpRemaining = getXpRemainingForNextLevel(saveData);
  const shopConditionCtx = buildConditionContext(saveData);
  const questJournal = buildQuestJournal(saveData, gamePackage);
  const activeQuestStep = questJournal.activeStep;
  const partyMemberIds = saveData.party_members || [];
  // Skills of whoever is being commanded — the tactics bar and the 1-6
  // hotkeys index into this same list. On Aldric's turn it becomes his kit.
  const hotbarSkills = controlledActor
    ? gamePackage.abilities
        .filter((a) => controlledActor.skills.includes(a.id))
        .slice(0, 6)
    : [];
  const overlayOpen = Boolean(
    activeShopId ||
      activeDialogueId ||
      activeDocumentId ||
      activeContainerId ||
      levelUpOpen,
  );
  const showPerfHud =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("perf");
  const isOpenFollowerCell = (x: number, z: number) => {
    const cell = getActiveCell(x, z);
    if (cell && !cell.walkable) return false;
    if (!cell) return false;
    if (getContainerAtCell(x, z)) return false;
    return !isBlockedByPlacement(x, z);
  };
  const partyFollowers = partyMemberIds.map((entity_id, index) => {
    // In combat, party members hold real positions of their own.
    if (inCombat) {
      const est = (saveData.entity_states || {})[entity_id];
      if (est?.cell) {
        return { entity_id, cell: est.cell as [number, number] };
      }
    }
    const offsets: [number, number][] = [
      [-(playerFacing[0] || 0) * (index + 1), -(playerFacing[1] || 0) * (index + 1)],
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
      [-1, 1],
      [1, 1],
    ];
    const offset =
      offsets.find(([dx, dz]) => isOpenFollowerCell(playerPos[0] + dx, playerPos[1] + dz)) ||
      offsets[0];
    return {
      entity_id,
      cell: [playerPos[0] + offset[0], playerPos[1] + offset[1]] as [number, number],
    };
  });

  latestPartyFollowersRef.current = partyFollowers;

  // Initiative strip data: everyone in the queue with name, HP, and side.
  const combatQueueInfo = inCombat
    ? (saveData.combat_queue || []).map((id) => {
        if (id === "player") {
          return {
            id,
            name: "You",
            hp: saveData.playerStats.hp,
            maxHp: saveData.playerStats.max_hp,
            kind: "player" as const,
            dead: saveData.playerStats.hp <= 0,
          };
        }
        if (partyMemberIds.includes(id)) {
          const def = gamePackage.entities.find((e) => e.id === id);
          const est = (saveData.entity_states || {})[id] || {};
          return {
            id,
            name: def?.display_name || id,
            hp: est.hp ?? def?.max_hp ?? 0,
            maxHp: def?.max_hp ?? 1,
            kind: "party" as const,
            dead: !!est.dead,
          };
        }
        let name = "Foe";
        let maxHp = 1;
        let hp = 0;
        let dead = false;
        activeMap.entity_placements?.forEach((p, idx) => {
          if (entityStateKey(activeMap.id, p.entity_id, idx) !== id) return;
          const def = gamePackage.entities.find((e) => e.id === p.entity_id);
          const est = (saveData.entity_states || {})[id] || {};
          name = def?.display_name || "Foe";
          maxHp = def?.max_hp ?? 1;
          hp = est.hp ?? maxHp;
          dead = !!est.dead || !!est.hidden;
        });
        return { id, name, hp, maxHp, kind: "enemy" as const, dead };
      })
    : [];
  const activeDialogue = activeDialogueId
    ? gamePackage.dialogue.find((d) => d.id === activeDialogueId)
    : undefined;
  const activeDialogueNode = activeDialogue?.nodes.find(
    (n) => n.id === activeDialogueNodeId,
  );
  const dialogueHasSceneImage = Boolean(activeDialogueNode?.scene_image_url);
  const bottomPanelOpen = Boolean(
    activeShopId ||
      activeDocumentId ||
      activeDialogueId ||
      activeContainerId,
  );

  return (
    <div className="flex flex-col h-full bg-neutral-950 relative overflow-hidden pb-16 sm:pb-0" style={{ touchAction: 'none' }}>
      <div className="flex-1 relative min-h-0">
        <Canvas
          shadows
          camera={{
            position: cameraPosition,
            fov: ISO_CAMERA_FOV,
          }}
          dpr={playDpr}
          gl={{
            antialias: false,
            alpha: false,
            stencil: false,
            powerPreference: "high-performance",
          }}
        >
          <IsometricCameraRig
            playerPos={playerPos}
            azimuth={cameraAzimuth}
            focusOverride={
              cameraFocusOverride ?? (commandingParty ? activeFocusPos : null)
            }
            glide={Boolean(
              activeCutscene || cameraFocusOverride || commandingParty,
            )}
          />
          <color attach="background" args={["#111735"]} />
          <fog attach="fog" args={["#161D36", 78, 190]} />
          <BlackStarLightRig playerPos={playerPos} />
          <AdaptiveQualityProbe dpr={playDpr} setDpr={setPlayDpr} />
          <FramePerfProbe enabled={showPerfHud} dpr={playDpr} />
          <GameRenderer
            map={activeMap}
            playerPos={playerPos}
            playerFacing={playerFacing}
            playerSpriteId={saveData.player?.sprite_id}
            worldItems={worldItemsRender}
            extraPlacements={containerRenderPlacements}
            onCellClick={targetingSkillId ? handleCellClick : undefined}
            onCellHover={targetingSkillId ? handleCellHover : undefined}
            onPointerOut={handlePointerOut}
            targetPattern={computeTargetPatternMemo}
            rangeCells={targetingRangeCells}
            hoveredCell={hoveredCell}
            entityStates={saveData.entity_states}
            partyFollowers={partyFollowers}
            partyMemberIds={partyMemberIds}
            mapDelta={renderMapDelta}
            inCombat={inCombat}
            activeTurnKey={activeTurnId}
            showGrid={false}
            enableOcclusion
            occlusionAzimuth={cameraAzimuth}
            renderCenter={cameraFocusOverride || activeFocusPos}
            renderRadius={PLAY_RENDER_RADIUS}
          />
          <ScreenFX inCombat={inCombat} mapId={activeMap?.id} />
        </Canvas>
        {showPerfHud && (
          <div
            id="play-perf-hud"
            className="absolute left-3 top-3 z-30 rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-cyan-100"
          >
            measuring...
          </div>
        )}

        {/* Virtual Joystick touch zone — covers the full game canvas */}
        {!levelUpOpen && !targetingSkillId && !activeShopId && !activeDialogueId && !activeDocumentId && !activeContainerId && (
          <div
            ref={joystickOverlayRef}
            className="absolute inset-0 z-10"
            style={{ touchAction: 'none' }}
            onPointerDown={joystickStart}
            onPointerMove={joystickMove}
            onPointerUp={joystickEnd}
            onPointerCancel={joystickEnd}
          >
            {joystickVis.visible && (
              <>
                {/* Base ring */}
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-white/25 bg-black/20"
                  style={{
                    left: joystickVis.baseX - JOYSTICK_MAX,
                    top: joystickVis.baseY - JOYSTICK_MAX,
                    width: JOYSTICK_MAX * 2,
                    height: JOYSTICK_MAX * 2,
                  }}
                />
                {/* Inner dead-zone ring */}
                <div
                  className="absolute pointer-events-none rounded-full border border-white/10"
                  style={{
                    left: joystickVis.baseX - JOYSTICK_DEAD,
                    top: joystickVis.baseY - JOYSTICK_DEAD,
                    width: JOYSTICK_DEAD * 2,
                    height: JOYSTICK_DEAD * 2,
                  }}
                />
                {/* Thumb */}
                <div
                  className="absolute pointer-events-none rounded-full bg-white/30 border-2 border-white/50 shadow-lg"
                  style={{
                    left: joystickVis.thumbX - 26,
                    top: joystickVis.thumbY - 26,
                    width: 52,
                    height: 52,
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Floating Act + Wait buttons — always reachable, bottom-right of canvas */}
        {!levelUpOpen && !targetingSkillId && !activeShopId && !activeDialogueId && !activeDocumentId && !activeContainerId && (
          <div className="absolute right-3 z-20 flex flex-col gap-2 pointer-events-auto" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <button
              className="w-12 h-12 sm:w-16 sm:h-16 bg-sacred-stone active:brightness-150 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all select-none shadow-[0_0_15px_rgba(0,0,0,0.8)] border-sacred-gold text-[var(--color-sacred-gold)] touch-manipulation gap-0.5"
              style={{ borderStyle: "solid", borderWidth: "2px" }}
              onClick={handleAct}
              title="Interact / Act"
            >
              <Hand className="w-5 h-5 sm:w-7 sm:h-7 drop-shadow-md" />
              <span className="text-[8px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase opacity-90 text-sacred-glow">Act</span>
            </button>

            <button
              className="w-12 h-12 sm:w-16 sm:h-16 bg-sacred-stone active:brightness-150 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all select-none shadow-[0_0_15px_rgba(0,0,0,0.8)] border-sacred-gold text-[var(--color-sacred-ink-dim)] touch-manipulation gap-0.5"
              style={{ borderStyle: "solid", borderWidth: "2px" }}
              onPointerDown={(e) => { e.stopPropagation(); simulateKey("z", true); }}
              onPointerUp={(e) => { e.stopPropagation(); simulateKey("z", false); }}
              onPointerLeave={() => simulateKey("z", false)}
              onContextMenu={(e) => e.preventDefault()}
              title="Wait (Pass Turn)"
            >
              <Clock className="w-5 h-5 sm:w-7 sm:h-7 drop-shadow-md" />
              <span className="text-[8px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase opacity-90">Wait</span>
            </button>
          </div>
        )}

        {/* Tactics bar — the commanded actor's skills, mirrored by hotkeys 1-6 */}
        {hotbarSkills.length > 0 && !levelUpOpen && !targetingSkillId && !overlayOpen && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-auto ${
              commandingParty ? "drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]" : ""
            }`}
            style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {hotbarSkills.map((skill, i) => {
              const affordable =
                (controlledActor?.mp ?? 0) >= skill.mp_cost &&
                (inCombat || (activeStats.energy || 0) >= skill.ap_cost);
              return (
                <button
                  key={skill.id}
                  onClick={() => beginTargeting(skill.id)}
                  disabled={!affordable}
                  className={`relative w-[46px] h-12 sm:w-[60px] sm:h-16 rounded-sm bg-sacred-stone flex flex-col items-center justify-center gap-0.5 shadow-[0_0_15px_rgba(0,0,0,0.8)] border-sacred-gold transition-all select-none touch-manipulation ${
                    affordable ? "active:scale-90 brightness-100" : "opacity-40 grayscale"
                  }`}
                  style={{ borderStyle: "solid", borderWidth: "1px" }}
                  title={`${skill.display_name}${skill.description ? ` — ${skill.description}` : ""}`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-serif font-bold text-[var(--color-sacred-gold)] drop-shadow-md">
                    {i + 1}
                  </span>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-sacred-ink)]" />
                  <span className="text-[7px] sm:text-[8px] font-[family-name:var(--font-display)] font-bold uppercase tracking-wider leading-tight text-center px-0.5 text-[var(--color-sacred-ink)]">
                    {skill.display_name}
                  </span>
                  {skill.mp_cost > 0 && (
                    <span className="text-[7px] sm:text-[9px] font-serif font-bold text-[#457b9d] drop-shadow-md">
                      {skill.mp_cost}MP
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Turn banner + initiative strip (combat only) */}
        {inCombat && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none" style={{ maxWidth: 'calc(100vw - 9rem)' }}>
            <div
              className={`px-3 py-1 sm:px-6 sm:py-2 border text-[10px] sm:text-sm font-[family-name:var(--font-display)] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,0,0,0.9)] bg-sacred-stone border-sacred-gold text-sacred-glow whitespace-nowrap ${
                controlledActor
                  ? controlledActor.isPlayer
                    ? "text-[var(--color-sacred-gold)]"
                    : "text-emerald-300"
                  : "text-[#e63946] border-[#8b1c1c]"
              }`}
              style={{ borderStyle: "solid", borderWidth: "2px", borderImage: "none" }}
            >
              {controlledActor
                ? controlledActor.isPlayer
                  ? "⚔ Your Turn ⚔"
                  : `⚔ ${controlledActor.name.split(" ")[0]}`
                : "Enemy..."}
            </div>
            <div className="flex gap-1 flex-nowrap justify-center overflow-hidden max-w-full">
              {combatQueueInfo
                .filter((c) => !c.dead)
                .slice(0, 6)
                .map((c) => {
                  const active = c.id === saveData.active_turn_id;
                  const accent =
                    c.kind === "player" || c.kind === "party"
                      ? "border-[var(--color-sacred-gold-dark)] text-[var(--color-sacred-ink)]"
                      : "border-[#8b1c1c] text-[#e63946]";
                  return (
                    <div
                      key={c.id}
                      className={`px-1.5 sm:px-3 py-0.5 sm:py-1 bg-sacred-stone border ${accent} ${
                        active ? "scale-110 shadow-[0_0_15px_var(--color-sacred-gold)] brightness-125 z-10" : "opacity-60 grayscale"
                      } transition-all flex flex-col items-center shrink-0`}
                      style={{ borderStyle: "solid", borderWidth: "1px" }}
                    >
                      <span className="text-[8px] sm:text-[10px] font-serif font-bold truncate max-w-[2.5rem] sm:max-w-20 leading-tight">
                        {c.name.split(" ")[0]}
                      </span>
                      <div className="w-8 sm:w-14 h-0.5 sm:h-1 bg-black border border-[#111] mt-0.5 overflow-hidden">
                        <div
                          className={`h-full ${c.kind === "enemy" ? "bg-[#8b1c1c]" : "bg-[var(--color-sacred-gold-dark)]"}`}
                          style={{
                            width: `${Math.max(0, Math.min(100, (c.hp / Math.max(1, c.maxHp)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Targeting banner */}
        {targetingSkillId &&
          (() => {
            const skill = gamePackage.abilities.find(
              (s) => s.id === targetingSkillId,
            );
            return (
              <div
                className={`absolute ${inCombat ? "top-[5.5rem]" : "top-3"} left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-indigo-950/90 border border-indigo-600/60 rounded-lg text-indigo-100 text-xs font-bold tracking-wide shadow-xl pointer-events-none flex items-center gap-2`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {commandingParty && controlledActor
                    ? `${controlledActor.name} — `
                    : ""}
                  {skill?.display_name}: tap a tile, tap again to cast · Esc
                  cancels
                </span>
              </div>
            );
          })()}

        {/* HUD / Controls Overlay */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 pointer-events-auto">
          {/* Player Vitals - compact */}
          <div
            className="px-2.5 py-2 sm:px-4 sm:py-3 bg-sacred-stone border-sacred-gold rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col gap-1.5 sm:gap-2.5 w-36 sm:w-48"
            style={{ borderStyle: "solid", borderWidth: "2px" }}
          >
            <div>
              <div className="flex justify-between items-end mb-0.5 px-0.5">
                <span className="text-[#e63946] text-[9px] sm:text-[11px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase">Vitality</span>
                <span className="font-serif font-bold text-[9px] sm:text-[11px] text-[var(--color-sacred-ink)] drop-shadow-sm">
                  {saveData.playerStats.hp} / {saveData.playerStats.max_hp}
                </span>
              </div>
              <div className="w-full bg-black/80 h-2 border border-[#4a1010] shadow-[inset_0_0_5px_rgba(0,0,0,1)] relative">
                <div
                  className="h-full bg-gradient-to-r from-[#8b1c1c] to-[#e63946] transition-all duration-300 shadow-[0_0_8px_rgba(230,57,70,0.5)]"
                  style={{
                    width: `${Math.max(0, Math.min(100, (saveData.playerStats.hp / saveData.playerStats.max_hp) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-0.5 px-0.5">
                <span className="text-[#457b9d] text-[9px] sm:text-[11px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase">Aether</span>
                <span className="font-serif font-bold text-[9px] sm:text-[11px] text-[var(--color-sacred-ink)] drop-shadow-sm">
                  {saveData.playerStats.mp ?? 10} / {saveData.playerStats.max_mp ?? 10}
                </span>
              </div>
              <div className="w-full bg-black/80 h-2 border border-[#0f1f38] shadow-[inset_0_0_5px_rgba(0,0,0,1)] relative">
                <div
                  className="h-full bg-gradient-to-r from-[#1d3557] to-[#457b9d] transition-all duration-300 shadow-[0_0_8px_rgba(69,123,157,0.5)]"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((saveData.playerStats.mp ?? 10) / (saveData.playerStats.max_mp ?? 10)) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between font-serif text-[9px] text-[var(--color-sacred-ink)] px-0.5 font-bold">
              <span title="Attack" className="flex items-center gap-0.5"><span className="text-[var(--color-sacred-gold)]">⚔</span> {saveData.playerStats.attack}</span>
              <span title="Defense" className="flex items-center gap-0.5"><span className="text-[var(--color-sacred-gold)]">🛡</span> {saveData.playerStats.defense}</span>
              <span title="Speed" className="flex items-center gap-0.5"><span className="text-[var(--color-sacred-gold)]">⚡</span> {saveData.playerStats.speed}</span>
            </div>
            <div className="pt-1 border-t border-[var(--color-sacred-gold-dark)]/35">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[var(--color-sacred-gold)] text-[9px] sm:text-[10px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase">
                  Level {playerLevel}
                </span>
                <span className="font-serif text-[8px] sm:text-[9px] font-bold text-[var(--color-sacred-ink)]">
                  {xpRemaining} XP
                  {pendingLevelUps > 0 ? ` +${pendingLevelUps}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full border border-[var(--color-sacred-gold-dark)] bg-black/75">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-sacred-gold-dark)] to-[var(--color-sacred-gold)] transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
            <div className="pt-1 border-t border-[var(--color-sacred-gold-dark)]/50 flex justify-between items-center px-0.5">
              <span className="text-[var(--color-sacred-gold)] text-[9px] sm:text-[11px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase">
                {clockPhase}
              </span>
              <span className="font-serif font-bold text-[9px] sm:text-[10px] text-[var(--color-sacred-ink)] drop-shadow-sm">
                Day {clockDay} · {String(clockHour).padStart(2, "0")}:
                {String(clockMinute).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Party panel — the people beside you, with their real stats */}
          {partyMemberIds.length > 0 && (
            <div
              className="px-2.5 py-2 sm:px-4 sm:py-3 bg-sacred-stone border-[var(--color-sacred-gold-dark)] rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col gap-1.5 sm:gap-2.5 w-36 sm:w-48 mt-0.5"
              style={{ borderStyle: "solid", borderWidth: "1px" }}
            >
              {partyMemberIds.map((pid) => {
                const def = gamePackage.entities.find((e) => e.id === pid);
                if (!def) return null;
                const est = (saveData.entity_states || {})[pid] || {};
                const hp = est.hp ?? def.max_hp;
                const mp = est.mp ?? def.max_mp;
                const theirTurn = inCombat && saveData.active_turn_id === pid;
                return (
                  <div
                    key={pid}
                    className={
                      theirTurn
                        ? "ring-1 ring-[var(--color-sacred-gold)] bg-black/20 p-1 -m-1"
                        : ""
                    }
                  >
                    <div className="flex justify-between items-end mb-1 px-1">
                      <span className="text-[var(--color-sacred-ink)] text-[10px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase truncate pr-1">
                        {def.display_name}
                      </span>
                      <span className="font-serif font-bold text-[10px] text-[var(--color-sacred-ink-dim)] shrink-0">
                        {est.dead ? "Fallen" : `${hp} / ${def.max_hp}`}
                      </span>
                    </div>
                    <div className="w-full bg-black/80 h-1.5 border border-[var(--color-sacred-gold-dark)] shadow-[inset_0_0_5px_rgba(0,0,0,1)] relative">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-sacred-gold-dark)] to-[var(--color-sacred-gold)] transition-all duration-300"
                        style={{
                          width: `${Math.max(0, Math.min(100, (hp / Math.max(1, def.max_hp)) * 100))}%`,
                        }}
                      />
                    </div>
                    {(def.max_mp ?? 0) > 0 && (
                      <div className="w-full bg-black/80 h-1 border border-[#0f1f38] shadow-[inset_0_0_5px_rgba(0,0,0,1)] relative mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-[#1d3557] to-[#457b9d] transition-all duration-300"
                          style={{
                            width: `${Math.max(0, Math.min(100, (mp / Math.max(1, def.max_mp)) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Danger panel — who's hunting you, how hurt they are.
              In combat the initiative strip carries this information. */}
          {!inCombat && nearbyHostiles.length > 0 && (
            <div
              className="px-4 py-3 bg-sacred-stone border-[#8b1c1c] rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col gap-2.5 w-48 mt-1"
              style={{ borderStyle: "solid", borderWidth: "1px" }}
            >
              <div className="flex items-center justify-center gap-1.5 text-[#e63946] text-[11px] font-[family-name:var(--font-display)] font-bold tracking-widest uppercase text-sacred-glow">
                <Swords className="w-4 h-4" />
                Hostiles
              </div>
              {nearbyHostiles.slice(0, 3).map((h) => (
                <div key={h.key}>
                  <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-[10px] font-serif font-bold text-[#e63946] truncate pr-1">
                      {h.name}
                    </span>
                    <span className="font-[family-name:var(--font-display)] font-bold text-[9px] text-[#e63946]/80 shrink-0 uppercase tracking-widest">
                      {h.dist === 1 ? "Melee!" : `${h.dist} Steps`}
                    </span>
                  </div>
                  <div className="w-full bg-black/80 h-1.5 border border-[#4a1010] shadow-[inset_0_0_5px_rgba(0,0,0,1)] relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#8b1c1c] to-[#e63946] transition-all duration-300 shadow-[0_0_5px_rgba(230,57,70,0.5)]"
                      style={{
                        width: `${Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {nearbyHostiles.length > 3 && (
                <div className="text-center text-[10px] font-serif font-bold text-[#8b1c1c] pt-1 italic">
                  + {nearbyHostiles.length - 3} More
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-right icon buttons */}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                setShowInventory(true);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-900/90 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 rounded-full shadow-lg transition-all flex items-center justify-center"
              title="Inventory"
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                setShowSkills(true);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-900/90 border border-indigo-700 hover:bg-indigo-700 text-indigo-200 rounded-full shadow-lg transition-all flex items-center justify-center"
              title="Spells & Skills"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                clearInputState();
                playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                setShowCaseFile(true);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-950/90 border border-sky-800 hover:bg-sky-800 text-sky-200 rounded-full shadow-lg transition-all flex items-center justify-center"
              title="Case File"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                clearInputState();
                playSfx("save_candle", { volume: 0.32, cooldownMs: 120 });
                setShowSaveMenu(true);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-950/90 border border-amber-800 hover:bg-amber-800 text-amber-200 rounded-full shadow-lg transition-all flex items-center justify-center"
              title="Save / Load"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {(saveData.party_members || []).length > 0 && (
              <button
                onClick={handlePartyTalk}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-900/90 border border-emerald-700 hover:bg-emerald-700 text-emerald-100 rounded-full shadow-lg transition-all flex items-center justify-center"
                title="Talk to Party"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          {activeQuestStep &&
            !targetingSkillId &&
            !activeShopId &&
            !activeDialogueId &&
            !activeDocumentId &&
            !activeContainerId &&
            !showInventory &&
            !showSkills &&
            !showSaveMenu &&
            !showCaseFile && (
              <button
                onClick={() => {
                  clearInputState();
                  playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                  setShowCaseFile(true);
                }}
                className="max-w-[15rem] sm:max-w-[18rem] rounded-sm border border-sky-800/80 bg-neutral-950/86 px-3 py-2 text-left shadow-lg transition-colors hover:bg-sky-950/90"
                title="Open Case File"
              >
                <div className="flex items-center gap-2 text-[10px] font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sky-300">
                  <ListChecks className="h-3.5 w-3.5 shrink-0" />
                  <span>Current Objective</span>
                </div>
                <div className="mt-1 line-clamp-2 text-xs font-serif leading-snug text-neutral-100">
                  {activeQuestStep.text}
                </div>
              </button>
            )}
          {targetingSkillId && (
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={() => {
                  playSfx("ui_back", { volume: 0.22, cooldownMs: 120 });
                  setTargetingSkillId(null);
                }}
                className="px-3 py-2 bg-red-900/90 border border-red-700 hover:bg-red-800 text-red-100 rounded-lg shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                <span>Cancel Targeting</span>
              </button>
              {hoveredCell && (
                <button
                  onClick={() =>
                    handleCellClick(hoveredCell[0], hoveredCell[1])
                  }
                  className="px-4 py-3 bg-amber-600/90 border border-amber-500 hover:bg-amber-500 text-amber-50 rounded shadow-lg transition-all flex items-center gap-2 font-bold animate-pulse"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Cast</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className="absolute left-2 pointer-events-none flex flex-col items-start justify-end gap-1 max-h-[30%] overflow-hidden z-10"
          style={{
            bottom: hotbarSkills.length > 0 && !overlayOpen
              ? 'calc(4rem + env(safe-area-inset-bottom))'
              : 'calc(0.5rem + env(safe-area-inset-bottom))',
            maxWidth: 'min(55%, 16rem)',
          }}
        >
          {logMessages.slice(-3).map((msg, i, arr) => {
            const age = arr.length - 1 - i;
            return (
              <div
                key={i}
                className="bg-neutral-900/85 border border-neutral-800/50 text-neutral-200 text-[10px] sm:text-[11px] py-1 px-2 sm:px-2.5 rounded-md shadow-lg pointer-events-auto transition-all animate-in fade-in slide-in-from-left-4 break-words"
                style={{ opacity: Math.max(0.15, 1 - age * 0.35) }}
              >
                {msg}
              </div>
            );
          })}
        </div>
      </div>

      {/* Red vignette flash whenever the player takes a hit */}
      {playerHurtAt > 0 && (
        <div
          key={playerHurtAt}
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(220,38,38,0.5) 100%)",
            animation: "hurt-vignette 500ms ease-out forwards",
          }}
        />
      )}

      {/* Screen fade overlay (screen_fade cutscene verb) */}
      <div
        className="absolute inset-0 z-40 pointer-events-none"
        style={{
          backgroundColor: screenFade.color,
          opacity: screenFade.opacity,
          transition: `opacity ${screenFade.duration}ms ease`,
        }}
      />

      {levelUpOpen && saveData.playerStats.hp > 0 && (
        <LevelUpOverlay
          level={playerLevel}
          pending={pendingLevelUps}
          onChoose={handleLevelUpChoice}
        />
      )}

      {/* Game Over Overlay */}
      {saveData &&
        saveData.playerStats.hp !== undefined &&
        saveData.playerStats.hp <= 0 && (
          <div className="absolute inset-0 bg-red-950/80 z-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-6xl font-bold font-serif text-red-500 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
              YOU DIED
            </h1>
            <p className="text-red-200/60 mb-8 max-w-sm text-center">
              Your journey has come to an end. The darkness reclaims you.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                  resetRun();
                }}
                className="px-8 py-3 bg-red-900 hover:bg-red-800 text-red-100 rounded shadow-[0_0_15px_rgba(153,27,27,0.5)] font-bold tracking-widest hover:scale-105 transition-all"
              >
                AWAKEN
              </button>
              <button
                onClick={() => {
                  playSfx("save_candle", { volume: 0.32, cooldownMs: 120 });
                  setShowSaveMenu(true);
                }}
                className="px-8 py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 border border-amber-800 rounded font-bold tracking-widest hover:scale-105 transition-all"
              >
                RECALL A MEMORY
              </button>
            </div>
          </div>
        )}

      {/* Case File Overlay */}
      {showCaseFile && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-sky-900/70 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[82vh]">
            <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-300" />
                Case File
              </h2>
              <button
                onClick={() => {
                  playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                  setShowCaseFile(false);
                }}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <section className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Read Documents</h3>
                {(saveData.read_documents || []).length > 0 ? (
                  (saveData.read_documents || []).map((documentId) => {
                    const doc = gamePackage.documents?.find((candidate) => candidate.id === documentId);
                    if (!doc) return null;
                    return (
                      <button
                        key={documentId}
                        onClick={() => {
                          playSfx("document_open", { volume: 0.32, cooldownMs: 120 });
                          setShowCaseFile(false);
                          usePlayStore.getState().markDocumentRead(documentId);
                          setActiveDocumentId(documentId);
                        }}
                        className="w-full text-left rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-2"
                      >
                        <div className="text-sm font-medium text-neutral-100">{doc.display_name}</div>
                        <div className="text-xs text-neutral-500 line-clamp-2 mt-1">{doc.content}</div>
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-neutral-800 p-3 text-sm text-neutral-500">
                    No documents have been read yet.
                  </p>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Quest Log</h3>
                  {questJournal.entries.length > 0 ? (
                    <div className="space-y-3">
                      {questJournal.entries.map((entry) => (
                        <div key={entry.id} className="rounded border border-neutral-800 bg-neutral-900/95 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-neutral-100">{entry.title}</div>
                              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                                {stateLabel(entry.state)}
                              </div>
                            </div>
                          </div>
                          {entry.description && (
                            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{entry.description}</p>
                          )}
                          <div className="mt-3 space-y-2">
                            {entry.steps.map((step) => {
                              const done = step.status === "done";
                              const current = step.status === "current";
                              const Icon = done ? CheckCircle2 : current ? Circle : LockKeyhole;
                              return (
                                <div
                                  key={step.id}
                                  className={`flex items-start gap-2 rounded px-2 py-1.5 ${
                                    current
                                      ? "bg-sky-950/45 text-neutral-100"
                                      : done
                                        ? "text-neutral-400"
                                        : "text-neutral-600"
                                  }`}
                                >
                                  <Icon
                                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                      done ? "text-emerald-400" : current ? "text-sky-300" : "text-neutral-700"
                                    }`}
                                  />
                                  <span className={`text-xs leading-snug ${done ? "line-through decoration-neutral-600" : ""}`}>
                                    {step.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded border border-dashed border-neutral-800 p-3 text-sm text-neutral-600">
                      No active case has been recorded yet.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Evidence / Key Items</h3>
                  {(saveData.inventory || []).filter((entry) => {
                    const item = gamePackage.items.find((candidate) => candidate.id === entry.id);
                    return entry.count > 0 && item?.category === "key";
                  }).length > 0 ? (
                    (saveData.inventory || [])
                      .filter((entry) => {
                        const item = gamePackage.items.find((candidate) => candidate.id === entry.id);
                        return entry.count > 0 && item?.category === "key";
                      })
                      .map((entry) => {
                        const item = gamePackage.items.find((candidate) => candidate.id === entry.id);
                        return (
                          <div key={entry.id} className="rounded border border-neutral-800 bg-neutral-900 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-neutral-200 truncate">{item?.display_name || entry.id}</span>
                              <span className="text-xs text-neutral-500">x{entry.count}</span>
                            </div>
                            {item?.description && (
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm text-neutral-600">No key evidence in inventory.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Dialog Overlay */}
      {showInventory && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Inventory
                </h2>
                <div className="text-amber-400 font-mono text-sm px-2 py-0.5 bg-amber-500/10 rounded flex items-center gap-1.5 border border-amber-500/20">
                  🪙 {saveData.money || 0}
                </div>
              </div>
              <button
                onClick={() => {
                  playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                  setShowInventory(false);
                }}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {(saveData.inventory || [])
                .filter((i) => i.count > 0)
                .map((invItem) => {
                  const itemDef = gamePackage.items.find(
                    (i) => i.id === invItem.id,
                  );
                  if (!itemDef) return null;
                  return (
                    <div
                      key={invItem.id}
                      className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-3 flex gap-4 items-center"
                    >
                      <div className="text-3xl bg-neutral-950 w-12 h-12 rounded flex items-center justify-center shrink-0 border border-neutral-800">
                        {itemDef.icon || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-white truncate text-sm">
                            {itemDef.display_name}
                          </h3>
                          <span className="bg-neutral-950 text-neutral-300 font-mono text-xs px-2 py-0.5 rounded border border-neutral-700">
                            x{invItem.count}
                          </span>
                        </div>
                        {itemDef.description && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            {itemDef.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                        {itemDef.category === "consumable" && (
                          <button
                            className="mt-2 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded transition-colors"
                            onClick={() => {
                              const effects = itemDef.effects;
                              let used = false;
                              if (effects?.heal) {
                                usePlayStore
                                  .getState()
                                  .updatePlayerHp(effects.heal);
                                addLog(
                                  `Used ${itemDef.display_name}. Restored ${effects.heal} HP.`,
                                );
                                used = true;
                              }
                              if (effects?.mp_restore) {
                                usePlayStore
                                  .getState()
                                  .updatePlayerMp(effects.mp_restore);
                                addLog(
                                  `Used ${itemDef.display_name}. Restored ${effects.mp_restore} \MP.`,
                                );
                                used = true;
                              }
                              if (effects?.energy_restore) {
                                const pss =
                                  usePlayStore.getState().saveData?.playerStats;
                                if (pss) {
                                  usePlayStore.getState().updatePlayerStats({
                                    energy:
                                      (pss.energy || 0) +
                                      effects.energy_restore,
                                  });
                                  addLog(
                                    `Used ${itemDef.display_name}. Restored energy.`,
                                  );
                                  used = true;
                                }
                              }
                              if (
                                effects?.max_hp_bonus ||
                                effects?.attack_bonus ||
                                effects?.defense_bonus ||
                                effects?.speed_bonus
                              ) {
                                const pss =
                                  usePlayStore.getState().saveData?.playerStats;
                                if (pss) {
                                  usePlayStore.getState().updatePlayerStats({
                                    max_hp:
                                      (pss.max_hp || 10) +
                                      (effects.max_hp_bonus || 0),
                                    attack:
                                      (pss.attack || 2) +
                                      (effects.attack_bonus || 0),
                                    defense:
                                      (pss.defense || 1) +
                                      (effects.defense_bonus || 0),
                                    speed:
                                      (pss.speed || 10) +
                                      (effects.speed_bonus || 0),
                                  });
                                  if (effects.max_hp_bonus) {
                                    usePlayStore
                                      .getState()
                                      .updatePlayerHp(effects.max_hp_bonus);
                                  }
                                  addLog(
                                    `Used ${itemDef.display_name}. Gained stats!`,
                                  );
                                  used = true;
                                }
                              }
                              if (!used) {
                                playSfx("warning", { volume: 0.24, cooldownMs: 120 });
                                addLog(
                                  `Used ${itemDef.display_name}. Nothing happened.`,
                                );
                              } else {
                                playSfx("heal", { volume: 0.32, cooldownMs: 120 });
                              }
                              usePlayStore.getState().removeItem(invItem.id, 1);
                              // Drinking mid-fight costs the turn.
                              if (usePlayStore.getState().saveData?.in_combat) {
                                setShowInventory(false);
                                usePlayStore.getState().advanceTurn();
                              }
                            }}
                          >
                            Use
                          </button>
                        )}
                          <button
                            className="mt-2 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-3 py-1 rounded transition-colors"
                          onClick={() => {
                            playSfx("ui_back", { volume: 0.18, cooldownMs: 120 });
                            handleDropItem(invItem.id);
                          }}
                        >
                          Drop
                        </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {(saveData.inventory || []).filter((i) => i.count > 0).length ===
                0 && (
                <div className="p-8 text-center text-neutral-500 text-sm">
                  Your inventory is empty.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spells Dialog Overlay */}
      {showSkills && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-indigo-700/50 w-full max-w-md rounded-xl flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center bg-indigo-950/20">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Spells & Abilities
                </h2>
              </div>
              <button
                onClick={() => {
                  playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                  setShowSkills(false);
                }}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gamePackage.abilities
                .filter((skill) =>
                  (saveData.known_skills || []).includes(skill.id),
                )
                .map((skill) => {
                return (
                  <div
                    key={skill.id}
                    className="bg-neutral-800/50 border border-neutral-800/80 rounded-lg p-3 flex flex-col gap-2 relative"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-indigo-100">
                        {skill.display_name}
                      </h3>
                      <div className="flex gap-2 text-xs font-mono">
                        <span className="text-amber-400">
                          AP: {skill.ap_cost}
                        </span>
                        {skill.mp_cost > 0 && (
                          <span className="text-blue-400">
                            MP: {skill.mp_cost}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {skill.description}
                    </p>
                    <div className="flex gap-2 text-[10px] text-neutral-500 uppercase tracking-wider mt-1">
                      <span className="px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-700/50">
                        Target: {skill.targeting}
                      </span>
                      <span className="px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-700/50">
                        Range: {skill.range}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-700/50 ${skill.element === "none" ? "" : "text-" + skill.element + "-400"}`}
                      >
                        El: {skill.element}
                      </span>
                    </div>
                    <button
                      className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors w-full flex items-center justify-center gap-2 font-bold"
                      onClick={() => beginTargeting(skill.id)}
                    >
                      <Hand className="w-3.5 h-3.5" />
                      Cast
                    </button>
                  </div>
                );
              })}
              {gamePackage.abilities.filter((skill) =>
                (saveData.known_skills || []).includes(skill.id),
              ).length === 0 && (
                <div className="p-8 text-center text-neutral-500 text-sm">
                  You know no rites yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save / Load Menu Overlay */}
      {showSaveMenu && (
        <div className="absolute inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-900/60 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center bg-amber-950/20">
              <h2 className="font-bold text-amber-100 flex items-center gap-2">
                <Save className="w-5 h-5" />
                The Candle Remembers
              </h2>
              <button
                onClick={() => {
                  playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                  setShowSaveMenu(false);
                }}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => i + 1).map(
                (slot) => {
                  // saveSlotRevision keeps this read fresh after writes.
                  void saveSlotRevision;
                  const data = readSaveSlot(slot);
                  const meta = data?.meta;
                  const minutes = Math.floor(meta?.clock_minutes ?? 0);
                  const metaLine = meta
                    ? `Day ${Math.floor(minutes / 1440) + 1} · ${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")} — ${new Date(meta.saved_at).toLocaleString()}`
                    : "— an unlit wick —";
                  const versionOk =
                    meta?.package_version === gamePackage.metadata.version;
                  return (
                    <div
                      key={slot}
                      className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-3 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-neutral-200 text-sm">
                          Memory {slot}
                        </span>
                        {meta && !versionOk && (
                          <span className="text-[10px] uppercase tracking-wider text-red-400">
                            older build
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{metaLine}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (usePlayStore.getState().saveToSlot(slot)) {
                              playSfx("save_candle", {
                                volume: 0.34,
                                cooldownMs: 120,
                              });
                              addLog(`The candle keeps this moment. (Memory ${slot})`);
                              setSaveSlotRevision((r) => r + 1);
                            }
                          }}
                          className="flex-1 text-xs bg-amber-600/90 hover:bg-amber-500 text-amber-50 px-3 py-1.5 rounded font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          disabled={!data || !versionOk}
                          onClick={() => {
                            const error = usePlayStore
                              .getState()
                              .loadFromSlot(slot, gamePackage.metadata.version);
                            if (error) {
                              playSfx("warning", { volume: 0.24, cooldownMs: 120 });
                              addLog(error);
                            } else {
                              playSfx("ui_click", { volume: 0.22, cooldownMs: 120 });
                              setShowSaveMenu(false);
                            }
                          }}
                          className="flex-1 text-xs bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 px-3 py-1.5 rounded font-medium transition-colors"
                        >
                          Load
                        </button>
                        <button
                          disabled={!data}
                          onClick={() => {
                            playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                            deleteSaveSlot(slot);
                            setSaveSlotRevision((r) => r + 1);
                          }}
                          className="text-xs bg-neutral-800 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-400 px-2.5 py-1.5 rounded transition-colors"
                          title="Forget this memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Panel — only visible for dialogue / shop / document interactions */}
      <div
        className={`shrink-0 transition-all duration-300 ${bottomPanelOpen ? `h-[18rem] sm:h-[22rem] z-30 border-t-2 border-sacred-gold ${dialogueHasSceneImage ? "bg-black/25" : "bg-sacred-parchment"} shadow-[0_-10px_30px_rgba(0,0,0,0.9)]` : "h-0 overflow-hidden"} flex flex-col justify-center items-center relative`}
      >
        {activeShopId ? (
          (() => {
            const shop = gamePackage.shops?.find((s) => s.id === activeShopId);
            if (!shop) {
              return (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-neutral-500">Shop not found.</p>
                  <button
                    onClick={() => {
                      playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                      closeShop();
                    }}
                    className="px-4 py-2 bg-neutral-800 rounded"
                  >
                    Close
                  </button>
                </div>
              );
            }
            return (
              <div className="w-full h-full flex flex-col bg-transparent relative z-20">
                <div className="px-6 py-4 border-b border-[var(--color-sacred-gold-dark)] flex justify-between items-center relative">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-sacred-gold)] flex items-center gap-2 uppercase tracking-wider text-sacred-glow">
                    <Briefcase className="w-5 h-5 text-[var(--color-sacred-gold)]" />
                    {shop.display_name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-[var(--color-sacred-ink)] font-serif font-bold text-lg px-3 py-1 flex items-center gap-1.5 drop-shadow-md">
                      <span className="text-[var(--color-sacred-gold)]">☩</span> {saveData.money || 0}
                    </div>
                    <button
                      onClick={() => {
                        playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                        closeShop();
                      }}
                      className="p-1 hover:bg-black/20 rounded text-[var(--color-sacred-ink-dim)] hover:text-[var(--color-sacred-ink)] transition-colors"
                    >
                      <X className="w-6 h-6 drop-shadow-md" />
                    </button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  {(() => {
                    const stock = shop.items.filter((item) =>
                      evaluateCondition(item.condition, shopConditionCtx),
                    );
                    if (stock.length === 0) {
                      return (
                        <p className="text-neutral-500 text-center py-8">
                          This shop has no items.
                        </p>
                      );
                    }
                    return (
                    <div className="space-y-2">
                      {stock.map((item, idx) => {
                        const itemDef = gamePackage.items?.find(
                          (i) => i.id === item.item_id,
                        );
                        if (!itemDef) return null;
                        const price = computeShopPrice(
                          item.price,
                          item.price_modifiers,
                          shopConditionCtx,
                        );
                        const canAfford = (saveData.money || 0) >= price;

                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-4 bg-transparent border-b border-[var(--color-sacred-gold-dark)]/30 hover:bg-black/10 transition-colors"
                          >
                            <div>
                              <div className="font-[family-name:var(--font-display)] text-[var(--color-sacred-ink)] font-bold tracking-wider text-lg">
                                {itemDef.display_name}
                              </div>
                              <div className="font-serif text-[var(--color-sacred-ink-dim)] italic">
                                {itemDef.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div
                                className={`font-serif font-bold text-lg ${canAfford ? "text-[var(--color-sacred-ink)]" : "text-[#8b1c1c]"}`}
                              >
                                {price} <span className="text-[var(--color-sacred-gold)]">☩</span>
                                {price !== item.price && (
                                  <span className="text-sm text-[var(--color-sacred-ink-dim)] line-through ml-2">
                                    {item.price}
                                  </span>
                                )}
                              </div>
                              <button
                                disabled={!canAfford}
                                onClick={() => {
                                  if (canAfford) {
                                    updateMoney(-price);
                                    usePlayStore
                                      .getState()
                                      .giveItem(item.item_id, 1);
                                    playSfx("coin", { volume: 0.34, cooldownMs: 100 });
                                    addLog(`Bought ${itemDef.display_name}.`);
                                  } else {
                                    playSfx("warning", {
                                      volume: 0.24,
                                      cooldownMs: 120,
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-sacred-stone border border-sacred-gold text-[var(--color-sacred-gold)] hover:brightness-125 disabled:opacity-50 disabled:grayscale rounded-sm font-[family-name:var(--font-display)] tracking-wider text-sm shadow-md transition-all"
                              >
                                Purchase
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()
        ) : activeContainerId ? (
          (() => {
            const container = activeMap.container_placements?.find(
              (c) => c.id === activeContainerId,
            );
            if (!container) {
              return (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-neutral-500">Container not found.</p>
                  <button
                    onClick={() => {
                      playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                      closeContainer();
                    }}
                    className="px-4 py-2 bg-neutral-800 rounded"
                  >
                    Close
                  </button>
                </div>
              );
            }
            const containerState = getContainerRuntimeState(
              container,
              saveData,
              activeMap.id,
            );
            const containerName = container.display_name || "Container";
            const setContainerItems = (
              items: { item_id: string; count: number }[],
            ) =>
              usePlayStore
                .getState()
                .updateContainerState(activeMap.id, container.id, { items });
            const takeEntry = (index: number) => {
              const entry = containerState.items[index];
              if (!entry) return;
              usePlayStore.getState().giveItem(entry.item_id, entry.count);
              playSfx("item_pickup", { volume: 0.34, cooldownMs: 100 });
              const itemDef = gamePackage.items.find(
                (i) => i.id === entry.item_id,
              );
              addLog(
                `Took ${entry.count > 1 ? `${entry.count}x ` : ""}${itemDef?.display_name || entry.item_id}.`,
              );
              setContainerItems(
                containerState.items.filter((_, i) => i !== index),
              );
            };
            const stowItem = (itemId: string) => {
              usePlayStore.getState().removeItem(itemId, 1);
              playSfx("ui_click", { volume: 0.22, cooldownMs: 100 });
              const existingIndex = containerState.items.findIndex(
                (entry) => entry.item_id === itemId,
              );
              const items =
                existingIndex >= 0
                  ? containerState.items.map((entry, i) =>
                      i === existingIndex
                        ? { ...entry, count: entry.count + 1 }
                        : entry,
                    )
                  : [...containerState.items, { item_id: itemId, count: 1 }];
              setContainerItems(items);
              const itemDef = gamePackage.items.find((i) => i.id === itemId);
              addLog(`Stowed ${itemDef?.display_name || itemId}.`);
            };
            const stowableInventory = (saveData.inventory || []).filter(
              (entry) => entry.count > 0,
            );

            return (
              <div className="w-full h-full flex flex-col bg-transparent relative z-20">
                <div className="px-6 py-4 border-b border-[var(--color-sacred-gold-dark)] flex justify-between items-center relative">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-sacred-gold)] flex items-center gap-2 uppercase tracking-wider text-sacred-glow">
                    <Briefcase className="w-5 h-5 text-[var(--color-sacred-gold)]" />
                    {containerName}
                  </h3>
                  <div className="flex items-center gap-3">
                    {containerState.items.length > 0 && (
                      <button
                        onClick={() => {
                          containerState.items.forEach((entry) => {
                            usePlayStore
                              .getState()
                              .giveItem(entry.item_id, entry.count);
                          });
                          playSfx("item_pickup", { volume: 0.38, cooldownMs: 120 });
                          addLog(`Emptied ${containerName}.`);
                          setContainerItems([]);
                        }}
                        className="px-4 py-2 bg-sacred-stone border border-sacred-gold text-[var(--color-sacred-gold)] hover:brightness-125 rounded-sm text-xs font-[family-name:var(--font-display)] font-bold tracking-wider transition-all shadow-md"
                      >
                        Take All
                      </button>
                    )}
                    <button
                      onClick={() => {
                        playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                        closeContainer();
                      }}
                      className="p-1 hover:bg-black/20 rounded text-[var(--color-sacred-ink-dim)] hover:text-[var(--color-sacred-ink)] transition-colors"
                    >
                      <X className="w-6 h-6 drop-shadow-md" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-2">
                  {containerState.items.length === 0 ? (
                    <p className="text-neutral-600 text-center text-sm py-3">
                      Empty.
                    </p>
                  ) : (
                    containerState.items.map((entry, index) => {
                      const itemDef = gamePackage.items.find(
                        (i) => i.id === entry.item_id,
                      );
                      return (
                        <div
                          key={`${entry.item_id}_${index}`}
                          className="flex justify-between items-center p-3 bg-transparent border-b border-[var(--color-sacred-gold-dark)]/30 hover:bg-black/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl">
                              {itemDef?.icon || "📦"}
                            </span>
                            <span className="text-lg font-[family-name:var(--font-display)] font-bold tracking-wider text-[var(--color-sacred-ink)] truncate">
                              {itemDef?.display_name || entry.item_id}
                              {entry.count > 1 ? ` x${entry.count}` : ""}
                            </span>
                          </div>
                          <button
                            onClick={() => takeEntry(index)}
                            className="px-4 py-2 bg-sacred-stone border border-sacred-gold text-[var(--color-sacred-gold)] hover:brightness-125 rounded-sm text-xs font-[family-name:var(--font-display)] font-bold tracking-wider transition-all shadow-md shrink-0"
                          >
                            Take
                          </button>
                        </div>
                      );
                    })
                  )}
                  <div className="pt-2 border-t border-neutral-800">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                      Your Pack
                    </div>
                    {stowableInventory.length === 0 ? (
                      <p className="text-neutral-600 text-sm">
                        Nothing to stow.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {stowableInventory.map((entry) => {
                          const itemDef = gamePackage.items.find(
                            (i) => i.id === entry.id,
                          );
                          return (
                            <div
                              key={entry.id}
                              className="flex justify-between items-center p-3 bg-transparent border-b border-[var(--color-sacred-gold-dark)]/30 hover:bg-black/10 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xl">
                                  {itemDef?.icon || "📦"}
                                </span>
                                <span className="text-md font-serif text-[var(--color-sacred-ink)] truncate drop-shadow-sm">
                                  {itemDef?.display_name || entry.id} <span className="text-[var(--color-sacred-gold)]">x</span>
                                  {entry.count}
                                </span>
                              </div>
                              <button
                                onClick={() => stowItem(entry.id)}
                                className="px-4 py-2 bg-black border border-[var(--color-sacred-gold-dark)] text-[var(--color-sacred-ink)] hover:brightness-125 rounded-sm text-xs font-[family-name:var(--font-display)] font-bold tracking-wider transition-all shadow-md shrink-0"
                              >
                                Stow
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : activeDocumentId ? (
          (() => {
            const document = gamePackage.documents?.find(
              (d) => d.id === activeDocumentId,
            );
            if (!document) {
              return (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-neutral-500">Document not found.</p>
                  <button
                    onClick={() => {
                      playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                      setActiveDocumentId(null);
                    }}
                    className="px-4 py-2 bg-neutral-800 rounded"
                  >
                    Close
                  </button>
                </div>
              );
            }
            return (
              <div className="w-full max-w-2xl h-full flex flex-col bg-transparent relative z-20">
                <div className="px-4 py-2 sm:px-6 sm:py-4 border-b border-[var(--color-sacred-gold-dark)] flex justify-between items-center relative shrink-0">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-base sm:text-2xl text-[var(--color-sacred-gold)] uppercase tracking-[0.2em] text-sacred-glow leading-tight">
                    {document.display_name}
                  </h3>
                  <button
                    onClick={() => {
                      playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                      setActiveDocumentId(null);
                    }}
                    className="p-1 hover:bg-black/20 rounded text-[var(--color-sacred-ink-dim)] hover:text-[var(--color-sacred-ink)] transition-colors shrink-0 ml-2"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
                  </button>
                </div>
                <div
                  className="px-4 py-3 sm:p-8 flex-1 overflow-y-auto font-serif text-sm sm:text-xl leading-relaxed sm:leading-loose text-[var(--color-sacred-ink)] whitespace-pre-wrap tracking-wide drop-shadow-sm text-justify"
                  style={{ touchAction: 'pan-y' }}
                >
                  {document.content}
                </div>
              </div>
            );
          })()
        ) : activeDialogueId && activeDialogueNodeId ? (
          (() => {
            const dialogue = gamePackage.dialogue.find(
              (d) => d.id === activeDialogueId,
            );
            const node = dialogue?.nodes.find(
              (n) => n.id === activeDialogueNodeId,
            );
            if (!node) {
              return (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-neutral-500">Conversation ended.</p>
                  <button
                    onClick={() => {
                      playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                      endDialogue();
                    }}
                    className="px-4 py-2 bg-neutral-800 rounded"
                  >
                    Close
                  </button>
                </div>
              );
            }
            const dialogueFlags = saveData.flags || {};
            const dialogueCtx = buildConditionContext(saveData);
            const visibleOptions = node.options.filter((opt) => {
              if (
                opt.required_quest &&
                opt.required_quest_state &&
                saveData.quests[opt.required_quest] !==
                  opt.required_quest_state
              )
                return false;
              if (
                opt.required_switch &&
                !!dialogueFlags[opt.required_switch] !==
                  (opt.required_switch_value ?? true)
              )
                return false;
              if (!evaluateCondition(opt.condition, dialogueCtx)) return false;
              return true;
            });
            const sceneImageUrl = node.scene_image_url;
            const hasSceneImage = Boolean(sceneImageUrl);
            return (
              <>
              {hasSceneImage && sceneImageUrl ? (
                <DialogueSceneImageStage
                  src={sceneImageUrl}
                  alt={node.scene_image_alt}
                />
              ) : (
                <DialoguePortraitStage speaker={node.speaker} />
              )}
              <div className={`w-full ${hasSceneImage ? "max-w-3xl bg-black/68 backdrop-blur-[2px] border-x border-[var(--color-sacred-gold)]/55 shadow-[0_0_34px_rgba(0,0,0,0.8)]" : "max-w-2xl bg-black/45 backdrop-blur-[1px] border-x border-[var(--color-sacred-gold-dark)]/40 shadow-[0_0_28px_rgba(0,0,0,0.55)]"} h-full flex flex-col relative z-20`}>
                <div className={`px-4 py-2 sm:px-6 sm:py-4 flex flex-col items-center justify-center border-b ${hasSceneImage ? "border-[var(--color-sacred-gold)]/45" : "border-[var(--color-sacred-gold-dark)]"} relative`}>
                  <h3 className="font-[family-name:var(--font-display)] text-base sm:text-xl font-bold text-[var(--color-sacred-gold)] uppercase tracking-[0.2em] text-sacred-glow">
                    {node.speaker}
                  </h3>
                  {/* Ornate decorative accent below speaker */}
                  <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-sacred-gold-dark)] to-transparent mt-1 sm:mt-2"></div>
                </div>
                <div className="px-4 py-2 sm:p-6 flex-1 overflow-y-auto">
                  <p className={`${hasSceneImage ? "text-neutral-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" : "text-[var(--color-sacred-ink)] drop-shadow-sm"} font-serif text-sm sm:text-lg leading-relaxed text-center`}>
                    {node.text}
                  </p>
                </div>
                <div className={`px-3 py-2 sm:p-4 flex flex-col gap-1.5 sm:gap-2 shrink-0 max-h-[45%] overflow-y-auto overflow-x-hidden border-t ${hasSceneImage ? "border-[var(--color-sacred-gold)]/45" : "border-[var(--color-sacred-gold-dark)]"}`}>
                  {visibleOptions.map((opt, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-1.5 sm:py-2 bg-neutral-800/50 hover:bg-neutral-700 rounded text-xs sm:text-sm text-neutral-300 transition-colors"
                        onClick={() => {
                          playSfx("dialogue_next", {
                            volume: 0.24,
                            cooldownMs: 100,
                          });
                          if (opt.set_switch) {
                            usePlayStore
                              .getState()
                              .setFlag(
                                opt.set_switch,
                                opt.set_switch_value ?? true,
                              );
                          }
                          opt.set_switches?.forEach((switchUpdate) => {
                            usePlayStore
                              .getState()
                              .setFlag(
                                switchUpdate.switch_id,
                                switchUpdate.switch_value ?? true,
                              );
                          });
                          if (opt.trigger_quest && opt.trigger_quest_state) {
                            setQuestState(
                              opt.trigger_quest,
                              opt.trigger_quest_state,
                            );
                            // Also show a toast in log
                            const questName =
                              gamePackage.quests.find(
                                (q) => q.id === opt.trigger_quest,
                              )?.display_name || opt.trigger_quest;
                            addLog(
                              `Quest Updated: ${questName} -> ${opt.trigger_quest_state}`,
                            );
                          }
                          if (!opt.next_node_id) {
                            closeDialogueDoorForCurrentMap(activeDialogueId);
                          }
                          advanceDialogue(opt.next_node_id);
                          if (!opt.next_node_id && opt.trigger_cutscene) {
                            const cutscene = gamePackage.cutscenes.find(
                              (c) => c.id === opt.trigger_cutscene,
                            );
                            if (cutscene) setActiveCutscene(cutscene);
                          }
                        }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  {visibleOptions.length === 0 && (
                    <button
                      onClick={() => {
                        playSfx("ui_back", { volume: 0.2, cooldownMs: 120 });
                        endDialogue();
                      }}
                      className="w-full text-center px-3 py-2 bg-neutral-800/50 hover:bg-neutral-700 rounded text-sm text-neutral-300 transition-colors italic"
                    >
                      (Close)
                    </button>
                  )}
                </div>
              </div>
              </>
            );
          })()
        ) : (
          null
        )}
      </div>
    </div>
  );
}

export function PlayMode() {
  const [state, setState] = useState<"title" | "playing" | "end">("title");
  const { gamePackage } = useEngineStore();
  const hasSave = !!usePlayStore((s) => s.saveData);
  const playTitleSfx = useCallback(
    (id: string, volume = 0.24) => {
      playSound(id, {
        volume,
        customSounds: gamePackage.settings?.sound_effects || {},
      });
    },
    [gamePackage.settings],
  );

  useEffect(() => {
    if (state === "title") {
      playMusic("/music/rain-on-the-ledger.mp3");
    }
  }, [state]);

  if (state === "end") {
    return (
      <div className="h-full bg-neutral-950 text-white relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,20,40,0.98)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center max-w-lg">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-sacred-gold)] to-transparent" />
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-[0.28em] text-[var(--color-sacred-gold)]">
            End of Act I
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base leading-relaxed text-neutral-300 italic">
            The Familiar Dark
          </p>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-sacred-gold)] to-transparent" />
          <button
            className="mt-4 border border-[var(--color-sacred-gold-dark)] bg-black/68 px-7 py-4 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-sacred-ink)] transition-all hover:border-[var(--color-sacred-gold)] hover:bg-black/82 hover:text-[var(--color-sacred-gold)] active:scale-[0.98]"
            onClick={() => setState("title")}
          >
            Return to Title
          </button>
        </div>
      </div>
    );
  }

  if (state === "title") {
    return (
      <div className="h-full bg-neutral-950 text-white relative overflow-hidden">
        <img
          src="/title/familiar-dark-title.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,7,0.92)_0%,rgba(7,8,12,0.66)_34%,rgba(7,8,12,0.18)_68%,rgba(5,5,7,0.44)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.18)_34%,rgba(0,0,0,0.3)_100%)]" />

        <div className="relative z-10 flex h-full w-full flex-col justify-end px-6 pb-8 pt-8 sm:px-12 sm:pb-12 lg:px-16">
          <div className="max-w-[46rem]">
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-[0.18em] text-[var(--color-sacred-ink)] drop-shadow-[0_5px_20px_rgba(0,0,0,0.95)] sm:text-7xl lg:text-8xl">
              {gamePackage.metadata.title || "CRPG Engine"}
            </h1>
            <div className="mt-4 h-px w-44 bg-gradient-to-r from-[var(--color-sacred-gold)] via-[var(--color-sacred-gold-dark)] to-transparent" />
            <p className="mt-4 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.34em] text-[var(--color-sacred-gold)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Version {gamePackage.metadata.version}
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
          <button
            className="border border-[var(--color-sacred-gold-dark)] bg-black/68 px-7 py-4 text-left font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[0.22em] text-[var(--color-sacred-ink)] shadow-[0_0_18px_rgba(0,0,0,0.75)] transition-all hover:border-[var(--color-sacred-gold)] hover:bg-black/82 hover:text-[var(--color-sacred-gold)] active:scale-[0.98] sm:min-w-52 sm:text-center"
            onClick={() => {
              playTitleSfx("ui_click");
              usePlayStore.getState().resetRun();
              usePlayStore.setState({ saveData: null });
              setState("playing");
            }}
          >
            New Game
          </button>
          <button
            className={`border px-7 py-4 text-left font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[0.22em] shadow-[0_0_18px_rgba(0,0,0,0.65)] transition-all sm:min-w-52 sm:text-center ${
              hasSave
                ? "border-[var(--color-sacred-gold-dark)] bg-black/54 text-[var(--color-sacred-ink-dim)] hover:border-[var(--color-sacred-gold)] hover:bg-black/78 hover:text-[var(--color-sacred-gold)] active:scale-[0.98]"
                : "cursor-not-allowed border-neutral-800/70 bg-black/34 text-neutral-600"
            }`}
            onClick={() => {
              if (hasSave) {
                playTitleSfx("ui_click");
                setState("playing");
              } else {
                playTitleSfx("warning", 0.2);
              }
            }}
            disabled={!hasSave}
          >
            Continue Game
          </button>
          </div>
        </div>
      </div>
    );
  }

  return <PlayEngine onGameEnd={() => setState("end")} />;
}

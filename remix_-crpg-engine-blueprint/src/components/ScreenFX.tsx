import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  wrapEffect,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  Effect,
  ChromaticAberrationEffect,
} from "postprocessing";
import { Uniform, Vector2, UnsignedByteType } from "three";
import { useFxStore } from "../store/fxStore";
import { getAudioBass } from "../utils/audioManager";

// ── Custom warp + ripple effect ──────────────────────────────────────────────

const WARP_FRAG = /* glsl */ `
uniform float uTime;
uniform float uHurt;
uniform vec2  uRipple;
uniform float uRippleAge;
uniform float uBass;
uniform float uCombat;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 p = uv;

  // Radial ripple from hurt origin
  vec2 rippleDir = p - uRipple;
  float rippleDist = length(rippleDir);
  float rippleWave = sin(rippleDist * 28.0 - uRippleAge * 14.0) * 0.006;
  float rippleFade = (1.0 - uRippleAge) * smoothstep(0.55, 0.0, rippleDist) * uHurt;
  p += normalize(rippleDir + 0.0001) * rippleWave * rippleFade;

  // Audio-bass barrel breathe + subtle combat swell
  vec2 c = p - 0.5;
  float r2 = dot(c, c);
  p += c * r2 * (0.018 + uBass * 0.045 + uCombat * 0.012);

  outputColor = texture2D(inputBuffer, p);
}
`;

class WarpEffect extends Effect {
  constructor() {
    super("WarpEffect", WARP_FRAG, {
      uniforms: new Map<string, Uniform>([
        ["uTime",      new Uniform(0)],
        ["uHurt",      new Uniform(0)],
        ["uRipple",    new Uniform(new Vector2(0.5, 0.5))],
        ["uRippleAge", new Uniform(1)],
        ["uBass",      new Uniform(0)],
        ["uCombat",    new Uniform(0)],
      ]),
    });
  }
}

// wrapEffect registers the class via extend() and forwards the ref to the live
// Effect instance (React 19 treats ref as a regular prop).
const WarpFX = wrapEffect(WarpEffect);

// ── Props ────────────────────────────────────────────────────────────────────

interface ScreenFXProps {
  inCombat: boolean;
  mapId?: string | null;
}

// ── Frame driver — updates all uniforms each tick ────────────────────────────

function ScreenFXDriver({
  warpRef,
  caRef,
  inCombat,
}: {
  warpRef: RefObject<WarpEffect | null>;
  caRef: RefObject<ChromaticAberrationEffect | null>;
  inCombat: boolean;
}) {
  const playerHurtAt = useFxStore((s) => s.playerHurtAt);

  const combatRamp   = useRef(0);
  const rippleAge    = useRef(1);
  const lastHurtAt   = useRef(0);
  const rippleOrigin = useRef(new Vector2(0.5, 0.5));

  useFrame((_, delta) => {
    const now = performance.now();

    // Detect new hurt event — reset ripple
    if (playerHurtAt !== lastHurtAt.current && playerHurtAt > 0) {
      lastHurtAt.current = playerHurtAt;
      rippleAge.current  = 0;
      rippleOrigin.current.set(0.5, 0.5);
    }

    const hurt = Math.max(0, 1 - (now - playerHurtAt) / 600);

    // Smooth combat ramp: ramps up fast, fades out slowly
    const targetCombat = inCombat ? 1 : 0;
    combatRamp.current += (targetCombat - combatRamp.current) * delta * (inCombat ? 0.9 : 0.4);
    const combat = combatRamp.current;

    rippleAge.current = Math.min(1, rippleAge.current + delta * 1.2);

    const bass = getAudioBass();

    // CA offset: gentle always-on, rises in combat, spikes on hurt.
    // Mutate the effect's own offset Vector2 in place.
    const ca = caRef.current;
    if (ca) {
      ca.offset.x = 0.0006 + combat * 0.0018 + hurt * 0.007 + bass * 0.001;
      ca.offset.y = (0.0006 + combat * 0.0012 + hurt * 0.005) * 0.7;
    }

    // Warp uniforms
    const warp = warpRef.current;
    if (warp) {
      const u = warp.uniforms;
      u.get("uTime")!.value      = now * 0.001;
      u.get("uHurt")!.value      = hurt;
      u.get("uRipple")!.value    = rippleOrigin.current;
      u.get("uRippleAge")!.value = rippleAge.current;
      u.get("uBass")!.value      = bass;
      u.get("uCombat")!.value    = combat;
    }
  });

  return null;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function ScreenFX({ inCombat, mapId }: ScreenFXProps) {
  const warpRef = useRef<WarpEffect>(null);
  const caRef   = useRef<ChromaticAberrationEffect>(null);

  const underground =
    (mapId?.includes("network") || mapId?.includes("cave") || mapId?.includes("depth")) ?? false;

  return (
    <>
      <ScreenFXDriver warpRef={warpRef} caRef={caRef} inCombat={inCombat} />
      <EffectComposer multisampling={0} frameBufferType={UnsignedByteType}>
        <WarpFX ref={warpRef} />
        <Bloom
          mipmapBlur
          intensity={underground ? 0.55 : 0.3}
          luminanceThreshold={underground ? 0.78 : 0.85}
          luminanceSmoothing={0.03}
          radius={0.6}
          levels={7}
        />
        <ChromaticAberration
          ref={caRef}
          offset={new Vector2(0.0006, 0.0004)}
        />
        <Vignette
          eskil={false}
          offset={0.3}
          darkness={underground ? 0.72 : 0.48}
        />
        <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.06} />
      </EffectComposer>
    </>
  );
}

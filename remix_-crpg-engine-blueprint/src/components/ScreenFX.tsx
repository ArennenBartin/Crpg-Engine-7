import { useRef, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";
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
        ["uTime",       new Uniform(0)],
        ["uHurt",       new Uniform(0)],
        ["uRipple",     new Uniform(new Vector2(0.5, 0.5))],
        ["uRippleAge",  new Uniform(1)],
        ["uBass",       new Uniform(0)],
        ["uCombat",     new Uniform(0)],
      ]),
    });
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ScreenFXProps {
  inCombat: boolean;
  mapId?: string | null;
}

// ── Driver component (must live inside <Canvas>) ─────────────────────────────

function ScreenFXDriver({
  warpEffect,
  caOffsetRef,
  inCombat,
}: {
  warpEffect: WarpEffect;
  caOffsetRef: RefObject<Vector2>;
  inCombat: boolean;
}) {
  const playerHurtAt = useFxStore((s) => s.playerHurtAt);

  const combatRamp    = useRef(0);
  const hurtDecay     = useRef(0);
  const rippleAge     = useRef(1);
  const lastHurtAt    = useRef(0);
  const rippleOrigin  = useRef(new Vector2(0.5, 0.5));

  useFrame((_, delta) => {
    const now = performance.now();

    // Detect new hurt event
    if (playerHurtAt !== lastHurtAt.current && playerHurtAt > 0) {
      lastHurtAt.current = playerHurtAt;
      rippleAge.current  = 0;
      rippleOrigin.current.set(0.5, 0.5); // screen center approximation
    }

    // Decay hurt intensity over 600ms
    hurtDecay.current = Math.max(0, 1 - (now - playerHurtAt) / 600);

    // Smooth combat ramp: 0.9× speed up, 0.4× speed down
    const targetCombat = inCombat ? 1 : 0;
    const rampSpeed = inCombat ? 0.9 : 0.4;
    combatRamp.current += (targetCombat - combatRamp.current) * delta * rampSpeed;

    // Ripple age advances, capped at 1
    rippleAge.current = Math.min(1, rippleAge.current + delta * 1.2);

    const bass   = getAudioBass();
    const hurt   = hurtDecay.current;
    const combat = combatRamp.current;

    // CA offset: gentle always-on + combat raise + hurt spike
    const caX = 0.0006 + combat * 0.0018 + hurt * 0.007 + bass * 0.001;
    const caY = (0.0006 + combat * 0.0012 + hurt * 0.005) * 0.7;
    caOffsetRef.current!.set(caX, caY);

    // Warp uniforms
    const u = warpEffect.uniforms;
    u.get("uTime")!.value      = now * 0.001;
    u.get("uHurt")!.value      = hurt;
    u.get("uRipple")!.value    = rippleOrigin.current;
    u.get("uRippleAge")!.value = rippleAge.current;
    u.get("uBass")!.value      = bass;
    u.get("uCombat")!.value    = combat;
  });

  return null;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function ScreenFX({ inCombat, mapId }: ScreenFXProps) {
  const warpEffect = useMemo(() => new WarpEffect(), []);
  const caOffset   = useRef(new Vector2(0.0006, 0.0004));

  const underground =
    (mapId?.includes("network") || mapId?.includes("cave") || mapId?.includes("depth")) ?? false;

  return (
    <>
      <ScreenFXDriver
        warpEffect={warpEffect}
        caOffsetRef={caOffset}
        inCombat={inCombat}
      />
      <EffectComposer multisampling={0} disableNormalPass>
        <primitive object={warpEffect} />
        <ChromaticAberration offset={caOffset.current} />
        <Vignette
          eskil={false}
          offset={0.3}
          darkness={underground ? 0.72 : 0.48}
        />
        <Noise
          blendFunction={BlendFunction.OVERLAY}
          opacity={0.06}
        />
      </EffectComposer>
    </>
  );
}

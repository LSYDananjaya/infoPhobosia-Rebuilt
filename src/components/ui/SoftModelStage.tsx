"use client";

import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { Pause, Play, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { PhobosiaLoader } from "@/components/ui/PhobosiaLoader";
import { getScrollVersion, subscribeScrollProgress } from "@/lib/viewportMetrics";

useGLTF.setDecoderPath("/draco/");

// Reserve 1 WebGL context for singleton LiquidGlassEngine so live contexts never exceed 4.
const MAX_ACTIVE_WEBGL_STAGES = 3;
const activeStageSlots = new Set<symbol>();
const pendingStageQueue = new Map<symbol, (granted: boolean) => void>();

function syncStageSlots() {
  for (const [id, setGranted] of pendingStageQueue) {
    if (activeStageSlots.size >= MAX_ACTIVE_WEBGL_STAGES) break;
    activeStageSlots.add(id);
    pendingStageQueue.delete(id);
    setGranted(true);
  }
}

function claimWebGLSlot(id: symbol, setGranted: (granted: boolean) => void) {
  if (activeStageSlots.has(id)) {
    setGranted(true);
    return;
  }
  if (activeStageSlots.size < MAX_ACTIVE_WEBGL_STAGES) {
    activeStageSlots.add(id);
    setGranted(true);
  } else {
    pendingStageQueue.delete(id);
    pendingStageQueue.set(id, setGranted);
    setGranted(false);
  }
}

function releaseWebGLSlot(id: symbol) {
  const removed = activeStageSlots.delete(id);
  pendingStageQueue.delete(id);
  if (removed) {
    syncStageSlots();
  }
}

const THREE_CLOCK_DEPRECATION =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

let consoleFilterInstalled = false;
function installThreeConsoleFilter() {
  if (consoleFilterInstalled || typeof window === "undefined") return;
  consoleFilterInstalled = true;
  const prev = THREE.getConsoleFunction();
  THREE.setConsoleFunction((type, message, ...params) => {
    // @react-three/fiber@9.8.2 internally instantiates THREE.Clock when creating Canvas stores;
    // suppress only that upstream deprecation notice under three@0.187+ while keeping all other logs.
    if (type === "warn" && message === THREE_CLOCK_DEPRECATION) {
      return;
    }
    if (prev) {
      prev(type, message, ...params);
    } else {
      console[type](message, ...params);
    }
  });
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: () => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface LoadedModelProps {
  modelUrl: string;
  targetScale: number;
  paused: boolean;
  reducedMotion: boolean;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  baseRotation?: [number, number, number];
  onReady: () => void;
}

function LoadedSoftModel({
  modelUrl,
  targetScale,
  paused,
  reducedMotion,
  pointerRef,
  scrollProgressRef,
  baseRotation = [0.12, -0.42, 0],
  onReady,
}: LoadedModelProps) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);
  const spinTimeRef = useRef(0);
  const timer = useMemo(() => new THREE.Timer(), []);
  const { gl } = useThree();

  // Clone scene safely per mount so instances remain independent
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const normScale = targetScale / maxDim;
    clone.scale.setScalar(normScale);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, targetScale]);

  useEffect(() => {
    timer.connect(document);
    return () => {
      timer.disconnect();
      timer.dispose();
    };
  }, [timer]);

  useEffect(() => {
    gl.domElement.setAttribute("role", "img");
    gl.domElement.setAttribute("aria-label", `Interactive 3D view for ${modelUrl}`);
    onReady();
  }, [gl, modelUrl, onReady]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    timer.update();
    const clampedDelta = Math.min(delta, 0.05);
    const timerDelta = Math.min(timer.getDelta(), 0.05);
    if (!paused && !reducedMotion) {
      spinTimeRef.current += timerDelta > 0 ? timerDelta : clampedDelta;
    }

    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    const scrollRot = reducedMotion ? 0 : scrollProgressRef.current * 0.85;

    const targetRotX = baseRotation[0] + py * 0.18;
    const targetRotY =
      baseRotation[1] +
      px * 0.34 +
      scrollRot +
      (!reducedMotion ? spinTimeRef.current * 0.14 : 0);

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 5, clampedDelta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 5, clampedDelta);

    const targetY =
      !paused && !reducedMotion ? Math.sin(spinTimeRef.current * 1.15) * 0.07 : 0;
    group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 4, clampedDelta);
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

export interface SoftModelStageProps {
  modelUrl: string;
  posterSrc: string;
  alt: string;
  className?: string;
  targetScale?: number;
  cameraPosition?: [number, number, number];
  fov?: number;
  interactive?: boolean;
  priorityPoster?: boolean;
  showControls?: boolean;
  baseRotation?: [number, number, number];
  lightingPreset?: "outpost-night" | "studio";
}

export function SoftModelStage({
  modelUrl,
  posterSrc,
  alt,
  className = "",
  targetScale = 2.55,
  cameraPosition = [0, 0.9, 4.4],
  fov = 38,
  interactive = false,
  priorityPoster = false,
  showControls = false,
  baseRotation = [0.12, -0.45, 0],
  lightingPreset = "studio",
}: SoftModelStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);
  const rectRef = useRef<DOMRect | null>(null);
  const rectScrollVersionRef = useRef(-1);
  const stageIdRef = useRef<symbol | null>(null);
  if (stageIdRef.current === null) {
    stageIdRef.current = Symbol("soft-model-stage");
  }

  const [inView, setInView] = useState(priorityPoster);
  const [slotGranted, setSlotGranted] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [controlsResetKey, setControlsResetKey] = useState(0);
  const [resolvedPosterSrc, setResolvedPosterSrc] = useState(posterSrc);

  useEffect(() => {
    installThreeConsoleFilter();
  }, []);

  useEffect(() => {
    setResolvedPosterSrc(posterSrc);
  }, [posterSrc]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        setInView(Boolean(entries[0]?.isIntersecting));
      },
      { rootMargin: "220px 0px" }
    );
    intersectionObserver.observe(el);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        rectRef.current = null;
      });
      resizeObserver.observe(el);
    }

    return () => {
      intersectionObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const id = stageIdRef.current!;
    if (inView && !webglFailed) {
      claimWebGLSlot(id, setSlotGranted);
    } else {
      setModelReady(false);
      releaseWebGLSlot(id);
      setSlotGranted(false);
    }
    return () => {
      releaseWebGLSlot(id);
    };
  }, [inView, webglFailed]);

  useEffect(() => {
    return subscribeScrollProgress((progress) => {
      scrollProgressRef.current = progress;
    });
  }, []);

  const refreshContainerRect = () => {
    const el = containerRef.current;
    if (!el) return;
    rectRef.current = el.getBoundingClientRect();
    rectScrollVersionRef.current = getScrollVersion();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rectRef.current || rectScrollVersionRef.current !== getScrollVersion()) {
      refreshContainerRect();
    }
    const rect = rectRef.current;
    if (!rect || !rect.width || !rect.height) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
  };

  const fallbackView = (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <img
        src={resolvedPosterSrc}
        alt={alt}
        width={1024}
        height={1024}
        loading={priorityPoster ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priorityPoster ? "high" : "auto"}
        onError={() => {
          if (resolvedPosterSrc !== "/images/outpost_1.png") {
            setResolvedPosterSrc("/images/outpost_1.png");
          }
        }}
        className="w-full h-full object-contain select-none drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)] transition-transform duration-500"
      />
    </div>
  );

  const canvasActive = inView && slotGranted && !webglFailed;

  return (
    <div
      ref={containerRef}
      onPointerEnter={refreshContainerRect}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-full select-none ${className}`}
    >
      {/* Instant high-DPI studio WebP render visible until WebGL crossfades in */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
          canvasActive && modelReady ? "opacity-0" : "opacity-100"
        }`}
      >
        <img
          src={resolvedPosterSrc}
          alt={alt}
          width={1024}
          height={1024}
          loading={priorityPoster ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priorityPoster ? "high" : "auto"}
          onError={() => {
            if (resolvedPosterSrc !== "/images/outpost_1.png") {
              setResolvedPosterSrc("/images/outpost_1.png");
            }
          }}
          className="w-full h-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
        />
      </div>

      {/* Live WebGL Soft-3D Canvas */}
      {canvasActive && (
        <WebGLErrorBoundary
          fallback={fallbackView}
          onError={() => setWebglFailed(true)}
        >
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              modelReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <Canvas
              key={controlsResetKey}
              dpr={[1, 2]}
              camera={{ position: cameraPosition, fov, near: 0.1, far: 50 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.08,
              }}
              onCreated={({ gl }) => {
                gl.domElement.addEventListener("webglcontextlost", (ev) => {
                  ev.preventDefault();
                  setWebglFailed(true);
                });
              }}
            >
              {lightingPreset === "outpost-night" ? (
                <>
                  <ambientLight intensity={0.22} color="#1e1b2e" />
                  <hemisphereLight args={["#ff9e64", "#090504", 0.42]} />
                  <directionalLight position={[2.5, 5.2, 3.2]} intensity={1.65} color="#ffc294" />
                  <pointLight position={[-0.9, 1.3, 0.4]} intensity={3.2} distance={5.5} decay={1.6} color="#ffaa6b" />
                  <pointLight position={[0.7, 1.2, -0.4]} intensity={2.4} distance={4.8} decay={1.6} color="#ffd2a6" />
                  <pointLight position={[-0.5, 1.1, -0.9]} intensity={2.0} distance={4.5} decay={1.6} color="#ff8547" />
                  <Environment resolution={128} frames={1}>
                    <Lightformer
                      form="rect"
                      intensity={1.1}
                      color="#ffae78"
                      position={[2, 4, 2]}
                      scale={[5, 2.5, 1]}
                      target={[0, 0, 0]}
                    />
                    <Lightformer
                      form="circle"
                      intensity={0.65}
                      color="#38bdf8"
                      position={[-4, 2, -2]}
                      scale={3}
                      target={[0, 0, 0]}
                    />
                  </Environment>
                </>
              ) : (
                <>
                  <ambientLight intensity={0.48} />
                  <hemisphereLight args={["#dbeafe", "#7c2d12", 0.6]} />
                  <directionalLight position={[4.5, 5.5, 4.0]} intensity={2.35} color="#ffdcc2" />
                  <directionalLight position={[-4.5, 3.0, 2.5]} intensity={1.45} color="#7dd3fc" />
                  <directionalLight position={[0, 4.0, -5.0]} intensity={1.6} color="#ffffff" />

                  <Environment resolution={128} frames={1}>
                    <Lightformer
                      form="rect"
                      intensity={2.4}
                      color="#ffe4cf"
                      position={[3, 4, 3]}
                      scale={[6, 3, 1]}
                      target={[0, 0, 0]}
                    />
                    <Lightformer
                      form="circle"
                      intensity={1.75}
                      color="#7dd3fc"
                      position={[-4, 2, 2]}
                      scale={4}
                      target={[0, 0, 0]}
                    />
                  </Environment>
                </>
              )}

              <Suspense fallback={null}>
                <LoadedSoftModel
                  modelUrl={modelUrl}
                  targetScale={targetScale}
                  paused={paused}
                  reducedMotion={reducedMotion}
                  pointerRef={pointerRef}
                  scrollProgressRef={scrollProgressRef}
                  baseRotation={baseRotation}
                  onReady={() => setModelReady(true)}
                />
                <ContactShadows
                  position={[0, -1.08, 0]}
                  opacity={0.48}
                  scale={6.5}
                  blur={2.6}
                  far={3.5}
                  frames={1}
                  color="#020409"
                />
              </Suspense>

              {interactive && (
                <OrbitControls
                  makeDefault
                  enableZoom={false}
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.08}
                  minPolarAngle={Math.PI * 0.25}
                  maxPolarAngle={Math.PI * 0.62}
                />
              )}
            </Canvas>
          </div>
        </WebGLErrorBoundary>
      )}

      {/* Live WebGL hydration status telemetry */}
      <AnimatePresence>
        {canvasActive && !modelReady && (
          <motion.div
            key="model-hydrating"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28 }}
            className="absolute top-3.5 right-3.5 z-20 pointer-events-none"
          >
            <PhobosiaLoader
              variant="pill"
              state="synthesizing"
              label="Hydrating Mesh"
              detail="Draco GLB"
              timer={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessible Motion Controls (required for continuous motion > 5s) */}
      {showControls && canvasActive && modelReady && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
          <LiquidGlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Resume 3D outpost rotation" : "Pause 3D outpost rotation"}
            contentClassName="text-xs"
          >
            {paused ? (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Play 3D</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause 3D</span>
              </>
            )}
          </LiquidGlassButton>

          {interactive && (
            <LiquidGlassButton
              type="button"
              variant="glass"
              size="icon"
              onClick={() => setControlsResetKey((k) => k + 1)}
              aria-label="Reset 3D camera angle"
              title="Reset 3D camera angle"
              contentClassName="min-w-[38px] min-h-[38px] p-2"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </LiquidGlassButton>
          )}
        </div>
      )}
    </div>
  );
}

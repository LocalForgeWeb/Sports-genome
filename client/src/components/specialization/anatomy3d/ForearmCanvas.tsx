import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cameraPresets, revealPresets } from "./settings";
import { manifestById, muscleLayerNames, muscleManifest } from "./muscleManifest";
import type { CanvasFailure, CanvasStatus, MuscleId, Side } from "./modelTypes";

/**
 * The 3D forearm (SG-FOREARM-INTEGRATION-20261019 §3, §7, §8).
 *
 * THIRD-PARTY SCENE, ADAPTED. The scene is the handoff's src/anatomy/ForearmCanvas.tsx: its
 * renderer settings, lights, fog, material palette, the filtering of the GLB down to the
 * forearm, the reveal presets, the orange selection (tint, emissive, outline) and the camera
 * easing are kept as supplied, so the approved look is unchanged. What the integration changed:
 *
 * - Assets: the model and decoder URLs come from props (configurable, deployment-safe).
 * - Left arm: the model is a right arm mirrored by a negative x scale; the camera presets'
 *   x is now mirrored with it, so a left-arm muscle is framed from the same anatomical side.
 * - Overview: the camera looks at the middle of the forearm and hand the overview shows, not
 *   the middle of the whole upper-limb file (most of it hidden), so the forearm is centred.
 * - The selected muscle draws its front faces only while it is drawn over the faded context
 *   (depthTest off), so its far side no longer paints over its near side (§7 depthTest review).
 * - Rendering is on demand: frames run while the camera eases, the controls move or damp,
 *   and stop when nothing changes; they also pause while the page is hidden or the canvas is
 *   scrolled out of view.
 * - Dragging the model cancels an automatic camera move rather than fighting it.
 * - WebGL that cannot start, a model or decoder that does not load, and a lost context are
 *   reported separately, so the page can offer the right recovery.
 * - Cleanup disposes geometries, materials, textures, the decoder's workers, the controls and
 *   the renderer, and releases the WebGL context, so a revisit starts clean.
 * - The unused selection tracer (never created in the supplied code) was removed.
 */

interface ForearmCanvasProps {
  modelUrl: string;
  decoderPath: string;
  selectedMuscleId: MuscleId | null;
  side: Side;
  reducedMotion: boolean;
  /** What the canvas is showing, said to assistive technology (the canvas is an image to them). */
  label: string;
  onMuscleSelect: (muscleId: MuscleId) => void;
  onStatusChange: (status: CanvasStatus, failure?: CanvasFailure) => void;
}

type ManagedMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  flatShading?: boolean;
};

type ManagedMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> & {
  userData: { muscleId?: MuscleId };
};

interface Controller {
  select: (muscleId: MuscleId | null) => void;
  setSide: (nextSide: Side) => void;
  setReducedMotion: (shouldReduce: boolean) => void;
}

const selectedColor = new THREE.Color("#F15A32");
const muscleColor = new THREE.Color("#94414b");
const boneColor = new THREE.Color("#9b827b");
const connectiveColor = new THREE.Color("#765e5c");
const vesselColor = new THREE.Color("#6d7697");
const arteryColor = new THREE.Color("#95555d");
const nerveColor = new THREE.Color("#c7a46f");
/** The device pixel ratio the canvas renders at, at most (the supplied cap). */
const MAX_PIXEL_RATIO = 1.7;

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function hasForearmAncestor(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const name = current.name.toLowerCase();
    if (name.includes("forearm -") || name.includes("forearm") || name.includes("retinaculum") || name.includes("tendon sheath")) return true;
    current = current.parent;
  }
  return false;
}

function asMeshes(object: THREE.Object3D): ManagedMesh[] {
  const meshes: ManagedMesh[] = [];
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) meshes.push(child as ManagedMesh);
  });
  return meshes;
}

function materialList(mesh: ManagedMesh): ManagedMaterial[] {
  return (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as ManagedMaterial[];
}

function setColor(material: ManagedMaterial, color: THREE.Color) {
  material.color?.copy(color);
}

function setOpacity(material: ManagedMaterial, opacity: number) {
  material.transparent = opacity < 0.99;
  material.opacity = opacity;
  material.depthWrite = opacity > 0.86;
  material.needsUpdate = true;
}

function muscleTone(name: string, muscleId?: MuscleId) {
  const lower = name.toLowerCase();
  if (muscleId === "brachioradialis" || lower.includes("brachioradialis")) return new THREE.Color("#ca5345");
  if (muscleId === "flexor-carpi-radialis" || lower.includes("flexor carpi radialis")) return new THREE.Color("#b94b4d");
  if (muscleId === "flexor-digitorum-profundus" || lower.includes("flexor digitorum profundus")) return new THREE.Color("#9c3d4d");
  if (lower.includes("pronator") || lower.includes("supinator")) return new THREE.Color("#b74c42");
  if (lower.includes("pollicis") || lower.includes("abductor")) return new THREE.Color("#a84150");
  if (lower.includes("extensor")) return new THREE.Color("#8f4053");
  if (lower.includes("flexor")) return new THREE.Color("#a9484b");
  return muscleColor;
}

function isMuscleStructure(name: string, muscleId?: MuscleId) {
  const lower = name.toLowerCase();
  return Boolean(muscleId) || lower.includes("muscle") || lower.includes("pronator") || lower.includes("flexor") || lower.includes("extensor") || lower.includes("brachioradialis");
}

function materialColorFor(name: string, muscleId?: MuscleId) {
  const lower = name.toLowerCase();
  if (isMuscleStructure(name, muscleId)) return muscleTone(name, muscleId);
  if (lower.includes("artery")) return arteryColor;
  if (lower.includes("vein")) return vesselColor;
  if (lower.includes("nerve")) return nerveColor;
  if (lower.includes("tendon") || lower.includes("fascia") || lower.includes("ligament") || lower.includes("retinaculum")) return connectiveColor;
  return boneColor;
}

function isDistractingStructure(name: string) {
  const lower = name.toLowerCase();
  const thinDigitalStructure = lower.includes("extensor digitorum") || lower.includes("extensor indicis") || lower.includes("extensor digiti") || lower.includes("extensor pollicis") || lower.includes("flexor pollicis longus") || lower.includes("flexor digitorum superficialis") || lower.includes("interosseus") || lower.includes("lumbrical") || lower.includes("digiti minimi") || lower.includes("common tendon") || (lower.includes("of hand") && !lower.includes("bones of hand"));
  return lower.includes("nerve") || lower.includes("vein") || lower.includes("artery") || lower.includes("fascia") || lower.includes("ligament") || lower.includes("retinaculum") || lower.includes("tendon") || lower.includes("fibrous sheath") || lower.includes("articular capsule") || lower.includes("art cart") || lower.includes("extensor hood") || lower.includes("annular ligament") || lower.includes("collateral ligament") || thinDigitalStructure;
}

function isFingerBone(name: string) {
  const lower = name.toLowerCase();
  return lower.includes("phalanx") || lower.includes("phalan") || lower.includes("metacarp") || lower.includes("carpal") || lower.includes("sesamoid bones of hand");
}

function isDistalHandDetail(name: string) {
  const lower = name.toLowerCase();
  const handRegion = ["phalan", "carpal", "metacarp", "finger", "digital", "hand", "pollicis", "digiti", "lumbrical", "interosseus", "digitorum"].some((term) => lower.includes(term));
  const solidBone = lower.includes("phalanx") || lower.includes("carpal") || lower.includes("metacarp") || lower.includes("sesamoid") || lower.includes("bone");
  return handRegion && !solidBone;
}

/** Every texture a material holds (map, normalMap, roughnessMap…), so cleanup can free them. */
function texturesOf(material: THREE.Material): THREE.Texture[] {
  return Object.values(material as unknown as Record<string, unknown>).filter((value): value is THREE.Texture => value instanceof THREE.Texture);
}

/** The supplied preset with its x mirrored for the left arm (the model is a mirrored right arm). */
function mirrored(vector: THREE.Vector3, side: Side) {
  const copy = vector.clone();
  if (side === "left") copy.x = -copy.x;
  return copy;
}

export function ForearmCanvas({ modelUrl, decoderPath, selectedMuscleId, side, reducedMotion, label, onMuscleSelect, onStatusChange }: ForearmCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef<MuscleId | null>(selectedMuscleId);
  const reducedMotionRef = useRef(reducedMotion);
  const sideRef = useRef(side);
  const callbackRef = useRef(onMuscleSelect);
  const statusRef = useRef(onStatusChange);
  const controllerRef = useRef<Controller | null>(null);

  selectedRef.current = selectedMuscleId;
  reducedMotionRef.current = reducedMotion;
  sideRef.current = side;
  callbackRef.current = onMuscleSelect;
  statusRef.current = onStatusChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let frameId = 0;
    let frameQueued = false;
    let pageHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    let offscreen = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let dracoLoader: DRACOLoader | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let modelRoot: THREE.Group | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let modelScale = 1;
    let raycaster: THREE.Raycaster | null = null;
    let pointerDown: { x: number; y: number } | null = null;
    /**
     * Frames still to draw after the athlete lets go. The controls' damping decays per frame,
     * not per second, and stops reporting changes before its last sliver of motion is spent;
     * drawn later, that sliver would nudge the camera on an unrelated redraw (a resize, a scroll
     * back into view). 90 frames leave under 0.1% of the motion, whatever the frame rate.
     */
    let settleFrames = 0;
    let transition: {
      startedAt: number;
      duration: number;
      fromPosition: THREE.Vector3;
      toPosition: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;

    const interactables: THREE.Object3D[] = [];
    const meshById = new Map<MuscleId, ManagedMesh[]>();
    const outlineById = new Map<MuscleId, THREE.LineSegments[]>();
    const baseColors = new Map<ManagedMaterial, THREE.Color>();
    const baseEmissive = new Map<ManagedMaterial, THREE.Color>();
    const baseEmissiveIntensity = new Map<ManagedMaterial, number>();
    const baseOpacity = new Map<ManagedMaterial, number>();
    const baseVisibility = new Map<ManagedMesh, boolean>();

    const setStatus = (status: CanvasStatus, failure?: CanvasFailure) => {
      if (!disposed) statusRef.current(status, failure);
    };

    /** Asks for a frame; nothing is drawn while the page is hidden or the canvas is off screen. */
    const requestRender = () => {
      if (disposed || frameQueued || pageHidden || offscreen || !renderer) return;
      frameQueued = true;
      frameId = requestAnimationFrame(render);
    };

    const applySide = () => {
      if (!modelRoot) return;
      modelRoot.scale.set(sideRef.current === "left" ? -modelScale : modelScale, modelScale, modelScale);
      modelRoot.updateMatrixWorld(true);
    };

    const updateSize = () => {
      if (!renderer || !camera) return;
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || canvas.clientWidth || 720;
      const height = parent?.clientHeight || canvas.clientHeight || 620;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      requestRender();
    };

    const resetMaterialPalette = () => {
      interactables.forEach((object) => {
        const mesh = object as ManagedMesh;
        mesh.visible = baseVisibility.get(mesh) ?? true;
        materialList(mesh).forEach((material) => {
          setColor(material, baseColors.get(material) ?? boneColor);
          setOpacity(material, baseOpacity.get(material) ?? 0.82);
          material.emissive?.copy(baseEmissive.get(material) ?? new THREE.Color("#000000"));
          if (material.emissiveIntensity !== undefined) material.emissiveIntensity = baseEmissiveIntensity.get(material) ?? 0;
        });
      });
      outlineById.forEach((lines) => lines.forEach((line) => {
        line.visible = false;
        (line.material as THREE.LineBasicMaterial).opacity = 0;
      }));
    };

    /**
     * Where the overview looks: the middle of what the overview shows (forearm and hand). The
     * supplied preset aimed at the middle of the whole upper-limb file, most of which is
     * hidden, which left the forearm low and to one side of the stage.
     */
    const overviewCenter = () => {
      if (!modelRoot) return null;
      modelRoot.updateMatrixWorld(true);
      const box = new THREE.Box3();
      interactables.forEach((object) => { if (baseVisibility.get(object as ManagedMesh)) box.expandByObject(object); });
      return box.isEmpty() ? null : box.getCenter(new THREE.Vector3());
    };

    const animateCamera = (id: MuscleId | null) => {
      if (!camera || !controls || !modelRoot) return;
      const currentSide = sideRef.current;
      const preset = cameraPresets[id ? (manifestById[id]?.cameraPreset ?? "overview") : "overview"];
      const revealDuration = id ? (revealPresets[manifestById[id]?.revealPreset ?? "outer"]?.transitionMs ?? 560) : 520;
      const presetTarget = mirrored(preset.target, currentSide);
      const presetOffset = mirrored(preset.offset, currentSide);
      const target = new THREE.Vector3();
      if (id && meshById.has(id)) {
        modelRoot.updateMatrixWorld(true);
        const box = new THREE.Box3();
        meshById.get(id)?.forEach((mesh) => box.expandByObject(mesh));
        if (!box.isEmpty()) box.getCenter(target);
      }
      if (id) target.add(presetTarget.clone().multiplyScalar(0.2)).lerp(new THREE.Vector3(0, 0, 0), 0.12);
      else target.copy(overviewCenter() ?? presetTarget);
      const focusDistance = id && manifestById[id]?.layer === "deep" ? preset.distance * 0.82 : preset.distance;
      const nextPosition = target.clone().add(presetOffset.normalize().multiplyScalar(focusDistance));
      const duration = reducedMotionRef.current ? 0 : Math.max(preset.durationMs, revealDuration);
      // A new selection starts from wherever the camera is now: it interrupts the last move.
      transition = {
        startedAt: performance.now(),
        duration,
        fromPosition: camera.position.clone(),
        toPosition: nextPosition,
        fromTarget: controls.target.clone(),
        toTarget: target,
      };
      if (duration === 0) {
        camera.position.copy(nextPosition);
        controls.target.copy(target);
        transition = null;
      }
      requestRender();
    };

    const applySelection = (id: MuscleId | null) => {
      if (!modelRoot) return;
      const manifest = id ? manifestById[id] : undefined;
      const reveal = manifest ? revealPresets[manifest.revealPreset] : revealPresets.outer;
      const normalizedSuperficial = new Set(muscleLayerNames.superficial.map(normalizeName));
      const normalizedTendons = new Set(muscleLayerNames.tendons.map(normalizeName));
      interactables.forEach((object) => {
        const mesh = object as ManagedMesh;
        const name = normalizeName(mesh.name);
        const meshId = mesh.userData.muscleId;
        const isSelected = Boolean(id && meshId === id);
        const isMuscle = isMuscleStructure(mesh.name, meshId);
        const defaultVisible = baseVisibility.get(mesh) ?? true;
        mesh.visible = defaultVisible || isSelected;
        mesh.renderOrder = isSelected ? 50 : 0;
        const isSuperficialLayer = normalizedSuperficial.has(name);
        const isTendon = normalizedTendons.has(name);
        let opacity = baseOpacity.get(materialList(mesh)[0]) ?? 0.8;
        if (isSelected) opacity = reveal.selectedOpacity;
        else if (manifest?.layer === "deep" && isSuperficialLayer) opacity = reveal.superficialOpacity;
        else if (manifest?.layer === "deep" && isTendon) opacity = reveal.tendonOpacity;
        else if (id && isMuscle) opacity = reveal.surroundingOpacity;
        materialList(mesh).forEach((material) => {
          if (isSelected) {
            const baseColor = baseColors.get(material) ?? muscleColor;
            const tintedColor = baseColor.clone().lerp(selectedColor, 0.58);
            const subtleEmissive = baseColor.clone().lerp(selectedColor, 0.32);
            setColor(material, tintedColor);
            material.emissive?.copy(subtleEmissive);
            if (material.emissiveIntensity !== undefined) material.emissiveIntensity = 0.12;
          } else {
            setColor(material, baseColors.get(material) ?? boneColor);
            material.emissive?.copy(baseEmissive.get(material) ?? new THREE.Color("#000000"));
            if (material.emissiveIntensity !== undefined) material.emissiveIntensity = baseEmissiveIntensity.get(material) ?? 0;
          }
          setOpacity(material, opacity);
          if (isSelected) {
            // Keep the real selected source mesh fully legible over the deliberately
            // faded context; no duplicate or mirrored geometry is introduced. Without the
            // depth test its back faces would draw over its front ones, so it shows only
            // the faces turned to the camera while it is selected.
            material.transparent = true;
            material.opacity = 1;
            material.depthTest = false;
            material.depthWrite = false;
            material.side = THREE.FrontSide;
            material.needsUpdate = true;
          } else {
            material.depthTest = true;
            material.side = THREE.DoubleSide;
          }
        });
      });
      outlineById.forEach((lines, outlineId) => lines.forEach((line) => {
        const active = outlineId === id;
        line.visible = active;
        (line.material as THREE.LineBasicMaterial).opacity = active ? 0.74 : 0;
      }));
      animateCamera(id);
    };

    const pick = (event: PointerEvent) => {
      if (!raycaster || !camera) return undefined;
      const bounds = canvas.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ), camera);
      const hit = raycaster.intersectObjects(interactables, true).find((entry) => entry.object.visible && Boolean((entry.object as ManagedMesh).userData?.muscleId));
      return hit ? (hit.object as ManagedMesh).userData?.muscleId : undefined;
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerDown) return;
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      pointerDown = null;
      // A drag turns the model; only a tap chooses a muscle.
      if (moved > 7) return;
      const muscleId = pick(event);
      if (muscleId) callbackRef.current(muscleId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      // Touch has no hover; the cursor hint is for a mouse only.
      if (event.pointerType !== "mouse" || pointerDown) return;
      canvas.style.cursor = pick(event) ? "pointer" : "grab";
    };

    /** The athlete took hold of the model: an automatic camera move stops where it is. */
    const handleControlStart = () => {
      transition = null;
      requestRender();
    };

    /** Let go: the damping runs out on screen, not on some later redraw. */
    const handleControlEnd = () => {
      settleFrames = 90;
      requestRender();
    };

    const render = (time: number) => {
      frameQueued = false;
      if (disposed || !renderer || !scene || !camera || !controls) return;
      let moving = false;
      if (transition) {
        const progress = transition.duration === 0 ? 1 : Math.min((time - transition.startedAt) / transition.duration, 1);
        const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
        controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
        if (progress >= 1) transition = null;
        else moving = true;
      }
      controls.autoRotate = false;
      const damping = controls.update();
      renderer.render(scene, camera);
      if (settleFrames > 0) settleFrames -= 1;
      if (moving || damping || settleFrames > 0) requestRender();
    };

    const handleVisibility = () => {
      pageHidden = document.visibilityState === "hidden";
      if (pageHidden) {
        cancelAnimationFrame(frameId);
        frameQueued = false;
      } else requestRender();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frameId);
      frameQueued = false;
      setStatus("error", "context-lost");
    };

    const controller: Controller = {
      select: (id) => {
        selectedRef.current = id;
        if (modelRoot) applySelection(id);
      },
      setSide: (nextSide) => {
        sideRef.current = nextSide;
        applySide();
        if (modelRoot) applySelection(selectedRef.current ?? null);
      },
      setReducedMotion: (shouldReduce) => {
        reducedMotionRef.current = shouldReduce;
        if (shouldReduce && transition && camera && controls) {
          camera.position.copy(transition.toPosition);
          controls.target.copy(transition.toTarget);
          controls.autoRotate = false;
          controls.update();
          transition = null;
          requestRender();
        }
      },
    };
    controllerRef.current = controller;

    const init = async () => {
      setStatus("loading");
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch (error) {
        console.error("Forearm anatomy: WebGL could not start", error);
        setStatus("error", "webgl");
        return;
      }
      try {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.46;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        canvas.addEventListener("webglcontextlost", handleContextLost);
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2("#061827", 0.052);
        camera = new THREE.PerspectiveCamera(31, 1, 0.01, 100);
        camera.position.set(0.42, 0.04, 4.35);
        controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.enablePan = false;
        controls.minDistance = 1.7;
        controls.maxDistance = 7.2;
        controls.rotateSpeed = 0.46;
        controls.zoomSpeed = 0.7;
        controls.autoRotateSpeed = 0.34;
        controls.target.set(0, 0, 0);
        controls.addEventListener("start", handleControlStart);
        controls.addEventListener("end", handleControlEnd);
        controls.addEventListener("change", requestRender);
        raycaster = new THREE.Raycaster();

        scene.add(new THREE.HemisphereLight("#ffdfd1", "#06111f", 3.1));
        const keyLight = new THREE.DirectionalLight("#ffd0bd", 5.5);
        keyLight.position.set(3.4, 4.4, 5.6);
        keyLight.castShadow = true;
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight("#70a6ca", 3.5);
        rimLight.position.set(-4.4, 1.9, -3.1);
        scene.add(rimLight);
        const warmEdge = new THREE.PointLight("#ef6a49", 2.9, 8);
        warmEdge.position.set(1.8, -0.4, 3.8);
        scene.add(warmEdge);
        const lowerFill = new THREE.PointLight("#8d2944", 1.35, 6);
        lowerFill.position.set(-1.9, -3.1, 1.4);
        scene.add(lowerFill);

        dracoLoader = new DRACOLoader().setDecoderPath(decoderPath);
        const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);
        const gltf = await gltfLoader.loadAsync(modelUrl);
        dracoLoader.dispose();
        dracoLoader = null;
        if (disposed) {
          gltf.scene.traverse((object) => {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
          });
          return;
        }
        modelRoot = gltf.scene as THREE.Group;
        modelRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) child.visible = hasForearmAncestor(child);
        });
        const initialBounds = new THREE.Box3().setFromObject(modelRoot);
        const initialCenter = initialBounds.getCenter(new THREE.Vector3());
        const initialSize = initialBounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
        modelScale = 3.25 / maxDimension;
        modelRoot.position.copy(initialCenter).multiplyScalar(-modelScale);
        applySide();
        scene.add(modelRoot);

        const manifestNameToId = new Map<string, MuscleId>();
        muscleManifest.forEach((entry) => entry.meshNames.forEach((name) => manifestNameToId.set(normalizeName(name), entry.id)));
        asMeshes(modelRoot).forEach((mesh) => {
          const originals = materialList(mesh);
          const copies = originals.map((material) => {
            const copy = material.clone();
            copy.side = THREE.DoubleSide;
            return copy;
          });
          // The clones replace the loaded materials, which are freed here (their textures are shared and stay).
          originals.forEach((material) => material.dispose());
          mesh.material = Array.isArray(mesh.material) ? copies : copies[0];
          const muscleId = manifestNameToId.get(normalizeName(mesh.name));
          mesh.userData.muscleId = muscleId;
          const mappedEntry = muscleId ? manifestById[muscleId] : undefined;
          const mappedOverviewMuscle = Boolean(muscleId && mappedEntry?.layer !== "deep");
          const visibleInOverview = ((hasForearmAncestor(mesh) || isFingerBone(mesh.name)) && !isDistractingStructure(mesh.name) && !isDistalHandDetail(mesh.name)) || mappedOverviewMuscle;
          baseVisibility.set(mesh, visibleInOverview);
          mesh.visible = visibleInOverview;
          materialList(mesh).forEach((material) => {
            const base = materialColorFor(mesh.name, muscleId);
            baseColors.set(material, base.clone());
            baseEmissive.set(material, base.clone().multiplyScalar(isMuscleStructure(mesh.name, muscleId) ? 0.055 : 0.015));
            baseEmissiveIntensity.set(material, isMuscleStructure(mesh.name, muscleId) ? 0.42 : 0.12);
            baseOpacity.set(material, muscleId ? 0.98 : isFingerBone(mesh.name) ? 0.78 : 0.88);
            setColor(material, base);
            material.emissive?.copy(baseEmissive.get(material) ?? new THREE.Color("#000000"));
            if (material.emissiveIntensity !== undefined) material.emissiveIntensity = baseEmissiveIntensity.get(material) ?? 0;
            material.roughness = isMuscleStructure(mesh.name, muscleId) ? 0.32 : 0.68;
            material.metalness = isMuscleStructure(mesh.name, muscleId) ? 0.045 : 0.015;
            material.flatShading = false;
            material.transparent = true;
            material.needsUpdate = true;
          });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          interactables.push(mesh);
          if (muscleId) {
            const meshes = meshById.get(muscleId) ?? [];
            meshes.push(mesh);
            meshById.set(muscleId, meshes);
            const edges = new THREE.EdgesGeometry(mesh.geometry, 22);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
              color: selectedColor,
              transparent: true,
              opacity: 0,
              depthTest: false,
              depthWrite: false,
            }));
            line.visible = false;
            line.renderOrder = 21;
            mesh.add(line);
            const outlines = outlineById.get(muscleId) ?? [];
            outlines.push(line);
            outlineById.set(muscleId, outlines);
          }
        });
        updateSize();
        resetMaterialPalette();
        applySelection(selectedRef.current ?? null);
        resizeObserver = new ResizeObserver(updateSize);
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
        if (typeof IntersectionObserver !== "undefined") {
          intersectionObserver = new IntersectionObserver((entries) => {
            offscreen = !entries.some((entry) => entry.isIntersecting);
            if (offscreen) {
              cancelAnimationFrame(frameId);
              frameQueued = false;
            } else requestRender();
          });
          intersectionObserver.observe(canvas);
        }
        document.addEventListener("visibilitychange", handleVisibility);
        canvas.addEventListener("pointerdown", handlePointerDown);
        canvas.addEventListener("pointerup", handlePointerUp);
        canvas.addEventListener("pointermove", handlePointerMove);
        setStatus("ready");
        requestRender();
      } catch (error) {
        if (disposed) return;
        console.error("Forearm anatomy: the model failed to load", error);
        canvas.dataset.modelError = error instanceof Error ? error.message : String(error);
        setStatus("error", "model");
      }
    };

    void init();
    return () => {
      disposed = true;
      transition = null;
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      dracoLoader?.dispose();
      controls?.removeEventListener("start", handleControlStart);
      controls?.removeEventListener("end", handleControlEnd);
      controls?.removeEventListener("change", requestRender);
      controls?.dispose();
      const textures = new Set<THREE.Texture>();
      scene?.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (!material) return;
          texturesOf(material).forEach((texture) => textures.add(texture));
          material.dispose();
        });
      });
      textures.forEach((texture) => texture.dispose());
      renderer?.renderLists.dispose();
      renderer?.dispose();
      // Give the context back now rather than at garbage collection: browsers keep only a few alive.
      renderer?.forceContextLoss();
      controllerRef.current = null;
    };
    // The scene is built once per mount; the props below reach it through the controller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, decoderPath]);

  useEffect(() => {
    controllerRef.current?.select(selectedMuscleId ?? null);
  }, [selectedMuscleId]);

  useEffect(() => {
    controllerRef.current?.setSide(side);
  }, [side]);

  useEffect(() => {
    controllerRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="sg-anatomy3d-canvas" role="img" aria-label={label} />;
}

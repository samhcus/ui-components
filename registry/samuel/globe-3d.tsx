"use client";
import React, { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { TrackballControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface GlobeMarker {
  lat: number;
  lng: number;
  src: string;
  label?: string;
  size?: number;
}

export interface Globe3DConfig {
  radius?: number;
  globeColor?: string;
  textureUrl?: string;
  bumpMapUrl?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  atmosphereBlur?: number;
  bumpScale?: number;
  autoRotateSpeed?: number;
  rotateSpeed?: number;
  dampingFactor?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  initialRotation?: { x: number; y: number };
  markerSize?: number;
  showWireframe?: boolean;
  wireframeColor?: string;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  backgroundColor?: string | null;
}

interface Globe3DProps {
  markers?: GlobeMarker[];
  config?: Globe3DConfig;
  className?: string;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

// Self-hosted (public/globe/) so the globe never depends on a CDN being up
const DEFAULT_EARTH_TEXTURE = "/globe/earth-blue-marble.jpg";
const DEFAULT_BUMP_TEXTURE = "/globe/earth-topology.png";

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

interface MarkerProps {
  marker: GlobeMarker;
  radius: number;
  defaultSize: number;
  onClick?: (marker: GlobeMarker) => void;
  onHover?: (marker: GlobeMarker | null) => void;
}

function Marker({ marker, radius, onClick, onHover }: MarkerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  // Place pin slightly above the surface so it clears the globe mesh
  const position = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.04),
    [marker.lat, marker.lng, radius]
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    const dot = worldPos.clone().normalize().dot(camera.position.clone().normalize());
    setIsVisible(dot > 0.15);
  });

  return (
    <group ref={groupRef} position={position} visible={isVisible}>
      <Html
        // No `distanceFactor`/`sprite`: the pin is a screen-space overlay so it
        // stays a constant size on screen. Zooming the globe must NOT resize it.
        style={{
          pointerEvents: isVisible ? "auto" : "none",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.15s ease-out",
          // Shift so the pin tip sits at the world position
          transform: "translate(-50%, -100%)",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={() => onClick?.(marker)}
        onMouseEnter={() => onHover?.(marker)}
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Apple Maps-style location pin */}
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19S22 19.25 22 11C22 4.925 17.075 0 11 0z"
            fill="#FF3B30"
          />
          <path
            d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19S22 19.25 22 11C22 4.925 17.075 0 11 0z"
            fill="url(#pin-shine)"
            opacity="0.25"
          />
          <circle cx="11" cy="11" r="4.5" fill="white" opacity="0.92" />
          <defs>
            <linearGradient id="pin-shine" x1="5" y1="2" x2="17" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </Html>
    </group>
  );
}

function RotatingGlobe({ config, markers, onMarkerClick, onMarkerHover }: { config: Required<Globe3DConfig>; markers: GlobeMarker[]; onMarkerClick?: (m: GlobeMarker) => void; onMarkerHover?: (m: GlobeMarker | null) => void }) {
  const [earthTexture, bumpTexture] = useTexture(
    [config.textureUrl, config.bumpMapUrl],
    (textures) => {
      const [earth, bump] = Array.isArray(textures) ? textures : [textures];
      if (earth) {
        earth.colorSpace = THREE.SRGBColorSpace;
        earth.anisotropy = 16;
        earth.needsUpdate = true;
      }
      if (bump) {
        bump.anisotropy = 8;
        bump.needsUpdate = true;
      }
    }
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(config.radius, 64, 64), [config.radius]);

  // Idle spin lives on the mesh (TrackballControls has no autoRotate), so the
  // globe drifts when untouched while the user can still tumble it freely.
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (groupRef.current && config.autoRotateSpeed > 0) {
      groupRef.current.rotation.y += config.autoRotateSpeed * delta;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={earthTexture} bumpMap={bumpTexture} bumpScale={config.bumpScale * 0.05} roughness={0.7} metalness={0.0} />
      </mesh>
      {config.showWireframe && (
        <mesh>
          <sphereGeometry args={[config.radius * 1.002, 32, 16]} />
          <meshBasicMaterial color={config.wireframeColor} wireframe transparent opacity={0.08} />
        </mesh>
      )}
      {markers.map((marker, i) => (
        <Marker key={i} marker={marker} radius={config.radius} defaultSize={config.markerSize} onClick={onMarkerClick} onHover={onMarkerHover} />
      ))}
    </group>
  );
}

function Atmosphere({ radius, color, intensity, blur }: { radius: number; color: string; intensity: number; blur: number }) {
  const fresnelPower = Math.max(0.5, 5 - blur);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { atmosphereColor: { value: new THREE.Color(color) }, intensity: { value: intensity }, fresnelPower: { value: fresnelPower } },
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normalize(normalMatrix * normal); vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 atmosphereColor; uniform float intensity; uniform float fresnelPower; varying vec3 vNormal; varying vec3 vPosition; void main() { float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower); gl_FragColor = vec4(atmosphereColor, fresnel * intensity); }`,
    side: THREE.BackSide, transparent: true, depthWrite: false,
  }), [color, intensity, fresnelPower]);
  return <mesh scale={[1.12, 1.12, 1.12]}><sphereGeometry args={[radius, 64, 32]} /><primitive object={mat} attach="material" /></mesh>;
}

function Scene({ markers, config, onMarkerClick, onMarkerHover }: { markers: GlobeMarker[]; config: Required<Globe3DConfig>; onMarkerClick?: (m: GlobeMarker) => void; onMarkerHover?: (m: GlobeMarker | null) => void }) {
  const { camera } = useThree();
  React.useEffect(() => { camera.position.set(0, 0, config.radius * 3.5); camera.lookAt(0, 0, 0); }, [camera, config.radius]);
  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight position={[config.radius * 5, config.radius * 2, config.radius * 5]} intensity={config.pointLightIntensity} color="#ffffff" />
      <directionalLight position={[-config.radius * 3, config.radius, -config.radius * 2]} intensity={config.pointLightIntensity * 0.3} color="#88ccff" />
      <RotatingGlobe config={config} markers={markers} onMarkerClick={onMarkerClick} onMarkerHover={onMarkerHover} />
      {config.showAtmosphere && <Atmosphere radius={config.radius} color={config.atmosphereColor} intensity={config.atmosphereIntensity} blur={config.atmosphereBlur} />}
      <TrackballControls makeDefault noPan={!config.enablePan} noZoom={!config.enableZoom} minDistance={config.minDistance} maxDistance={config.maxDistance} rotateSpeed={config.rotateSpeed * 3.5} zoomSpeed={1.2} dynamicDampingFactor={0.15} />
    </>
  );
}

const defaultConfig: Required<Globe3DConfig> = {
  radius: 2, globeColor: "#1a1a2e", textureUrl: DEFAULT_EARTH_TEXTURE, bumpMapUrl: DEFAULT_BUMP_TEXTURE,
  showAtmosphere: false, atmosphereColor: "#4da6ff", atmosphereIntensity: 0.5, atmosphereBlur: 2,
  bumpScale: 1, autoRotateSpeed: 0.3, rotateSpeed: 0.7, dampingFactor: 0.04, enableZoom: false, enablePan: false, minDistance: 5, maxDistance: 15,
  initialRotation: { x: 0, y: 0 }, markerSize: 0.06, showWireframe: false, wireframeColor: "#4a9eff",
  ambientIntensity: 0.6, pointLightIntensity: 1.5, backgroundColor: null,
};

export function Globe3D({ markers = [], config = {}, className, onMarkerClick, onMarkerHover }: Globe3DProps) {
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  return (
    <div className={cn("relative h-[340px] w-full", className)}>
      <Canvas gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} dpr={[1, 2]}
        camera={{ fov: 45, near: 0.1, far: 1000, position: [0, 0, mergedConfig.radius * 3.5] }}
        style={{ background: mergedConfig.backgroundColor ?? "transparent" }}>
        <Suspense fallback={<Html center><span className="text-xs text-muted-foreground">Loading...</span></Html>}>
          <Scene markers={markers} config={mergedConfig} onMarkerClick={onMarkerClick} onMarkerHover={onMarkerHover} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Globe3D;

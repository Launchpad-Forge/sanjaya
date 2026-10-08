// Baseline scene.glb + change markers. Positions are in the baseline's Sanjaya frame
// (Y up, metres), which is also glTF's convention, so markers need no conversion.
import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Html, Line, OrbitControls, useGLTF } from '@react-three/drei';

export const SEVERITY_COLOR = { high: '#FF5A5F', medium: '#F5A524', low: '#A1A1A6' };

function Scene({ url }) {
  const { scene } = useGLTF(url);
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isPoints) Object.assign(o.material, { size: 0.025, sizeAttenuation: true });
    });
  }, [scene]);
  return <primitive object={scene} />;
}

function Marker({ change, selected, onSelect }) {
  const color = SEVERITY_COLOR[change.severity];
  const pos = change.current_position ?? change.baseline_position;
  const r = selected ? 0.13 : 0.08;
  const pick = (e) => { e.stopPropagation(); onSelect?.(change.id); };
  const region = change.region;
  return (
    <group>
      {change.baseline_position && change.current_position && (
        <>
          <Line points={[change.baseline_position, change.current_position]} color={color} lineWidth={selected ? 3 : 1.5} dashed dashSize={0.06} gapSize={0.04} />
          <mesh position={change.baseline_position} onClick={pick}>
            <sphereGeometry args={[r * 0.7, 16, 12]} />
            <meshBasicMaterial color={color} wireframe />
          </mesh>
        </>
      )}
      {region && (
        <mesh position={region.bbox_min.map((v, i) => (v + region.bbox_max[i]) / 2)} onClick={pick}>
          <boxGeometry args={region.bbox_max.map((v, i) => v - region.bbox_min[i])} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      )}
      <mesh position={pos} onClick={pick}>
        <sphereGeometry args={[r, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.8} />
      </mesh>
      {selected && (
        <Html position={pos} center style={{ pointerEvents: 'none' }}>
          <div className="mt-10 whitespace-nowrap rounded-full bg-black/80 px-3 py-1 text-xs text-paper border border-white/20">
            {change.label ?? 'geometry'} · {change.type.replace(/_/g, ' ')}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function MapViewer3D({ url, changes = [], selectedId, onSelect, className = 'h-[480px]' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-graphite bg-black ${className}`}>
      <Canvas camera={{ position: [0, 3, 3], fov: 55 }} onPointerMissed={() => onSelect?.(null)}>
        <Suspense fallback={<Html center><span className="text-sm text-slate">Loading 3D map…</span></Html>}>
          {url && (
            <Bounds fit clip margin={1.1}>
              <Scene url={url} />
            </Bounds>
          )}
        </Suspense>
        {changes.map((c) => <Marker key={c.id} change={c} selected={c.id === selectedId} onSelect={onSelect} />)}
        <OrbitControls makeDefault />
      </Canvas>
      {!url && <p className="absolute inset-0 grid place-items-center text-sm text-slate">No 3D map yet</p>}
    </div>
  );
}

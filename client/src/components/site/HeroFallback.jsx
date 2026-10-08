import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function Scene() {
  const pointsRef = useRef();
  const pathRef = useRef();
  
  const positions = useMemo(() => {
    const count = 40000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = (Math.random() - 0.5) * 30;
      const x = (Math.random() - 0.5) * (4 + Math.sin(z) * 2);
      const y = (Math.random() - 0.5) * 3;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const pathPositions = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = -15 + (i / count) * 30;
      const x = Math.sin(z) * 0.5;
      const y = Math.cos(z * 0.5) * 0.2;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.position.z = (state.clock.elapsedTime * 0.8) % 15;
    }
    if (pathRef.current) {
      pathRef.current.position.z = (state.clock.elapsedTime * 0.8) % 15;
    }
  });

  return (
    <>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#ffffff" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </Points>
      <Points ref={pathRef} positions={pathPositions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#F5A524" size={0.08} sizeAttenuation={true} depthWrite={false} opacity={0.8} />
      </Points>
    </>
  );
}

export default function HeroFallback() {
  const [inView, setInView] = useState(true);
  const containerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-void">
      {inView && (
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} frameloop="always">
          <Scene />
        </Canvas>
      )}
    </div>
  );
}

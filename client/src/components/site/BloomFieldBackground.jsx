import { useEffect, useRef, useState } from 'react';

const COLORS = [
  { hex: '#FFFFFF', stop: 0.0 },
  { hex: '#310527', stop: 0.28 },
  { hex: '#39051F', stop: 0.74 },
  { hex: '#D7D5D5', stop: 1.0 },
];

export default function BloomFieldBackground({ intensity = 'hero' }) {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame;
    let startTime = performance.now();
    
    // Seed and static properties
    const numBlobs = 6;
    const blobs = [];
    const seed = 174074637;
    const random = (s) => {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    
    for (let i = 0; i < numBlobs; i++) {
        blobs.push({
            p: random(seed + i * 2) * Math.PI * 2,
            p2: random(seed + i * 2 + 1) * Math.PI * 2,
            cx: 20 + random(seed + i * 3) * 60,
            cy: 20 + random(seed + i * 4) * 60,
            r: 40 + random(seed + i * 5) * 40,
            color: COLORS[i % COLORS.length].hex
        });
    }

    const draw = (time) => {
      if (document.hidden) return;
      const t = paused ? 0 : (time - startTime) / 1000;
      const ph = t * 1.0;
      const amt = 0.40;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = '#D7D5D5';
      ctx.fillRect(0, 0, width, height);

      blobs.forEach(blob => {
          let x = blob.cx;
          let y = blob.cy;
          if (!paused) {
              x += (Math.sin(ph * 0.55 + blob.p) - Math.sin(blob.p)) * 14 * amt;
              y += (Math.sin(ph * 0.43 + blob.p2) - Math.sin(blob.p2)) * 14 * amt;
          }
          
          const px = (x / 100) * width;
          const py = (y / 100) * height;
          const pr = (blob.r / 100) * Math.max(width, height);
          
          const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
          grad.addColorStop(0, blob.color);
          grad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
      });
      
      if (!paused) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      draw(performance.now());
    };

    window.addEventListener('resize', resize);
    resize();
    
    if (!paused) frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [paused, intensity]);

  return (
    <div className="fixed inset-0 -z-10 bg-[#D7D5D5]">
      <canvas ref={canvasRef} className="w-full h-full object-cover opacity-80" style={{ filter: 'url(#grain)' }} />
      <svg className="hidden">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
        </filter>
      </svg>
    </div>
  );
}

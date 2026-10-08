import { useEffect, useRef, useState } from 'react';
import waves from './shaders/waves.frag?raw';
import mesh from './shaders/mesh.frag?raw';

// Share the sign-in palette and color grading without changing either motion field.
const signInColors = [0.102, 0.078, 0.137, 0.718, 0.365, 0.412, 0.918, 0.804, 0.761, 1, 0.961, 0.922];
const colorGrade = [1.08, 0.07, 2]; // contrast, brightness, saturation
const hue = 2.27;

const presets = {
  waves: {
    source: waves, speed: -0.67,
    colors: signInColors,
    shape: [1.32, 0.49, 0.84, 0.01], surface: [1.73, ...colorGrade],
    finish: [hue, 0, 0.040, 0.35], transform: [4984, 3.37, 0.40, 1],
    space: [-0.13, 0.05, 0, 0], cursor: [0, 3, 0.54, 0.56],
  },
  mesh: {
    source: mesh, speed: 0.73,
    colors: signInColors,
    shape: [1.10, 0.34, 0.50, 0], surface: [2.40, ...colorGrade],
    finish: [hue, 0.36, 0.026, 0.07], transform: [1453, 0, 0, 0],
    space: [0, 0, 0, 0], cursor: [0, 2, 0.65, 0.46],
  },
};

/** A single WebGL1 triangle. The supplied fragment shaders are kept verbatim. */
export default function ShaderBackground({ variant = 'mesh' }) {
  const canvasRef = useRef(null);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;
    const preset = presets[variant];
    let program, buffer, sceneLocation, shaders = [], frame = 0, lastTime = null;
    let ready = false;

    function release() {
      cancelAnimationFrame(frame);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
      shaders = [];
      ready = false;
    }

    function draw(time) {
      if (!ready || document.hidden) return;
      // Ambient motion needs only 30fps, even on high-refresh displays.
      if (!paused && lastTime !== null && time - lastTime < 1000 / 30) {
        frame = requestAnimationFrame(draw);
        return;
      }
      if (!paused && lastTime !== null) elapsed.current += (time - lastTime) / 1000;
      lastTime = time;
      gl.uniform4f(sceneLocation, canvas.width, canvas.height, elapsed.current * preset.speed, 4);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.state = paused ? 'paused' : 'running';
      if (!paused) frame = requestAnimationFrame(draw);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      lastTime = null;
      if (document.hidden) {
        canvas.dataset.state = 'hidden';
        return;
      }
      draw(performance.now());
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      refresh();
    }

    function initialize() {
      try {
        const compile = (type, source) => {
          const shader = gl.createShader(type);
          if (!shader) throw new Error('Shader unavailable');
          shaders.push(shader);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
          return shader;
        };
        program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }'));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, preset.source));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        sceneLocation = gl.getUniformLocation(program, 'u_scene');
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_colors[0]'), new Float32Array([...preset.colors, ...Array(12).fill(0)]));
        for (const key of ['shape', 'surface', 'finish', 'transform', 'space', 'cursor']) {
          gl.uniform4fv(gl.getUniformLocation(program, `u_${key}`), preset[key]);
        }
        ready = true;
        setAvailable(true);
        resize();
      } catch {
        release();
        setAvailable(false);
        canvas.dataset.state = 'fallback';
      }
    }

    const lost = event => {
      event.preventDefault();
      release();
      setAvailable(false);
      canvas.dataset.state = 'fallback';
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', initialize);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    initialize();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', refresh);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', initialize);
      release();
    };
  }, [variant, paused]);

  return (
    <>
      <div className={`shader-background shader-background--${variant}`} aria-hidden="true">
        <canvas ref={canvasRef} style={{ opacity: available ? 1 : 0 }} />
      </div>
      {available && <button className="shader-control" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play background animation' : 'Pause background animation'}>
        <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span> Background {paused ? 'paused' : 'motion'}
      </button>}
    </>
  );
}

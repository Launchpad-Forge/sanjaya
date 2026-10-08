export function sampleVideoEdge(videoElement, expectedBgHex) {
  if (!videoElement) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  
  // Sample top-left corner
  ctx.drawImage(videoElement, 0, 0, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  
  const toHex = (n) => n.toString(16).padStart(2, '0');
  const actualHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  const expected = expectedBgHex.toUpperCase();
  
  if (actualHex !== expected) {
    console.warn(`[Video Edge Warning] Video corner color ${actualHex} does not match expected background ${expected}. Edges may be visible.`);
  }
}

// One evidence image (keyframe or object crop) with the detection box or the projected
// location drawn on top, in the image's own pixel coordinates.
import { useState } from 'react';

export default function Evidence({ item, color = '#F5A524' }) {
  const [size, setSize] = useState(null);
  if (!item.url) return null;
  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-lg border border-graphite bg-black">
        <img src={item.url} alt={item.note} className="block w-full"
          onLoad={(e) => setSize([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])} />
        {size && (item.box || item.pixel) && (
          <svg viewBox={`0 0 ${size[0]} ${size[1]}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
            {item.box && (
              <rect x={item.box[0]} y={item.box[1]} width={item.box[2] - item.box[0]} height={item.box[3] - item.box[1]}
                fill="none" stroke={color} strokeWidth={size[0] / 200} />
            )}
            {item.pixel && (
              <circle cx={item.pixel[0]} cy={item.pixel[1]} r={size[0] / 22} fill="none" stroke={color} strokeWidth={size[0] / 200} />
            )}
          </svg>
        )}
      </div>
      <figcaption className="mt-1 text-xs text-slate">
        <span className="uppercase tracking-wide text-paper/70">{item.scan}</span> · {item.note}
      </figcaption>
    </figure>
  );
}

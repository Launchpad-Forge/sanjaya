import { useState } from 'react';

const rooms = [
  { name: 'ENTRY', x: 210, y: 282, w: 130, h: 90 },
  { name: 'WORKSPACE', x: 210, y: 142, w: 220, h: 126 },
  { name: 'CORRIDOR', x: 354, y: 282, w: 210, h: 90 },
  { name: 'STAIRWELL', x: 444, y: 142, w: 120, h: 126 },
  { name: 'UNEXPLORED', x: 578, y: 142, w: 125, h: 230 },
];

export default function SpatialPreview() {
  const [view, setView] = useState('Spatial map');
  return (
    <div className="spatial-preview">
      <div className="preview-toolbar"><span className="preview-file"><span className="status-dot" /> THE WORLD, RECONSTRUCTED</span><span className="preview-tag">Illustrative preview</span></div>
      <div className="preview-tabs" role="group" aria-label="Map preview view">
        {['Spatial map', 'Scene graph'].map(tab => <button key={tab} type="button" aria-pressed={view === tab} onClick={() => setView(tab)}>{tab}</button>)}
      </div>
      <svg className="spatial-map" viewBox="0 0 900 480" role="img" aria-label={view === 'Spatial map' ? 'Illustrative floor plan with an entry, workspace, corridor, stairwell, and unexplored room' : 'Illustrative scene graph connecting an entry to a workspace, corridor, and stairwell'}>
        <defs>
          <pattern id="map-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0v26" fill="none" stroke="#aab3ee" strokeOpacity=".09" strokeWidth=".7" /></pattern>
          <radialGradient id="map-glow"><stop stopColor="#6451c9" stopOpacity=".3" /><stop offset="1" stopColor="#6451c9" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="900" height="480" fill="url(#map-grid)" />
        <ellipse cx="450" cy="260" rx="350" ry="220" fill="url(#map-glow)" />
        {view === 'Spatial map' ? <g transform="translate(8 -10) matrix(1 -.18 .38 .75 -90 100)">
          {rooms.map((room, i) => <g key={room.name}>
            <path d={`M${room.x} ${room.y + room.h}v-32h${room.w}v32`} fill={i === 4 ? '#1b2035' : '#45416d'} fillOpacity=".45" />
            <rect x={room.x} y={room.y - 32} width={room.w} height={room.h} fill={i === 4 ? '#15172b' : '#292846'} fillOpacity=".85" stroke={i === 4 ? '#696b82' : '#b6a7f0'} strokeWidth="1.5" strokeDasharray={i === 4 ? '6 5' : undefined} />
            <path d={`M${room.x} ${room.y + room.h - 32}v32h${room.w}v-32M${room.x + room.w} ${room.y - 32}v32`} fill="none" stroke="#777395" strokeWidth="1" />
            <text x={room.x + room.w / 2} y={room.y + room.h / 2 - 28} textAnchor="middle" fill={i === 4 ? '#a5a5b6' : '#ded9f1'} fontSize="10" letterSpacing="2">{room.name}</text>
          </g>)}
          <path d="M242 305h45v-104h89v103h128V207" fill="none" stroke="#86e9d4" strokeWidth="3" strokeDasharray="5 5" />
          {[[242,305], [376,201], [504,207]].map(([x,y]) => <g key={x}><circle cx={x} cy={y} r="13" fill="#86e9d4" fillOpacity=".13" /><circle cx={x} cy={y} r="4" fill="#a6f8df" /></g>)}
          {Array.from({length: 7}, (_, i) => <path key={i} d={`M466 ${211 + i * 5}h43`} stroke="#a29ec5" strokeWidth="1" />)}
        </g> : <g>
          <path d="M200 250 420 155 660 250 420 345 200 250M420 155v190" fill="none" stroke="#9e91d1" strokeWidth="1.5" />
          {[['Entry',200,250],['Workspace',420,155],['Stairwell',660,250],['Corridor',420,345]].map(([name,x,y]) => <g key={name}><circle cx={x} cy={y} r="37" fill="#26253f" stroke="#a2d9d1" /><circle cx={x} cy={y} r="7" fill="#b6f5dc" /><text x={x} y={y + 62} fill="#e3e0f2" textAnchor="middle" fontSize="13">{name}</text></g>)}
        </g>}
        <g transform="translate(42 382)" stroke="#8b8aa6" strokeWidth="1"><path d="M0 30V0m0 30 24 12M0 30l-20 12" /><text x="-4" y="-9" fill="#a9a7bd" stroke="none" fontSize="10">Z</text><text x="28" y="49" fill="#a9a7bd" stroke="none" fontSize="10">X</text></g>
      </svg>
      <div className="preview-bottom"><span><i /> Camera path</span><span><i /> Mapped space</span><span><i /> Yet to explore</span><span className="preview-note">Pixels → places → understanding</span></div>
    </div>
  );
}

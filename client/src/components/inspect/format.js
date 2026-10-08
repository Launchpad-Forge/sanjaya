// Shared wording for change events (results page and report).
const VERB = {
  object_moved: 'moved', object_appeared: 'appeared', object_disappeared: 'missing',
  geometry_added: 'new material', geometry_removed: 'material missing',
};

export const changeTitle = (c) =>
  c.label ? `${c.label[0].toUpperCase()}${c.label.slice(1)} ${VERB[c.type]}` : `${VERB[c.type][0].toUpperCase()}${VERB[c.type].slice(1)}`;

export function changeMagnitude(c, unit) {
  if (c.displacement_m != null) return `${c.displacement_m} ${unit} (${c.displacement_range_m[0]}–${c.displacement_range_m[1]})`;
  if (c.region) return `≈ ${c.region.volume_m3} m³`;
  return null;
}

export const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
export const xyz = (p) => (p ? `(${p.map((v) => v.toFixed(2)).join(', ')})` : '–');

export const ACTION = {
  high: 'Verify on site now; safety-relevant item.',
  medium: 'Verify on site at the next walk-through.',
  low: 'Review the evidence; likely minor.',
};

export const SUPPORT_LABELS = {
  alignment: 'Scan alignment (ICP fitness)',
  sigma_ratio: 'Displacement / uncertainty',
  geometric: 'Geometric support',
  baseline_detection: 'Baseline detection support',
  current_detection: 'Current detection support',
  baseline_views: 'Baseline sightings',
  current_views: 'Current sightings',
  detection: 'Detection support',
  views: 'Sightings',
  free_space_views: 'Other scan saw empty space (views)',
  surface_views: 'Other scan saw a surface (views)',
  occluded_views: 'Other scan blocked (views)',
  own_views: 'Own-scan views agreeing',
};

// Gemini explains findings; it never produces them. It only sees the measured evidence of
// one change, and every number in its reply must trace back to that evidence (metres may
// be restated as centimetres, a 0-1 confidence as a percentage). Otherwise the reply is
// discarded and a deterministic template built from the same evidence is used.
import { env } from '../config/env.js';

const SYSTEM = `You explain one finding from an automated visual inspection to a facility inspector.
You receive the measured evidence as JSON. Write 2-3 plain sentences:
1. what changed (object or region) and, only if the JSON has it, how far it moved;
2. how strong the evidence is (sightings, free-space views, alignment, confidence);
3. a recommendation that a person verifies it on site.
Use ONLY numbers present in the JSON. You may convert metres to centimetres and a 0-1 value to a percentage.
Never estimate, round up, or invent a measurement, a cause, or an object that is not in the JSON.
If displacement is null, do not state any distance. This is decision support, not a verdict.`;

/** The only information the explanation may use. */
export function evidenceFacts(c, unit) {
  return {
    type: c.type, object: c.label, unit, severity: c.severity, confidence: c.confidence,
    displacement: c.displacement_m, displacement_range: c.displacement_range_m,
    position_uncertainty: c.uncertainty_m, volume_m3: c.region?.volume_m3 ?? null, support: c.support,
  };
}

/** Every number in text must match a number in facts (or x100 of it), within rounding. */
export function groundedNumbers(text, facts) {
  const allowed = [];
  const walk = (v) => {
    if (typeof v === 'number') allowed.push(v, v * 100);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(facts);
  const found = (text.replace(/\b3-?D\b/gi, '').match(/\d+(?:[.,]\d+)?/g) || []).map((s) => parseFloat(s.replace(',', '.')));
  const bad = found.filter((n) => !allowed.some((a) => Math.abs(n - a) <= Math.max(0.011, 0.02 * Math.abs(a))));
  return { ok: bad.length === 0, bad };
}

const pct = (x) => `${Math.round(x * 100)}%`;

export function templateExplanation(c, unit) {
  const s = c.support || {};
  const verify = ' A person should verify this on site before acting.';
  const conf = `Confidence ${pct(c.confidence)} (scan alignment ${pct(s.alignment ?? 0)}).`;
  switch (c.type) {
    case 'object_moved': {
      const [lo, hi] = c.displacement_range_m ?? [];
      const dist = c.displacement_m == null ? 'moved' :
        `moved about ${c.displacement_m} ${unit} (likely ${lo}-${hi} ${unit})`;
      return `The ${c.label} ${dist} from its baseline position, seen ${s.baseline_views} time(s) in the baseline ` +
        `and ${s.current_views} time(s) now. ${conf}${verify}`;
    }
    case 'object_disappeared':
      return `The ${c.label} recorded in the baseline was not found: ${s.free_space_views} view(s) of the current scan ` +
        `looked at its location and saw empty space. ${conf}${verify}`;
    case 'object_appeared':
      return `A ${c.label} is present that was not in the baseline: ${s.free_space_views} baseline view(s) saw empty ` +
        `space at this location. ${conf}${verify}`;
    case 'geometry_added':
    case 'geometry_removed':
      return `${c.type === 'geometry_added' ? 'New' : 'Missing'} material of about ${c.region?.volume_m3} m³ ` +
        `${c.type === 'geometry_added' ? 'appeared' : 'is gone'} here (no object label; ${s.free_space_views} view(s) ` +
        `of the other scan saw empty space). ${conf}${verify}`;
    default:
      return `Change of type ${c.type}. ${conf}${verify}`;
  }
}

export async function explainChange(change, unit) {
  const facts = evidenceFacts(change, unit);
  const fallback = { text: templateExplanation(change, unit), source: 'template' };
  if (!env.GEMINI_API_KEY) return fallback;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(facts) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
    const body = await res.json();
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('gemini returned no text');
    const g = groundedNumbers(text, facts);
    if (!g.ok) return { ...fallback, rejected: { text, ungrounded_numbers: g.bad } };
    return { text, source: 'gemini', model: env.GEMINI_MODEL };
  } catch (e) {
    return { ...fallback, error: e.message };
  }
}

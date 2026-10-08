// /inspection/:id: what changed, where, how much, how sure, and the evidence.
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { explainInspection, getInspection } from '../../api/missions';
import Evidence from '../../components/inspect/Evidence';
import { SUPPORT_LABELS, changeMagnitude, changeTitle, pct, xyz } from '../../components/inspect/format';
import MapViewer3D, { SEVERITY_COLOR } from '../../components/viewer/MapViewer3D';
import usePoll from '../../hooks/usePoll';

export default function Inspection() {
  const { id } = useParams();
  const { data: ins, error, setData } = usePoll(getInspection, id);
  const [selectedId, setSelectedId] = useState(null);
  const explained = useRef(false);

  const r = ins?.status === 'ready' ? ins.result : null;
  const changes = r?.changes ?? [];
  const selected = changes.find((c) => c.id === selectedId) ?? null;

  // explanations are generated once from the evidence, then stored with the inspection
  useEffect(() => {
    if (!r || explained.current || !changes.length || changes.every((c) => c.explanation)) return;
    explained.current = true;
    explainInspection(id)
      .then((ex) => setData((d) => ({ ...d, result: { ...d.result, changes: d.result.changes.map((c) => ({ ...c, explanation: ex[c.id] })) } })))
      .catch(() => { /* explanations are optional; the evidence stands on its own */ });
  }, [r, changes, id, setData]);

  useEffect(() => { if (!selectedId && changes.length) setSelectedId(changes[0].id); }, [changes, selectedId]);

  if (error) return <Shell><p role="alert">{error}</p></Shell>;
  if (!ins || ins.status === 'processing') {
    return <Shell><p className="text-lg">Comparing the rescan with the baseline…</p><p className="mt-2 text-slate">Aligning both scans and checking every object and surface. Usually under a minute.</p></Shell>;
  }
  if (ins.status === 'failed') return <Shell><p role="alert">Comparison failed: {ins.error}</p><Link to="/inspect" className="mt-4 inline-block text-trace">Back to inspection</Link></Shell>;

  const a = r.alignment;
  const high = r.summary.high;
  return (
    <Shell wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">Inspection result</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
            {r.status !== 'ok' ? 'Scans could not be aligned'
              : changes.length ? `${changes.length} change${changes.length > 1 ? 's' : ''} detected` : 'No changes detected'}
          </h1>
          {high > 0 && <p className="mt-2 font-medium" style={{ color: SEVERITY_COLOR.high }}>{high} high priority</p>}
        </div>
        <div className="flex gap-3">
          <Link to={`/reports/${id}`} className="rounded-full bg-trace px-6 py-3 font-semibold text-void">Generate report</Link>
          <Link to="/inspect" className="rounded-full border border-white/20 px-6 py-3">New scan</Link>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <Stat label="Changes" value={changes.length} />
        <Stat label="High priority" value={high} />
        <Stat label="Objects (baseline → now)" value={`${r.baseline.objects} → ${r.current.objects}`} />
        <Stat label="Floor covered (baseline)" value={ins.baseline.stats?.floor_area_seen ? `${ins.baseline.stats.floor_area_seen} m²` : '–'} />
        <Stat label="Alignment" value={a?.confidence != null ? `${pct(a.confidence)} · ${a.method}` : 'failed'} />
      </dl>

      {r.warnings.length > 0 && <ul className="mt-4 text-sm text-slate">{r.warnings.map((w) => <li key={w}>• {w}</li>)}</ul>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <MapViewer3D url={ins.urls.baseline_scene} changes={changes} selectedId={selectedId} onSelect={setSelectedId} className="h-[520px]" />
        <ol className="max-h-[520px] space-y-2 overflow-auto">
          {changes.map((c) => (
            <li key={c.id}>
              <button onClick={() => setSelectedId(c.id)} aria-pressed={c.id === selectedId}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${c.id === selectedId ? 'border-trace bg-white/5' : 'border-graphite hover:border-white/30'}`}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLOR[c.severity] }} />
                  <span className="font-medium">{changeTitle(c)}</span>
                  <span className="ml-auto text-xs uppercase text-slate">{c.severity}</span>
                </div>
                <p className="mt-1 text-sm text-slate">
                  {changeMagnitude(c, r.unit) ?? 'presence change'} · confidence {pct(c.confidence)}
                </p>
              </button>
            </li>
          ))}
          {!changes.length && r.status === 'ok' && <li className="text-sm text-slate">Nothing in the areas both scans saw has changed beyond the measurement uncertainty.</li>}
        </ol>
      </div>

      {selected && <ChangeDetail c={selected} unit={r.unit} />}

      {r.unverified.length > 0 && (
        <details className="mt-8 rounded-2xl border border-graphite p-6 text-sm">
          <summary className="cursor-pointer font-medium">{r.unverified.length} possible change(s) not confirmed</summary>
          <p className="mt-2 text-slate">Not reported as changes because the other scan could not confirm them.</p>
          <ul className="mt-3 space-y-1">{r.unverified.map((u, i) => <li key={i}>• {u.label ?? 'geometry'} ({u.type.replace(/_/g, ' ')}): {u.reason}</li>)}</ul>
        </details>
      )}
    </Shell>
  );
}

function ChangeDetail({ c, unit }) {
  const base = c.evidence.filter((e) => e.scan === 'baseline' && e.url);
  const cur = c.evidence.filter((e) => e.scan === 'current' && e.url);
  const color = SEVERITY_COLOR[c.severity];
  return (
    <section className="mt-8 rounded-2xl border border-graphite p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-semibold">{changeTitle(c)}</h2>
        <span className="text-slate">{changeMagnitude(c, unit)}</span>
        <span className="ml-auto text-sm">Confidence <strong>{pct(c.confidence)}</strong></span>
      </div>
      <p className="mt-1 text-sm text-slate">
        Baseline {xyz(c.baseline_position)} → current {xyz(c.current_position)} {unit} · position uncertainty ±{c.uncertainty_m} {unit}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <EvidenceColumn title="Baseline" items={base} color={color} />
        <EvidenceColumn title="Current" items={cur} color={color} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate">Why we believe this</h3>
          <dl className="mt-2 divide-y divide-graphite text-sm">
            {Object.entries(c.support).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5"><dt className="text-slate">{SUPPORT_LABELS[k] ?? k}</dt><dd>{v}</dd></div>
            ))}
            {c.support.geometry_regions?.map((g, i) => (
              <div key={i} className="flex justify-between py-1.5"><dt className="text-slate">Geometry backs it ({g.type.replace(/_/g, ' ')})</dt><dd>{g.volume_m3} m³</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate">Explanation</h3>
          <p className="mt-2 leading-relaxed">{c.explanation?.text ?? 'Writing an explanation from the evidence…'}</p>
          {c.explanation && (
            <p className="mt-2 text-xs text-slate">
              {c.explanation.source === 'gemini' ? `Written by ${c.explanation.model} from the measured evidence only.` : 'Generated directly from the measured evidence.'}
              {' '}Decision support: a person should verify before acting.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function EvidenceColumn({ title, items, color }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate">{title}</h3>
      {items.length ? <div className="grid gap-3 sm:grid-cols-2">{items.map((e, i) => <Evidence key={i} item={e} color={color} />)}</div>
        : <p className="text-sm text-slate">No image for this scan.</p>}
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-xl border border-graphite p-4"><dt className="text-slate">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>;
}

function Shell({ children, wide }) {
  return (
    <main className="min-h-screen bg-void px-4 py-8 text-paper md:px-10">
      <div className={`mx-auto ${wide ? 'max-w-7xl' : 'max-w-3xl'}`}>
        <Link to="/inspect" className="text-sm text-slate hover:text-paper">← Inspection</Link>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

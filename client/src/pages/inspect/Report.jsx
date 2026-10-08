// /reports/:id: printable inspection report (browser "Save as PDF").
import { Link, useParams } from 'react-router-dom';
import { getInspection } from '../../api/missions';
import { ACTION, changeMagnitude, changeTitle, pct, xyz } from '../../components/inspect/format';
import usePoll from '../../hooks/usePoll';

const when = (s) => (s ? new Date(s).toLocaleString() : '–');

export default function Report() {
  const { id } = useParams();
  const { data: ins, error } = usePoll(getInspection, id);
  if (error) return <Page><p role="alert">{error}</p></Page>;
  if (!ins || ins.status !== 'ready') return <Page><p>{ins?.status === 'failed' ? `Comparison failed: ${ins.error}` : 'Preparing report…'}</p></Page>;

  const r = ins.result;
  const a = r.alignment;
  const bs = ins.baseline.stats ?? {};
  return (
    <Page>
      <div className="flex items-start justify-between gap-4 print:hidden">
        <Link to={`/inspection/${id}`} className="text-sm text-neutral-500">← Back to result</Link>
        <button onClick={() => window.print()} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">Print / save as PDF</button>
      </div>

      <header className="mt-6 border-b border-neutral-300 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Sanjaya inspection report</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {r.status !== 'ok' ? 'Inconclusive: scans could not be aligned' : `${r.changes.length} change${r.changes.length === 1 ? '' : 's'} detected · ${r.summary.high} high priority`}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">Report {id} · generated {when(ins.finished_at)}</p>
      </header>

      <Section title="Inspection summary">
        <Table rows={[
          ['Baseline scan', `${when(ins.baseline.created_at)} · session ${ins.baseline.id}`],
          ['Current scan', `${when(ins.current.created_at)} · session ${ins.current.id}`],
          ['Objects found', `${ins.baseline.objects} in baseline, ${ins.current.objects} now`],
          ['Coverage (baseline)', `${bs.floor_area_seen ?? '–'} m² floor seen · ${bs.frames ?? '–'} frames · path ${bs.path_length ?? '–'} ${r.unit} · ${bs.unexplored_edges ?? '–'} unexplored edges`],
          ['Real-world scale', bs.metric ? `estimated (spread ${bs.scale?.spread}; lower is better)` : 'not available: distances in model units'],
          ['Alignment', a?.confidence != null ? `${a.method} · confidence ${pct(a.confidence)} · residual ${a.rmse} ${r.unit}${a.anchor ? ` · marker #${a.anchor.marker_id}` : ''}` : 'failed'],
        ]} />
      </Section>

      <Section title="Detected changes">
        {r.changes.length === 0 && <p className="text-sm">No change was found in the areas both scans observed, beyond the measurement uncertainty.</p>}
        {r.changes.map((c, i) => (
          <article key={c.id} className="mt-4 break-inside-avoid rounded-lg border border-neutral-300 p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="text-lg font-semibold">{i + 1}. {changeTitle(c)}</h3>
              <span className="rounded-full border border-neutral-400 px-2 text-xs uppercase">{c.severity}</span>
              <span className="ml-auto text-sm">Confidence {pct(c.confidence)}</span>
            </div>
            <Table rows={[
              ['Magnitude', changeMagnitude(c, r.unit) ?? 'presence change'],
              ['Location (baseline frame)', `baseline ${xyz(c.baseline_position)} → current ${xyz(c.current_position)} ${r.unit}, ±${c.uncertainty_m}`],
              ['Evidence', Object.entries(c.support).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`).join(' · ')],
              ['Recommended action', ACTION[c.severity]],
            ]} />
            <div className="mt-3 flex flex-wrap gap-2">
              {c.evidence.filter((e) => e.url).slice(0, 4).map((e, k) => (
                <figure key={k} className="m-0 w-36">
                  <img src={e.url} alt={e.note} className="w-full rounded border border-neutral-300" />
                  <figcaption className="text-[10px] text-neutral-500">{e.scan}: {e.note}</figcaption>
                </figure>
              ))}
            </div>
            {c.explanation && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Explanation{c.explanation.source === 'gemini' ? ' (AI, from the evidence above)' : ''}:</span> {c.explanation.text}
              </p>
            )}
          </article>
        ))}
      </Section>

      {r.unverified.length > 0 && (
        <Section title="Not confirmed">
          <ul className="list-disc pl-5 text-sm">{r.unverified.map((u, i) => <li key={i}>{u.label ?? 'geometry'} ({u.type.replace(/_/g, ' ')}): {u.reason}</li>)}</ul>
        </Section>
      )}

      <Section title="Limitations">
        <ul className="list-disc pl-5 text-sm">{[...r.limitations, ...r.warnings].map((l) => <li key={l}>{l}</li>)}</ul>
        <p className="mt-3 text-sm font-medium">
          This report is decision support. Measurements come from computer vision on a single camera; explanations only restate that evidence. A qualified person must verify findings before acting.
        </p>
      </Section>
    </Page>
  );
}

function Section({ title, children }) {
  return <section className="mt-8"><h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2><div className="mt-2">{children}</div></section>;
}

function Table({ rows }) {
  return (
    <table className="mt-2 w-full text-sm">
      <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-neutral-200 align-top"><th className="w-48 py-1.5 pr-4 text-left font-normal text-neutral-500">{k}</th><td className="py-1.5">{v}</td></tr>)}</tbody>
    </table>
  );
}

function Page({ children }) {
  return <main className="min-h-screen bg-white px-6 py-8 text-neutral-900 print:p-0"><div className="mx-auto max-w-4xl">{children}</div></main>;
}

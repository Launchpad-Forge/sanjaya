import { useParams, Link } from 'react-router-dom';
import { getMission } from '../../api/missions';
import usePoll from '../../hooks/usePoll';
import ScanResults from '../../components/inspect/ScanResults';
import Brand from '../../components/site/Brand';

export default function Mission() {
  const { id } = useParams();
  const { data, error } = usePoll(getMission, id);
  return <main className="scan-page"><div className="page-container"><header className="scan-header"><Brand /><Link to="/inspect">New scan ↗</Link></header>{data?.status === 'ready' ? <ScanResults mission={data} /> : <section className="scan-progress"><span className="eyebrow">SANJAYA / RECONSTRUCTION</span><h1>{error || data?.status === 'failed' ? 'This scan needs another try.' : 'Building your mental map.'}</h1><p role={error || data?.status === 'failed' ? 'alert' : 'status'}>{error || data?.error || 'The engine is processing your capture. This can take several minutes, depending on the queue.'}</p><p>Keep this link to return to your results.</p><Link to="/inspect" className="button-secondary">Back to capture</Link></section>}</div></main>;
}

import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { Arrow } from '../../components/site/Brand';

export default function Inspections() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-paper">Spatial Inspections</h1>
          <p className="text-xs text-slate mt-1">Manage baseline environments and 3D change comparison records.</p>
        </div>
        <Link to="/inspect" className="button-primary text-xs shrink-0">
          New Inspection Scan <Arrow />
        </Link>
      </div>

      <div className="border border-white/10 rounded-xl bg-graphite/40 overflow-hidden">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead className="bg-void text-slate uppercase border-b border-white/10">
            <tr>
              <th className="p-4 font-normal">Inspection ID</th>
              <th className="p-4 font-normal">Environment</th>
              <th className="p-4 font-normal">Date Created</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="p-4 text-paper font-bold">#INS-BASELINE-01</td>
              <td className="p-4 text-slate">Indoor Walkthrough</td>
              <td className="p-4 text-slate">{new Date().toLocaleDateString()}</td>
              <td className="p-4"><StatusBadge status="AVAILABLE" label="BASELINE SAVED" /></td>
              <td className="p-4 text-right">
                <Link to="/inspect" className="text-trace hover:underline font-bold">Rescan →</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

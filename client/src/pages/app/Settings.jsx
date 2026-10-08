import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-paper">Workspace Settings</h1>
        <p className="text-xs text-slate mt-1">Configure spatial perception preferences and engine parameters.</p>
      </div>

      <div className="p-6 rounded-xl bg-graphite/40 border border-white/10 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-mono text-paper uppercase tracking-wider">Perception Defaults</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate mb-1">Default Scene Type</label>
              <select className="w-full bg-void border border-white/10 rounded px-3 py-2 text-paper">
                <option value="Indoor">Indoor (Rooms, Tunnels, Hospitals)</option>
                <option value="Outdoor">Outdoor (Structures, Sites)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate mb-1">Target FPS</label>
              <input type="number" defaultValue={6} className="w-full bg-void border border-white/10 rounded px-3 py-2 text-paper" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <h3 className="text-sm font-bold font-mono text-paper uppercase tracking-wider">Object Vocabulary</h3>
          <p className="text-xs text-slate">Default targets for OWLv2 open-vocabulary 3D lifting:</p>
          <input 
            type="text" 
            defaultValue="door, staircase, person, fire extinguisher, exit sign, hazard" 
            className="w-full bg-void border border-white/10 rounded px-3 py-2 text-xs font-mono text-paper" 
          />
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { PLCProject, Tag } from '../types';
import { Power, Activity, Thermometer, Gauge, Lightbulb, MonitorCheck, MousePointer2, ToggleLeft, Hash, SlidersHorizontal } from 'lucide-react';

interface SimulationDashboardProps {
  project: PLCProject;
  setProject: (p: PLCProject) => void;
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ project, setProject }) => {
  const [controlMode, setControlMode] = useState<'toggle' | 'push'>('push');

  const setTagValue = (tagId: string, val: any) => {
    const newTags = project.tags.map(t => {
      if (t.id === tagId) return { ...t, value: val };
      return t;
    });
    setProject({ ...project, tags: newTags });
  };

  const inputs = project.tags.filter(t => t.address.startsWith('I') && t.dataType === 'BOOL');
  const outputs = project.tags.filter(t => t.address.startsWith('Q') && t.dataType === 'BOOL');
  const analogTags = project.tags.filter(t => t.dataType !== 'BOOL');

  return (
    <div className="p-8 flex flex-col gap-8 h-full bg-[#f4f7f9] overflow-y-auto font-sans">
      <div className="flex items-center justify-between border-b border-[#d1dce5] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#006487] to-[#004b66] rounded flex items-center justify-center text-white font-bold text-xl shadow-xl border border-[#003d52]">
            S7
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#006487] flex items-center gap-2">
              CPU 1214C Simulator
              <span className="text-[10px] font-normal px-2 py-0.5 bg-green-100 text-green-700 rounded border border-green-200 uppercase">Online</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">Real-time Digital & Analog I/O Mapping</p>
          </div>
        </div>

        <div className="flex bg-white border border-[#ccc] rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setControlMode('push')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${controlMode === 'push' ? 'bg-[#006487] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <MousePointer2 className="w-3 h-3" /> PUSH BUTTON (MOMENTARY)
          </button>
          <button 
            onClick={() => setControlMode('toggle')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${controlMode === 'toggle' ? 'bg-[#006487] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <ToggleLeft className="w-3 h-3" /> TOGGLE SWITCH (LATCHED)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Virtual Inputs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#d1dce5]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#333]">
              <Power className="w-4 h-4 text-blue-500" />
              Digital Inputs (DI)
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {inputs.map(input => (
              <div key={input.id} className="flex flex-col items-center gap-2 group">
                <span className={`text-[10px] font-mono font-bold ${input.value ? 'text-green-600' : 'text-gray-400'}`}>{input.address}</span>
                <button 
                  onMouseDown={() => setTagValue(input.id, true)}
                  onMouseUp={() => controlMode === 'push' && setTagValue(input.id, false)}
                  onMouseLeave={() => controlMode === 'push' && input.value && setTagValue(input.id, false)}
                  onClick={() => controlMode === 'toggle' && setTagValue(input.id, !input.value)}
                  className={`w-14 h-14 rounded-md border-2 transition-all flex items-center justify-center shadow-md relative overflow-hidden active:translate-y-0.5 active:shadow-none
                    ${input.value 
                      ? 'bg-green-500 border-green-600 ring-4 ring-green-100' 
                      : 'bg-[#f0f3f5] border-[#cbd5e0] hover:bg-[#e2e8f0]'}
                  `}
                >
                   {input.value && <div className="absolute inset-0 bg-white/30 animate-pulse" />}
                   <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${input.value ? 'bg-white shadow-[0_0_12px_white] scale-110' : 'bg-[#a0aec0]'}`} />
                </button>
                <span className="text-[9px] font-semibold text-center leading-tight text-gray-600 h-6 overflow-hidden">{input.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Outputs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#d1dce5]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#333]">
              <Lightbulb className="w-4 h-4 text-orange-500" />
              Digital Outputs (DQ)
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {outputs.map(output => (
              <div key={output.id} className="flex flex-col items-center gap-2">
                <span className={`text-[10px] font-mono font-bold ${output.value ? 'text-orange-600' : 'text-gray-400'}`}>{output.address}</span>
                <div 
                  className={`w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-inner relative
                    ${output.value 
                      ? 'bg-[#fbbf24] border-[#d97706] shadow-[0_0_20px_#fbbf24] ring-4 ring-orange-100' 
                      : 'bg-[#2d3748] border-[#1a202c] shadow-none'}
                  `}
                >
                  {output.value ? (
                    <>
                      <div className="w-8 h-8 bg-white/50 blur-xl rounded-full absolute animate-pulse" />
                      <div className="w-3 h-3 bg-white rounded-full opacity-90 shadow-[0_0_8px_white]" />
                    </>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-[#4a5568] rounded-full" />
                  )}
                </div>
                <span className="text-[9px] font-semibold text-center leading-tight text-gray-600 h-6 overflow-hidden">{output.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analog & Memory Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#d1dce5]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#333]">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
              Analog & Memory (IW/QW/D)
            </h3>
          </div>
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {analogTags.map(tag => (
              <div key={tag.id} className="p-3 bg-[#f8fafc] rounded-md border border-[#e2e8f0] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#006487]">{tag.name}</span>
                    <span className="text-[9px] text-gray-400 font-mono tracking-wider">{tag.address}</span>
                  </div>
                  <input 
                    type="number"
                    value={tag.value}
                    onChange={(e) => setTagValue(tag.id, parseFloat(e.target.value))}
                    className="w-20 bg-white border border-[#cbd5e0] text-right px-2 py-0.5 rounded text-[10px] font-mono font-black text-orange-600"
                  />
                </div>
                <input 
                  type="range"
                  min={tag.address.startsWith('I') ? 0 : -32768}
                  max={tag.address.startsWith('I') ? 27648 : 32767}
                  value={tag.value}
                  onChange={(e) => setTagValue(tag.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006487]"
                />
              </div>
            ))}
            {analogTags.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-xs italic">
                No analog tags defined.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;

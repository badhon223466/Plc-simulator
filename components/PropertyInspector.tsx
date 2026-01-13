
import React, { useState, useEffect } from 'react';
import { PLCProject, Instruction, Tag, LadderElement, isBranchGroup, InstructionType } from '../types';
import { Info, Settings, Code, Database, X, Sliders, Hash, Tag as TagIcon } from 'lucide-react';

interface PropertyInspectorProps {
  project: PLCProject;
  selectedId: string | null;
  setProject: (p: PLCProject) => void;
  onClose?: () => void;
}

const PropertyInspector: React.FC<PropertyInspectorProps> = ({ project, selectedId, setProject, onClose }) => {
  const [tab, setTab] = useState<'general' | 'params' | 'config' | 'diag'>('general');

  const findInstruction = (elements: LadderElement[], id: string): Instruction | undefined => {
    for (const el of elements) {
      if (isBranchGroup(el)) {
        for (const branch of el.branches) {
          const found = findInstruction(branch, id);
          if (found) return found;
        }
      } else if (el.id === id) {
        return el as Instruction;
      }
    }
    return undefined;
  };

  const selectedInstruction = (() => {
    if (!selectedId) return undefined;
    for (const network of project.networks) {
      for (const rung of network.rungs) {
        const found = findInstruction(rung.elements, selectedId);
        if (found) return found;
      }
    }
    return undefined;
  })();

  useEffect(() => {
    if (selectedInstruction?.type !== InstructionType.PID && tab === 'config') {
        setTab('general');
    }
  }, [selectedId, selectedInstruction]);

  const updateParam = (key: string, value: any) => {
    if (!selectedId) return;

    const updateElements = (elements: LadderElement[]): LadderElement[] => {
      return elements.map(el => {
        if (isBranchGroup(el)) {
          return {
            ...el,
            branches: el.branches.map(branch => updateElements(branch))
          };
        } else if (el.id === selectedId) {
          const currentParams = (el as Instruction).params || {};
          return { ...el, params: { ...currentParams, [key]: value } };
        }
        return el;
      });
    };

    const newNetworks = project.networks.map(n => ({
      ...n,
      rungs: n.rungs.map(r => ({
        ...r,
        elements: updateElements(r.elements)
      }))
    }));
    setProject({ ...project, networks: newNetworks });
  };

  const updateInstructionTag = (tagId: string | undefined) => {
    if (!selectedId) return;
    const updateElements = (elements: LadderElement[]): LadderElement[] => {
      return elements.map(el => {
        if (isBranchGroup(el)) {
          return { ...el, branches: el.branches.map(b => updateElements(b)) };
        } else if (el.id === selectedId) {
          return { ...el, tagId };
        }
        return el;
      });
    };
    const newNetworks = project.networks.map(n => ({
      ...n,
      rungs: n.rungs.map(r => ({ ...r, elements: updateElements(r.elements) }))
    }));
    setProject({ ...project, networks: newNetworks });
  };

  if (!selectedInstruction) {
    return (
      <div className="flex flex-col h-full bg-[#e6e6e6] items-center justify-center text-gray-400 text-xs italic p-10">
        Select an instruction in the editor to view properties.
      </div>
    );
  }

  const isTimer = [InstructionType.TON, InstructionType.TOF, InstructionType.TONR].includes(selectedInstruction.type);
  const isCounter = [InstructionType.CTU, InstructionType.CTD, InstructionType.CTUD].includes(selectedInstruction.type);
  const isMath = [InstructionType.ADD, InstructionType.SUB, InstructionType.MUL, InstructionType.DIV, InstructionType.MOV].includes(selectedInstruction.type);
  const isScaling = [InstructionType.NORM_X, InstructionType.SCALE_X].includes(selectedInstruction.type);
  const isPID = selectedInstruction.type === InstructionType.PID;

  return (
    <div className="flex flex-col h-full bg-[#e6e6e6]">
      <div className="flex bg-[#d6dee2] border-b border-[#ccc] h-8 shrink-0 justify-between items-center pr-2">
        <div className="flex h-full">
          <TabItem active={tab === 'general'} label="General" icon={Info} onClick={() => setTab('general')} />
          <TabItem active={tab === 'params'} label="Inputs/Outputs" icon={Settings} onClick={() => setTab('params')} />
          {isPID && (
             <TabItem active={tab === 'config'} label="PID Tuning" icon={Sliders} onClick={() => setTab('config')} />
          )}
          <TabItem active={tab === 'diag'} label="Diagnostics" icon={Code} onClick={() => setTab('diag')} />
        </div>
        <button onClick={onClose} className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="text-sm font-bold text-[#006487]">{selectedInstruction.type === InstructionType.PID ? 'PID_Compact' : selectedInstruction.type}</span>
            <span className="text-[10px] text-gray-400 font-mono">Instance: {selectedInstruction.id}</span>
          </div>

          {tab === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Instruction Name" value={selectedInstruction.type} readOnly />
              <Field label="Version" value="1.0.0" readOnly />
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Comment</label>
                <textarea className="w-full text-xs p-2 border border-[#ccc] rounded outline-none h-16" placeholder="Add logical comment..." />
              </div>
            </div>
          )}

          {tab === 'params' && (
            <div className="flex flex-col gap-4">
               <div className="text-[10px] text-gray-500 uppercase font-bold bg-gray-50 p-2 rounded flex items-center gap-2">
                 <Database className="w-3 h-3" /> Parameter Mapping
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Tag Assignment (Q, I, M) */}
                  {!isMath && !isPID && !isScaling && (
                    <TagSelector 
                      label="Operand Tag (Q/I/M/T/C)" 
                      value={selectedInstruction.tagId} 
                      tags={project.tags} 
                      onChange={updateInstructionTag} 
                    />
                  )}

                  {/* Specific parameters based on type */}
                  {isTimer && (
                    <>
                      <NumberInput 
                        label="Preset Time (PT)" 
                        value={selectedInstruction.params?.preset ?? 0} 
                        onChange={(v) => updateParam('preset', v)} 
                        suffix={selectedInstruction.params?.timeUnit || 'ms'}
                      />
                      <TagSelector 
                        label="Reset Tag (R)" 
                        value={selectedInstruction.params?.resetTagId} 
                        tags={project.tags} 
                        onChange={(v) => updateParam('resetTagId', v)} 
                      />
                    </>
                  )}

                  {isCounter && (
                    <>
                      <NumberInput 
                        label="Preset Value (PV)" 
                        value={selectedInstruction.params?.preset ?? 0} 
                        onChange={(v) => updateParam('preset', v)} 
                      />
                      <TagSelector 
                        label="Reset Tag (R)" 
                        value={selectedInstruction.params?.resetTagId} 
                        tags={project.tags} 
                        onChange={(v) => updateParam('resetTagId', v)} 
                      />
                    </>
                  )}

                  {(isMath || isPID || isScaling) && (
                    <>
                      <div className="space-y-4 col-span-2 border-l-2 border-[#006487] pl-4 py-2">
                        <TagOrConstant 
                          label={isPID ? "Setpoint (SP)" : isScaling ? "Input Value" : "Input 1 (IN1)"}
                          tagValue={selectedInstruction.params?.sourceTagId}
                          constValue={isPID ? selectedInstruction.params?.setpoint : selectedInstruction.params?.preset}
                          tags={project.tags}
                          onTagChange={(v) => updateParam('sourceTagId', v)}
                          onConstChange={(v) => updateParam(isPID ? 'setpoint' : 'preset', v)}
                        />
                        {selectedInstruction.type !== InstructionType.MOV && (
                          <TagOrConstant 
                            label={isPID ? "Input (PV)" : isScaling ? "Min Value" : "Input 2 (IN2)"}
                            tagValue={selectedInstruction.params?.minTagId}
                            constValue={selectedInstruction.params?.preset2}
                            tags={project.tags}
                            onTagChange={(v) => updateParam('minTagId', v)}
                            onConstChange={(v) => updateParam('preset2', v)}
                          />
                        )}
                        {isScaling && (
                          <TagOrConstant 
                            label="Max Value"
                            tagValue={selectedInstruction.params?.maxTagId}
                            constValue={selectedInstruction.params?.preset3}
                            tags={project.tags}
                            onTagChange={(v) => updateParam('maxTagId', v)}
                            onConstChange={(v) => updateParam('preset3', v)}
                          />
                        )}
                        <TagSelector 
                          label={isPID ? "Output (OUT)" : "Destination (OUT)"}
                          value={selectedInstruction.params?.destTagId}
                          tags={project.tags}
                          onChange={(v) => updateParam('destTagId', v)}
                        />
                      </div>
                    </>
                  )}
               </div>
            </div>
          )}

          {tab === 'config' && isPID && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded border border-gray-100">
                <NumberInput 
                  label="Gain (Kp)" 
                  value={selectedInstruction.params?.kp ?? 1.0} 
                  step={0.01}
                  onChange={(v) => updateParam('kp', v)} 
                />
                <NumberInput 
                  label="Integral (Ki)" 
                  value={selectedInstruction.params?.ki ?? 0.1} 
                  step={0.01}
                  onChange={(v) => updateParam('ki', v)} 
                />
                <NumberInput 
                  label="Derivative (Kd)" 
                  value={selectedInstruction.params?.kd ?? 0.0} 
                  step={0.01}
                  onChange={(v) => updateParam('kd', v)} 
                />
              </div>

              <div className="bg-[#f0f7f9] p-4 rounded-md border border-[#00648722] space-y-4 shadow-inner">
                <h4 className="text-[11px] font-bold text-[#006487] uppercase flex items-center gap-2">
                  <Sliders className="w-3 h-3" /> Output Limits (Range)
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <NumberInput 
                    label="Output Minimum (%)" 
                    value={selectedInstruction.params?.outMin ?? -100.0} 
                    onChange={(v) => updateParam('outMin', v)} 
                    suffix="%"
                  />
                  <NumberInput 
                    label="Output Maximum (%)" 
                    value={selectedInstruction.params?.outMax ?? 100.0} 
                    onChange={(v) => updateParam('outMax', v)} 
                    suffix="%"
                  />
                </div>
                <p className="text-[9px] text-gray-500 italic">Common range for bipolar control: -100% to 100%.</p>
              </div>
            </div>
          )}

          {tab === 'diag' && (
            <div className="text-xs text-gray-400 font-mono bg-gray-50 p-4 rounded border border-dashed text-center">
              [No active diagnostic errors detected for this block]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TagSelector: React.FC<{ label: string; value: string | undefined; tags: Tag[]; onChange: (v: string | undefined) => void }> = ({ label, value, tags, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
      <TagIcon className="w-2.5 h-2.5" /> {label}
    </label>
    <select 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value || undefined)}
      className="text-xs p-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487] bg-white"
    >
      <option value="">-- No Tag --</option>
      {tags.map(t => (
        <option key={t.id} value={t.id}>{t.address} ({t.name})</option>
      ))}
    </select>
  </div>
);

const TagOrConstant: React.FC<{ 
  label: string; 
  tagValue: string | undefined; 
  constValue: number | undefined; 
  tags: Tag[]; 
  onTagChange: (v: string | undefined) => void; 
  onConstChange: (v: number | undefined) => void;
}> = ({ label, tagValue, constValue, tags, onTagChange, onConstChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
    <div className="flex gap-2">
      <select 
        value={tagValue || ''} 
        onChange={(e) => {
          onTagChange(e.target.value || undefined);
          if (e.target.value) onConstChange(undefined);
        }}
        className="flex-1 text-xs p-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487] bg-white"
      >
        <option value="">-- Constant Value --</option>
        {tags.map(t => (
          <option key={t.id} value={t.id}>{t.address} ({t.name})</option>
        ))}
      </select>
      {!tagValue && (
        <input 
          type="number"
          value={constValue ?? 0}
          onChange={(e) => onConstChange(parseFloat(e.target.value))}
          placeholder="0.0"
          className="w-20 text-xs p-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487] font-mono font-bold text-[#006487]"
        />
      )}
    </div>
  </div>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number }> = ({ label, value, onChange, suffix, step = 1 }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
    <div className="flex items-center gap-1">
      <input 
        type="number" 
        step={step}
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 text-xs p-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487] font-mono font-bold text-[#006487]"
      />
      {suffix && <span className="text-[10px] font-bold text-gray-400">{suffix}</span>}
    </div>
  </div>
);

const TabItem: React.FC<{ active: boolean; label: string; icon: any; onClick: () => void }> = ({ active, label, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 h-full text-[11px] cursor-pointer border-r border-[#ccc] transition-all
      ${active ? 'bg-white font-bold text-[#006487] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </div>
);

const Field: React.FC<{ label: string; value: any; readOnly?: boolean }> = ({ label, value, readOnly }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
    <input 
      type="text" 
      value={value} 
      readOnly={readOnly}
      className={`text-xs p-1.5 border border-[#ccc] rounded outline-none ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-1 focus:ring-[#006487]'}`}
    />
  </div>
);

export default PropertyInspector;

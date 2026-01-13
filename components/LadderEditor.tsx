
import React, { useState, useRef, useEffect } from 'react';
import { PLCProject, Network, InstructionType, Instruction, Tag, Rung, LadderElement, isBranchGroup, BranchGroup } from '../types';
import { Plus, Trash2, GitBranch, Settings2, Zap, ZapOff, XCircle, Search, Check, X, Clock, RefreshCw, Power, PowerOff, Hash, RotateCcw, AlertCircle, ChevronDown, Split, Layers, ToggleLeft, ToggleRight, Lock, Unlock } from 'lucide-react';

interface LadderEditorProps {
  project: PLCProject;
  setProject: (p: PLCProject) => void;
  selectedNetworkId: string | null;
  setSelectedNetworkId: (id: string | null) => void;
  setSelectedInstructionId: (id: string | null) => void;
}

const LadderEditor: React.FC<LadderEditorProps> = ({ 
  project, 
  setProject, 
  selectedNetworkId, 
  setSelectedNetworkId,
  setSelectedInstructionId
}) => {
  const [zoom, setZoom] = useState(1);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [editParamKey, setEditParamKey] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const updateProjectElement = (id: string, data: Partial<Instruction>) => {
    const updateElements = (elements: LadderElement[]): LadderElement[] => {
      return elements.map(el => {
        if (isBranchGroup(el)) {
          return {
            ...el,
            branches: el.branches.map(branch => updateElements(branch))
          };
        } else if (el.id === id) {
          if (data.params) {
            return { ...el, ...data, params: { ...(el as Instruction).params, ...data.params } };
          }
          return { ...el, ...data };
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

  const handleDrop = (target: { netId: string, rungId: string, branchIdx?: number, pos?: number, parentBranchId?: string }, e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('instructionType');
    const isBranch = e.dataTransfer.getData('isBranch') === 'true';
    if (!type) return;

    let newElement: LadderElement;

    if (isBranch || type === 'Open Branch') {
      newElement = {
        id: `branch_${Date.now()}`,
        branches: [[], []],
      };
    } else {
      newElement = {
        id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: type as InstructionType,
        params: { 
          preset: 0, preset2: 0, preset3: 100, current: 0, timeUnit: 'ms', kp: 1.0, ki: 0.1, kd: 0.0, setpoint: 50,
          inMin: 0, inMax: 27648, outMin: 0, outMax: 100
        }
      };
    }

    const insertIntoList = (list: LadderElement[]): LadderElement[] => {
        if (target.pos !== undefined && target.parentBranchId === undefined) {
             const copy = [...list];
             copy.splice(target.pos, 0, newElement);
             return copy;
        }
        return [...list, newElement];
    };

    const findAndInsert = (elements: LadderElement[]): LadderElement[] => {
        return elements.map(el => {
            if (isBranchGroup(el)) {
                if (el.id === target.parentBranchId && target.branchIdx !== undefined) {
                    const newBranches = [...el.branches];
                    newBranches[target.branchIdx] = [...newBranches[target.branchIdx], newElement as Instruction];
                    return { ...el, branches: newBranches };
                }
                return { ...el, branches: el.branches.map(b => findAndInsert(b)) };
            }
            return el;
        });
    };

    const newNetworks = project.networks.map(n => {
      if (n.id === target.netId) {
        return {
          ...n,
          rungs: n.rungs.map(r => {
            if (r.id === target.rungId) {
                if (target.parentBranchId) {
                    return { ...r, elements: findAndInsert(r.elements) };
                }
                return { ...r, elements: insertIntoList(r.elements) };
            }
            return r;
          })
        };
      }
      return n;
    });

    setProject({ ...project, networks: newNetworks });
  };

  const addBranchToGroup = (branchGroupId: string) => {
    const updateElements = (elements: LadderElement[]): LadderElement[] => {
      return elements.map(el => {
        if (isBranchGroup(el)) {
          if (el.id === branchGroupId) {
            return { ...el, branches: [...el.branches, []] };
          }
          return { ...el, branches: el.branches.map(b => updateElements(b)) };
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

  const addRungToNetwork = (netId: string) => {
    const newRung: Rung = {
      id: `rung_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      elements: []
    };
    const newNetworks = project.networks.map(n => 
      n.id === netId ? { ...n, rungs: [...n.rungs, newRung] } : n
    );
    setProject({ ...project, networks: newNetworks });
  };

  const removeRungFromNetwork = (netId: string, rungId: string) => {
    const newNetworks = project.networks.map(n => {
      if (n.id === netId) {
        return { ...n, rungs: n.rungs.filter(r => r.id !== rungId) };
      }
      return n;
    });
    setProject({ ...project, networks: newNetworks });
  };

  const removeElement = (netId: string, rungId: string, elId: string) => {
    const removeInElements = (elements: LadderElement[]): LadderElement[] => {
      return elements
        .filter(el => el.id !== elId)
        .map(el => {
          if (isBranchGroup(el)) {
            return {
              ...el,
              branches: el.branches.map(b => removeInElements(b)).filter(b => b.length >= 0)
            };
          }
          return el;
        });
    };

    const newNetworks = project.networks.map(n => ({
      ...n,
      rungs: n.rungs.map(r => ({
        ...r,
        elements: removeInElements(r.elements)
      }))
    }));
    setProject({ ...project, networks: newNetworks });
    setSelectedInstructionId(null);
  };

  const handleOpenPopup = (e: React.MouseEvent, id: string, paramKey: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickEditId(id);
    setEditParamKey(paramKey);
    setPopupPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f3f5] overflow-auto select-none relative">
      <div className="sticky top-0 z-20 bg-white border-b border-[#ccc] p-1 flex items-center gap-2 shadow-sm">
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:bg-gray-100 rounded text-xs font-bold">-</button>
        <span className="text-[10px] font-bold text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-gray-100 rounded text-xs font-bold">+</button>
        <div className="h-4 w-[1px] bg-gray-300 mx-2" />
        <span className="text-[10px] font-bold text-[#006487] uppercase mr-2 tracking-wide">WebTIA Sim - LIVE DATA MONITORING ACTIVE</span>
      </div>

      <div className="p-8 space-y-12" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {project.networks.map((network, netIdx) => (
          <div 
            key={network.id} 
            className={`border border-[#ccc] bg-white rounded-sm shadow-sm transition-all ${selectedNetworkId === network.id ? 'ring-2 ring-[#FFA500]' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedNetworkId(network.id); }}
          >
            <div className="bg-[#e6eef2] px-3 py-1.5 flex items-center justify-between border-b border-[#b1bdc8]">
              <span className="font-bold text-xs text-[#006487]">Network {netIdx + 1}: {network.title}</span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); addRungToNetwork(network.id); }} 
                  title="Add Rung to this Network" 
                  className="p-1 hover:bg-[#ccdbe5] rounded text-[#006487] flex items-center gap-1 text-[9px] font-bold border border-transparent hover:border-[#006487]"
                >
                  <Layers className="w-3.5 h-3.5" /> + RUNG
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); 
                    const newNetworks = project.networks.filter(n => n.id !== network.id);
                    setProject({ ...project, networks: newNetworks });
                  }} 
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="relative pt-12 pb-12 overflow-x-auto min-w-full bg-[#ffffff] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#006487] shadow-[2px_0_4px_rgba(0,0,0,0.1)] z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#006487] shadow-[-2px_0_4px_rgba(0,0,0,0.1)] z-10" />

              <div className="flex flex-col gap-0">
                {network.rungs.map((rung, rIdx) => (
                  <div key={rung.id} className="relative group/rung">
                    <div className="flex items-center min-h-[140px] pl-10 pr-10 relative">
                      <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] z-0 transition-colors duration-200 ${rung.elements.length > 0 && (rung.elements[rung.elements.length - 1] as any).powerFlowOut ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-[#b1bdc8]'}`} />

                      <div 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={(e) => handleDrop({ netId: network.id, rungId: rung.id }, e)}
                        className="flex items-center gap-0 z-10 w-full"
                      >
                        {rung.elements.map((element) => (
                          <LadderElementView 
                            key={element.id} 
                            element={element} 
                            tags={project.tags}
                            project={project}
                            setProject={setProject}
                            netId={network.id}
                            rungId={rung.id}
                            onRemove={() => removeElement(network.id, rung.id, element.id)}
                            onSelect={() => setSelectedInstructionId(element.id)}
                            onOpenPopup={(e, param) => handleOpenPopup(e, element.id, param)}
                            updateProject={(val) => updateProjectElement(element.id, val)}
                            onAddBranchToGroup={() => addBranchToGroup(element.id)}
                            handleDrop={handleDrop}
                          />
                        ))}
                        
                        <div className="w-16 h-12 flex items-center justify-center border-2 border-dashed border-transparent hover:border-[#006487] hover:bg-[#00648710] rounded transition-all cursor-pointer group">
                          <Plus className="w-5 h-5 text-gray-200 group-hover:text-[#006487]" />
                        </div>
                      </div>
                    </div>

                    {network.rungs.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeRungFromNetwork(network.id, rung.id); }}
                        className="absolute right-2 top-2 opacity-0 group-hover/rung:opacity-100 text-red-400 hover:text-red-600 transition-all z-20"
                        title="Delete Rung"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); addRungToNetwork(network.id); }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-[#00648755] text-[#006487] text-[10px] font-bold hover:bg-[#00648710] transition-all"
                >
                  <Plus className="w-3 h-3" /> ADD RUNG TO NETWORK
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {quickEditId && (
        <QuickEditPopup 
          id={quickEditId} 
          paramKey={editParamKey}
          pos={popupPos} 
          project={project} 
          setProject={setProject}
          onUpdate={updateProjectElement}
          onClose={() => { setQuickEditId(null); setEditParamKey(null); }} 
        />
      )}
    </div>
  );
};

const LadderElementView: React.FC<{ 
  element: LadderElement; 
  tags: Tag[]; 
  project: PLCProject;
  setProject: (p: PLCProject) => void;
  netId: string;
  rungId: string;
  onRemove: () => void; 
  onSelect: () => void;
  onOpenPopup: (e: React.MouseEvent, paramKey?: string) => void;
  updateProject: (v: Partial<Instruction>) => void;
  onAddBranchToGroup: () => void;
  handleDrop: any;
}> = ({ element, tags, project, setProject, netId, rungId, onRemove, onSelect, onOpenPopup, updateProject, onAddBranchToGroup, handleDrop }) => {
  
  if (isBranchGroup(element)) {
    return (
      <div className="relative flex items-center mx-1 group/branch">
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[3px] ${element.isActive ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-[#b1bdc8]'}`} />
        
        <div className={`flex flex-col gap-8 px-4 py-4 relative ml-4 mr-4`}>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] transition-colors ${element.isActive ? 'bg-[#00FF00]' : 'bg-[#b1bdc8]'}`} style={{ height: 'calc(100% - 60px)' }} />
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[3px] transition-colors ${element.powerFlowOut ? 'bg-[#00FF00]' : 'bg-[#b1bdc8]'}`} style={{ height: 'calc(100% - 60px)' }} />

          {element.branches.map((branch, bIdx) => (
            <div key={bIdx} className="flex items-center relative min-h-[60px]">
              <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-[3px] ${element.isActive ? 'bg-[#00FF00]' : 'bg-[#b1bdc8]'}`} />
              <div className={`absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-[3px] ${branch.length > 0 && (branch[branch.length-1] as Instruction).powerFlowOut ? 'bg-[#00FF00]' : 'bg-[#b1bdc8]'}`} />
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop({ netId, rungId, branchIdx: bIdx, parentBranchId: element.id }, e)}
                className="flex items-center gap-0 min-w-[60px]"
              >
                {branch.map((el) => (
                   <LadderElementView 
                     key={el.id} 
                     element={el} 
                     tags={tags} 
                     project={project}
                     setProject={setProject}
                     netId={netId}
                     rungId={rungId}
                     onRemove={() => {}} 
                     onSelect={() => {}} 
                     onOpenPopup={onOpenPopup} 
                     updateProject={() => {}} 
                     onAddBranchToGroup={() => {}}
                     handleDrop={handleDrop}
                   />
                ))}
                {branch.length === 0 && (
                   <div className={`w-16 h-[3px] ${element.isActive ? 'bg-[#00FF00]' : 'bg-[#b1bdc8] border-2 border-dashed border-transparent hover:border-[#00648733] rounded'}`} />
                )}
              </div>
            </div>
          ))}
          
          <button 
            onClick={onAddBranchToGroup}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/branch:opacity-100 bg-[#006487] text-white rounded-full p-1 shadow-md hover:scale-110 transition-all z-20"
            title="Add Parallel Path (OR Gate)"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[3px] ${element.powerFlowOut ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-[#b1bdc8]'}`} />
        
        <button onClick={onRemove} className="absolute -top-4 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/branch:opacity-100 shadow-sm z-50 transition-opacity"><Trash2 className="w-2.5 h-2.5" /></button>
      </div>
    );
  }

  const inst = element as Instruction;
  const isBlock = [
    InstructionType.TON, InstructionType.TOF, InstructionType.TONR, 
    InstructionType.CTU, InstructionType.CTD, InstructionType.CTUD, 
    InstructionType.MOV, InstructionType.PID, InstructionType.NORM_X, InstructionType.SCALE_X, 
    InstructionType.ADD, InstructionType.SUB, InstructionType.MUL, InstructionType.DIV,
    InstructionType.EQ, InstructionType.NE, InstructionType.GT, InstructionType.GE, InstructionType.LT, InstructionType.LE,
    InstructionType.SR, InstructionType.RS, InstructionType.AND, InstructionType.OR, InstructionType.XOR
  ].includes(inst.type);
  const isCoil = [InstructionType.COIL, InstructionType.SET, InstructionType.RESET].includes(inst.type);
  const isContact = [InstructionType.NO, InstructionType.NC].includes(inst.type);
  const tag = tags.find(t => t.id === inst.tagId);

  return (
    <div 
      className="relative flex items-center group/inst" 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => onOpenPopup(e)}
    >
      <div className={`w-4 h-[3px] ${inst.isActive ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-[#b1bdc8]'}`} />
      
      <button 
        onClick={(e) => { e.stopPropagation(); handleDrop({ netId, rungId }, { preventDefault: () => {}, dataTransfer: { getData: (k: string) => k === 'isBranch' ? 'true' : 'Open Branch' } } as any); }}
        className="absolute -left-2 top-0 bg-blue-500 text-white rounded-full p-0.5 opacity-0 group-hover/inst:opacity-100 shadow-lg hover:scale-125 transition-all z-20"
        title="Start Parallel Branch (OR)"
      >
        <Split className="w-2.5 h-2.5" />
      </button>

      {isBlock ? (
        <div className={`min-w-[150px] bg-[#eef3f7] border-2 shadow-sm relative transition-all duration-200 ${inst.isActive && inst.powerFlowOut ? 'border-[#00FF00] shadow-[0_0_15px_#00FF0033]' : 'border-[#b1bdc8]'}`}>
          <div className="bg-[#b1bdc8] text-center py-0.5 text-[9px] font-bold text-[#333] border-b border-[#999] uppercase">
            {inst.type === InstructionType.OR ? 'OR' : inst.type === InstructionType.PID ? 'PID_Compact' : inst.type}
          </div>
          <div className="p-2 space-y-2 font-mono text-[8px]">
             {renderBlockInputs(inst, tags, project, onOpenPopup)}
          </div>
          <div className="flex justify-between items-center px-1 text-[7px] text-gray-400 border-t border-gray-200">
             <span>EN</span>
             <span className={inst.powerFlowOut ? 'text-green-500 font-bold' : ''}>ENO</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center relative">
          <div 
            className="absolute -top-8 flex flex-col items-center w-full cursor-pointer hover:bg-gray-100/50 rounded px-1 transition-all border border-transparent hover:border-[#00648720]"
            onClick={(e) => onOpenPopup(e)}
          >
            <span className={`text-[8px] font-bold truncate max-w-[80px] ${Boolean(tag?.value) ? 'text-green-600' : 'text-[#006487]'}`}>"{tag?.name || '???'}"</span>
            <div className="flex flex-col items-center">
               <span className="text-[7px] text-gray-500 font-mono bg-white/80 px-1 rounded border border-gray-100">{tag?.address || '---'}</span>
               {tag && tag.dataType !== 'BOOL' && (
                  <span className="text-[7px] text-orange-600 font-black mt-0.5 animate-in fade-in">({tag.value})</span>
               )}
               {tag && tag.dataType === 'BOOL' && (
                  <span className={`text-[7px] font-bold mt-0.5 ${tag.value ? 'text-green-600' : 'text-gray-300'}`}>({tag.value ? (inst.type === InstructionType.SET || inst.type === InstructionType.RESET ? 'LATCHED' : 'ON') : 'OFF'})</span>
               )}
            </div>
          </div>
          
          <div className={`w-14 h-10 border-2 rounded-sm flex items-center justify-center bg-white transition-all 
            ${inst.isActive && inst.powerFlowOut ? 'border-[#00FF00] bg-[#e6ffed] shadow-[0_0_12px_#00FF00]' : 'border-[#b1bdc8]'} 
            ${inst.type === InstructionType.SET && tag?.value ? 'border-[#00FF00] bg-[#e6ffed] shadow-[0_0_12px_#00FF00]' : ''}
            ${inst.forced || (tag?.forced) ? 'ring-2 ring-orange-400 border-orange-500 bg-orange-50' : ''}`}>
            {(inst.forced || tag?.forced) && (
              <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm border border-white z-20 animate-bounce">
                <span className="text-[6px] font-bold px-0.5">F</span>
              </div>
            )}
            
            <span className={`text-lg font-bold transition-colors 
              ${inst.isActive && inst.powerFlowOut ? 'text-[#00CC00]' : 'text-[#555]'} 
              ${inst.type === InstructionType.SET && tag?.value ? 'text-[#00CC00] drop-shadow-md' : ''}`}>
              {inst.type === InstructionType.NO && "-||-"}
              {inst.type === InstructionType.NC && "-|/|-" }
              {inst.type === InstructionType.COIL && "( )"}
              {inst.type === InstructionType.SET && "(S)"}
              {inst.type === InstructionType.RESET && "(R)"}
            </span>
          </div>

          {(isCoil || isContact) && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/inst:flex items-center gap-1 bg-white border border-gray-200 rounded p-0.5 shadow-md z-30 transition-all animate-in fade-in slide-in-from-top-1">
              <button 
                title="Force ON"
                onClick={(e) => { e.stopPropagation(); updateProject({ forced: inst.forced === 'ON' ? null : 'ON' }); }}
                className={`p-0.5 rounded transition-colors ${inst.forced === 'ON' ? 'bg-green-600 text-white' : 'hover:bg-green-50 text-green-600'}`}
              >
                <Zap className="w-2.5 h-2.5" />
              </button>
              <button 
                title="Force OFF"
                onClick={(e) => { e.stopPropagation(); updateProject({ forced: 'OFF' ? null : 'OFF' }); }}
                className={`p-0.5 rounded transition-colors ${inst.forced === 'OFF' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}
              >
                <ZapOff className="w-2.5 h-2.5" />
              </button>
              {(inst.forced || tag?.forced) && (
                <button 
                  title="Clear Force"
                  onClick={(e) => { e.stopPropagation(); 
                    if (tag) {
                      const newTags = project.tags.map(t => t.id === tag.id ? { ...t, forced: false } : t);
                      setProject({ ...project, tags: newTags });
                    }
                    updateProject({ forced: null }); 
                  }}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-500"
                >
                  <XCircle className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`w-4 h-[3px] ${inst.powerFlowOut ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]' : 'bg-[#b1bdc8]'}`} />
      
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/inst:opacity-100 shadow-sm z-50 transition-opacity"><Trash2 className="w-2.5 h-2.5" /></button>
    </div>
  );
};

function resolveSmartValue(project: PLCProject, tag: Tag | undefined, presetValue: number | undefined): string | number {
  if (!tag) return presetValue !== undefined ? presetValue : 0;
  
  const isTimer = tag.address.startsWith('T');
  const isCounter = tag.address.startsWith('C');

  if (isTimer || isCounter) {
    for (const net of project.networks) {
      for (const rung of net.rungs) {
        const found = findInstruction(rung.elements, tag.id);
        if (found && found.params) {
          return found.params.current || 0;
        }
      }
    }
  }

  return tag.value;
}

function findInstruction(elements: LadderElement[], tagId: string): Instruction | undefined {
  for (const el of elements) {
    if (isBranchGroup(el)) {
      for (const b of el.branches) {
        const found = findInstruction(b, tagId);
        if (found) return found;
      }
    } else {
      const inst = el as Instruction;
      if (inst.tagId === tagId && [
        InstructionType.TON, InstructionType.TOF, InstructionType.TONR, 
        InstructionType.CTU, InstructionType.CTD, InstructionType.CTUD
      ].includes(inst.type)) {
        return inst;
      }
    }
  }
  return undefined;
}

function renderBlockInputs(inst: Instruction, tags: Tag[], project: PLCProject, onOpenPopup: (e: React.MouseEvent, paramKey?: string) => void) {
  const tag = tags.find(t => t.id === inst.tagId);
  const resetTag = tags.find(t => t.id === inst.params?.resetTagId);
  const unit = inst.params?.timeUnit || 'ms';
  const isResetEnabled = [InstructionType.TONR, InstructionType.CTU, InstructionType.CTD, InstructionType.CTUD, InstructionType.SR, InstructionType.RS].includes(inst.type);
  
  const isCompare = [
    InstructionType.EQ, InstructionType.NE, InstructionType.GT, InstructionType.GE, InstructionType.LT, InstructionType.LE
  ].includes(inst.type);

  if (isCompare) {
    const in1Tag = tags.find(t => t.id === inst.params?.sourceTagId);
    const in2Tag = tags.find(t => t.id === inst.params?.minTagId);
    const val1 = resolveSmartValue(project, in1Tag, inst.params?.preset);
    const val2 = resolveSmartValue(project, in2Tag, inst.params?.preset2 ?? 0);
    return (
      <>
        <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
          <span className="text-gray-500">IN1:</span>
          <div className="flex flex-col items-end text-[7px]">
            <span className="text-blue-600 font-bold">{in1Tag?.address || inst.params?.preset || '0'}</span>
            <span className="text-orange-600 font-bold">({val1})</span>
          </div>
        </div>
        <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'minTagId')}>
          <span className="text-gray-500">IN2:</span>
          <div className="flex flex-col items-end text-[7px]">
            <span className="text-blue-600 font-bold">{in2Tag?.address || inst.params?.preset2 || '0'}</span>
            <span className="text-orange-600 font-bold">({val2})</span>
          </div>
        </div>
        <div className="text-center mt-1">
          <span className={`text-[10px] font-black uppercase ${inst.powerFlowOut ? 'text-green-600' : 'text-gray-300'}`}>
            {inst.type === InstructionType.EQ && '=='}
            {inst.type === InstructionType.NE && '<>'}
            {inst.type === InstructionType.GT && '>'}
            {inst.type === InstructionType.GE && '>='}
            {inst.type === InstructionType.LT && '<'}
            {inst.type === InstructionType.LE && '<='}
          </span>
        </div>
      </>
    );
  }

  const isLogicGate = [InstructionType.AND, InstructionType.OR, InstructionType.XOR].includes(inst.type);
  if (isLogicGate) {
    const in1Tag = tags.find(t => t.id === inst.params?.sourceTagId);
    const in2Tag = tags.find(t => t.id === inst.params?.minTagId);
    const outTag = tags.find(t => t.id === inst.params?.destTagId);
    return (
      <>
        <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
          <span className="text-gray-500">IN1:</span>
          <span className={in1Tag?.value ? 'text-green-500 font-bold' : 'text-gray-400'}>{in1Tag?.address || '??'}</span>
        </div>
        <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'minTagId')}>
          <span className="text-gray-500">IN2:</span>
          <span className={in2Tag?.value ? 'text-green-500 font-bold' : 'text-gray-400'}>{in2Tag?.address || '??'}</span>
        </div>
        <div className="flex justify-between cursor-pointer border-t border-gray-100 mt-1 hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'destTagId')}>
          <span className="text-gray-500 font-bold">OUT:</span>
          <span className={outTag?.value ? 'text-green-600 font-bold' : 'text-gray-400'}>{outTag?.address || '??'}</span>
        </div>
      </>
    );
  }

  switch (inst.type) {
    case InstructionType.NORM_X:
    case InstructionType.SCALE_X:
      const vInTag = tags.find(t => t.id === inst.params?.sourceTagId);
      const minInTag = tags.find(t => t.id === inst.params?.minTagId);
      const maxInTag = tags.find(t => t.id === inst.params?.maxTagId);
      const outInTag = tags.find(t => t.id === inst.params?.destTagId);
      const vInVal = resolveSmartValue(project, vInTag, inst.params?.preset);
      const minInVal = resolveSmartValue(project, minInTag, inst.params?.preset2);
      const maxInVal = resolveSmartValue(project, maxInTag, inst.params?.preset3 !== undefined ? inst.params?.preset3 : (inst.type === InstructionType.NORM_X ? 27648 : 100));
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
            <span className="text-gray-500 uppercase">Value:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{vInTag?.address || inst.params?.preset || '0'}</span>
              <span className="text-orange-600 font-black">({vInVal})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'minTagId')}>
            <span className="text-gray-500 uppercase">Min:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{minInTag?.address || inst.params?.preset2 || '0'}</span>
              <span className="text-orange-600 font-black">({minInVal})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'maxTagId')}>
            <span className="text-gray-500 uppercase">Max:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{maxInTag?.address || inst.params?.preset3 !== undefined ? inst.params?.preset3 : (inst.type === InstructionType.NORM_X ? '27648' : '100')}</span>
              <span className="text-orange-600 font-black">({maxInVal})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer border-t border-gray-100 mt-1 hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'destTagId')}>
            <span className="text-gray-500 font-bold uppercase">Out:</span>
            <div className="flex flex-col items-end text-[7px]">
               <span className="text-green-600 font-bold">{outInTag?.address || '??'}</span>
               <span className="text-orange-600 font-black">({outInTag?.value !== undefined ? outInTag.value : '0.0'})</span>
            </div>
          </div>
        </>
      );
    case InstructionType.PID:
      const spTag = tags.find(t => t.id === inst.params?.sourceTagId);
      const pvTag = tags.find(t => t.id === inst.params?.minTagId);
      const outTag = tags.find(t => t.id === inst.params?.destTagId);
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-100 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
            <span className="text-gray-500 font-bold uppercase">Setpoint:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{spTag?.address || inst.params?.setpoint || '0.0'}</span>
              <span className="text-orange-600 font-black">({spTag?.value || inst.params?.setpoint || 0})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-100 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'minTagId')}>
            <span className="text-gray-500 font-bold uppercase">Input:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{pvTag?.address || '??'}</span>
              <span className="text-orange-600 font-black">({pvTag?.value || 0})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer border-t border-gray-200 mt-1 hover:bg-blue-100 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'destTagId')}>
            <span className="text-gray-500 font-bold uppercase">Output:</span>
            <div className="flex flex-col items-end text-[7px]">
               <span className="text-green-600 font-bold">{outTag?.address || '??'}</span>
               <span className="text-orange-600 font-black">({outTag?.value || 0.0})</span>
            </div>
          </div>
        </>
      );
    case InstructionType.SR:
    case InstructionType.RS:
      const sLabel = inst.type === InstructionType.SR ? 'S1' : 'S';
      const rLabel = inst.type === InstructionType.SR ? 'R' : 'R1';
      return (
        <>
          <div className="flex justify-between border-b border-gray-100 pb-1">
            <span className="text-gray-500 font-bold">{sLabel}:</span>
            <span className={inst.isActive ? 'text-green-500 font-black' : 'text-gray-300'}>●</span>
          </div>
          <div className={`flex justify-between cursor-pointer p-0.5 rounded transition-all border border-transparent ${resetTag?.value ? 'bg-red-100 border-red-200' : 'hover:bg-blue-50 hover:border-blue-100'}`} onClick={(e) => onOpenPopup(e, 'resetTagId')}>
            <span className="text-gray-500 font-bold">{rLabel}:</span>
            <span className={resetTag ? (resetTag.value ? 'text-red-600 font-bold' : 'text-blue-500') : 'text-gray-400 font-bold'}>
              {resetTag ? resetTag.address : '??'}
            </span>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded transition-colors" onClick={(e) => onOpenPopup(e)}>
            <span className="text-gray-500 font-bold">Q:</span>
            <span className={Boolean(tag?.value) ? 'text-green-600 font-bold' : 'text-gray-400'}>{tag?.address || '??'}</span>
          </div>
        </>
      );
    case InstructionType.TON:
    case InstructionType.TOF:
    case InstructionType.TONR:
      const currentVal = inst.params?.current || 0;
      const displayCurrent = unit === 's' ? (currentVal / 1000).toFixed(1) : currentVal;
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded transition-colors" onClick={(e) => onOpenPopup(e, 'preset')}>
            <span className="text-gray-500">PT:</span>
            <span className="text-blue-600 font-bold">{inst.params?.preset}{unit}</span>
          </div>
          <div className="flex justify-between p-0.5 bg-orange-50 border border-orange-100 rounded shadow-inner">
            <span className="text-gray-500">ET:</span>
            <span className={`font-black text-[9px] transition-colors ${currentVal > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
               {displayCurrent}{unit}
            </span>
          </div>
          {isResetEnabled && (
            <div className={`flex justify-between cursor-pointer p-0.5 rounded transition-all border border-transparent ${resetTag?.value ? 'bg-red-100 border-red-200' : 'hover:bg-blue-50 hover:border-blue-100'}`} onClick={(e) => onOpenPopup(e, 'resetTagId')}>
              <span className="text-gray-500">R:</span>
              <span className={resetTag ? (resetTag.value ? 'text-red-600 font-bold animate-pulse' : 'text-blue-500') : 'text-gray-400 font-bold'}>
                {resetTag ? resetTag.address : '??'}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-1">
            <span className="text-gray-500">IN:</span>
            <span className={inst.isActive ? 'text-green-500 font-black' : 'text-gray-300'}>●</span>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded transition-colors" onClick={(e) => onOpenPopup(e)}>
            <span className="text-gray-500">Q:</span>
            <span className={Boolean(tag?.value) ? 'text-green-600 font-bold' : 'text-gray-400'}>{tag?.address || '??'}</span>
          </div>
        </>
      );
    case InstructionType.CTU:
    case InstructionType.CTD:
    case InstructionType.CTUD:
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded transition-colors" onClick={(e) => onOpenPopup(e, 'preset')}>
            <span className="text-gray-500">PV:</span>
            <span className="text-blue-600 font-bold">{inst.params?.preset}</span>
          </div>
          <div className="flex justify-between p-0.5 bg-orange-50 border border-orange-100 rounded shadow-inner">
            <span className="text-gray-500">CV:</span>
            <span className={`font-black text-[9px] transition-all ${inst.params?.current && inst.params.current > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
               {inst.params?.current || 0}
            </span>
          </div>
          <div className={`flex justify-between cursor-pointer p-0.5 rounded transition-all border border-transparent ${resetTag?.value ? 'bg-red-100 border-red-200' : 'hover:bg-blue-50 hover:border-blue-100'}`} onClick={(e) => onOpenPopup(e, 'resetTagId')}>
            <span className="text-gray-500">R:</span>
            <span className={resetTag ? (resetTag.value ? 'text-red-600 font-bold animate-pulse' : 'text-blue-500') : 'text-gray-400 font-bold'}>
              {resetTag ? resetTag.address : '??'}
            </span>
          </div>
          <div className="flex justify-between cursor-pointer border-t border-gray-100 pt-1 hover:bg-blue-50 p-0.5 rounded transition-colors" onClick={(e) => onOpenPopup(e)}>
            <span className="text-gray-500">Q:</span>
            <span className={Boolean(tag?.value) ? 'text-green-600 font-bold' : 'text-gray-400'}>{tag?.address || '??'}</span>
          </div>
        </>
      );
    case InstructionType.MOV:
      const srcTag = tags.find(t => t.id === inst.params?.sourceTagId);
      const destTag = tags.find(t => t.id === inst.params?.destTagId);
      const srcSmartVal = resolveSmartValue(project, srcTag, inst.params?.preset);
      const destSmartVal = resolveSmartValue(project, destTag, undefined);
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
            <span className="text-gray-500 uppercase">In:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="font-mono text-blue-600 font-bold truncate max-w-[80px]">
                {srcTag?.address || inst.params?.preset || '0'}
              </span>
              <span className="text-orange-600 font-black">
                ({srcSmartVal})
              </span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'destTagId')}>
            <span className="text-gray-500 uppercase">Out:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-mono font-bold truncate max-w-[80px]">
                {destTag?.address || '??'}
              </span>
              <span className="text-orange-600 font-black">
                ({destSmartVal === undefined ? '?' : destSmartVal})
              </span>
            </div>
          </div>
        </>
      );
    case InstructionType.ADD:
    case InstructionType.SUB:
    case InstructionType.MUL:
    case InstructionType.DIV:
      const in1Tag = tags.find(t => t.id === inst.params?.sourceTagId);
      const in2Tag = tags.find(t => t.id === inst.params?.minTagId);
      const resTag = tags.find(t => t.id === inst.params?.destTagId);
      const val1 = resolveSmartValue(project, in1Tag, inst.params?.preset);
      const val2 = resolveSmartValue(project, in2Tag, inst.params?.preset2 ?? 0);
      const valRes = resolveSmartValue(project, resTag, undefined);
      return (
        <>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'sourceTagId')}>
            <span className="text-gray-500 font-bold uppercase">In1:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{in1Tag?.address || inst.params?.preset || '0'}</span>
              <span className="text-orange-600 font-bold">({val1})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded" onClick={(e) => onOpenPopup(e, 'minTagId')}>
            <span className="text-gray-500 font-bold uppercase">In2:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-blue-600 font-bold">{in2Tag?.address || inst.params?.preset2 || '0'}</span>
              <span className="text-orange-600 font-bold">({val2})</span>
            </div>
          </div>
          <div className="flex justify-between cursor-pointer hover:bg-blue-50 p-0.5 rounded border-t border-gray-100" onClick={(e) => onOpenPopup(e, 'destTagId')}>
            <span className="text-gray-500 font-bold uppercase">Out:</span>
            <div className="flex flex-col items-end text-[7px]">
              <span className="text-green-600 font-bold">{resTag?.address || '??'}</span>
              <span className="text-orange-600 font-bold animate-pulse">({valRes === undefined ? '?' : valRes})</span>
            </div>
          </div>
        </>
      );
    default:
      return <div className="text-center italic opacity-30">No Parameters</div>;
  }
}

const QuickEditPopup: React.FC<{ 
  id: string, 
  paramKey: string | null,
  pos: { x: number, y: number }, 
  project: PLCProject, 
  setProject: (p: PLCProject) => void,
  onUpdate: (id: string, data: Partial<Instruction>) => void,
  onClose: () => void 
}> = ({ id, paramKey, pos, project, setProject, onUpdate, onClose }) => {
  const [search, setSearch] = useState('');
  const [constValue, setConstValue] = useState<string>('');
  
  const findInst = (elements: LadderElement[]): Instruction | undefined => {
    for (const el of elements) {
      if (isBranchGroup(el)) {
        for (const b of el.branches) {
          const found = findInst(b);
          if (found) return found;
        }
      } else if (el.id === id) return el as Instruction;
    }
    return undefined;
  };

  let instruction: Instruction | undefined;
  for (const net of project.networks) {
    for (const rung of net.rungs) {
      instruction = findInst(rung.elements);
      if (instruction) break;
    }
    if (instruction) break;
  }

  useEffect(() => {
    if (instruction) {
      if (paramKey === 'sourceTagId' || paramKey === 'preset') setConstValue(String(instruction.params?.preset ?? instruction.params?.setpoint ?? ''));
      else if (paramKey === 'minTagId') setConstValue(String(instruction.params?.preset2 ?? ''));
      else if (paramKey === 'maxTagId') setConstValue(String(instruction.params?.preset3 ?? ''));
      else setConstValue(String(instruction.params?.preset ?? ''));
    }
  }, [instruction, paramKey]);

  if (!instruction) return null;

  const currentTagId = (paramKey && paramKey !== 'preset') ? (instruction.params as any)?.[paramKey] : instruction.tagId;
  const currentTag = project.tags.find(t => t.id === currentTagId);
  
  const filteredTags = project.tags.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.address.toLowerCase().includes(search.toLowerCase())
  );

  const assignTag = (tagId: string | null) => {
    if (paramKey && paramKey !== 'preset') {
      onUpdate(id, { params: { [paramKey]: tagId } });
    } else {
      onUpdate(id, { tagId: tagId || undefined });
    }
    onClose();
  };

  const assignConstant = () => {
    const val = Number(constValue);
    if (!isNaN(val)) {
      if (paramKey === 'minTagId') {
        onUpdate(id, { params: { minTagId: undefined, preset2: val } }); 
      } else if (paramKey === 'maxTagId') {
        onUpdate(id, { params: { maxTagId: undefined, preset3: val } });
      } else if (paramKey === 'preset' || paramKey === 'sourceTagId') {
        if (instruction?.type === InstructionType.PID && paramKey === 'sourceTagId') {
            onUpdate(id, { params: { sourceTagId: undefined, setpoint: val } });
        } else {
            onUpdate(id, { params: { sourceTagId: undefined, preset: val } });
        }
      } else {
        onUpdate(id, { params: { preset: val } });
      }
      onClose();
    }
  };

  const toggleBitValue = (force: boolean = false) => {
    if (currentTag && currentTag.dataType === 'BOOL') {
      const newTags = project.tags.map(t => t.id === currentTag.id ? { ...t, value: !t.value, forced: force } : t);
      setProject({ ...project, tags: newTags });
    }
  };

  return (
    <div 
      className="fixed z-[101] bg-white border border-[#ccc] shadow-2xl rounded-md w-72 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ top: Math.min(pos.y, window.innerHeight - 500), left: Math.min(pos.x, window.innerWidth - 300) }}
    >
      <div className="bg-[#006487] text-white px-3 py-1.5 text-[11px] font-bold flex justify-between items-center">
        <span>{paramKey ? `Set Value: ${paramKey}` : `Instruction: ${instruction.type}`}</span>
        <button onClick={onClose}><X className="w-3 h-3" /></button>
      </div>

      <div className="p-3 space-y-4">
        {currentTag && currentTag.dataType === 'BOOL' && (
          <div className="space-y-2 pb-3 border-b border-gray-100">
             <label className="text-[9px] font-bold text-[#006487] uppercase">Modify State</label>
             <div className="flex gap-2">
                <button 
                  onClick={() => toggleBitValue(false)}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-[10px] font-black transition-all shadow-md active:scale-95
                    ${currentTag.value ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'}`}
                >
                  {currentTag.value ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {currentTag.value ? 'OFF' : 'ON'}
                </button>
                <button 
                  onClick={() => toggleBitValue(true)}
                  className={`px-3 py-2 rounded-md border-2 border-orange-400 flex items-center justify-center gap-1 text-[10px] font-bold transition-all
                    ${currentTag.forced ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50'}`}
                  title="Override PLC Logic (Force)"
                >
                  {currentTag.forced ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {currentTag.forced ? 'FORCED' : 'FORCE'}
                </button>
             </div>
             {currentTag.forced && <p className="text-[8px] text-orange-600 italic">Caution: PLC logic is currently bypassed for this tag.</p>}
          </div>
        )}

        <div className="space-y-2 pb-3 border-b border-gray-100">
          <label className="text-[9px] font-bold text-[#006487] uppercase">Enter Constant Value</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              className="flex-1 text-xs px-2 py-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487]"
              placeholder="Value..."
              value={constValue}
              onChange={(e) => setConstValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') assignConstant(); }}
            />
            <button onClick={assignConstant} className="px-3 py-1.5 bg-[#006487] text-white text-[10px] font-bold rounded">APPLY</button>
          </div>
        </div>

        {currentTag && (
          <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] p-3 rounded-md border border-[#cbd5e1] shadow-inner space-y-3">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5">
                 <RefreshCw className="w-3 h-3" /> Monitor Value
               </span>
               <div className="flex items-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${currentTag.value ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-300'}`} />
                 <span className="text-[10px] font-mono font-bold text-orange-600">
                   {resolveSmartValue(project, currentTag, 0)}
                 </span>
               </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase">Search PLC Tag Table</label>
          <div className="relative">
            <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
            <input 
              className="w-full text-xs pl-7 pr-2 py-1.5 border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487]"
              placeholder="Filter by name/address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-40 overflow-y-auto border border-[#eee] rounded shadow-inner">
          {filteredTags.map(tag => (
            <div 
              key={tag.id}
              onClick={() => assignTag(tag.id)}
              className={`px-3 py-2 border-b border-[#eee] hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors ${currentTagId === tag.id ? 'bg-blue-100' : ''}`}
            >
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${tag.address.startsWith('D') || tag.address.startsWith('T') || tag.address.startsWith('C') ? 'text-orange-600' : 'text-[#006487]'}`}>{tag.address}</span>
                <span className="text-[9px] text-gray-500">"{tag.name}"</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">{resolveSmartValue(project, tag, 0)}</div>
              {currentTagId === tag.id && <Check className="w-3 h-3 text-green-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LadderEditor;

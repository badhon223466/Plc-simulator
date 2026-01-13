
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Play, Square, Save, Undo, Redo, FileCode, Tag as TagIcon, Search, 
  Monitor, Pause, Maximize2, Minimize2, ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { PLCProject, PLCMode, Network, Tag } from './types';
import { INITIAL_PROJECT } from './constants';
import { PLCEngine } from './simulator/engine';

import ProjectTree from './components/ProjectTree';
import InstructionPalette from './components/InstructionPalette';
import LadderEditor from './components/LadderEditor';
import TagTable from './components/TagTable';
import PropertyInspector from './components/PropertyInspector';

const App: React.FC = () => {
  const [project, setProject] = useState<PLCProject>(() => {
    const saved = localStorage.getItem('webtia_project');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT;
  });
  const [mode, setMode] = useState<PLCMode>(PLCMode.STOP);
  const [activeTab, setActiveTab] = useState<'editor' | 'tags'>('editor');
  const [selectedInstructionId, setSelectedInstructionId] = useState<string | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>('net_1');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isTreeVisible, setIsTreeVisible] = useState(true);
  
  const engineRef = useRef<PLCEngine | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PLCEngine(project, (updatedProject) => {
        setProject(updatedProject);
      });
    }
    
    engineRef.current.setMode(mode);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, mode]);

  const saveProject = () => {
    localStorage.setItem('webtia_project', JSON.stringify(project));
    alert('Project saved successfully.');
  };

  const toggleRun = () => {
    const newMode = mode === PLCMode.RUN ? PLCMode.STOP : PLCMode.RUN;
    setMode(newMode);
    engineRef.current?.setMode(newMode);
  };

  const handleProjectUpdate = (newProject: PLCProject) => {
    setProject(newProject);
    engineRef.current?.updateProject(newProject);
  };

  const addNetwork = () => {
    const newNet: Network = {
      id: `net_${Date.now()}`,
      title: `Network ${project.networks.length + 1}`,
      comment: '',
      rungs: [{ id: `rung_${Date.now()}`, elements: [] }]
    };
    handleProjectUpdate({ ...project, networks: [...project.networks, newNet] });
  };

  return (
    <div className="flex flex-col h-screen select-none bg-[#f5f5f5] text-[#333]">
      {/* Header Bar */}
      <header className={`bg-[#f0f0f0] border-b border-[#ccc] ${isFullScreen ? 'h-12 bg-[#004b66] text-white' : 'h-10'} flex items-center px-4 justify-between shrink-0 shadow-sm z-[101] font-sans transition-all`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsTreeVisible(!isTreeVisible)}
              className={`p-1.5 rounded transition-colors ${isFullScreen ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
              title={isTreeVisible ? "Hide Project Tree" : "Show Project Tree"}
            >
              {isTreeVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className={`w-6 h-6 ${isFullScreen ? 'bg-white' : 'bg-[#006487]'} flex items-center justify-center rounded-sm shadow-inner`}>
              <span className={`${isFullScreen ? 'text-[#006487]' : 'text-white'} text-[10px] font-bold`}>SI</span>
            </div>
            {!isFullScreen && <span className="text-sm font-semibold text-[#555] tracking-tight">WebTIA Portal v19</span>}
          </div>
          {!isFullScreen && (
            <>
              <div className="h-4 w-[1px] bg-[#ccc] mx-2" />
              <div className="flex items-center gap-1">
                <button onClick={saveProject} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Save Project"><Save className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Undo"><Undo className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors" title="Redo"><Redo className="w-4 h-4" /></button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${mode === PLCMode.RUN ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'} text-[10px] font-bold`}>
            <div className={`w-2 h-2 rounded-full ${mode === PLCMode.RUN ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            CPU: {mode}
          </div>

          {/* SIMULATION CONTROLS */}
          <div className={`flex items-center ${isFullScreen ? 'bg-white/10 p-1 rounded-lg' : 'bg-white border border-[#ccc] rounded p-0.5 shadow-sm'} gap-1`}>
            <button 
              onClick={toggleRun}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${mode === PLCMode.RUN ? 'bg-green-600 text-white shadow-inner' : isFullScreen ? 'hover:bg-white/20 text-green-400' : 'hover:bg-gray-100 text-green-600'}`}
              title="Run Simulation"
            >
              <Play className={`w-3.5 h-3.5 ${mode === PLCMode.RUN ? 'fill-white' : 'fill-current'}`} />
            </button>
            <button 
              onClick={() => { setMode(PLCMode.PAUSE); engineRef.current?.setMode(PLCMode.PAUSE); }}
              className={`p-1.5 rounded text-xs transition-all ${mode === PLCMode.PAUSE ? 'bg-orange-500 text-white shadow-inner' : isFullScreen ? 'hover:bg-white/20 text-orange-400' : 'hover:bg-gray-100 text-orange-600'}`}
              title="Pause Simulation"
            >
              <Pause className={`w-3.5 h-3.5 ${mode === PLCMode.PAUSE ? 'fill-white' : 'fill-current'}`} />
            </button>
            <button 
              onClick={() => { setMode(PLCMode.STOP); engineRef.current?.setMode(PLCMode.STOP); }}
              className={`p-1.5 rounded text-xs transition-all ${mode === PLCMode.STOP ? 'bg-red-600 text-white shadow-inner' : isFullScreen ? 'hover:bg-white/20 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
              title="Stop Simulation"
            >
              <Square className={`w-3.5 h-3.5 ${mode === PLCMode.STOP ? 'fill-white' : 'fill-current'}`} />
            </button>
          </div>

          {isFullScreen && (
            <button 
              onClick={() => setIsFullScreen(false)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              title="Exit Full Screen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Project Tree */}
        {!isFullScreen && isTreeVisible && (
          <aside className="w-72 border-r border-[#ccc] bg-[#e6e6e6] flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
            <div className="p-2 text-[11px] font-bold uppercase text-[#555] border-b border-[#ccc] bg-[#d6dee2] flex items-center justify-between">
              <span>Project Tree</span>
              <Search className="w-3 h-3 opacity-40" />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <ProjectTree project={project} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </aside>
        )}

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {!isFullScreen && (
            <div className="flex bg-[#f2f2f2] border-b border-[#ccc] h-8 shrink-0">
              <TabItem active={activeTab === 'editor'} label="Main_Program [OB1]" icon={FileCode} onClick={() => setActiveTab('editor')} />
              <TabItem active={activeTab === 'tags'} label="PLC_Tags" icon={TagIcon} onClick={() => setActiveTab('tags')} />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeTab === 'editor' && (
              <>
                <div className="p-1 border-b border-[#ccc] bg-[#f8f9fa] flex gap-1 justify-between items-center px-4">
                  <div className="flex gap-1">
                    <button 
                      onClick={addNetwork}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#ccc] rounded bg-white hover:bg-gray-100 text-[#006487] font-semibold shadow-sm"
                    >
                      Insert Network
                    </button>
                  </div>
                  {!isFullScreen && (
                    <button 
                      onClick={() => setIsFullScreen(true)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#ccc] rounded bg-white hover:bg-gray-100 text-gray-600 font-medium shadow-sm"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <LadderEditor 
                    project={project} 
                    setProject={handleProjectUpdate} 
                    selectedNetworkId={selectedNetworkId}
                    setSelectedNetworkId={setSelectedNetworkId}
                    setSelectedInstructionId={setSelectedInstructionId}
                  />
                </div>
              </>
            )}
            {activeTab === 'tags' && <TagTable tags={project.tags} setTags={(tags) => handleProjectUpdate({ ...project, tags })} />}
          </div>

          {/* Bottom Property Inspector */}
          {!isFullScreen && activeTab === 'editor' && (
            <div className={`relative transition-all duration-300 ease-in-out border-t border-[#ccc] ${isInspectorVisible ? 'h-64' : 'h-0'}`}>
               <div className="absolute top-0 left-0 right-0 h-full overflow-hidden">
                  <PropertyInspector 
                    project={project} 
                    selectedId={selectedInstructionId} 
                    setProject={handleProjectUpdate} 
                    onClose={() => setIsInspectorVisible(false)}
                  />
               </div>
            </div>
          )}

          {!isFullScreen && activeTab === 'editor' && !isInspectorVisible && (
            <button 
              onClick={() => setIsInspectorVisible(true)}
              className="fixed bottom-10 right-72 bg-[#006487] text-white p-2 rounded-full shadow-lg hover:bg-[#005573] transition-all z-50 flex items-center gap-2 px-3 text-xs font-bold"
            >
              <ChevronUp className="w-4 h-4" />
              SHOW PROPERTIES
            </button>
          )}
        </main>

        {/* Instructions */}
        {!isFullScreen && activeTab === 'editor' && (
          <aside className="w-64 border-l border-[#ccc] bg-[#e6e6e6] flex flex-col shrink-0">
            <div className="p-2 text-[11px] font-bold uppercase text-[#555] border-b border-[#ccc] bg-[#d6dee2]">
              <span>Instructions</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InstructionPalette />
            </div>
          </aside>
        )}
      </div>

      {!isFullScreen && (
        <footer className="h-6 bg-[#006487] text-white text-[10px] flex items-center px-4 justify-between shrink-0 font-medium shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm ${mode === PLCMode.RUN ? 'bg-green-400 animate-pulse' : mode === PLCMode.PAUSE ? 'bg-orange-400' : 'bg-red-400'}`} />
              <span>CPU 1214C DC/DC/DC</span>
            </div>
            <div className="h-3 w-[1px] bg-white/20" />
            <span>Scan Time: {mode === PLCMode.RUN ? '4ms' : '0ms'}</span>
          </div>
          <div className="flex items-center gap-3 opacity-80">
            <span>S7-1200 CPU</span>
            <div className="bg-white/10 px-2 py-0.5 rounded text-[9px]">PLC_1</div>
          </div>
        </footer>
      )}
    </div>
  );
};

const TabItem: React.FC<{ active: boolean; label: string; icon: any; onClick: () => void }> = ({ active, label, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 h-full text-[11px] cursor-pointer border-r border-[#ccc] transition-all
      ${active ? 'bg-white border-t-2 border-t-[#006487] font-bold text-[#006487] shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' : 'hover:bg-gray-200 text-gray-500 hover:text-[#333]'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </div>
);

export default App;

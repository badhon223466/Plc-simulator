
import React from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode, Tag as TagIcon, Cpu } from 'lucide-react';
import { PLCProject } from '../types';

interface ProjectTreeProps {
  project: PLCProject;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const TreeItem: React.FC<{ icon: any; label: string; active?: boolean; onClick?: () => void; indent?: number }> = ({ 
  icon: Icon, label, active, onClick, indent = 0 
}) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-2 px-2 py-1 text-xs cursor-pointer whitespace-nowrap transition-colors ${active ? 'bg-[#006487] text-white' : 'hover:bg-gray-300'}`}
    style={{ paddingLeft: `${indent * 12 + 8}px` }}
  >
    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#777]'}`} />
    <span>{label}</span>
  </div>
);

const ProjectTree: React.FC<ProjectTreeProps> = ({ project, activeTab, setActiveTab }) => {
  return (
    <div className="py-2 flex flex-col">
      <TreeItem 
        icon={Cpu} 
        label="PLC_1 [CPU 1214C DC/DC/DC]" 
        indent={0}
      />
      
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-[#555] font-bold mt-2">
        <ChevronDown className="w-3 h-3" />
        <Folder className="w-3.5 h-3.5 text-[#e8b62c]" />
        <span>Program Blocks</span>
      </div>
      
      <TreeItem 
        icon={FileCode} 
        label="Main [OB1]" 
        active={activeTab === 'editor'} 
        onClick={() => setActiveTab('editor')} 
        indent={2} 
      />
      
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-[#555] font-bold mt-2">
        <ChevronDown className="w-3 h-3" />
        <Folder className="w-3.5 h-3.5 text-[#e8b62c]" />
        <span>PLC Tags</span>
      </div>
      
      <TreeItem 
        icon={TagIcon} 
        label="Standard Tag Table" 
        active={activeTab === 'tags'} 
        onClick={() => setActiveTab('tags')} 
        indent={2} 
      />

      <div className="flex items-center gap-1 px-2 py-1 text-xs text-[#555] font-bold mt-2">
        <ChevronRight className="w-3 h-3" />
        <Folder className="w-3.5 h-3.5 text-[#e8b62c]" />
        <span>Online Diagnostics</span>
      </div>
    </div>
  );
};

export default ProjectTree;

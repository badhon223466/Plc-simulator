
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, GitMerge, Square, Minimize2, Cpu } from 'lucide-react';
import { InstructionType } from '../types';

const InstructionItem: React.FC<{ type: string; label: string; isBranch?: boolean }> = ({ type, label, isBranch }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('instructionType', type);
    if (isBranch) e.dataTransfer.setData('isBranch', 'true');
  };

  return (
    <div 
      draggable 
      onDragStart={handleDragStart}
      className="flex items-center gap-2 px-6 py-1.5 text-[11px] text-[#333] hover:bg-gray-300 cursor-grab active:cursor-grabbing border-b border-[#ddd] transition-colors"
    >
      <div className={`w-6 h-6 flex items-center justify-center bg-white border border-[#ccc] rounded shadow-sm ${isBranch ? 'border-blue-500 bg-blue-50' : ''}`}>
        <span className={`font-bold text-[10px] ${isBranch ? 'text-blue-600' : ''}`}>{label}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">{type}</span>
        {isBranch && <span className="text-[8px] text-blue-500 uppercase tracking-tighter">Parallel (OR)</span>}
      </div>
    </div>
  );
};

const Group: React.FC<{ title: string; children: React.ReactNode; icon?: any }> = ({ title, children, icon: Icon }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col">
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 bg-[#d6dee2] text-[11px] font-bold border-b border-[#ccc] cursor-pointer hover:bg-[#ccdbe5]"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {Icon && <Icon className="w-3 h-3 text-[#006487] mr-1" />}
        <span>{title}</span>
      </div>
      {open && <div className="flex flex-col bg-[#e6e6e6]">{children}</div>}
    </div>
  );
};

const InstructionPalette: React.FC = () => {
  return (
    <div className="flex flex-col bg-[#e6e6e6] h-full overflow-y-auto">
      <Group title="General & OR Logic">
        <InstructionItem type="Open Branch" label="[OR]" isBranch />
        <InstructionItem type={InstructionType.NO} label="-||-" />
        <InstructionItem type={InstructionType.NC} label="-|/|-" />
        <InstructionItem type={InstructionType.COIL} label="-( )-" />
      </Group>

      <Group title="Technology Objects" icon={Cpu}>
        <InstructionItem type={InstructionType.PID} label="PID" />
      </Group>

      <Group title="Logic Gate Blocks">
        <InstructionItem type={InstructionType.AND} label="&" />
        <InstructionItem type={InstructionType.OR} label="≥1" />
        <InstructionItem type={InstructionType.XOR} label="=1" />
      </Group>

      <Group title="Bit Logic (Latching)">
        <InstructionItem type={InstructionType.SET} label="-(S)-" />
        <InstructionItem type={InstructionType.RESET} label="-(R)-" />
        <InstructionItem type={InstructionType.SR} label="SR" />
        <InstructionItem type={InstructionType.RS} label="RS" />
      </Group>

      <Group title="Comparator Operations">
        <InstructionItem type={InstructionType.EQ} label="==" />
        <InstructionItem type={InstructionType.NE} label="<>" />
        <InstructionItem type={InstructionType.GT} label=">" />
        <InstructionItem type={InstructionType.GE} label=">=" />
        <InstructionItem type={InstructionType.LT} label="<" />
        <InstructionItem type={InstructionType.LE} label="<=" />
      </Group>

      <Group title="Timers">
        <InstructionItem type={InstructionType.TON} label="TON" />
        <InstructionItem type={InstructionType.TOF} label="TOF" />
        <InstructionItem type={InstructionType.TONR} label="TONR" />
      </Group>

      <Group title="Counters">
        <InstructionItem type={InstructionType.CTU} label="CTU" />
        <InstructionItem type={InstructionType.CTD} label="CTD" />
      </Group>

      <Group title="Math & Conversion">
        <InstructionItem type={InstructionType.MOV} label="MOV" />
        <InstructionItem type={InstructionType.ADD} label="ADD" />
        <InstructionItem type={InstructionType.SUB} label="SUB" />
        <InstructionItem type={InstructionType.MUL} label="MUL" />
        <InstructionItem type={InstructionType.DIV} label="DIV" />
        <InstructionItem type={InstructionType.NORM_X} label="NRM" />
        <InstructionItem type={InstructionType.SCALE_X} label="SCL" />
      </Group>
    </div>
  );
};

export default InstructionPalette;

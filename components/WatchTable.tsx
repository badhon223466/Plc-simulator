
import React, { useState } from 'react';
import { Tag } from '../types';
import { Monitor, Lock, Unlock, RefreshCcw, Eye } from 'lucide-react';

interface WatchTableProps {
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
}

const WatchTable: React.FC<WatchTableProps> = ({ tags, setTags }) => {
  const toggleForce = (id: string) => {
    setTags(tags.map(t => t.id === id ? { ...t, forced: !t.forced } : t));
  };

  const updateForceValue = (id: string, value: any) => {
    setTags(tags.map(t => t.id === id ? { ...t, value } : t));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-2 border-b border-[#ccc] bg-[#f2f2f2] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#006487]">
          <Monitor className="w-3.5 h-3.5" />
          Watch Table_1
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-1 px-2 py-1 text-xs border border-[#ccc] rounded bg-white hover:bg-gray-100">
            <RefreshCcw className="w-3 h-3" />
            Monitor All
          </button>
        </div>
      </div>

      <div className="flex bg-[#e6e6e6] border-b border-[#ccc] text-[11px] font-bold uppercase text-[#555]">
        <div className="w-10 px-2 py-1.5 border-r border-[#ccc]">#</div>
        <div className="flex-1 px-3 py-1.5 border-r border-[#ccc]">Address</div>
        <div className="flex-1 px-3 py-1.5 border-r border-[#ccc]">Name</div>
        <div className="w-24 px-3 py-1.5 border-r border-[#ccc]">Monitor Value</div>
        <div className="w-24 px-3 py-1.5 border-r border-[#ccc]">Modify Value</div>
        <div className="w-20 px-3 py-1.5">Force</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tags.map((tag, idx) => (
          <div key={tag.id} className={`flex border-b border-[#eee] text-[11px] hover:bg-blue-50 transition-colors ${tag.forced ? 'bg-orange-50' : ''}`}>
            <div className="w-10 px-2 py-1 border-r border-[#eee] text-gray-400">{idx + 1}</div>
            <div className="flex-1 px-3 py-1 border-r border-[#eee] font-mono text-[#006487]">{tag.address}</div>
            <div className="flex-1 px-3 py-1 border-r border-[#eee]">{tag.name}</div>
            <div className={`w-24 px-3 py-1 border-r border-[#eee] font-bold ${tag.value ? 'text-green-600' : 'text-gray-400'}`}>
              {tag.dataType === 'BOOL' ? (tag.value ? 'TRUE' : 'FALSE') : tag.value}
            </div>
            <div className="w-24 px-3 py-1 border-r border-[#eee]">
              {tag.dataType === 'BOOL' ? (
                <button 
                  onClick={() => updateForceValue(tag.id, !tag.value)}
                  className="px-2 py-0.5 border border-gray-300 rounded text-[9px] uppercase hover:bg-gray-100"
                >
                  Set {tag.value ? 'False' : 'True'}
                </button>
              ) : (
                <input 
                  type="number" 
                  className="w-full bg-transparent outline-none border-b border-gray-200"
                  defaultValue={tag.value}
                  onBlur={(e) => updateForceValue(tag.id, Number(e.target.value))}
                />
              )}
            </div>
            <div className="w-20 px-3 py-1 flex items-center justify-center">
              <button 
                onClick={() => toggleForce(tag.id)}
                className={`p-1 rounded transition-colors ${tag.forced ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-200'}`}
              >
                {tag.forced ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchTable;


import React, { useState } from 'react';
import { Tag } from '../types';
import { Plus, Trash2, Search, Filter } from 'lucide-react';

interface TagTableProps {
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
}

const TagTable: React.FC<TagTableProps> = ({ tags, setTags }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const addTag = () => {
    const newTag: Tag = {
      id: `tag_${Date.now()}`,
      name: `Tag_${tags.length + 1}`,
      address: 'M0.0',
      dataType: 'BOOL',
      value: false
    };
    setTags([...tags, newTag]);
  };

  const updateTag = (id: string, field: keyof Tag, value: any) => {
    setTags(tags.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id));
  };

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Table Toolbar */}
      <div className="p-2 border-b border-[#ccc] bg-[#f2f2f2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tags..." 
              className="pl-7 pr-2 py-1 text-xs border border-[#ccc] rounded outline-none focus:ring-1 focus:ring-[#006487] w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-1 px-2 py-1 text-xs border border-[#ccc] rounded bg-white hover:bg-gray-100">
            <Filter className="w-3 h-3" />
            Filter
          </button>
        </div>
        <button 
          onClick={addTag}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-[#006487] text-white rounded hover:bg-[#005573]"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Table Header */}
      <div className="flex bg-[#e6e6e6] border-b border-[#ccc] text-xs font-bold uppercase text-[#555]">
        <div className="w-12 px-3 py-2 border-r border-[#ccc]">No.</div>
        <div className="flex-1 px-3 py-2 border-r border-[#ccc]">Name</div>
        <div className="w-32 px-3 py-2 border-r border-[#ccc]">Data Type</div>
        <div className="w-32 px-3 py-2 border-r border-[#ccc]">Address</div>
        <div className="w-32 px-3 py-2 border-r border-[#ccc]">Value</div>
        <div className="w-12 px-3 py-2"></div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {filteredTags.map((tag, idx) => (
          <div key={tag.id} className="flex border-b border-[#eee] text-xs hover:bg-blue-50 transition-colors">
            <div className="w-12 px-3 py-1.5 border-r border-[#eee] text-gray-400">{idx + 1}</div>
            <div className="flex-1 px-3 py-1.5 border-r border-[#eee]">
              <input 
                type="text" 
                value={tag.name} 
                onChange={(e) => updateTag(tag.id, 'name', e.target.value)}
                className="w-full bg-transparent outline-none focus:bg-white"
              />
            </div>
            <div className="w-32 px-3 py-1.5 border-r border-[#eee]">
              <select 
                value={tag.dataType} 
                onChange={(e) => updateTag(tag.id, 'dataType', e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="BOOL">BOOL</option>
                <option value="INT">INT</option>
                <option value="REAL">REAL</option>
                <option value="TIME">TIME</option>
              </select>
            </div>
            <div className="w-32 px-3 py-1.5 border-r border-[#eee]">
              <input 
                type="text" 
                value={tag.address} 
                onChange={(e) => updateTag(tag.id, 'address', e.target.value)}
                className="w-full bg-transparent outline-none uppercase"
              />
            </div>
            <div className="w-32 px-3 py-1.5 border-r border-[#eee] font-mono flex items-center justify-between">
              <span>{tag.dataType === 'BOOL' ? (tag.value ? 'TRUE' : 'FALSE') : tag.value}</span>
              {tag.dataType === 'BOOL' && (
                <button 
                  onClick={() => updateTag(tag.id, 'value', !tag.value)}
                  className={`w-4 h-4 rounded-full border border-gray-300 ${tag.value ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
            <div className="w-12 px-3 py-1.5 flex items-center justify-center">
              <Trash2 
                className="w-3.5 h-3.5 text-gray-300 hover:text-red-500 cursor-pointer" 
                onClick={() => removeTag(tag.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagTable;

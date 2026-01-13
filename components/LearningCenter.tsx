
import React, { useState, useMemo } from 'react';
import { PLCProject, PLCTask } from '../types';
import { BookOpen, CheckCircle, Circle, Trophy, ArrowRight } from 'lucide-react';

const TASKS: PLCTask[] = [
  {
    id: 't1',
    title: 'Basic Motor Latch',
    description: 'Use a Start PB (I0.0), a Stop PB (I0.1), and a Motor Coil (Q0.0). Create a logic where pressing Start latches the motor ON, and Stop breaks the latch.',
    difficulty: 'Beginner',
    conditions: [{ tagId: '3', targetValue: true }]
  },
  {
    id: 't2',
    title: 'Delayed Start',
    description: 'Use a TON (Timer On Delay) to turn ON the System_Ready bit (M0.0) exactly 5 seconds after I0.0 is activated.',
    difficulty: 'Intermediate',
    conditions: [{ tagId: '4', targetValue: true }]
  }
];

const LearningCenter: React.FC<{ project: PLCProject }> = ({ project }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(TASKS[0].id);

  const selectedTask = TASKS.find(t => t.id === selectedTaskId)!;

  const isCompleted = useMemo(() => {
    return selectedTask.conditions.every(cond => {
      const tag = project.tags.find(t => t.id === cond.tagId);
      return tag && tag.value === cond.targetValue;
    });
  }, [project, selectedTask]);

  return (
    <div className="flex h-full bg-[#f8f9fa]">
      <div className="w-64 border-r border-[#ccc] bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-[#eee] bg-gray-50 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold">Curriculum</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {TASKS.map(task => (
            <div 
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`p-3 border-b border-[#eee] cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-[#006487] text-white' : 'hover:bg-gray-50'}`}
            >
              <div className="text-[11px] font-bold truncate">{task.title}</div>
              <div className={`text-[9px] mt-1 ${selectedTaskId === task.id ? 'text-blue-100' : 'text-gray-400'}`}>{task.difficulty}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#006487]">{selectedTask.title}</h2>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {isCompleted ? 'Task Verified' : 'In Progress'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#eee] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Instruction
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{selectedTask.description}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#eee] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Verification Logic
          </div>
          <div className="space-y-2">
            {selectedTask.conditions.map((cond, i) => {
              const tag = project.tags.find(t => t.id === cond.tagId);
              const met = tag && tag.value === cond.targetValue;
              return (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-[11px]">
                  <span className="font-mono">{tag?.address} ({tag?.name}) must be {String(cond.targetValue)}</span>
                  {met ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                </div>
              );
            })}
          </div>
        </div>

        {isCompleted && (
          <button className="mt-4 flex items-center justify-center gap-2 bg-[#006487] text-white py-3 rounded font-bold text-xs uppercase hover:bg-[#005573] transition-colors">
            Next Lesson
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LearningCenter;

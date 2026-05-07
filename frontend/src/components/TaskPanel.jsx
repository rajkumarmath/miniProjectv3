import React from 'react';
import { CheckSquare, Clock, Tag, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function TaskPanel({ agents }) {
  const prioritizer = agents.find(a => a.name === 'PrioritizerAgent');
  const tasks = prioritizer?.task_queue || [];

  const handleComplete = async (taskId) => {
    try {
      await fetch(`${API_BASE_URL}/complete_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-widest uppercase">To-Do List</h2>
        </div>
        <div className="text-xs font-semibold text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
          {tasks.length} items
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll">
        {tasks.map(task => {
          const isOverdue = task.ticks_ignored > 5;
          const score = task.priority_score || 0;
          
          let priorityTag = 'Low';
          let priorityColor = 'bg-slate-800 text-slate-400 border border-slate-700';
          
          if (score >= 20) {
            priorityTag = 'Urgent';
            priorityColor = 'bg-red-950 text-red-400 border border-red-500/50';
          } else if (score >= 15) {
            priorityTag = 'High';
            priorityColor = 'bg-amber-950 text-amber-400 border border-amber-500/50';
          } else if (score >= 10) {
            priorityTag = 'Medium';
            priorityColor = 'bg-blue-950 text-blue-400 border border-blue-500/50';
          }

          return (
            <div key={task.task_id} className={`bg-black/40 border border-white/10 p-3 rounded-xl flex flex-col gap-2 hover:border-cyan-500/30 transition-all ${isOverdue ? 'border-red-500/50 bg-red-950/20' : ''}`}>
              
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2">
                  <button 
                    onClick={() => handleComplete(task.task_id)}
                    className="mt-0.5 w-4 h-4 rounded border border-white/20 flex items-center justify-center text-transparent hover:text-green-400 hover:border-green-400 transition-colors shrink-0"
                    title="Complete Task"
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className="font-semibold text-sm text-slate-200 leading-snug break-words">
                    {task.title}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${priorityColor}`}>
                  {priorityTag}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  <Tag size={12} className="text-slate-400" />
                  <span className="capitalize">{task.category}</span>
                </div>
                
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-semibold animate-pulse' : ''}`}>
                  <Clock size={12} />
                  {task.deadline === 0 ? 'Today' : task.deadline === 1 ? 'Tomorrow' : task.deadline ? `In ${task.deadline} days` : 'Someday'}
                </div>
              </div>

            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <CheckSquare size={24} className="text-slate-600" />
            <p className="tracking-widest uppercase text-[10px]">Queue Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

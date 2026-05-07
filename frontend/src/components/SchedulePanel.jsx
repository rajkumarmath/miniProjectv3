import React from 'react';
import { Calendar, CheckCircle2, CircleDashed } from 'lucide-react';

export default function SchedulePanel({ schedule }) {
  const slots = ['Morning', 'Afternoon', 'Evening'];
  
  return (
    <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-widest uppercase">Daily Schedule</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-purple-950/50 border border-purple-500/30 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.1)] text-purple-400 font-semibold uppercase tracking-wider">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.0001 22.0001C6.47725 22.0001 2.00012 17.523 2.00012 12.0001C2.00012 6.47725 6.47725 2.00012 12.0001 2.00012C17.523 2.00012 22.0001 6.47725 22.0001 12.0001C22.0001 17.523 17.523 22.0001 12.0001 22.0001ZM12.0001 20.0001C16.4184 20.0001 20.0001 16.4184 20.0001 12.0001C20.0001 7.58184 16.4184 4.00012 12.0001 4.00012C7.58184 4.00012 4.00012 7.58184 4.00012 12.0001C4.00012 16.4184 7.58184 20.0001 12.0001 20.0001ZM11.0001 7.00012H13.0001V13.0001H11.0001V7.00012ZM11.0001 15.0001H13.0001V17.0001H11.0001V15.0001Z" />
          </svg>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span> G-Cal Sync
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scroll relative">
        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-white/5"></div>
        
        <div className="space-y-6">
          {slots.map(slot => (
            <div key={slot} className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-black border-[3px] border-purple-500 z-10 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                  {slot}
                </h3>
              </div>
              
              <div className="pl-8 space-y-2">
                {schedule[slot]?.map((task, i) => (
                  <div key={i} className="bg-black/40 border border-white/10 p-2.5 rounded-xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {task.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                      ) : (
                        <CircleDashed size={16} className="text-slate-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm truncate font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))}
                
                {(!schedule[slot] || schedule[slot].length === 0) && (
                  <div className="text-xs text-slate-600 font-medium py-1 italic">
                    Free time
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

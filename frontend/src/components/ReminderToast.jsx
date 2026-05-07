import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function ReminderToast({ reminder, onDismiss }) {
  const { level, text } = reminder;
  
  let color = 'bg-blue-900/80 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
  if (level === 1) color = 'bg-yellow-900/80 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
  if (level === 2) color = 'bg-orange-900/80 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse';
  if (level >= 3) color = 'bg-red-900/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse';

  useEffect(() => {
    // Auto dismiss after some time unless level is high
    if (level < 3) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [level, onDismiss]);

  return (
    <div className={`flex items-start gap-3 p-3 rounded border w-72 backdrop-blur-md animate-[fade-in-up_0.3s_ease-out] ${color}`}>
      <Bell size={18} className="text-white flex-shrink-0 mt-0.5 animate-bounce" />
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white leading-tight mb-1">Reminder (Lv.{level})</h4>
        <p className="text-xs text-gray-200">{text}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={onDismiss} className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors">
            Dismiss
          </button>
          <button onClick={onDismiss} className="text-[10px] bg-black/40 hover:bg-black/60 text-white px-2 py-1 rounded transition-colors">
            Snooze
          </button>
        </div>
      </div>
      <button onClick={onDismiss} className="text-white/50 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

import React from 'react';
import { Play, Pause, RotateCcw, Brain } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ControlPanel({ systemState }) {
  const { tick, running } = systemState;
  const [focusMode, setFocusMode] = React.useState(false);

  const handleFocusToggle = async () => {
    const newFocus = !focusMode;
    setFocusMode(newFocus);
    try {
      await fetch(`${API_BASE_URL}/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newFocus ? 'start' : 'stop' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleControl = async (action, speed = 1.0) => {
    try {
      await fetch(`${API_BASE_URL}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, speed })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 mr-2">
        <div className="relative flex h-2.5 w-2.5">
          {running && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${running ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-slate-600'}`}></span>
        </div>
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{running ? 'Active' : 'Paused'}</span>
      </div>

      <div className="flex gap-1 border-l border-white/10 pl-2">
        {!running ? (
          <button 
            onClick={() => handleControl('start')}
            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
            title="Start"
          >
            <Play size={16} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={() => handleControl('pause')}
            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Pause"
          >
            <Pause size={16} fill="currentColor" />
          </button>
        )}
        <button 
          onClick={() => handleControl('reset')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      
      <div className="flex gap-1 border-l border-white/10 pl-2">
        <button 
          onClick={handleFocusToggle}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${focusMode ? 'text-purple-400 bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-slate-500 hover:text-purple-400 hover:bg-slate-800'}`}
          title="Toggle Deep Focus"
        >
          <Brain size={16} className={focusMode ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  );
}

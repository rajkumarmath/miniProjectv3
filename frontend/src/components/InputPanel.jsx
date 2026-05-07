import React, { useState, useEffect } from 'react';
import { Plus, Battery, CheckCircle2, Target, Mic, MicOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function InputPanel() {
  const [text, setText] = useState('');
  const [energy, setEnergy] = useState(3);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const rec = new window.webkitSpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev + (prev ? ' ' : '') + transcript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await fetch(`${API_BASE_URL}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnergyChange = async (val) => {
    setEnergy(val);
    try {
      await fetch(`${API_BASE_URL}/energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: val })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md flex-shrink-0 relative overflow-hidden">
      {isListening && (
        <div className="absolute inset-0 bg-cyan-900/20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 animate-pulse"></div>
        </div>
      )}
      <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 relative z-10 tracking-widest uppercase">
        <Plus size={16} className="text-cyan-400" /> Add Task
      </h2>

      <form onSubmit={handleSubmit} className="mb-5 relative z-10 flex gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Execute command...`}
            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all pr-10 font-mono"
            spellCheck="false"
          />
          <button 
            type="button"
            onClick={toggleListening}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
            title="Voice Input"
          >
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
        </div>
        <button type="submit" className="hidden">Submit</button>
      </form>

      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Battery size={14} className="text-cyan-500"/> Energy Level</span>
          <span className="text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">{energy}/5</span>
        </div>
        <input 
          type="range" 
          min="1" max="5" 
          value={energy}
          onChange={(e) => handleEnergyChange(parseInt(e.target.value))}
          className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer mt-1"
        />
        <div className="flex justify-between text-lg px-1 mt-1">
          <span className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => handleEnergyChange(1)}>😴</span>
          <span className="opacity-100 hover:scale-110 cursor-pointer transition-transform drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" onClick={() => handleEnergyChange(5)}>⚡</span>
        </div>
      </div>
    </div>
  );
}

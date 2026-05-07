import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AdvisorPanel({ data }) {
  const { score, recommendation } = data;
  
  let colorClass = 'text-brand-green bg-green-50 border-green-200';
  let message = "You're doing great!";
  
  if (score < 40) { 
    colorClass = 'text-brand-red bg-red-50 border-red-200'; 
    message = "Let's get back on track.";
  } else if (score < 70) { 
    colorClass = 'text-brand-amber bg-amber-50 border-amber-200'; 
    message = "Keep up the momentum.";
  }

  return (
    <div className="bg-surface border border-slate-200 rounded-2xl p-5 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-brand-indigo" />
        <h2 className="text-sm font-bold text-slate-800">AI Advisor</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 ${colorClass} shrink-0 shadow-sm`}>
          <span className="text-xl font-bold">{score}</span>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <p className="text-xs text-slate-500 font-medium">{message}</p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

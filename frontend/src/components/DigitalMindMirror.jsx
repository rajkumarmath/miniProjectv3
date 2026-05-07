import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BrainCircuit, AlertTriangle, Zap, Target, ShieldAlert, Activity, Medal, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigitalMindMirror({ profile }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return (
    <div className="w-full h-full bg-black/60 flex items-center justify-center border border-white/5 rounded-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.1),_transparent_70%)]"></div>
      <div className="animate-pulse text-cyan-400 font-mono text-sm tracking-widest flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
        <Activity className="animate-spin-slow" size={18} />
        INITIALIZING NEURAL SCAN...
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col p-5 font-mono text-slate-300 shadow-[0_0_30px_rgba(0,0,0,0.8)] inset-0 backdrop-blur-md">
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrainCircuit className="text-cyan-400" size={24} />
            <div className={`absolute inset-0 bg-cyan-400 blur-md rounded-full transition-opacity duration-1000 ${pulse ? 'opacity-60' : 'opacity-10'}`}></div>
          </div>
          <div>
            <h2 className="text-white font-bold tracking-widest text-lg drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] uppercase">Cognitive Profile</h2>
            <p className="text-[10px] text-cyan-400/80 tracking-[0.2em] uppercase">Neural Map Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-cyan-950/30 border border-cyan-900/50 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          <span className="text-cyan-400 font-semibold tracking-wider">SYNCED</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 relative z-10 h-full overflow-y-auto custom-scroll pr-2">
        
        <div className="flex gap-4">
          {/* Left Column: Stats */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            
            <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-900/40 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm relative overflow-hidden group flex justify-between items-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <div>
                <div className="text-xs text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap size={12} className="text-purple-400"/> Primary Archetype</div>
                <div className="text-xl font-bold text-white tracking-wide">{profile.primary_type}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Level {profile.level}</div>
                <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                  <div className="bg-cyan-500 h-full shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-1000" style={{width: `${(profile.xp/profile.next_level_xp)*100}%`}}></div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">{profile.xp} / {profile.next_level_xp} XP</div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 border border-red-500/20 rounded-xl p-3 backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.05)]">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle size={10} className="text-red-400"/> Weakness</div>
                <div className="text-sm font-semibold text-red-300">{profile.weakness}</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 border border-cyan-500/20 rounded-xl p-3 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.05)]">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={10} className="text-cyan-400"/> Peak Focus</div>
                <div className="text-sm font-semibold text-cyan-300">{profile.peak_focus}</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 border border-amber-500/20 rounded-xl p-3 backdrop-blur-sm relative overflow-hidden shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert size={10} className={profile.burnout_risk === 'High' ? 'text-red-500' : 'text-amber-500'}/> Burnout Risk</div>
                <div className={`text-lg font-bold ${profile.burnout_risk === 'High' ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse' : 'text-amber-400'}`}>
                  {profile.burnout_risk}
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/40 border border-green-500/20 rounded-xl p-3 backdrop-blur-sm flex flex-col justify-center items-center relative shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                  <circle cx="50%" cy="50%" r="25" className="stroke-slate-800" strokeWidth="3" fill="none" />
                  <circle cx="50%" cy="50%" r="25" className="stroke-green-500 transition-all duration-1000 ease-out" strokeWidth="3" fill="none" strokeDasharray="157" strokeDashoffset={157 - (157 * profile.consistency) / 100} strokeLinecap="round"/>
                </svg>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 z-10">Consistency</div>
                <div className="text-lg font-bold text-white z-10">{profile.consistency}%</div>
              </motion.div>
            </div>

          </div>

          {/* Right Column: Radar Chart */}
          <div className="w-[45%] bg-slate-900/20 border border-cyan-500/20 rounded-xl flex flex-col items-center justify-center p-2 relative backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]">
             {/* Radar scanning line effect */}
             <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] origin-top-left -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(6,182,212,0.2)_90deg,transparent_90deg)] animate-[spin_4s_linear_infinite]"></div>
             </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profile.radar_data}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#06b6d4', fontSize: 9, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="User" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} isAnimationActive={true} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gamification Badges */}
        <div className="bg-slate-900/40 border border-yellow-500/20 rounded-xl p-3 backdrop-blur-sm shadow-[0_0_10px_rgba(234,179,8,0.05)]">
          <div className="text-[10px] text-yellow-500/70 uppercase tracking-widest mb-2 flex items-center gap-2"><Trophy size={12} className="text-yellow-500"/> Recent Achievements</div>
          <div className="flex flex-wrap gap-2">
            {profile.badges?.map((badge, i) => (
              <motion.div whileHover={{ scale: 1.1 }} key={i} className="flex items-center gap-1.5 text-xs bg-black/60 border border-yellow-500/30 px-2 py-1 rounded text-yellow-100 shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                <Medal size={12} className="text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,1)]" />
                {badge}
              </motion.div>
            ))}
            {(!profile.badges || profile.badges.length === 0) && (
               <div className="text-xs text-slate-500 italic">No achievements yet. Keep working!</div>
            )}
          </div>
        </div>

      </div>

      {/* Footer / Future Prediction */}
      <div className="mt-4 pt-3 border-t border-white/10 relative z-10 shrink-0">
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 flex gap-3 items-center overflow-hidden relative group">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="shrink-0 bg-cyan-900/50 text-cyan-400 p-1.5 rounded-md border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
             <Activity size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-cyan-400 uppercase tracking-widest mb-0.5">Predictive Intelligence Engine</div>
            <div className="text-sm text-cyan-100 font-medium truncate animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_2px_rgba(6,182,212,0.8)]">
              "{profile.prediction}"
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

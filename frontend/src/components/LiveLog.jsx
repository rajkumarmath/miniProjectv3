import React, { useRef, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, CheckCircle2, XCircle, BarChart3, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENT_PROFILES = {
  IntakeAgent: { color: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/30', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]', icon: MessageSquare },
  PrioritizerAgent: { color: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/30', shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]', icon: BarChart3 },
  SchedulerAgent: { color: 'text-brand-amber', bg: 'bg-brand-amber/10', border: 'border-brand-amber/30', shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]', icon: Activity },
  DecomposerAgent: { color: 'text-brand-purple', bg: 'bg-brand-purple/10', border: 'border-brand-purple/30', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]', icon: Cpu },
  AdvisorAgent: { color: 'text-brand-magenta', bg: 'bg-brand-magenta/10', border: 'border-brand-magenta/30', shadow: 'shadow-[0_0_10px_rgba(219,39,119,0.3)]', icon: CheckCircle2 },
  ProcrastinationDetectorAgent: { color: 'text-brand-red', bg: 'bg-brand-red/10', border: 'border-brand-red/30', shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]', icon: ShieldAlert },
  API: { color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-700', shadow: 'shadow-none', icon: MessageSquare }
};

export default function LiveLog({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full font-mono text-slate-300">
      <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold text-white tracking-widest uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Agent Consensus Stream</h2>
        </div>
        <div className="text-[10px] bg-black/50 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,255,0.2)]">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
          XAI Engine Active
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        <AnimatePresence>
          {messages.map((m, i) => {
            const profileName = m.sender.replace('Agent', '');
            const profile = AGENT_PROFILES[m.sender] || AGENT_PROFILES.API;
            const Icon = profile.icon;
            
            const isConflict = m.msg_type === 'conflict' || m.msg_type === 'reject_task';
            const isNegotiation = m.msg_type === 'negotiate' || m.msg_type === 'compromise';
            
            let cardStyle = "bg-slate-900/40 border-slate-700/50";
            let badgeStyle = "bg-slate-800 text-slate-300 border-slate-600";
            
            // Format content nicely instead of JSON stringify
            let messageContent = '';
            if (typeof m.content === 'string') {
              messageContent = m.content;
            } else if (m.content) {
              if (m.content.action) messageContent = `Executed: ${m.content.action}`;
              else if (m.content.task) messageContent = `Processing Task: ${m.content.task.title || m.content.task.description || 'Unknown'}`;
              else if (m.content.proposal) messageContent = `Proposal: ${m.content.proposal}`;
              else if (m.content.reason) messageContent = `Reason: ${m.content.reason}`;
              else if (m.content.message) messageContent = m.content.message;
              else messageContent = "Updated internal state.";
            }

            if (isConflict) {
              cardStyle = "bg-red-900/10 border-red-500/30";
              badgeStyle = "bg-red-950 text-red-400 border-red-500/50";
              messageContent = `Rejected task. ${m.content?.reason || 'High risk detected.'}`;
            } else if (isNegotiation) {
              cardStyle = "bg-amber-900/10 border-amber-500/30";
              badgeStyle = "bg-amber-950 text-amber-400 border-amber-500/50";
              messageContent = `Compromise proposed. ${m.content?.proposal || ''}`;
            } else if (m.msg_type === 'xai_explanation') {
               cardStyle = "bg-indigo-900/10 border-indigo-500/30";
               badgeStyle = "bg-indigo-950 text-indigo-400 border-indigo-500/50";
               messageContent = "Decision reasoning provided.";
            }

            const timeString = new Date(m.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

            const hasXAI = m.msg_type === 'xai_explanation' || (m.content && (m.content.confidence !== undefined || m.content.tradeoff));
            const confidence = m.msg_type === 'xai_explanation' ? m.content.confidence : (hasXAI ? m.content.confidence : null);
            const tradeoff = m.msg_type === 'xai_explanation' ? m.content.tradeoff : (hasXAI ? m.content.tradeoff : null);
            const why = m.msg_type === 'xai_explanation' ? m.content.why : null;

            return (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 p-4 rounded-2xl border backdrop-blur-md ${cardStyle} transition-all relative`}
              >
                {/* Connecting Line if not first */}
                {i > 0 && <div className="absolute -top-6 left-9 w-0.5 h-6 bg-gradient-to-b from-transparent to-white/10" />}

                {/* Animated Avatar */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${profile.bg} ${profile.border} ${profile.color} ${profile.shadow} shrink-0 relative`}
                >
                  <Icon size={20} />
                  {isConflict && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    >
                      <span className="text-[8px] text-white font-bold">!</span>
                    </motion.div>
                  )}
                  {/* Speaking animation ring */}
                  <div className={`absolute inset-0 rounded-xl border border-white/20 animate-ping opacity-20`} style={{ animationDuration: '2s' }}></div>
                </motion.div>

                {/* Cyberpunk Dialogue Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold tracking-widest uppercase text-xs ${profile.color}`}>{profileName}</span>
                      <span className="text-slate-600 text-[10px]">{timeString}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${badgeStyle}`}>
                      {m.msg_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-slate-300 leading-relaxed text-xs font-sans">
                    {messageContent}
                  </div>

                  {/* XAI HUD Overlay */}
                  {hasXAI && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 bg-black/50 border border-cyan-900/30 rounded-lg p-3 text-[10px] relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                        <span className="text-cyan-400 font-bold uppercase tracking-widest">Decision Matrix</span>
                        {confidence && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 tracking-wider">CONF:</span>
                            <span className="text-cyan-400 font-bold">{confidence}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 font-sans">
                        {tradeoff && (
                          <div className="flex gap-2">
                            <span className="text-slate-500 shrink-0">TRADEOFF:</span>
                            <span className="text-slate-300">{tradeoff}</span>
                          </div>
                        )}
                        {why && why.map((w, j) => (
                           <div key={j} className="flex gap-2">
                             <span className="text-purple-500 shrink-0">&gt;</span>
                             <span className="text-purple-300">{w}</span>
                           </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

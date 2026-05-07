import React, { useMemo } from 'react';
import { ReactFlow, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const STATE_COLORS = {
  IDLE: 'border-slate-700 bg-slate-900 text-slate-400 shadow-[0_0_10px_rgba(51,65,85,0.5)]',
  THINKING: 'border-blue-400 bg-blue-900/50 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[pulse_1.5s_ease-in-out_infinite]',
  NEGOTIATING: 'border-amber-400 bg-amber-900/50 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
  RESOLVED: 'border-green-400 bg-green-900/50 text-green-200 shadow-[0_0_15px_rgba(74,222,128,0.8)]',
  BLOCKED: 'border-red-500 bg-red-900/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,1)] animate-[pulse_1s_ease-in-out_infinite]'
};

const CustomNode = ({ data }) => {
  const { name, role, state } = data;
  const colorClass = STATE_COLORS[state] || STATE_COLORS.IDLE;
  
  const shortName = name.replace('Agent', '');

  return (
    <div className={`p-3 rounded-xl border-2 ${colorClass} w-36 text-center transition-all duration-300 relative flex flex-col items-center justify-center font-mono backdrop-blur-md`}>
      <div className="font-bold text-sm tracking-widest">{shortName}</div>
      <div className="text-[9px] uppercase font-medium opacity-70 mt-1 tracking-widest">{role}</div>
      
      {state !== 'IDLE' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-900 rounded-full border-2 border-current flex items-center justify-center shadow-[0_0_8px_currentColor]">
          <div className="w-1.5 h-1.5 rounded-full animate-ping bg-current"></div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function AgentGraph({ agents, messages }) {
  const nodes = useMemo(() => {
    const count = 8;
    const radius = 240; 
    const centerX = 400;
    const centerY = 300;
    
    const order = [
      "IntakeAgent", "PrioritizerAgent", "SchedulerAgent", "DecomposerAgent", 
      "AdvisorAgent", "FocusAgent", "ProcrastinationDetectorAgent", "ReminderAgent"
    ];

    return agents.map(agent => {
      const idx = order.indexOf(agent.name) !== -1 ? order.indexOf(agent.name) : 0;
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      return {
        id: agent.name,
        type: 'custom',
        position: {
          x: centerX + radius * Math.cos(angle) - 72,
          y: centerY + radius * Math.sin(angle) - 35
        },
        data: agent
      };
    });
  }, [agents]);

  const edges = useMemo(() => {
    const now = new Date().getTime();
    const recentMessages = messages.filter(m => {
      const t = new Date(m.timestamp).getTime();
      return (now - t) < 6000 && m.receiver !== 'broadcast'; 
    });

    return recentMessages.map((m, i) => {
      const isConflict = m.msg_type === "reject_task" || m.msg_type === "conflict";
      const edgeColor = isConflict ? '#ef4444' : '#60a5fa'; // Red for conflict, Blue otherwise
      const dropShadow = isConflict ? 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' : 'drop-shadow(0 0 5px rgba(96,165,250,0.8))';

      return {
        id: `e-${m.sender}-${m.receiver}-${m.id}`,
        source: m.sender,
        target: m.receiver,
        animated: true,
        label: m.msg_type,
        style: { stroke: edgeColor, strokeWidth: isConflict ? 4 : 2, filter: dropShadow }, 
        labelStyle: { fill: '#ffffff', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9, rx: 4, ry: 4, stroke: edgeColor, strokeWidth: 1 }, 
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      };
    });
  }, [messages, systemTimeHack()]);

  function systemTimeHack() {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
      const id = setInterval(() => setTick(t => t + 1), 250); // Faster update for smoother animations
      return () => clearInterval(id);
    }, []);
    return null;
  }

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden font-mono">
      {/* Neural Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none z-0"></div>
      
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="z-10"
      >
        <Background color="#334155" gap={24} size={2} className="opacity-30" />
      </ReactFlow>
    </div>
  );
}

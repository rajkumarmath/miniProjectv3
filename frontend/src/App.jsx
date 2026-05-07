import React, { useEffect, useRef, useState } from 'react';
import AgentGraph from './components/AgentGraph';
import LiveLog from './components/LiveLog';
import TaskPanel from './components/TaskPanel';
import SchedulePanel from './components/SchedulePanel';
import ReminderToast from './components/ReminderToast';
import InputPanel from './components/InputPanel';
import ControlPanel from './components/ControlPanel';
import DigitalMindMirror from './components/DigitalMindMirror';
import useSystemStore from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, Settings, Trash2, Bell, BellOff } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from './config';

export default function App() {
  const {
    systemState, messages, schedule, emergencyMode, reminders, cognitiveProfile,
    voiceEnabled, voiceMode, notificationsEnabled, setSystemState, addMessage, setSchedule, setAdvisorUpdate,
    setEmergencyMode, addReminder, removeReminder, setCognitiveProfile, setSimulationUpdate,
    setVoiceEnabled, setVoiceMode, setNotificationsEnabled, clearState
  } = useSystemStore();

  const [scanActive, setScanActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const wsRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const femaleVoiceRef = useRef(null);

  useEffect(() => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      // Try to find a good female voice
      femaleVoiceRef.current = voices.find(v => v.name.includes('Zira') || v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')) || voices[0];
    };
    
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    loadVoices();

    const ws = new WebSocket(`${WS_BASE_URL}/ws`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.msg_type === 'system_state') {
        setSystemState(msg.content);
      } else if (msg.msg_type === 'schedule_updated') {
        setSchedule(msg.content);
      } else if (msg.msg_type === 'advisor_update') {
        setAdvisorUpdate(msg.content);
        // Removed voice spam on every advisor update
      } else if (msg.msg_type === 'emergency_mode') {
        const state = useSystemStore.getState();
        if (!state.emergencyMode && msg.content.active && state.voiceEnabled && state.notificationsEnabled) {
           speak("Emergency mode activated. Burnout risk is critical. Please take a break immediately.", 0.9, 0.8);
        }
        setEmergencyMode(msg.content.active);
      } else if (msg.msg_type === 'cognitive_profile') {
        setCognitiveProfile(msg.content);
      } else if (msg.msg_type === 'cognitive_scan_started') {
        setScanActive(true);
        setTimeout(() => setScanActive(false), 3000);
      } else if (msg.msg_type === 'simulation_update') {
        setSimulationUpdate(msg.content);
      } else if (msg.msg_type === 'data_cleared') {
        clearState();
      } else {
        const noisyTypes = ['tick', 'system_state', 'schedule_updated', 'decompose_check', 'parsed_input', 'subtasks_created', 'cognitive_scan_started', 'energy_update'];
        if (!noisyTypes.includes(msg.msg_type)) {
          addMessage(msg);
        }
      }
    };
    wsRef.current = ws;

    const eventSource = new EventSource(`${API_BASE_URL}/reminders`);
    eventSource.addEventListener('reminder', (e) => {
      const state = useSystemStore.getState();
      if (!state.notificationsEnabled) return;
      
      const data = JSON.parse(e.data);
      state.addReminder(data);
      if (state.voiceEnabled) speak(data.text);
      
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Agent Reminder", { body: data.text });
      }
    });

    return () => {
      ws.close();
      eventSource.close();
    };
  }, []); // Run only once on mount, state accessed via getState()

  const speak = (text, rate = 1.1, pitch = 1.2) => {
    if (!synthRef.current || !voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (femaleVoiceRef.current) utterance.voice = femaleVoiceRef.current;
    
    // Adjust based on personality
    if (voiceMode === 'calm') {
      utterance.rate = rate * 0.9;
      utterance.pitch = pitch * 0.9;
    } else if (voiceMode === 'strict') {
      utterance.rate = rate * 1.2;
      utterance.pitch = pitch * 0.8;
    } else {
      utterance.rate = rate;
      utterance.pitch = pitch;
    }
    
    synthRef.current.speak(utterance);
  };

  const testVoice = (mode) => {
    if (!synthRef.current || !voiceEnabled) return;
    
    // Resume audio context just in case browser requires gesture
    if (synthRef.current.resume) synthRef.current.resume();
    
    synthRef.current.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(`Voice mode is set to ${mode}.`);
    if (femaleVoiceRef.current) utterance.voice = femaleVoiceRef.current;
    
    if (mode === 'calm') {
      utterance.rate = 0.99; // Adjusted rate multiplier
      utterance.pitch = 1.08; // Adjusted pitch
    } else if (mode === 'strict') {
      utterance.rate = 1.32;
      utterance.pitch = 0.96;
    } else {
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
    }
    
    synthRef.current.speak(utterance);
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all data and start fresh?")) {
      try {
        await fetch(`${API_BASE_URL}/clear_data`, { method: 'POST' });
        // The websocket will receive 'data_cleared' and call clearState()
      } catch (err) {
        console.error("Failed to clear data:", err);
      }
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col p-4 gap-4 font-sans transition-colors duration-1000 overflow-hidden ${emergencyMode ? 'bg-red-950 text-red-50' : 'bg-slate-950 text-slate-200'}`}>
      
      {/* Subtle Cognitive Scan Overlay */}
      <AnimatePresence>
        {scanActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 4 }} exit={{ opacity: 0, height: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.8)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)] w-1/2 animate-[translateX_1s_infinite]"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futuristic Navbar */}
      <header className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-white/5 p-1.5 border border-white/10 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <img src="/logo.png" alt="University Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            Autonomous Multi-Agent Productivity System <span className="text-xs text-cyan-400 ml-2 border border-cyan-500/50 px-2 py-0.5 rounded-full bg-cyan-900/20">V3</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClearData}
            title="Clear All Data"
            className="text-red-400 hover:text-red-300 transition-colors p-2 bg-slate-800/50 rounded-full border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/50"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            title="Toggle Notifications"
            className={`p-2 rounded-full border transition-colors ${notificationsEnabled ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' : 'text-slate-500 bg-slate-800/50 border-white/5 hover:text-cyan-400'}`}
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            title="Voice Settings"
            className="text-slate-400 hover:text-cyan-400 transition-colors p-2 bg-slate-800/50 rounded-full border border-white/5"
          >
            <Settings size={18} />
          </button>
          <ControlPanel systemState={systemState} />
        </div>
      </header>

      {/* Voice Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] w-64"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Voice AI Settings</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-300">Voice Assistant</span>
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Personality</span>
              <div className="grid grid-cols-3 gap-2">
                {['calm', 'motivating', 'strict'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setVoiceMode(mode);
                      testVoice(mode);
                    }}
                    className={`text-[10px] py-1.5 rounded-md border capitalize transition-all ${voiceMode === mode ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid - Neon Cyberpunk */}
      <div className="flex-1 flex gap-4 min-h-0 relative z-10">
        
        {/* Left Column */}
        <div className="w-[30%] flex flex-col gap-4 min-w-0">
          <InputPanel />
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <TaskPanel agents={systemState.agents} />
            <SchedulePanel schedule={schedule} />
          </div>
        </div>

        {/* Center/Right */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Top Row - WOW Features */}
          <div className="h-[55%] flex gap-4 min-h-0">
            {/* Digital Mind Mirror */}
            <div className="w-[45%] flex flex-col overflow-hidden min-w-0 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-slate-900/30 backdrop-blur-md">
              <DigitalMindMirror profile={cognitiveProfile} />
            </div>

            {/* Agent Network Graph */}
            <div className="flex-1 bg-slate-900/30 backdrop-blur-md border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col overflow-hidden relative">
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <h2 className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-3 py-1.5 rounded border border-cyan-500/30 tracking-widest uppercase">
                  Neural Sync
                </h2>
                {emergencyMode && (
                  <h2 className="text-[10px] font-bold text-red-400 bg-red-950/50 px-3 py-1.5 rounded border border-red-500/30 tracking-widest uppercase animate-pulse">
                    EMERGENCY OVERRIDE
                  </h2>
                )}
              </div>
              <AgentGraph agents={systemState.agents} messages={messages} />
            </div>
          </div>

          {/* Bottom Row - Multi-Agent Consensus Log */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-slate-900/30 backdrop-blur-md">
            <LiveLog messages={messages} />
          </div>

        </div>
      </div>

      {/* Reminders */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        <AnimatePresence>
          {reminders.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
              <ReminderToast reminder={r} onDismiss={() => removeReminder(i)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

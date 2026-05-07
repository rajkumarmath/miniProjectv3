import { create } from 'zustand';

const useSystemStore = create((set) => ({
  systemState: { tick: 0, agents: [] },
  messages: [],
  schedule: { Morning: [], Afternoon: [], Evening: [] },
  advisorUpdate: { score: 100, recommendation: '', confidence: 100 },
  emergencyMode: false,
  reminders: [],
  cognitiveProfile: null,
  simulationUpdate: null,
  voiceEnabled: true,
  voiceMode: 'calm', // calm, motivating, strict

  setSystemState: (state) => set({ systemState: state }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages.slice(-99), msg] })),
  setSchedule: (schedule) => set({ schedule }),
  setAdvisorUpdate: (update) => set({ advisorUpdate: update }),
  setEmergencyMode: (active) => set({ emergencyMode: active }),
  addReminder: (reminder) => set((state) => ({ reminders: [...state.reminders, reminder] })),
  removeReminder: (idx) => set((state) => ({ reminders: state.reminders.filter((_, i) => i !== idx) })),
  setCognitiveProfile: (profile) => set({ cognitiveProfile: profile }),
  setSimulationUpdate: (sim) => set({ simulationUpdate: sim }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setVoiceMode: (mode) => set({ voiceMode: mode }),
  clearState: () => set({ 
    systemState: { tick: 0, agents: [] }, 
    messages: [], 
    schedule: { Morning: [], Afternoon: [], Evening: [] }, 
    reminders: [], 
    cognitiveProfile: null, 
    simulationUpdate: null, 
    advisorUpdate: { score: 100, recommendation: '', confidence: 100 } 
  })
}));

export default useSystemStore;

import asyncio
from typing import List, Dict, Any
from .base import BaseAgent, Message
from .message_bus import message_bus
from .productivity_agents import (
    IntakeAgent, PrioritizerAgent, SchedulerAgent, DecomposerAgent,
    ProcrastinationDetectorAgent, ReminderAgent, FocusAgent, AdvisorAgent,
    BurnoutDetectorAgent, BehaviorAnalysisAgent, SimulationAgent,
    ExplanationEngine, RewardAgent
)

class Orchestrator:
    def __init__(self):
        self.tick_counter = 0
        self.running = False
        self.speed = 1.0 # Multiplier
        self.persistent_memory: List[Dict[str, Any]] = []
        
        self.agents = [
            IntakeAgent(),
            PrioritizerAgent(),
            SchedulerAgent(),
            DecomposerAgent(),
            ProcrastinationDetectorAgent(),
            ReminderAgent(),
            FocusAgent(),
            AdvisorAgent(),
            BurnoutDetectorAgent(),
            BehaviorAnalysisAgent(),
            SimulationAgent(),
            ExplanationEngine(),
            RewardAgent()
        ]
        
        for agent in self.agents:
            message_bus.register_agent(agent)

    async def start(self):
        self.running = True
        asyncio.create_task(self._loop())

    def pause(self):
        self.running = False

    def reset(self):
        self.tick_counter = 0
        # Reset agents
        for agent in self.agents:
            agent.inbox.clear()
            agent.memory.clear()
            agent.state = agent.state.IDLE
        self.persistent_memory.clear()

    def set_speed(self, speed: float):
        self.speed = speed

    async def _loop(self):
        while True:
            if self.running:
                self.tick_counter += 1
                
                # Extract all tasks from Prioritizer for tick broadcast
                tasks = []
                for a in self.agents:
                    if isinstance(a, PrioritizerAgent):
                        tasks = a.task_queue
                        break
                        
                # Send tick message to all agents (mainly for ProcrastinationDetector)
                tick_msg = Message(
                    sender="Orchestrator",
                    receiver="broadcast",
                    msg_type="tick",
                    content={"tick": self.tick_counter, "tasks": tasks}
                )
                await message_bus.publish(tick_msg)
                
                # Execute all agents
                for agent in self.agents:
                    await agent.think()
                    
                # Broadcast state update for UI
                state_msg = Message(
                    sender="Orchestrator",
                    receiver="broadcast",
                    msg_type="system_state",
                    content={
                        "tick": self.tick_counter,
                        "agents": [a.get_status() for a in self.agents]
                    }
                )
                await message_bus.publish(state_msg)
                
            await asyncio.sleep(2.0 / self.speed)

orchestrator = Orchestrator()

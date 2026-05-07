import re
import datetime
import uuid
from typing import Dict, Any, List
from .base import BaseAgent, AgentState

class IntakeAgent(BaseAgent):
    def __init__(self):
        super().__init__("IntakeAgent", "Parser", "Friendly and welcoming! 😊")
    
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "raw_input":
                self.state = AgentState.THINKING
                original_text = msg.content.get("text", "")
                text = original_text.lower()
                req_type = msg.content.get("type", "task")
                
                # Split paragraph into multiple tasks using regex
                # Matches common conjunctions and punctuation to separate tasks
                raw_tasks = [t.strip() for t in re.split(r'\b(?:and also|and then|then also|and|also|then|\.|;|,)\b', text) if len(t.strip()) > 4]
                
                if not raw_tasks:
                    raw_tasks = [text.strip()]

                for raw_text in raw_tasks:
                    # Ignore meaningless fillers
                    if raw_text in ["i have to", "i need to", "i want to", "have to", "need to"]:
                        continue

                    # Deterministic Parsing
                    effort = "medium"
                    if "hard" in raw_text or "difficult" in raw_text or "big" in raw_text: effort = "high"
                    elif "easy" in raw_text or "quick" in raw_text or "small" in raw_text: effort = "low"
                    
                    deadline = 0 # today
                    if "tomorrow" in raw_text or "tomarrow" in raw_text: deadline = 1
                    elif "urgent" in raw_text: deadline = 0
                    elif "someday" in raw_text: deadline = None
                    else:
                        match = re.search(r'in (\d+) days', raw_text)
                        if match: deadline = int(match.group(1))
                    
                    category = "personal"
                    if "work" in raw_text or "meeting" in raw_text or "code" in raw_text or "report" in raw_text or "project" in raw_text: category = "work"
                    elif "health" in raw_text or "workout" in raw_text or "gym" in raw_text or "sleep" in raw_text or "water" in raw_text: category = "health"
                    elif "learn" in raw_text or "study" in raw_text or "read" in raw_text or "exam" in raw_text or "exxam" in raw_text: category = "learning"

                    parsed = {
                        "task_id": str(uuid.uuid4()),
                        "title": raw_text.capitalize(),
                        "type": req_type,
                        "deadline": deadline,
                        "effort": effort,
                        "category": category,
                        "status": "new",
                        "ticks_ignored": 0,
                        "defer_count": 0
                    }
                    self.memory.append({"action": "parsed", "data": parsed})
                    await self.send("PrioritizerAgent", "parsed_input", parsed)
                    
            self.inbox.remove(msg)
        self.state = AgentState.IDLE

class PrioritizerAgent(BaseAgent):
    def __init__(self):
        super().__init__("PrioritizerAgent", "Prioritizer", "Cold, mathematical, calculating. 🤖")
        self.task_queue = []
        self.negotiation_rounds = {} # task_id -> rounds
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "parsed_input":
                self.state = AgentState.THINKING
                task = msg.content
                
                urgency = 5 if task["deadline"] == 0 else max(1, 5 - (task["deadline"] or 5))
                importance = 5 if task["category"] == "work" else (3 if task["category"] == "health" else 2)
                
                if task["effort"] == "high": importance += 1
                
                task["priority_score"] = min(25, urgency * importance)
                task["confidence"] = 75 + (urgency * 2)
                task["tradeoff"] = f"Prioritizing '{task['category']}' over low-priority background tasks."
                
                self.task_queue.append(task)
                self.task_queue.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
                
                await self.send("broadcast", "task_prioritized", task)
                await self.send("SchedulerAgent", "schedule_request", task)
                await self.send("DecomposerAgent", "decompose_check", task)

            elif msg.msg_type == "conflict":
                self.state = AgentState.NEGOTIATING
                task = msg.content.get("task")
                tid = task["task_id"]
                rounds = self.negotiation_rounds.get(tid, 0)
                
                if rounds < 2:
                    self.negotiation_rounds[tid] = rounds + 1
                    task["priority_score"] += 2
                    task["tradeoff"] = "Compromise: Increasing priority slightly to force fit into schedule."
                    await self.send("SchedulerAgent", "negotiate", {"task": task, "round": rounds + 1})
                else:
                    self.state = AgentState.RESOLVED
                    task["tradeoff"] = "Negotiation failed. Forcing task into schedule despite risks."
                    await self.send("SchedulerAgent", "force_schedule", task)
                    self.negotiation_rounds[tid] = 0
            
            elif msg.msg_type == "intervention":
                tid = msg.content.get("task_id")
                for t in self.task_queue:
                    if t["task_id"] == tid:
                        t["priority_score"] = 25 # max priority
                        await self.send("AdvisorAgent", "alert", {"msg": f"Intervention! Maxed priority for {t['title']}."})
                        
            elif msg.msg_type == "task_completed":
                tid = msg.content.get("task_id")
                self.task_queue = [t for t in self.task_queue if t["task_id"] != tid]

            self.inbox.remove(msg)
            
        if self.state not in [AgentState.NEGOTIATING, AgentState.THINKING]:
            self.state = AgentState.IDLE

    def reset(self):
        self.task_queue = []
        self.negotiation_rounds = {}

    def get_status(self) -> Dict[str, Any]:
        status = super().get_status()
        status["task_queue"] = self.task_queue
        return status

class SchedulerAgent(BaseAgent):
    def __init__(self):
        super().__init__("SchedulerAgent", "Scheduler", "Organized, firm, efficient. 📅")
        self.schedule = {"Morning": [], "Afternoon": [], "Evening": []}
        self.energy = 3
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "energy_update":
                self.energy = msg.content.get("level", 3)
                
            elif msg.msg_type in ["schedule_request", "negotiate"]:
                self.state = AgentState.THINKING
                task = msg.content if msg.msg_type == "schedule_request" else msg.content.get("task")
                
                slot = "Morning" if task["effort"] == "high" else ("Afternoon" if task["effort"] == "medium" else "Evening")
                
                # Check for burnout detector overrides
                if hasattr(self, "burnout_limit") and task["effort"] == "high" and self.burnout_limit:
                    await self.send("PrioritizerAgent", "reject_task", {"task": task, "reason": "Burnout Limit Exceeded"})
                    self.state = AgentState.NEGOTIATING
                elif len(self.schedule[slot]) >= self.energy and msg.msg_type != "force_schedule":
                    self.state = AgentState.NEGOTIATING
                    await self.send("PrioritizerAgent", "conflict", {"task": task, "reason": f"Overbooked {slot}"})
                else:
                    self.schedule[slot].append(task)
                    self.state = AgentState.RESOLVED
                    await self.send("broadcast", "schedule_updated", self.schedule)

            elif msg.msg_type == "force_schedule":
                task = msg.content
                slot = "Morning" if task["effort"] == "high" else "Afternoon"
                self.schedule[slot].append(task)
                self.state = AgentState.RESOLVED
                await self.send("broadcast", "schedule_updated", self.schedule)
                
            elif msg.msg_type == "burnout_alert":
                self.burnout_limit = True
                
            elif msg.msg_type == "task_completed":
                tid = msg.content.get("task_id")
                for slot in self.schedule:
                    self.schedule[slot] = [t for t in self.schedule[slot] if t["task_id"] != tid]
                await self.send("broadcast", "schedule_updated", self.schedule)
                
            self.inbox.remove(msg)
            
        if self.state not in [AgentState.NEGOTIATING, AgentState.THINKING]:
            self.state = AgentState.IDLE

    def reset(self):
        self.schedule = {"Morning": [], "Afternoon": [], "Evening": []}
        self.energy = 3

class DecomposerAgent(BaseAgent):
    def __init__(self):
        super().__init__("DecomposerAgent", "Decomposer", "Analytical, thorough, detailed. 🔍")
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "decompose_check":
                self.state = AgentState.THINKING
                task = msg.content
                if task["effort"] == "high" or task["type"] == "goal":
                    for step in ["Research", "Draft", "Finalize"]:
                        subtask = {
                            "task_id": str(uuid.uuid4()),
                            "title": f"{task['title']} - Step: {step}",
                            "type": "task",
                            "deadline": task.get("deadline", 0),
                            "effort": "low",
                            "category": task.get("category", "work"),
                            "status": "new",
                            "ticks_ignored": 0,
                            "defer_count": 0
                        }
                        await self.send("PrioritizerAgent", "parsed_input", subtask)
                    await self.send("broadcast", "subtasks_created", {"parent": task})
                    self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE

class ProcrastinationDetectorAgent(BaseAgent):
    def __init__(self):
        super().__init__("ProcrastinationDetectorAgent", "Enforcer", "Sarcastic, relentless. 👀")
        self.tracked_tasks = {}
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "tick":
                self.state = AgentState.THINKING
                # update task tracking
                tasks = msg.content.get("tasks", [])
                for task in tasks:
                    if task["status"] != "done":
                        tid = task["task_id"]
                        if tid not in self.tracked_tasks:
                            self.tracked_tasks[tid] = {"ignored": 0, "flagged": 0}
                        self.tracked_tasks[tid]["ignored"] += 1
                        
                        if self.tracked_tasks[tid]["ignored"] >= 5:
                            self.tracked_tasks[tid]["flagged"] += 1
                            self.tracked_tasks[tid]["ignored"] = 0
                            
                            if self.tracked_tasks[tid]["flagged"] >= 3:
                                await self.send("PrioritizerAgent", "intervention", {"task_id": tid})
                                await self.send("AdvisorAgent", "score_penalty", {"amount": 5, "reason": "Procrastination"})
                            else:
                                await self.send("ReminderAgent", "escalate", {"task": task})
            self.inbox.remove(msg)
        self.state = AgentState.IDLE

class BurnoutDetectorAgent(BaseAgent):
    def __init__(self):
        super().__init__("BurnoutDetectorAgent", "Guardian", "Vigilant, protective. 🛡️")
        self.high_effort_count = 0
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "parsed_input":
                task = msg.content
                if task["effort"] == "high":
                    self.high_effort_count += 1
                    
                if self.high_effort_count > 3:
                    self.state = AgentState.THINKING
                    await self.send("SchedulerAgent", "burnout_alert", {"level": "critical"})
                    await self.send("PrioritizerAgent", "parsed_input", {
                        "task_id": str(uuid.uuid4()),
                        "title": "Mandatory Recovery Block",
                        "type": "task",
                        "deadline": 0,
                        "effort": "low",
                        "category": "health",
                        "status": "new",
                        "ticks_ignored": 0,
                        "defer_count": 0
                    })
                    self.high_effort_count = 0 # reset after intervention
                    self.state = AgentState.RESOLVED
            self.inbox.remove(msg)

class ReminderAgent(BaseAgent):
    def __init__(self):
        super().__init__("ReminderAgent", "Reminder", "Persistent, escalating. ⏰")
        self.levels = ["Friendly reminder!", "Firmly asking you to do this.", "URGENT: Do this now.", "SERIOUSLY DO THIS NOW OR ELSE."]
        self.task_levels = {}
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "escalate":
                self.state = AgentState.THINKING
                task = msg.content.get("task")
                tid = task["task_id"]
                lvl = self.task_levels.get(tid, 0)
                lvl = min(lvl + 1, len(self.levels) - 1)
                self.task_levels[tid] = lvl
                
                text = f"{self.levels[lvl]} -> {task['title']}"
                await self.send("broadcast", "sse_reminder", {"level": lvl, "text": text})
            self.inbox.remove(msg)
        self.state = AgentState.IDLE

class FocusAgent(BaseAgent):
    def __init__(self):
        super().__init__("FocusAgent", "Focus", "Zen, protective. 🧘")
        self.focus_active = False
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "start_focus":
                self.focus_active = True
                self.state = AgentState.RESOLVED
                await self.send("AdvisorAgent", "score_boost", {"amount": 10})
            elif msg.msg_type == "stop_focus":
                self.focus_active = False
                self.state = AgentState.IDLE
            elif msg.msg_type == "interrupt_focus" and self.focus_active:
                await self.send("AdvisorAgent", "score_penalty", {"amount": 5, "reason": "Focus interrupted"})
                await self.send("ProcrastinationDetectorAgent", "focus_fail", {})
            self.inbox.remove(msg)

class AdvisorAgent(BaseAgent):
    def __init__(self):
        super().__init__("AdvisorAgent", "Coach", "Encouraging, supportive coach. 🌟")
        self.productivity_score = 100
        self.recommendation = "Add a task to get started!"
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "score_penalty":
                self.productivity_score = max(0, self.productivity_score - msg.content.get("amount", 0))
            elif msg.msg_type == "score_boost":
                self.productivity_score = min(100, self.productivity_score + msg.content.get("amount", 0))
            elif msg.msg_type == "schedule_updated":
                sched = msg.content
                top_task = None
                for slot in ["Morning", "Afternoon", "Evening"]:
                    if sched.get(slot):
                        top_task = sched[slot][0]
                        break
                if top_task:
                    self.recommendation = f"You should work on: {top_task['title']}"
                else:
                    self.recommendation = "You're all caught up! Great job!"
                    
            if self.productivity_score < 40:
                self.confidence = 40.0
                await self.send("broadcast", "emergency_mode", {"active": True})
            else:
                self.confidence = self.productivity_score
                await self.send("broadcast", "emergency_mode", {"active": False})
                
            self.inbox.remove(msg)
            
        await self.send("broadcast", "advisor_update", {
            "score": self.productivity_score,
            "recommendation": self.recommendation,
            "confidence": self.confidence
        })

    def reset(self):
        self.productivity_score = 100
        self.recommendation = "Add a task to get started!"
        self.confidence = 100

class BehaviorAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__("BehaviorAnalysisAgent", "Analyzer", "Calm, observant, psychologically analytical. 🧠")
        self.scan_count = 0

    async def think(self):
        from db import get_user_profile, update_user_profile
        for msg in list(self.inbox):
            if msg.msg_type == "tick":
                self.scan_count += 1
                if self.scan_count >= 10: # Run every 10 ticks for demo
                    self.state = AgentState.THINKING
                    await self.send("broadcast", "cognitive_scan_started", {})
                    
                    profile = await get_user_profile()
                    cons = profile.get("consistency_score", 50)
                    
                    # Very simple mock rule for demo, in real life would query DB
                    archetype = "Deadline Sprinter"
                    if cons > 80: archetype = "Consistency Champion"
                    elif cons < 30: archetype = "Burnout Risk"
                    
                    radar_data = [
                        {"subject": "Focus", "A": min(100, cons + 10), "fullMark": 100},
                        {"subject": "Discipline", "A": cons, "fullMark": 100},
                        {"subject": "Energy", "A": 90, "fullMark": 100},
                        {"subject": "Speed", "A": 75, "fullMark": 100},
                        {"subject": "Consistency", "A": cons, "fullMark": 100},
                    ]
                    
                    new_profile = {
                        "primary_type": archetype,
                        "weakness": "Avoids difficult tasks before noon",
                        "peak_focus": "8:30 PM - 11:00 PM",
                        "burnout_risk": "High" if cons < 40 else "Low",
                        "consistency": cons,
                        "prediction": "Behavioral Shift Detected: Avoidance increasing for learning tasks.",
                        "level": profile.get("level", 1),
                        "xp": profile.get("xp", 0),
                        "next_level_xp": profile.get("level", 1) * 1000,
                        "badges": profile.get("badges", []),
                        "radar_data": radar_data
                    }
                    
                    await update_user_profile(primary_type=archetype)
                    
                    await self.send("broadcast", "cognitive_profile", new_profile)
                    self.scan_count = 0
                    self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE

class SimulationAgent(BaseAgent):
    def __init__(self):
        super().__init__("SimulationAgent", "Oracle", "Calculating, prophetic. 🔮")

    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "schedule_updated":
                self.state = AgentState.THINKING
                # Simulate future based on schedule
                sched = msg.content
                total_tasks = sum(len(sched[s]) for s in sched)
                prob = min(99, total_tasks * 15)
                sim_msg = f"{prob}% probability assignment delayed. Burnout risk increasing."
                await self.send("broadcast", "simulation_update", {"prediction": sim_msg})
                self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE

class ExplanationEngine(BaseAgent):
    def __init__(self):
        super().__init__("ExplanationEngine", "XAI", "Transparent, logical. 💡")

    async def think(self):
        for msg in list(self.inbox):
            # Intercepts negotiations or prioritization to add explanation
            if msg.msg_type == "task_prioritized":
                self.state = AgentState.THINKING
                task = msg.content
                exp = {
                    "task_id": task.get("task_id"),
                    "confidence": task.get("confidence", 85),
                    "tradeoff": task.get("tradeoff", "Standard priority balancing."),
                    "why": [
                        f"Priority score calculated as {task.get('priority_score')}.",
                        f"Category is {task.get('category')}."
                    ]
                }
                await self.send("broadcast", "xai_explanation", exp)
                self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE

class RewardAgent(BaseAgent):
    def __init__(self):
        super().__init__("RewardAgent", "Cheerleader", "Energetic, celebratory! 🎉")

    async def think(self):
        from db import get_user_profile, update_user_profile
        for msg in list(self.inbox):
            if msg.msg_type == "task_completed":
                self.state = AgentState.THINKING
                profile = await get_user_profile()
                xp = profile.get("xp", 0) + 100
                level = profile.get("level", 1)
                if xp >= level * 1000:
                    level += 1
                    await self.send("broadcast", "level_up", {"level": level})
                
                await update_user_profile(xp=xp, level=level)
                await self.send("broadcast", "xp_gained", {"amount": 100, "total": xp})
                self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE

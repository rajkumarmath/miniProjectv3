import os

with open('agents/productivity_agents.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add imports
imports_to_add = """import re
import datetime
import uuid
import os
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
from .base import BaseAgent, AgentState
from google import genai
from google.genai import types

load_dotenv()
try:
    genai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "dummy"))
except Exception:
    genai_client = None

def llm_generate_json(prompt: str):
    if not genai_client or os.environ.get("GEMINI_API_KEY") is None:
        return None
    try:
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"LLM Error: {e}")
        return None

def llm_generate_text(prompt: str):
    if not genai_client or os.environ.get("GEMINI_API_KEY") is None:
        return None
    try:
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"LLM Error: {e}")
        return None
"""

code = code.replace("import re\nimport datetime\nimport uuid\nfrom typing import Dict, Any, List\nfrom .base import BaseAgent, AgentState", imports_to_add)

# Replace IntakeAgent
new_intake = """class IntakeAgent(BaseAgent):
    def __init__(self):
        super().__init__("IntakeAgent", "Parser", "Friendly and welcoming! 😊")
    
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "raw_input":
                self.state = AgentState.THINKING
                text = msg.content.get("text", "")
                req_type = msg.content.get("type", "task")
                
                # LLM Parsing
                prompt = f'''
                Parse the following user input into a task or goal.
                Input: "{text}"
                Type requested: "{req_type}"
                
                Return a JSON object with:
                - effort: "low", "medium", or "high"
                - deadline: integer (0 for today, 1 for tomorrow, null for no deadline)
                - category: "work", "health", "learning", or "personal"
                - is_digital_executable: boolean (true if the task can be done by an AI, e.g. drafting an email, writing a report, summarizing a text. False if it requires physical action like going to the gym or calling someone).
                '''
                
                llm_res = llm_generate_json(prompt)
                
                if llm_res:
                    effort = llm_res.get("effort", "medium")
                    deadline = llm_res.get("deadline", 0)
                    category = llm_res.get("category", "personal")
                    is_digital = llm_res.get("is_digital_executable", False)
                else:
                    # Fallback Deterministic Parsing
                    text_lower = text.lower()
                    effort = "medium"
                    if "hard" in text_lower or "difficult" in text_lower or "big" in text_lower: effort = "high"
                    elif "easy" in text_lower or "quick" in text_lower or "small" in text_lower: effort = "low"
                    
                    deadline = 0 # today
                    if "tomorrow" in text_lower: deadline = 1
                    elif "urgent" in text_lower: deadline = 0
                    elif "someday" in text_lower: deadline = None
                    else:
                        match = re.search(r'in (\d+) days', text_lower)
                        if match: deadline = int(match.group(1))
                    
                    category = "personal"
                    if "work" in text_lower or "meeting" in text_lower or "code" in text_lower or "report" in text_lower: category = "work"
                    elif "health" in text_lower or "workout" in text_lower or "gym" in text_lower: category = "health"
                    elif "learn" in text_lower or "study" in text_lower or "read" in text_lower: category = "learning"
                    is_digital = "write" in text_lower or "draft" in text_lower or "report" in text_lower

                parsed = {
                    "task_id": str(uuid.uuid4()),
                    "title": text,
                    "type": req_type,
                    "deadline": deadline,
                    "effort": effort,
                    "category": category,
                    "status": "new",
                    "is_digital": is_digital,
                    "ticks_ignored": 0,
                    "defer_count": 0
                }
                self.memory.append({"action": "parsed", "data": parsed})
                await self.send("PrioritizerAgent", "parsed_input", parsed)
                
                if is_digital:
                    await self.send("WorkerAgent", "execute_task", parsed)
                    
            self.inbox.remove(msg)
        self.state = AgentState.IDLE"""

# Replace old IntakeAgent with new
import re
code = re.sub(r'class IntakeAgent\(BaseAgent\):.*?self\.state = AgentState\.IDLE', new_intake, code, flags=re.DOTALL)


# Replace DecomposerAgent
new_decomposer = """class DecomposerAgent(BaseAgent):
    def __init__(self):
        super().__init__("DecomposerAgent", "Decomposer", "Analytical, thorough, detailed. 🔍")
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "decompose_check":
                self.state = AgentState.THINKING
                task = msg.content
                if task["effort"] == "high" or task["type"] == "goal":
                    prompt = f'''
                    Break down the following high-effort task into 3 actionable subtasks.
                    Task: "{task['title']}"
                    Return a JSON object with a key "subtasks" containing a list of strings.
                    '''
                    llm_res = llm_generate_json(prompt)
                    if llm_res and "subtasks" in llm_res:
                        subtasks = [
                            {"title": t, "status": "new", "parent": task["task_id"]} for t in llm_res["subtasks"]
                        ]
                    else:
                        subtasks = [
                            {"title": f"{task['title']} - Step 1: Research", "status": "new", "parent": task["task_id"]},
                            {"title": f"{task['title']} - Step 2: Draft", "status": "new", "parent": task["task_id"]},
                            {"title": f"{task['title']} - Step 3: Finalize", "status": "new", "parent": task["task_id"]}
                        ]
                    await self.send("broadcast", "subtasks_created", {"parent": task, "subtasks": subtasks})
                    self.state = AgentState.RESOLVED
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE"""

code = re.sub(r'class DecomposerAgent\(BaseAgent\):.*?self\.state = AgentState\.IDLE', new_decomposer, code, flags=re.DOTALL)

# Replace AdvisorAgent
new_advisor = """class AdvisorAgent(BaseAgent):
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
                    prompt = f"Given the user needs to work on '{top_task['title']}', give a one sentence encouraging advice."
                    llm_res = llm_generate_text(prompt)
                    if llm_res:
                        self.recommendation = f"{llm_res.strip()} (Task: {top_task['title']})"
                    else:
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
        })"""

code = re.sub(r'class AdvisorAgent\(BaseAgent\):.*?\}', new_advisor + "\n        })", code, flags=re.DOTALL)


# Add WorkerAgent
new_worker = """

class WorkerAgent(BaseAgent):
    def __init__(self):
        super().__init__("WorkerAgent", "Executor", "I do the digital heavy lifting. 💻")
        
    async def think(self):
        for msg in list(self.inbox):
            if msg.msg_type == "execute_task":
                self.state = AgentState.THINKING
                task = msg.content
                prompt = f'''
                Execute the following task autonomously.
                Task: "{task['title']}"
                Write the output or result of this task directly. Do not output anything else but the result.
                '''
                
                # Signal we are working
                await self.send("broadcast", "worker_status", {"task_id": task["task_id"], "status": "working"})
                
                llm_res = llm_generate_text(prompt)
                
                if llm_res:
                    task["result"] = llm_res
                    task["status"] = "done"
                    await self.send("broadcast", "task_executed", {"task": task})
                self.state = AgentState.RESOLVED
                
            self.inbox.remove(msg)
        if self.state == AgentState.THINKING:
            self.state = AgentState.IDLE
"""

code += new_worker

with open('agents/productivity_agents.py', 'w', encoding='utf-8') as f:
    f.write(code)

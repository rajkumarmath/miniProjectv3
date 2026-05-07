# Autonomous Multi-Agent Personal Productivity & Task Manager

A fully functional, deterministic multi-agent system powered by 8 distinct AI personas running via a custom message bus. No LLMs, no external APIs.

## Features
- **8 Autonomous Agents**: Intake, Prioritizer, Scheduler, Decomposer, ProcrastinationDetector, Reminder, Focus, and Advisor.
- **Pure Deterministic Logic**: Everything runs strictly locally.
- **Real-time Graph**: Visually watch the agents communicate in real-time.
- **Negotiation Loops**: Watch the Scheduler and Prioritizer argue over task load!
- **Escalating Reminders**: Uses Web Notifications and SSE to persist reminders.
- **Emergency Mode**: If your productivity score dips below 40, the system goes into full alert mode.

## Installation

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `python main.py`
*(Runs on port 8000)*

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
*(Runs on port 5173)*

## Usage
1. Open the Frontend UI.
2. Ensure you allow **Notifications** when prompted by the browser.
3. Click the **Start (Play)** button in the top right control panel to begin the orchestrator tick loop.
4. Use the **Input Panel** to add tasks (e.g., "Urgent meeting tomorrow", "Easy coding task").
5. Watch the agents negotiate priorities, slots, and reminders!

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import asyncio
import json

from agents.orchestrator import orchestrator
from agents.message_bus import message_bus
from agents.base import Message

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskInput(BaseModel):
    text: str

class GoalInput(BaseModel):
    text: str

class EnergyInput(BaseModel):
    level: int

class ControlInput(BaseModel):
    action: str
    speed: float = 1.0

# Store connected websockets
connected_clients = set()
# Store reminder queue for SSE
reminder_queue = asyncio.Queue()

from db import init_db

@app.on_event("startup")
async def startup_event():
    # Initialize SQLite Database
    await init_db()

    # Register websocket broadcast
    async def ws_broadcast(message: Message):
        if connected_clients:
            msg_str = message.json()
            for client in list(connected_clients):
                try:
                    await client.send_text(msg_str)
                except Exception:
                    connected_clients.remove(client)
        
        # Route SSE reminders specifically
        if message.msg_type == "sse_reminder":
            await reminder_queue.put(message.content)

    message_bus.subscribe(ws_broadcast)

@app.post("/task")
async def add_task(req: TaskInput):
    msg = Message(sender="API", receiver="IntakeAgent", msg_type="raw_input", content={"text": req.text, "type": "task"})
    await message_bus.publish(msg)
    return {"status": "ok"}

@app.post("/goal")
async def add_goal(req: GoalInput):
    msg = Message(sender="API", receiver="IntakeAgent", msg_type="raw_input", content={"text": req.text, "type": "goal"})
    await message_bus.publish(msg)
    return {"status": "ok"}

@app.post("/energy")
async def set_energy(req: EnergyInput):
    msg = Message(sender="API", receiver="SchedulerAgent", msg_type="energy_update", content={"level": req.level})
    await message_bus.publish(msg)
    return {"status": "ok"}

@app.get("/status")
async def get_status():
    return {
        "tick": orchestrator.tick_counter,
        "running": orchestrator.running,
        "agents": [a.get_status() for a in orchestrator.agents]
    }

@app.post("/control")
async def control_system(req: ControlInput):
    if req.action == "start":
        if not orchestrator.running:
            await orchestrator.start()
    elif req.action == "pause":
        orchestrator.pause()
    elif req.action == "reset":
        orchestrator.reset()
    
    orchestrator.set_speed(req.speed)
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            # Just keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

@app.get("/reminders")
async def sse_reminders(request: Request):
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                # Wait for new reminder or timeout to check disconnect
                content = await asyncio.wait_for(reminder_queue.get(), timeout=1.0)
                yield {
                    "event": "reminder",
                    "data": json.dumps(content)
                }
            except asyncio.TimeoutError:
                pass
    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

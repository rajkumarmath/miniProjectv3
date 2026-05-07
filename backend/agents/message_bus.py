import asyncio
from typing import List, Dict, Callable, Any
from .base import Message

class MessageBus:
    def __init__(self):
        self.history: List[Message] = []
        self.agents: Dict[str, Any] = {}
        self.subscribers: List[Callable] = []
        self.lock = asyncio.Lock()

    def register_agent(self, agent: Any):
        self.agents[agent.name] = agent
        agent.message_bus = self

    def subscribe(self, callback: Callable):
        """Register a callback (e.g., for websockets) to receive all messages."""
        self.subscribers.append(callback)

    async def publish(self, message: Message):
        async with self.lock:
            self.history.append(message)
            
            # Send to specific receiver if not broadcast
            if message.receiver in self.agents:
                self.agents[message.receiver].receive(message)
            elif message.receiver == "broadcast":
                for name, agent in self.agents.items():
                    if name != message.sender:
                        agent.receive(message)
            
            # Notify websocket subscribers
            for callback in self.subscribers:
                await callback(message)

message_bus = MessageBus()

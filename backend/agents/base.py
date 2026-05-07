from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import uuid
import datetime

class AgentState(str, Enum):
    IDLE = "IDLE"
    THINKING = "THINKING"
    NEGOTIATING = "NEGOTIATING"
    RESOLVED = "RESOLVED"
    BLOCKED = "BLOCKED"

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender: str
    receiver: str
    msg_type: str
    content: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

class BaseAgent:
    def __init__(self, name: str, role: str, personality: str):
        self.name = name
        self.role = role
        self.personality = personality
        self.state: AgentState = AgentState.IDLE
        self.memory: List[Dict[str, Any]] = []
        self.inbox: List[Message] = []
        self.goals: List[str] = []
        self.confidence: float = 100.0
        self.message_bus = None

    def receive(self, message: Message):
        """Called by the message bus to push messages into the inbox."""
        self.inbox.append(message)

    async def send(self, receiver: str, msg_type: str, content: Dict[str, Any]):
        """Helper to construct and send a message through the bus."""
        msg = Message(
            sender=self.name,
            receiver=receiver,
            msg_type=msg_type,
            content=content
        )
        if self.message_bus:
            await self.message_bus.publish(msg)
            
    async def think(self):
        """
        Main tick method. 
        MUST process inbox, update memory, and send messages.
        To be overridden by subclasses.
        """
        pass

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "state": self.state.value,
            "confidence": self.confidence,
            "personality": self.personality
        }

import aiosqlite
import asyncio
import json

DB_PATH = "brain_memory.sqlite"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        # Tasks Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                task_id TEXT PRIMARY KEY,
                title TEXT,
                type TEXT,
                effort TEXT,
                category TEXT,
                status TEXT,
                ticks_ignored INTEGER DEFAULT 0,
                defer_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        
        # Behavior Logs (Avoidance, Energy, Focus)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS behavior_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT,
                data_json TEXT
            )
        """)

        # User Profile (Archetypes, XP, Streaks)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY DEFAULT 1,
                primary_type TEXT DEFAULT 'Unknown',
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                badges_json TEXT DEFAULT '[]',
                consistency_score INTEGER DEFAULT 50
            )
        """)
        
        # Ensure user profile exists
        await db.execute("INSERT OR IGNORE INTO user_profile (id) VALUES (1)")
        await db.commit()

async def get_user_profile():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT * FROM user_profile WHERE id = 1") as cursor:
            row = await cursor.fetchone()
            if row:
                return {
                    "primary_type": row[1],
                    "level": row[2],
                    "xp": row[3],
                    "badges": json.loads(row[4] or '[]'),
                    "consistency_score": row[5]
                }
            return {}

async def update_user_profile(**kwargs):
    async with aiosqlite.connect(DB_PATH) as db:
        set_clause = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        values = list(kwargs.values())
        if set_clause:
            await db.execute(f"UPDATE user_profile SET {set_clause} WHERE id = 1", values)
            await db.commit()

async def log_behavior(event_type: str, data: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("INSERT INTO behavior_logs (event_type, data_json) VALUES (?, ?)", (event_type, json.dumps(data)))
        await db.commit()

async def add_or_update_task(task: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO tasks (task_id, title, type, effort, category, status, ticks_ignored, defer_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(task_id) DO UPDATE SET
                status=excluded.status,
                ticks_ignored=excluded.ticks_ignored,
                defer_count=excluded.defer_count
        """, (
            task.get("task_id"), task.get("title"), task.get("type"), task.get("effort"),
            task.get("category"), task.get("status"), task.get("ticks_ignored", 0), task.get("defer_count", 0)
        ))
        if task.get("status") == "done":
            await db.execute("UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE task_id = ?", (task.get("task_id"),))
        await db.commit()

async def get_tasks_by_status(status: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM tasks WHERE status = ?", (status,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

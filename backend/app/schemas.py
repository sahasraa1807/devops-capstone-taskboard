from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


TaskStatus = Literal["todo", "in_progress", "review", "done"]
TaskPriority = Literal["low", "medium", "high", "critical"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the task")
    description: Optional[str] = Field(None, description="Detailed task description")
    status: TaskStatus = Field(default="todo", description="Workflow state")
    priority: TaskPriority = Field(default="medium", description="Priority level")
    assignee: str = Field(default="Unassigned", max_length=100, description="Task assignee")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee: Optional[str] = Field(None, max_length=100)


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStats(BaseModel):
    total: int
    todo: int
    in_progress: int
    review: int
    done: int
    high_priority: int


class HealthResponse(BaseModel):
    status: str
    version: str


class ReadyResponse(BaseModel):
    status: str
    database: str

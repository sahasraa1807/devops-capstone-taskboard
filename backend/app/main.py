import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy.orm import Session

from app.database import get_db, check_db_ready, Base, engine
from app.models import Task
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStats,
    HealthResponse,
    ReadyResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown."""
    # Attempt table creation if database is connected (Alembic handles migrations in prod)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield


app = FastAPI(
    title="TaskBoard API",
    description="DevOps Capstone TaskBoard SaaS Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose Prometheus metrics at /metrics
Instrumentator().instrument(app).expose(app)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "TaskBoard API",
        "status": "running",
        "docs_url": "/docs",
        "metrics_url": "/metrics",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health():
    """Liveness probe: verifies container process is responsive."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/ready", response_model=ReadyResponse, tags=["Health"])
def ready(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connectivity."""
    try:
        # Verify db session is active and query works
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )


@app.get("/api/tasks/stats", response_model=TaskStats, tags=["Tasks"])
def get_task_stats(db: Session = Depends(get_db)):
    """Summary KPI metrics for the TaskBoard dashboard."""
    tasks = db.query(Task).all()
    total = len(tasks)
    todo = sum(1 for t in tasks if t.status == "todo")
    in_progress = sum(1 for t in tasks if t.status == "in_progress")
    review = sum(1 for t in tasks if t.status == "review")
    done = sum(1 for t in tasks if t.status == "done")
    high_priority = sum(1 for t in tasks if t.priority in ("high", "critical"))

    return TaskStats(
        total=total,
        todo=todo,
        in_progress=in_progress,
        review=review,
        done=done,
        high_priority=high_priority,
    )


@app.get("/api/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def list_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve all tasks with optional status and priority filtering."""
    query = db.query(Task)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    return query.order_by(Task.created_at.desc()).all()


@app.get("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Retrieve a single task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task


@app.post(
    "/api/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Tasks"],
)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        assignee=task_in.assignee,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@app.delete(
    "/api/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Tasks"],
)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    db.delete(task)
    db.commit()
    return None

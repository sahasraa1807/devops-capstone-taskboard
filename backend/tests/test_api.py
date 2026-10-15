def test_root_endpoint(client):
    """Test the root endpoint returns running status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "TaskBoard API"
    assert data["status"] == "running"


def test_health_endpoint(client):
    """Test liveness probe endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_ready_endpoint(client):
    """Test readiness probe endpoint."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_metrics_endpoint(client):
    """Test that Prometheus metrics endpoint returns scrapeable metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text or "process_cpu_seconds_total" in response.text or "# HELP" in response.text


def test_create_task(client):
    """Test creating a new task."""
    payload = {
        "title": "Setup Kubernetes Cluster",
        "description": "Deploy EKS cluster using Terraform modules",
        "status": "todo",
        "priority": "high",
        "assignee": "DevOps Engineer",
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["priority"] == "high"
    assert data["status"] == "todo"
    assert data["assignee"] == "DevOps Engineer"


def test_get_tasks_list(client):
    """Test retrieving list of tasks."""
    # Create two tasks first
    client.post("/api/tasks", json={"title": "Task 1", "status": "todo"})
    client.post("/api/tasks", json={"title": "Task 2", "status": "done"})

    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) >= 2


def test_get_task_by_id(client):
    """Test retrieving a specific task by ID."""
    res_create = client.post(
        "/api/tasks",
        json={"title": "Single Task", "description": "Single task details"},
    )
    task_id = res_create.json()["id"]

    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Single Task"


def test_task_not_found(client):
    """Test requesting a non-existent task returns 404."""
    response = client.get("/api/tasks/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_task(client):
    """Test updating an existing task."""
    res_create = client.post(
        "/api/tasks",
        json={"title": "Before Update", "status": "todo", "priority": "low"},
    )
    task_id = res_create.json()["id"]

    update_payload = {
        "title": "After Update",
        "status": "in_progress",
        "priority": "high",
    }
    response = client.put(f"/api/tasks/{task_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "After Update"
    assert data["status"] == "in_progress"
    assert data["priority"] == "high"


def test_delete_task(client):
    """Test deleting an existing task."""
    res_create = client.post(
        "/api/tasks", json={"title": "Task to delete", "status": "todo"}
    )
    task_id = res_create.json()["id"]

    response = client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204

    # Verify task is deleted
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 404


def test_task_stats(client):
    """Test statistics endpoint."""
    client.post("/api/tasks", json={"title": "Task A", "status": "todo", "priority": "low"})
    client.post("/api/tasks", json={"title": "Task B", "status": "in_progress", "priority": "high"})
    client.post("/api/tasks", json={"title": "Task C", "status": "done", "priority": "critical"})

    response = client.get("/api/tasks/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total"] >= 3
    assert stats["todo"] >= 1
    assert stats["in_progress"] >= 1
    assert stats["done"] >= 1
    assert stats["high_priority"] >= 2

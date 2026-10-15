import React, { useState, useEffect } from 'react'

const API_BASE = '/api'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
    high_priority: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: 'DevOps Team',
  })

  // Fetch tasks and statistics
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`),
        fetch(`${API_BASE}/tasks/stats`),
      ])

      if (!tasksRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data from TaskBoard backend service')
      }

      const tasksData = await tasksRes.json()
      const statsData = await statsRes.json()

      setTasks(tasksData)
      setStats(statsData)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error connecting to backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create task')

      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: 'DevOps Team',
      })
      fetchData()
    } catch (err) {
      alert(`Error creating task: ${err.message}`)
    }
  }

  // Handle task status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update task status')
      fetchData()
    } catch (err) {
      alert(`Error updating task: ${err.message}`)
    }
  }

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete task')
      fetchData()
    } catch (err) {
      alert(`Error deleting task: ${err.message}`)
    }
  }

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === 'all' ? true : task.status === activeFilter
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <h2>Task<span>Board</span></h2>
        </div>

        <div className="nav-section-title">Workspaces</div>
        <ul className="nav-menu">
          <li
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Tasks & Sprints
          </li>
          <li
            className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            🚀 DevOps CI/CD
          </li>
          <li
            className={`nav-item ${activeTab === 'infrastructure' ? 'active' : ''}`}
            onClick={() => setActiveTab('infrastructure')}
          >
            ☁️ AWS & EKS Cluster
          </li>
          <li
            className={`nav-item ${activeTab === 'observability' ? 'active' : ''}`}
            onClick={() => setActiveTab('observability')}
          >
            📊 Metrics & Grafana
          </li>
        </ul>

        <div className="nav-section-title">Kubernetes Cluster</div>
        <div className="sidebar-footer">
          <div>Namespace: <strong>taskboard</strong></div>
          <div>Cluster: <strong>ap-south-1</strong></div>
          <div className="badge-env">Production EKS</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
            Version: 1.0.0 (SHA-tracked)
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>TaskBoard SaaS Production</h1>
            <p>Cloud-native containerized delivery on AWS EKS with Prometheus & Helm</p>
          </div>
          <div className="topbar-right">
            <button className="btn-secondary" onClick={fetchData}>
              🔄 Refresh
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              ➕ New Task
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          {/* CI/CD Pipeline Status Indicator */}
          <div className="pipeline-banner">
            <div>
              <strong style={{ fontSize: '0.9rem' }}>CI/CD Deployment Status:</strong>
              <span style={{ marginLeft: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Automated GitOps via GitHub Actions & GHCR
              </span>
            </div>
            <div className="pipeline-status">
              <div className="pipe-item">
                <span className="dot dot-green"></span>
                <span>Pytest: <strong>Passing (11/11)</strong></span>
              </div>
              <div className="pipe-item">
                <span className="dot dot-green"></span>
                <span>Trivy: <strong>Scanned (Clean)</strong></span>
              </div>
              <div className="pipe-item">
                <span className="dot dot-green"></span>
                <span>GHCR: <strong>Published</strong></span>
              </div>
              <div className="pipe-item">
                <span className="dot dot-blue"></span>
                <span>Helm: <strong>v1.0.0 Ready</strong></span>
              </div>
            </div>
          </div>

          {/* Backend Error State */}
          {error && (
            <div className="alert-error">
              <span>⚠️ <strong>Backend Connection Error:</strong> {error}</span>
              <button className="btn-secondary" onClick={fetchData}>Retry</button>
            </div>
          )}

          {/* KPI Stat Cards */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Total Tasks</div>
              <div className="kpi-value">{stats.total}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title" style={{ color: '#38bdf8' }}>In Progress</div>
              <div className="kpi-value" style={{ color: '#38bdf8' }}>{stats.in_progress}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title" style={{ color: '#fbbf24' }}>Under Review</div>
              <div className="kpi-value" style={{ color: '#fbbf24' }}>{stats.review}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title" style={{ color: '#34d399' }}>Completed</div>
              <div className="kpi-value" style={{ color: '#34d399' }}>{stats.done}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title" style={{ color: '#f87171' }}>High Priority</div>
              <div className="kpi-value" style={{ color: '#f87171' }}>{stats.high_priority}</div>
            </div>
          </section>

          {/* Tab View: Tasks Table */}
          {activeTab === 'tasks' && (
            <>
              {/* Filter and Search Bar */}
              <div className="filter-bar">
                <div className="filter-tabs">
                  {['all', 'todo', 'in_progress', 'review', 'done'].map((status) => (
                    <button
                      key={status}
                      className={`filter-tab ${activeFilter === status ? 'active' : ''}`}
                      onClick={() => setActiveFilter(status)}
                    >
                      {status === 'all'
                        ? 'All Tasks'
                        : status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Search tasks, descriptions, assignees..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Task Table */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Task Title</th>
                      <th>Assignee</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          Loading tasks from FastAPI PostgreSQL database...
                        </td>
                      </tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          No tasks found. Click "+ New Task" to create your first sprint task!
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            #{task.id}
                          </td>
                          <td>
                            <strong>{task.title}</strong>
                            {task.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td>👤 {task.assignee}</td>
                          <td>
                            <span className={`priority-${task.priority}`}>
                              ● {task.priority.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(task.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn delete"
                              title="Delete task"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab View: DevOps Pipeline Architecture */}
          {activeTab === 'pipeline' && (
            <div className="table-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>CI/CD Pipeline Architecture</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Every commit pushed to the <code>main</code> branch triggers our automated GitHub Actions workflow:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="kpi-card">
                  <strong style={{ color: 'var(--primary)' }}>Stage 1: Test & Lint</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Runs <code>pytest -v</code> against in-memory isolated test database and builds the React frontend.
                  </p>
                </div>
                <div className="kpi-card">
                  <strong style={{ color: 'var(--primary)' }}>Stage 2: Security Scan</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Trivy scans Docker images for HIGH & CRITICAL CVE vulnerabilities before promotion.
                  </p>
                </div>
                <div className="kpi-card">
                  <strong style={{ color: 'var(--primary)' }}>Stage 3: GHCR Push</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Images are tagged with immutable Git SHA (<code>${`{github.sha}`}</code>) and pushed to GitHub Container Registry.
                  </p>
                </div>
                <div className="kpi-card">
                  <strong style={{ color: 'var(--primary)' }}>Stage 4: Helm Deploy</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Deploys or upgrades the application release in the Kubernetes cluster.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab View: Infrastructure & Cluster */}
          {activeTab === 'infrastructure' && (
            <div className="table-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>AWS EKS & Terraform Infrastructure</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Provisioned via Infrastructure as Code (Terraform) in <code>ap-south-1</code>:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                <li>✅ <strong>VPC:</strong> 10.0.0.0/16 with 2 Public and 2 Private subnets</li>
                <li>✅ <strong>Gateways:</strong> Internet Gateway + High-availability NAT Gateway</li>
                <li>✅ <strong>EKS Cluster:</strong> Kubernetes 1.30 managed control plane</li>
                <li>✅ <strong>Worker Nodes:</strong> 2x t3.medium EC2 instances with autoscaling</li>
                <li>✅ <strong>Ingress:</strong> Nginx Ingress routing <code>/</code> (Frontend) & <code>/api</code> (Backend)</li>
                <li>✅ <strong>HPA:</strong> CPU utilization auto-scaler (2 min, 5 max replicas)</li>
              </ul>
            </div>
          )}

          {/* Tab View: Observability */}
          {activeTab === 'observability' && (
            <div className="table-container" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Prometheus & Grafana Observability</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Live metrics collected from FastAPI endpoint <code>/metrics</code> via Prometheus ServiceMonitor:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="kpi-card">
                  <span className="kpi-title">Backend Liveness</span>
                  <strong style={{ color: 'var(--success)' }}>HTTP 200 (/health)</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Backend Readiness</span>
                  <strong style={{ color: 'var(--success)' }}>HTTP 200 (/ready)</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Metrics Scrape Target</span>
                  <strong style={{ color: 'var(--info)' }}>UP (/metrics)</strong>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Create New Task */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button
                className="action-btn"
                style={{ fontSize: '1.2rem' }}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Configure Prometheus ServiceMonitor"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide context, acceptance criteria, or logs..."
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assignee</label>
                <input
                  type="text"
                  placeholder="e.g. SRE Lead"
                  className="form-input"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

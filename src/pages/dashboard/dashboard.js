import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { auth } from '../../config/firebase-config';
import { useProjects } from '../../hooks/useProjects';
import { useHealth } from '../../hooks/useHealth';
import { useTheme } from '../../hooks/useTheme';
import './dashboard.css';

/* ---------- Helpers ---------- */

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const moodEmoji = (n) => {
  const map = ['😞', '😕', '😐', '🙂', '😄'];
  return map[Math.min(4, Math.max(0, Number(n) - 1))];
};

const burnoutEmoji = (n) => {
  const map = ['🧘', '😌', '😬', '😰', '🔥'];
  return map[Math.min(4, Math.max(0, Number(n) - 1))];
};

const QUICK_HOURS = [1, 2, 4, 8];

/* ---------- Component ---------- */

const Dashboard = () => {
  const { addProject, fetchProjects, deleteProject } = useProjects();
  const { addHealthLog, fetchHealthLogs, deleteHealthLog } = useHealth();
  const { theme, toggleTheme } = useTheme();

  const { user } = useSelector((state) => state.auth);
  const { items: projects, status: projectStatus } = useSelector(
    (state) => state.projects
  );
  const { logs: healthLogs, status: healthStatus } = useSelector(
    (state) => state.health
  );

  /* -------- Form state -------- */
  const [projName, setProjName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projSubmitting, setProjSubmitting] = useState(false);

  const [selectedProjId, setSelectedProjId] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [mood, setMood] = useState('3');
  const [burnout, setBurnout] = useState('1');
  const [notes, setNotes] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  /* -------- List controls -------- */
  const [projectSearch, setProjectSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logProjectFilter, setLogProjectFilter] = useState('all');
  const [logSort, setLogSort] = useState('recent');

  /* -------- UI state -------- */
  const [toasts, setToasts] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const confirmTimer = useRef(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  /* -------- Initial fetch -------- */
  useEffect(() => {
    fetchProjects();
    fetchHealthLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Toast helper -------- */
  const pushToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  /* -------- Handlers -------- */
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !clientName.trim()) return;

    setProjSubmitting(true);
    const ok = await addProject({ name: projName, client: clientName });
    setProjSubmitting(false);

    if (ok) {
      setProjName('');
      setClientName('');
      pushToast('Project registered', 'success');
    } else {
      pushToast('Failed to register project', 'error');
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!selectedProjId || !hoursWorked) {
      pushToast('Pick a project and enter hours', 'error');
      return;
    }

    setLogSubmitting(true);
    const ok = await addHealthLog({
      projectId: selectedProjId,
      hoursWorked,
      mood,
      burnout,
      notes,
    });
    setLogSubmitting(false);

    if (ok) {
      setHoursWorked('');
      setNotes('');
      setMood('3');
      setBurnout('1');
      pushToast('Session logged', 'success');
    } else {
      pushToast('Failed to log session', 'error');
    }
  };

  const handleQuickHours = (h) => {
    const current = parseFloat(hoursWorked) || 0;
    setHoursWorked(String(current + h));
  };

  const requestDelete = (id) => {
    if (confirmId === id) {
      clearTimeout(confirmTimer.current);
      setConfirmId(null);
      return true;
    }
    setConfirmId(id);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
    return false;
  };

  const handleDeleteProject = async (id) => {
    if (!requestDelete(`p-${id}`)) return;
    const ok = await deleteProject(id);
    pushToast(ok ? 'Project deleted' : 'Failed to delete project', ok ? 'success' : 'error');
  };

  const handleDeleteLog = async (log) => {
    if (!requestDelete(`l-${log.id}`)) return;
    const ok = await deleteHealthLog(log.id, log.projectId, log.hoursWorked);
    pushToast(ok ? 'Log deleted' : 'Failed to delete log', ok ? 'success' : 'error');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user?.email || '');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } catch {
      /* ignore */
    }
  };

  /* -------- Derived data -------- */
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach((p) => (map[p.id] = p));
    return map;
  }, [projects]);

  const stats = useMemo(() => {
    const totalHours = healthLogs.reduce(
      (sum, l) => sum + (Number(l.hoursWorked) || 0),
      0
    );
    const recent = healthLogs.slice(0, 7);
    const avgMood = recent.length
      ? (
          recent.reduce((s, l) => s + Number(l.mood || 0), 0) / recent.length
        ).toFixed(1)
      : '—';
    const avgBurnout = recent.length
      ? (
          recent.reduce((s, l) => s + Number(l.burnout || 0), 0) / recent.length
        ).toFixed(1)
      : '—';

    return {
      totalHours: totalHours.toFixed(1),
      activeProjects: projects.length,
      avgMood,
      avgBurnout,
    };
  }, [healthLogs, projects]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.client || '').toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    let list = healthLogs.filter((l) => {
      if (logProjectFilter !== 'all' && l.projectId !== logProjectFilter) {
        return false;
      }
      if (!q) return true;
      const project = projectMap[l.projectId];
      return (
        (l.notes || '').toLowerCase().includes(q) ||
        (project?.name || '').toLowerCase().includes(q)
      );
    });

    if (logSort === 'hours') {
      list = [...list].sort(
        (a, b) => Number(b.hoursWorked) - Number(a.hoursWorked)
      );
    } else if (logSort === 'mood') {
      list = [...list].sort((a, b) => Number(b.mood) - Number(a.mood));
    } else if (logSort === 'burnout') {
      list = [...list].sort((a, b) => Number(b.burnout) - Number(a.burnout));
    }

    return list;
  }, [healthLogs, logSearch, logProjectFilter, logSort, projectMap]);

  /* -------- Render -------- */
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <div className="brand-mark">DP</div>
          <div>
            <h1>DevPulse</h1>
            <p className="dashboard-header__sub">
              Signed in as{' '}
              <button
                type="button"
                className="email-btn"
                onClick={handleCopyEmail}
                title="Click to copy"
              >
                {user?.email} {copiedEmail ? '✓' : '📋'}
              </button>
            </p>
          </div>
        </div>

        <div className="dashboard-header__right">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="logout-btn" onClick={() => auth.signOut()}>
            Log out
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon">⏱️</div>
          <div>
            <div className="stat-card__value">{stats.totalHours}</div>
            <div className="stat-card__label">Total hours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">📁</div>
          <div>
            <div className="stat-card__value">{stats.activeProjects}</div>
            <div className="stat-card__label">Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🙂</div>
          <div>
            <div className="stat-card__value">{stats.avgMood}</div>
            <div className="stat-card__label">Avg mood (7d)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🔥</div>
          <div>
            <div className="stat-card__value">{stats.avgBurnout}</div>
            <div className="stat-card__label">Avg burnout (7d)</div>
          </div>
        </div>
      </section>

      <main className="dashboard-grid">
        {/* Column 1: Forms */}
        <div className="form-column">
          <section className="dashboard-card">
            <h3>Add new project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Inventory API"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>
              <div className="form-group">
                <label>Client organization</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Startup Incubator"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={projSubmitting}
              >
                {projSubmitting ? 'Registering…' : 'Register project'}
              </button>
            </form>
          </section>

          <section className="dashboard-card">
            <h3>Log a session</h3>
            <form onSubmit={handleCreateLog}>
              <div className="form-group">
                <label>Target project</label>
                <select
                  className="form-control"
                  value={selectedProjId}
                  onChange={(e) => setSelectedProjId(e.target.value)}
                  required
                >
                  <option value="">-- Choose project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Hours invested</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="form-control"
                  placeholder="e.g. 4.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  required
                />
                <div className="quick-hours">
                  {QUICK_HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className="quick-hours__btn"
                      onClick={() => handleQuickHours(h)}
                    >
                      +{h}h
                    </button>
                  ))}
                  {hoursWorked && (
                    <button
                      type="button"
                      className="quick-hours__btn quick-hours__btn--clear"
                      onClick={() => setHoursWorked('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="slider-label">
                  <span>Mood</span>
                  <span className="slider-value">
                    {moodEmoji(mood)} {mood}/5
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="slider-label">
                  <span>Burnout</span>
                  <span className="slider-value">
                    {burnoutEmoji(burnout)} {burnout}/5
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={burnout}
                  onChange={(e) => setBurnout(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="slider-label">
                  <span>Session notes</span>
                  <span className="slider-value char-count">
                    {notes.length}/200
                  </span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  maxLength={200}
                  placeholder="What did you work on? Any blockers?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="submit-btn green"
                disabled={logSubmitting}
              >
                {logSubmitting ? 'Recording…' : 'Record telemetry'}
              </button>
            </form>
          </section>
        </div>

        {/* Column 2: Projects */}
        <section className="dashboard-card">
          <div className="card-head">
            <h3>Tracked projects</h3>
            <span className="count-badge">{projects.length}</span>
          </div>

          <input
            type="search"
            className="form-control search-input"
            placeholder="Search projects…"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
          />

          {projectStatus === 'loading' ? (
            <div className="skeleton-list">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📦</div>
              <p>
                {projects.length === 0
                  ? 'No projects yet. Add one to get started.'
                  : 'No projects match your search.'}
              </p>
            </div>
          ) : (
            <div className="item-scroll-container">
              {filteredProjects.map((p) => (
                <div key={p.id} className="data-card-item">
                  <div className="item-row">
                    <h4>{p.name}</h4>
                    <button
                      className={`delete-btn ${
                        confirmId === `p-${p.id}` ? 'delete-btn--confirm' : ''
                      }`}
                      onClick={() => handleDeleteProject(p.id)}
                      title={
                        confirmId === `p-${p.id}`
                          ? 'Click again to confirm'
                          : 'Delete project'
                      }
                    >
                      {confirmId === `p-${p.id}` ? 'Confirm?' : '🗑'}
                    </button>
                  </div>
                  <p className="item-sub">🏢 {p.client}</p>
                  <div className="badge-row">
                    <span className="badge neutral">
                      {Number(p.totalHours || 0).toFixed(1)} hrs
                    </span>
                    <span className="badge success">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Column 3: Health stream */}
        <section className="dashboard-card">
          <div className="card-head">
            <h3>Health stream</h3>
            <span className="count-badge">{healthLogs.length}</span>
          </div>

          <div className="log-filters">
            <input
              type="search"
              className="form-control"
              placeholder="Search notes…"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
            <div className="log-filters__row">
              <select
                className="form-control"
                value={logProjectFilter}
                onChange={(e) => setLogProjectFilter(e.target.value)}
              >
                <option value="all">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                className="form-control"
                value={logSort}
                onChange={(e) => setLogSort(e.target.value)}
              >
                <option value="recent">Most recent</option>
                <option value="hours">Most hours</option>
                <option value="mood">Best mood</option>
                <option value="burnout">Highest burnout</option>
              </select>
            </div>
          </div>

          {healthStatus === 'loading' ? (
            <div className="skeleton-list">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🌱</div>
              <p>
                {healthLogs.length === 0
                  ? 'No logs yet. Record your first session.'
                  : 'No logs match your filters.'}
              </p>
            </div>
          ) : (
            <div className="item-scroll-container">
              {filteredLogs.map((l) => {
                const project = projectMap[l.projectId];
                return (
                  <div key={l.id} className="data-card-item log-item">
                    <div className="item-row">
                      <h4>{project ? project.name : 'Unknown project'}</h4>
                      <button
                        className={`delete-btn ${
                          confirmId === `l-${l.id}` ? 'delete-btn--confirm' : ''
                        }`}
                        onClick={() => handleDeleteLog(l)}
                        title={
                          confirmId === `l-${l.id}`
                            ? 'Click again to confirm'
                            : 'Delete log'
                        }
                      >
                        {confirmId === `l-${l.id}` ? 'Confirm?' : '🗑'}
                      </button>
                    </div>
                    {l.notes && (
                      <p className="log-notes">
                        <em>“{l.notes}”</em>
                      </p>
                    )}
                    <div className="badge-row">
                      <span className="badge neutral">{l.hoursWorked} hrs</span>
                      <span
                        className={`badge ${
                          l.mood >= 4
                            ? 'success'
                            : l.mood <= 2
                            ? 'danger'
                            : 'warning'
                        }`}
                      >
                        {moodEmoji(l.mood)} Mood {l.mood}/5
                      </span>
                      <span
                        className={`badge ${
                          l.burnout >= 4
                            ? 'danger'
                            : l.burnout >= 3
                            ? 'warning'
                            : 'success'
                        }`}
                      >
                        {burnoutEmoji(l.burnout)} Burnout {l.burnout}/5
                      </span>
                    </div>
                    <p className="log-time">{timeAgo(l.createdAt)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '⚠ ' : 'ℹ '}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Clock, Plus, Minus } from 'lucide-react'
import PagificationContainer from '../../components/General/PagificationContainer.jsx'
import '../../styles/AppealSession.css'

const fmtBytes = (b) =>
  b < 1024 ? b + ' B'
  : b < 1_048_576 ? (b / 1024).toFixed(1) + ' KB'
  : (b / 1_048_576).toFixed(1) + ' MB'

const ALLOWED_EXT  = ['csv', 'xls', 'xlsx']
const ALLOWED_MIME = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const LEVELS = ['L1', 'L2', 'L3', 'L4']

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toISOString().split('T')[0]
}

const getSessionWindowKey = (semester, session) => `${semester}::${session}`

const BulkImport = () => {
  const [files,    setFiles]    = useState([])
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState('')
  const inputRef  = useRef(null)
  const dragCount = useRef(0)

  const addFiles = useCallback((incoming) => {
    setError('')
    const valid = [], bad = []
    Array.from(incoming).forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (ALLOWED_MIME.includes(f.type) || ALLOWED_EXT.includes(ext)) {
        if (f.size > 25 * 1024 * 1024) bad.push(f.name + ' (>25 MB)')
        else valid.push({ id: crypto.randomUUID(), file: f, progress: 0, status: 'pending' })
      } else bad.push(f.name + ' (unsupported type)')
    })
    if (bad.length) setError('Skipped: ' + bad.join(' · '))
    setFiles((p) => [...p, ...valid])
  }, [])

  const onDrop      = (e) => { e.preventDefault(); dragCount.current = 0; setDragging(false); addFiles(e.dataTransfer.files) }
  const onDragEnter = (e) => { e.preventDefault(); dragCount.current++; setDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); if (--dragCount.current === 0) setDragging(false) }
  const onDragOver  = (e) => e.preventDefault()
  const removeFile  = (id) => setFiles((p) => p.filter((f) => f.id !== id))

  /* Replace the interval below with a real api.post('/appeal-sessions/import', formData) */
  const simulateUpload = (id) =>
    new Promise((res) => {
      let pct = 0
      const t = setInterval(() => {
        pct = Math.min(100, pct + Math.floor(Math.random() * 20) + 8)
        setFiles((p) => p.map((f) =>
          f.id === id ? { ...f, progress: pct, status: pct < 100 ? 'uploading' : 'done' } : f
        ))
        if (pct >= 100) { clearInterval(t); res() }
      }, 160)
    })

  const handleUpload = async () => {
    await Promise.all(
      files.filter((f) => f.status === 'pending').map((f) => simulateUpload(f.id))
    )
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="bulk-card">
      <div className="bulk-card__header">
        <span className="bulk-card__icon-wrap"><Upload size={15} /></span>
        <h3 className="bulk-card__title">Bulk Import Data</h3>
      </div>
      <p className="bulk-card__subtitle">
        Upload CSV or Excel files containing manual appeal entries from legacy systems.
      </p>

      {/* Drop zone */}
      <div
        className={`drop-zone${dragging ? ' drop-zone--over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload CSV or Excel files"
      >
        <Upload className="drop-zone__icon" size={28} strokeWidth={1.5} />
        <p className="drop-zone__text">Drop Files Here</p>
        <p className="drop-zone__sub">Maximum 25MB · CSV, XLSX</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="bulk-card__error">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* File queue */}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map(({ id, file, progress, status }) => (
            <li key={id} className="file-list__item">
              <FileSpreadsheet size={16} className={`file-list__icon file-list__icon--${status}`} />
              <div className="file-list__info">
                <div className="file-list__row">
                  <span className="file-list__name">{file.name}</span>
                  <span className="file-list__size">{fmtBytes(file.size)}</span>
                </div>
                <div className="file-list__track">
                  <div className={`file-list__fill file-list__fill--${status}`} style={{ width: progress + '%' }} />
                </div>
              </div>
              {status === 'done'      && <CheckCircle size={15} className="file-list__status file-list__status--done" />}
              {status === 'uploading' && <Clock       size={15} className="file-list__status file-list__status--uploading" />}
              {status === 'pending'   && (
                <button className="file-list__remove" onClick={() => removeFile(id)} aria-label="Remove file">
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 && (
        <button className="bulk-card__upload-btn" onClick={handleUpload}>
          <Upload size={15} />
          Upload {pendingCount} File{pendingCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}

const ExemptSelector = ({ label, items, exempted, onToggle, displayKey, idKey }) => {
  const [search, setSearch] = useState('')

  const filtered = items.filter((item) =>
    item[displayKey].toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="exempt-selector">
      <label className="field-label">{label}</label>

      {/* Exempted chips */}
      {exempted.length > 0 && (
        <div className="exempt-selector__chips">
          {exempted.map((item) => (
            <span key={item[idKey]} className="exempt-chip">
              {item[displayKey]}
              <button className="exempt-chip__remove" onClick={() => onToggle(item)} aria-label={`Remove ${item[displayKey]}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + list */}
      <input
        type="text"
        className="field-input exempt-selector__search"
        placeholder={`Search ${label.toLowerCase()}…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="exempt-selector__list">
        {filtered.length === 0 && (
          <p className="exempt-selector__empty">No results</p>
        )}
        {filtered.map((item) => {
          const isExempted = exempted.some((e) => e[idKey] === item[idKey])
          return (
            <button
              key={item[idKey]}
              className={`exempt-selector__row${isExempted ? ' exempt-selector__row--active' : ''}`}
              onClick={() => onToggle(item)}
            >
              <span className="exempt-selector__row-label">{item[displayKey]}</span>
              {isExempted
                ? <CheckCircle size={14} className="exempt-selector__check" />
                : <Plus size={14} className="exempt-selector__plus" />
              }
            </button>
          )
        })}
      </div>
    </div>
  )
}


const AppealSessions = () => {
  /* ── remote data ── */
  const [courses,   setCourses]   = useState([])
  const [faculties, setFaculties] = useState([])
  const [stats,     setStats]     = useState(null)
  const [sessionHistory, setSessionHistory] = useState([])
  const [sessionWindows, setSessionWindows] = useState({})
  const [loading,   setLoading]   = useState(true)
  const [fetchErr,  setFetchErr]  = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [sessionResponse, historyResponse] = await Promise.all([
          fetch('/appeal-session-data.json'),
          fetch('/appealsMockData.json'),
        ])

        if (!sessionResponse.ok) {
          throw new Error(`Failed to load session data: ${sessionResponse.status}`)
        }

        if (!historyResponse.ok) {
          throw new Error(`Failed to load historical session data: ${historyResponse.status}`)
        }

        const data = await sessionResponse.json()
        const historyData = await historyResponse.json()
        setCourses(data.courses)
        setFaculties(data.faculties)
        setStats(data.stats)
        setSessionHistory(Array.isArray(historyData.appealRecords) ? historyData.appealRecords : [])
        setSessionWindows(historyData.sessionWindows && typeof historyData.sessionWindows === 'object' ? historyData.sessionWindows : {})
      } catch (err) {
        setFetchErr('Failed to load session data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const defaultEnd = nextMonth.toISOString().split('T')[0]

  const [startDate,      setStartDate]      = useState(today)
  const [endDate,        setEndDate]        = useState(defaultEnd)
  const [maxAppeals,     setMaxAppeals]     = useState(3)
  const [openToStudents, setOpenToStudents] = useState(true)
  const [activeLevels,   setActiveLevels]   = useState(['L1', 'L2'])
  const [exemptCourses,  setExemptCourses]  = useState([])
  const [exemptFaculties,setExemptFaculties]= useState([])
  const [activeTab,      setActiveTab]      = useState('courses') // 'courses' | 'faculties'

  const toggleLevel = (l) =>
    setActiveLevels((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l])

  const toggleExemptCourse   = (c) =>
    setExemptCourses((p)   => p.some((x) => x.id === c.id) ? p.filter((x) => x.id !== c.id) : [...p, c])

  const toggleExemptFaculty  = (f) =>
    setExemptFaculties((p) => p.some((x) => x.id === f.id) ? p.filter((x) => x.id !== f.id) : [...p, f])

  const hasActiveSession = Boolean(stats?.hasActiveSession)
  const sessionTypeLabel = stats?.sessionType ? `${stats.sessionType} Session` : 'Active Session'
  const totalAppeals = Number(stats?.total) || 0
  const acceptedAppeals = Number(stats?.accepted) || 0
  const pendingAppeals = Number(stats?.pending) || 0
  const lastMidtermTotal = Number(stats?.lastMidtermTotal) || 0
  const lastFinalTotal = Number(stats?.lastFinalTotal) || 0

  const normalizedSessionHistory = [...sessionHistory]
    .map((record) => {
      const windowKey = getSessionWindowKey(record.semester, record.session)
      const sessionWindow = sessionWindows[windowKey] || {}
      return {
        id: `${record.semester}-${record.session}-${record.date}`,
        semester: record.semester,
        session: record.session,
        active: record.status === 'Open' || Number(record.activeCount) > 0,
        status: record.status,
        totalAppeals: Number(record.count) || 0,
        acceptedAppeals: Number(record.acceptedCount) || 0,
        rejectedAppeals: Math.max(
          0,
          (Number(record.count) || 0)
            - (Number(record.acceptedCount) || 0)
            - (Number(record.pendingCount) || 0)
            - (Number(record.inProgressCount) || 0)
            - (Number(record.activeCount) || 0)
        ),
        changedMarks: Number(record.failToPassCount) || 0,
        averageGradeChange: Number(record.gradeChangeAverage) || 0,
        pendingAppeals: Number(record.pendingCount) || 0,
        inProgressAppeals: Number(record.inProgressCount) || 0,
        activeAppeals: Number(record.activeCount) || 0,
        startDate: sessionWindow.startedAt || record.start_date || record.startDate || record.date,
        endDate: sessionWindow.endedAt || record.end_date || record.endDate || record.date,
        resolutionMinutes: Number(record.avgResolutionMinutes) || 0,
      }
    })
    .sort((left, right) => {
      const leftDate = new Date(left.startDate || left.endDate || left.id).getTime()
      const rightDate = new Date(right.startDate || right.endDate || right.id).getTime()

      return rightDate - leftDate
    })

  if (loading) return <div className="ap-page ap-page--loading"><p>Loading…</p></div>
  if (fetchErr) return <div className="ap-page ap-page--error"><p>{fetchErr}</p></div>

  return (
    <div className="ap-page">

      {/* ── Header ── */}
      <header className="ap-header">
        <p className="ap-header__eyebrow">Quality Assurance Dashboard</p>
        <h1 className="ap-header__title">Grade Appeals<br />Management</h1>
      </header>

      {/* ── Body grid ── */}
      <div className="ap-body">

        {/* ── Left: Submission Window ── */}
        <div className="session-form-card">

          {/* Top row: title + toggle */}
          <div className="session-form-card__top">
            <div className="session-form-card__title-row">
              <span className="session-form-card__icon-wrap"><Upload size={16} /></span>
              <h2 className="session-form-card__title">Submission Window</h2>
            </div>

            <label className="toggle-wrap" aria-label="Toggle open to students">
              <input
                type="checkbox"
                className="toggle-input"
                checked={openToStudents}
                onChange={() => setOpenToStudents((p) => !p)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">Open to<br />Students</span>
            </label>
          </div>

          {/* Dates */}
          <div className="date-row">
            <div className="field-group">
              <label className="field-label">Start Date</label>
              <input type="date" className="field-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">End Date</label>
              <input type="date" className="field-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Counter + Levels */}
          <div className="controls-row">
            <div className="field-group">
              <label className="field-label">Max Appeals Per Student</label>
              <div className="counter">
                <button className="counter__btn" onClick={() => setMaxAppeals((p) => Math.max(1, p - 1))} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span className="counter__value">{maxAppeals}</span>
                <button className="counter__btn" onClick={() => setMaxAppeals((p) => p + 1)} aria-label="Increase">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Eligible Levels</label>
              <div className="level-pills">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    className={`level-pill${activeLevels.includes(l) ? ' level-pill--active' : ''}`}
                    onClick={() => toggleLevel(l)}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Exempt section with tabs */}
          <div className="exempt-section">
            <p className="field-label">Exemptions</p>

            <div className="exempt-tabs">
              <button
                className={`exempt-tab${activeTab === 'courses' ? ' exempt-tab--active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                Courses
                {exemptCourses.length > 0 && (
                  <span className="exempt-tab__badge">{exemptCourses.length}</span>
                )}
              </button>
              <button
                className={`exempt-tab${activeTab === 'faculties' ? ' exempt-tab--active' : ''}`}
                onClick={() => setActiveTab('faculties')}
              >
                Faculties
                {exemptFaculties.length > 0 && (
                  <span className="exempt-tab__badge">{exemptFaculties.length}</span>
                )}
              </button>
            </div>

            {activeTab === 'courses' && (
              <ExemptSelector
                label="Exempt Courses"
                items={courses}
                exempted={exemptCourses}
                onToggle={toggleExemptCourse}
                displayKey="name"
                idKey="id"
              />
            )}
            {activeTab === 'faculties' && (
              <ExemptSelector
                label="Exempt Faculties"
                items={faculties}
                exempted={exemptFaculties}
                onToggle={toggleExemptFaculty}
                displayKey="name"
                idKey="id"
              />
            )}
          </div>

        </div>

        <div className="ap-right">

          <BulkImport />

          {stats && (
            <div className="stat-card">
              {hasActiveSession ? (
                <>
                  <p className="stat-card__label">Active {sessionTypeLabel}</p>
                  <div className="stat-card__headline">
                    <span className="stat-card__big">{totalAppeals.toLocaleString()}</span>
                    <span className="stat-card__delta stat-card__delta--up">Active</span>
                  </div>
                  <div className="stat-card__metrics">
                    <div className="stat-card__metric">
                      <span className="stat-card__metric-label">Total Appeals</span>
                      <strong className="stat-card__metric-value">{totalAppeals.toLocaleString()}</strong>
                    </div>
                    <div className="stat-card__metric">
                      <span className="stat-card__metric-label">Accepted</span>
                      <strong className="stat-card__metric-value">{acceptedAppeals.toLocaleString()}</strong>
                    </div>
                    <div className="stat-card__metric">
                      <span className="stat-card__metric-label">Pending</span>
                      <strong className="stat-card__metric-value">{pendingAppeals.toLocaleString()}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="stat-card__label">No Active Session</p>
                  <div className="stat-card__history">
                    <div className="stat-card__history-item">
                      <span className="stat-card__history-label">Last Midterm Session</span>
                      <strong className="stat-card__history-value">{lastMidtermTotal.toLocaleString()}</strong>
                    </div>
                    <div className="stat-card__history-item">
                      <span className="stat-card__history-label">Last Finals Session</span>
                      <strong className="stat-card__history-value">{lastFinalTotal.toLocaleString()}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      <section className="session-history-section">
        <div className="session-history-section__header">
          <div>
            <p className="session-history-section__eyebrow">Historical Records</p>
            <h2 className="session-history-section__title">Previous Appeal Sessions</h2>
          </div>
          <p className="session-history-section__subtitle">
            Paginated archive of active and closed appeal sessions, including outcomes and timing.
          </p>
        </div>

        <PagificationContainer
          data={normalizedSessionHistory}
          itemName="sessions"
          initialRowsPerPage={5}
          rowsPerPageOptions={[5, 10, 20]}
        >
          {(paginatedSessions) => (
            <div className="session-history-tableWrap">
              <table className="session-history-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th>Total Appeals</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Changed Marks</th>
                    <th>Avg Mark Change</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Resolution Min</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.semester}</td>
                      <td>{session.session}</td>
                      <td>
                        <span className={`session-history-badge${session.active ? ' session-history-badge--active' : ' session-history-badge--inactive'}`}>
                          {session.active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="session-history-statusText">{session.status}</div>
                      </td>
                      <td>{session.totalAppeals.toLocaleString()}</td>
                      <td>{session.acceptedAppeals.toLocaleString()}</td>
                      <td>{session.rejectedAppeals.toLocaleString()}</td>
                      <td>{session.changedMarks.toLocaleString()}</td>
                      <td>{session.averageGradeChange ? session.averageGradeChange.toFixed(1) : '—'}</td>
                      <td>{formatDate(session.startDate)}</td>
                      <td>{formatDate(session.endDate)}</td>
                      <td>{session.resolutionMinutes ? session.resolutionMinutes.toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PagificationContainer>
      </section>
    </div>
  )
}

export default AppealSessions

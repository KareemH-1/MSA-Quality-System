import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Clock,
  Plus, Minus, MoreVertical, Eye, Copy, Download, BarChart2,
  RefreshCw, Archive, Users, TrendingUp,
  BookOpen, Award, Zap, Calendar, Shield, AlertTriangle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import PagificationContainer from '../../components/General/PagificationContainer.jsx'
import Export from '../../components/data-components/Export.jsx'
import '../../styles/AppealSession.css'
import api from '../../api/axios'
import { useAuth } from '../../services/AuthContext.jsx'

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
const SESSION_TYPES = ['Midterm', 'Final']
const SESSION_STATUSES = ['Draft', 'Scheduled', 'Open', 'Closed', 'Archived']

const STATUS_FLOW = {
  Draft: ['Scheduled'],
  Scheduled: ['Open', 'Draft'],
  Open: ['Closed'],
  Closed: ['Archived', 'Open'],
  Archived: [],
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().split('T')[0]
}

const getSessionWindowKey = (semester, session) => `${semester}::${session}`

const computeAutoStatus = (startDate, endDate) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (now < start) return 'Scheduled'
  if (now >= start && now <= end) return 'Open'
  return 'Closed'
}

const MOCK_STUDENTS_PER_LEVEL = { L1: 1240, L2: 1180, L3: 980, L4: 820 }
const MOCK_INSTRUCTORS = 47
const MOCK_MODULE_LEADERS = 12

/* ─── Bulk Import with Preview Pipeline ─────────────────── */
const ImportPipeline = ({ onClose }) => {
  const [stage, setStage] = useState('idle')
  const [files, setFiles]   = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError]   = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [previewCols, setPreviewCols] = useState([])
  const [rowErrors, setRowErrors] = useState({})
  const [editCell, setEditCell] = useState(null)
  const [editVal, setEditVal]   = useState('')
  const inputRef = useRef(null)
  const dragCount = useRef(0)

  const addFiles = useCallback((incoming) => {
    setError('')
    const valid = [], bad = []
    Array.from(incoming).forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (ALLOWED_MIME.includes(f.type) || ALLOWED_EXT.includes(ext)) {
        if (f.size > 25 * 1024 * 1024) bad.push(f.name + ' (>25 MB)')
        else valid.push({ id: crypto.randomUUID(), file: f, status: 'pending' })
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

  const validateRow = (row, cols) => {
    const errs = []
    const studentId = row['Student ID'] || row['student_id'] || row[cols[0]]
    const grade     = row['Grade'] || row['grade'] || row['Original Grade']
    if (!studentId) errs.push('Missing Student ID')
    if (!grade)     errs.push('Missing grade')
    if (grade && isNaN(parseFloat(grade))) errs.push('Invalid grade format')
    return errs
  }

  const parseFile = async (fileEntry) => {
    return new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          res(json)
        } catch (err) { rej(err) }
      }
      reader.onerror = rej
      reader.readAsArrayBuffer(fileEntry.file)
    })
  }

  const handlePreview = async () => {
    if (!files.length) return
    setStage('validating')
    try {
      const allRows = []
      for (const f of files) {
        const rows = await parseFile(f)
        allRows.push(...rows)
      }
      const cols = allRows.length > 0 ? Object.keys(allRows[0]) : []
      const errors = {}
      allRows.forEach((row, i) => {
        const e = validateRow(row, cols)
        if (e.length) errors[i] = e
      })
      setPreviewCols(cols)
      setPreviewRows(allRows)
      setRowErrors(errors)
      setStage('preview')
    } catch (err) {
      setError('Failed to parse file: ' + err.message)
      setStage('idle')
    }
  }

  const startEdit  = (row, col, val) => { setEditCell({ row, col }); setEditVal(val) }
  const commitEdit = () => {
    if (!editCell) return
    const { row, col } = editCell
    setPreviewRows((prev) => {
      const updated = [...prev]
      updated[row] = { ...updated[row], [col]: editVal }
      const errs = validateRow(updated[row], previewCols)
      setRowErrors((e) => {
        const next = { ...e }
        if (errs.length) next[row] = errs
        else delete next[row]
        return next
      })
      return updated
    })
    setEditCell(null)
  }

  const handleCommit = async () => {
    setStage('done')
    try {
      const payload = {
        records: previewRows.map(row => ({
          student_id: row['Student ID'] || row['student_id'] || row['StudentID'],
          course_id: row['Course ID'] || row['course_id'] || row['CourseID'],
          session_id: row['Session ID'] || row['session_id'] || row['SessionID'],
          original_grade: row['Grade'] || row['grade'] || row['Original Grade'],
          reason: row['Reason'] || row['reason'] || row['Appeal Reason'],
        }))
      }
      await api.post('/View/QAView.php?action=import', payload)
    } catch (err) {
      setError('Import failed: ' + (err.response?.data?.message || err.message))
      setStage('preview')
      console.error(err)
    }
  }

  const resetPipeline = () => {
    setStage('idle')
    setFiles([])
    setPreviewRows([])
    setPreviewCols([])
    setRowErrors({})
    setError('')
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const errorCount   = Object.keys(rowErrors).length


  const downloadTemplate = () => {
    const template = [
      {
        'Student ID': 'STU001',
        'Course ID': 'CSC101',
        'Session ID': 'MID2026',
        'Grade': '65',
        'Reason': 'Marking error in calculation',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Appeals')
    XLSX.writeFile(wb, 'appeal_import_template.xlsx')
  }

  if (stage === 'idle') return (
    <div className="import-pipeline-idle">
      <div className="import-instructions">
        <div className="instructions-header">
          <BookOpen size={18} />
          <h4>Import Format Specification</h4>
        </div>
        <div className="instructions-content">
          <p className="instructions-intro">Your file must contain the following columns (exact names required):</p>
          <div className="instructions-table">
            <div className="instr-row instr-row--header">
              <div className="instr-col">Column Name</div>
              <div className="instr-col">Data Type</div>
              <div className="instr-col">Description</div>
              <div className="instr-col">Example</div>
            </div>
            {[
              {
                col: 'Student ID',
                type: 'Text',
                desc: 'Unique student identifier (must exist in system)',
                ex: 'STU001',
              },
              {
                col: 'Course ID',
                type: 'Text',
                desc: 'Unique course identifier (must exist in system)',
                ex: 'CSC101',
              },
              {
                col: 'Session ID',
                type: 'Text',
                desc: 'Session identifier (Midterm/Final, Year)',
                ex: 'MID2026',
              },
              {
                col: 'Grade',
                type: 'Number',
                desc: 'Original grade before appeal (0-100)',
                ex: '65',
              },
              {
                col: 'Reason',
                type: 'Text',
                desc: 'Reason for appeal (optional but recommended)',
                ex: 'Marking error',
              },
            ].map((row) => (
              <div key={row.col} className="instr-row">
                <div className="instr-col instr-col--name">{row.col}</div>
                <div className="instr-col instr-col--type">{row.type}</div>
                <div className="instr-col instr-col--desc">{row.desc}</div>
                <div className="instr-col instr-col--ex">{row.ex}</div>
              </div>
            ))}
          </div>
          <div className="instructions-notes">
            <h5>Important Notes:</h5>
            <ul>
              <li><strong>File Format:</strong> .csv, .xls, or .xlsx</li>
              <li><strong>Max File Size:</strong> 25 MB</li>
              <li><strong>Column Names:</strong> Must match exactly (case-insensitive)</li>
              <li><strong>Row Limit:</strong> Up to 1000 rows per import</li>
              <li><strong>Student ID:</strong> Must correspond to existing student in database</li>
              <li><strong>Course ID:</strong> Must correspond to existing course in database</li>
              <li><strong>Grade Format:</strong> Numeric value between 0-100</li>
              <li><strong>Empty Cells:</strong> Will be flagged as errors for required fields</li>
              <li><strong>Duplicates:</strong> System will reject duplicate entries in same import</li>
            </ul>
          </div>
        </div>
        <div className="import-actions">
          <button className="import-btn import-btn--secondary" onClick={downloadTemplate}>
            <FileSpreadsheet size={14} /> Download Template
          </button>
          <label className="import-btn import-btn--primary">
            <Upload size={14} /> Select Files to Import
            <input
              type="file"
              ref={inputRef}
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
              accept=".csv,.xls,.xlsx"
            />
          </label>
        </div>
        {error && <p className="import-error">{error}</p>}
      </div>

      {files.length > 0 && (
        <div className="import-files-list">
          <p className="import-files-title">Queued Files ({files.length})</p>
          {files.map((f) => (
            <div key={f.id} className="import-file-item">
              <FileSpreadsheet size={14} className="import-file-icon" />
              <div className="import-file-details">
                <p className="import-file-name">{f.file.name}</p>
                <p className="import-file-size">{fmtBytes(f.file.size)}</p>
              </div>
              <button className="import-file-remove" onClick={() => removeFile(f.id)} aria-label="Remove file">
                <X size={14} />
              </button>
            </div>
          ))}
          <button className="import-btn import-btn--primary" onClick={handlePreview}>
            <CheckCircle size={14} /> Preview & Validate
          </button>
        </div>
      )}
    </div>
  )

  if (stage === 'done') return (
    <div className="import-pipeline-done">
      <div className="import-pipeline-done__icon">
        <CheckCircle size={40} />
      </div>
      <h3 className="import-pipeline-done__title">Import Complete</h3>
      <p className="import-pipeline-done__sub">{previewRows.length} records imported successfully.</p>
      <div className="import-pipeline-done__actions">
        <button className="import-btn import-btn--ghost" onClick={resetPipeline}>
          <Upload size={14} /> New Import
        </button>
        <button className="import-btn import-btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )

  if (stage === 'preview') return (
    <div className="import-pipeline-preview">
      <div className="import-meta">
        <span className="import-badge import-badge--total">{previewRows.length} rows</span>
        {errorCount > 0 && <span className="import-badge import-badge--error">{errorCount} errors</span>}
        {errorCount === 0 && <span className="import-badge import-badge--ok">All valid</span>}
        <span className="import-meta__hint">Click a cell to edit inline</span>
      </div>
      <div className="import-table-wrap">
        <table className="import-table">
          <thead>
            <tr>
              <th>#</th>
              {previewCols.map((c) => <th key={c}>{c}</th>)}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.slice(0, 50).map((row, ri) => (
              <tr key={ri} className={rowErrors[ri] ? 'import-table__row--error' : ''}>
                <td className="import-table__num">{ri + 1}</td>
                {previewCols.map((col) => (
                  <td key={col} onClick={() => startEdit(ri, col, row[col])}>
                    {editCell?.row === ri && editCell?.col === col ? (
                      <input
                        className="import-table__edit"
                        value={editVal}
                        autoFocus
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                      />
                    ) : (
                      <span>{row[col] || <span className="import-table__empty">—</span>}</span>
                    )}
                  </td>
                ))}
                <td>
                  {rowErrors[ri]
                    ? <span className="import-row-badge import-row-badge--error" title={rowErrors[ri].join(', ')}><AlertCircle size={12} /> {rowErrors[ri][0]}</span>
                    : <span className="import-row-badge import-row-badge--ok"><CheckCircle size={12} /> Valid</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {previewRows.length > 50 && (
          <p className="import-table__more">+ {previewRows.length - 50} more rows not shown</p>
        )}
      </div>
      <div className="import-actions">
        <button className="import-btn import-btn--ghost" onClick={() => setStage('idle')}>
          <X size={14} /> Back
        </button>
        <button className="import-btn import-btn--primary" onClick={handleCommit} disabled={errorCount > 0}>
          <CheckCircle size={14} /> Commit {previewRows.length} Records
        </button>
      </div>
    </div>
  )

  return (
    <div className="import-pipeline-idle">
      <p className="import-pipeline-idle__sub">
        Upload CSV or Excel files. You'll preview and validate before committing.
      </p>
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
        <Upload className="drop-zone__icon" size={32} strokeWidth={1.5} />
        <p className="drop-zone__text">Drop Files Here</p>
        <p className="drop-zone__sub">Maximum 25 MB · CSV, XLSX</p>
        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {error && <p className="import-pipeline-idle__error"><AlertCircle size={13} /> {error}</p>}

      {files.length > 0 && (
        <ul className="file-list">
          {files.map(({ id, file, status }) => (
            <li key={id} className="file-list__item">
              <FileSpreadsheet size={16} className={`file-list__icon file-list__icon--${status}`} />
              <div className="file-list__info">
                <div className="file-list__row">
                  <span className="file-list__name">{file.name}</span>
                  <span className="file-list__size">{fmtBytes(file.size)}</span>
                </div>
                <div className="file-list__track">
                  <div className={`file-list__fill file-list__fill--${status}`} style={{ width: status === 'done' ? '100%' : '0%' }} />
                </div>
              </div>
              <button className="file-list__remove" onClick={() => removeFile(id)} aria-label="Remove file"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 && (
        <button className="import-pipeline-idle__preview-btn" onClick={handlePreview}>
          <Eye size={15} /> Preview {pendingCount} File{pendingCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}

/* ─── Import Modal ───────────────────────────────────────── */
const ImportModal = ({ onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal__header">
          <div className="import-modal__header-left">
            <div className="import-modal__icon-wrap">
              <Upload size={16} />
            </div>
            <div>
              <h3 className="import-modal__title">Bulk Import Data</h3>
              <p className="import-modal__subtitle">Grade records · CSV or Excel</p>
            </div>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close import modal">
            <X size={18} />
          </button>
        </div>
        <div className="import-modal__body">
          <ImportPipeline onClose={onClose} />
        </div>
      </div>
    </div>
  )
}

/* ─── Exempt Selector ────────────────────────────────────── */
const ExemptSelector = ({ label, items, exempted, onToggle, displayKey, idKey }) => {
  const [search, setSearch] = useState('')
  const filtered = items.filter((item) => item[displayKey].toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="exempt-selector">
      <label className="field-label">{label}</label>
      {exempted.length > 0 && (
        <div className="exempt-selector__chips">
          {exempted.map((item) => (
            <span key={item[idKey]} className="exempt-chip">
              {item[displayKey]}
              <button className="exempt-chip__remove" onClick={() => onToggle(item)} aria-label={`Remove ${item[displayKey]}`}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <input type="text" className="field-input exempt-selector__search" placeholder={`Search ${label.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="exempt-selector__list">
        {filtered.length === 0 && <p className="exempt-selector__empty">No results</p>}
        {filtered.map((item) => {
          const isExempted = exempted.some((e) => e[idKey] === item[idKey])
          return (
            <button key={item[idKey]} className={`exempt-selector__row${isExempted ? ' exempt-selector__row--active' : ''}`} onClick={() => onToggle(item)}>
              <span className="exempt-selector__row-label">{item[displayKey]}</span>
              {isExempted ? <CheckCircle size={14} className="exempt-selector__check" /> : <Plus size={14} className="exempt-selector__plus" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Session Card ───────────────────────────────────────── */
const SessionActionsMenu = ({ session, onAction }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const actions = [
    { id: 'view',     icon: <Eye size={13} />,         label: 'View Details' },
    { id: 'clone',    icon: <Copy size={13} />,        label: 'Clone Session' },
    { id: 'export',   icon: <Download size={13} />,    label: 'Export Appeals' },
    { id: 'accepted', icon: <CheckCircle size={13} />, label: 'Export Accepted' },
    { id: 'analytics',icon: <BarChart2 size={13} />,   label: 'View Analytics' },
    { id: 'reopen',   icon: <RefreshCw size={13} />,   label: 'Reopen Session' },
    { id: 'archive',  icon: <Archive size={13} />,     label: 'Archive Session' },
  ]

  return (
    <div className="session-actions" ref={ref}>
      <button className="session-actions__trigger" onClick={() => setOpen((p) => !p)} aria-label="Session actions">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="session-actions__menu">
          {actions.map((a) => (
            <button key={a.id} className="session-actions__item" onClick={() => { onAction(a.id, session); setOpen(false) }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const statusColor = (status) => ({
  Open:      'session-card__status--open',
  Closed:    'session-card__status--closed',
  Archived:  'session-card__status--archived',
  Scheduled: 'session-card__status--scheduled',
  Draft:     'session-card__status--draft',
}[status] || 'session-card__status--closed')

const SessionCard = ({ session, onAction }) => {
  const acceptRate = session.totalAppeals > 0
    ? Math.round((session.acceptedAppeals / session.totalAppeals) * 100)
    : 0

  return (
    <div className="session-card">
      <div className="session-card__header">
        <div className="session-card__meta">
          <span className={`session-card__status ${statusColor(session.status)}`}>{session.status || (session.active ? 'Open' : 'Closed')}</span>
          <span className="session-card__type-badge">{session.session}</span>
        </div>
        <SessionActionsMenu session={session} onAction={onAction} />
      </div>
      <div className="session-card__body">
        <p className="session-card__semester">{session.semester}</p>
        <div className="session-card__dates">
          <span><Calendar size={11} /> {formatDate(session.startDate)}</span>
          <span className="session-card__dates-sep">→</span>
          <span>{formatDate(session.endDate)}</span>
        </div>
      </div>
      <div className="session-card__stats">
        <div className="session-card__stat">
          <span className="session-card__stat-val">{session.totalAppeals.toLocaleString()}</span>
          <span className="session-card__stat-label">Total</span>
        </div>
        <div className="session-card__stat">
          <span className="session-card__stat-val session-card__stat-val--green">{session.acceptedAppeals.toLocaleString()}</span>
          <span className="session-card__stat-label">Accepted</span>
        </div>
        <div className="session-card__stat">
          <span className="session-card__stat-val session-card__stat-val--red">{session.rejectedAppeals.toLocaleString()}</span>
          <span className="session-card__stat-label">Rejected</span>
        </div>
        <div className="session-card__stat">
          <span className="session-card__stat-val session-card__stat-val--accent">{session.changedMarks.toLocaleString()}</span>
          <span className="session-card__stat-label">F→P</span>
        </div>
      </div>
      <div className="session-card__footer">
        <div className="session-card__bar-wrap">
          <div className="session-card__bar">
            <div className="session-card__bar-fill" style={{ width: acceptRate + '%' }} />
          </div>
          <span className="session-card__bar-label">{acceptRate}% accepted</span>
        </div>
        {session.resolutionMinutes > 0 && (
          <span className="session-card__resolution"><Clock size={11} /> {session.resolutionMinutes.toFixed(0)}min avg</span>
        )}
      </div>
    </div>
  )
}

/* ─── Analytics Cards ────────────────────────────────────── */
const AnalyticsCards = ({ sessions }) => {
  const totalAppeals   = sessions.reduce((s, x) => s + x.totalAppeals, 0)
  const totalAccepted  = sessions.reduce((s, x) => s + x.acceptedAppeals, 0)
  const totalRejected  = sessions.reduce((s, x) => s + x.rejectedAppeals, 0)
  const totalFtoP      = sessions.reduce((s, x) => s + x.changedMarks, 0)
  const avgResolution  = sessions.filter((x) => x.resolutionMinutes > 0).reduce((s, x, _, a) => s + x.resolutionMinutes / a.length, 0)
  const avgGradeChange = sessions.filter((x) => x.averageGradeChange > 0).reduce((s, x, _, a) => s + x.averageGradeChange / a.length, 0)
  const acceptRate     = totalAppeals > 0 ? Math.round((totalAccepted / totalAppeals) * 100) : 0

  const cards = [
    { icon: <BookOpen size={16} />,    label: 'Total Appeals',    value: totalAppeals.toLocaleString(),                              color: 'blue' },
    { icon: <CheckCircle size={16} />, label: 'Accepted',         value: totalAccepted.toLocaleString(),                             color: 'green' },
    { icon: <X size={16} />,           label: 'Rejected',         value: totalRejected.toLocaleString(),                             color: 'red' },
    { icon: <TrendingUp size={16} />,  label: 'Fail → Pass',      value: totalFtoP.toLocaleString(),                                 color: 'accent' },
    { icon: <Clock size={16} />,       label: 'Avg Resolution',   value: avgResolution > 0 ? avgResolution.toFixed(0) + ' min' : '—', color: 'purple' },
    { icon: <Award size={16} />,       label: 'Avg Grade Change', value: avgGradeChange > 0 ? '+' + avgGradeChange.toFixed(1) : '—', color: 'gold' },
    { icon: <Zap size={16} />,         label: 'Accept Rate',      value: acceptRate + '%',                                           color: 'teal' },
    { icon: <Users size={16} />,       label: 'Sessions Tracked', value: sessions.length,                                            color: 'slate' },
  ]

  return (
    <section className="analytics-section">
      <div className="analytics-section__header">
        <p className="analytics-section__eyebrow">Aggregate Insights</p>
        <h2 className="analytics-section__title">Analytics Overview</h2>
      </div>
      <div className="analytics-grid">
        {cards.map((c) => (
          <div key={c.label} className={`analytics-card analytics-card--${c.color}`}>
            <div className="analytics-card__icon">{c.icon}</div>
            <div className="analytics-card__val">{c.value}</div>
            <div className="analytics-card__label">{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Capacity Warning ───────────────────────────────────── */
const CapacityWarnings = ({ eligibleStudents, maxAppeals, activeLevels }) => {
  const totalCapacity    = eligibleStudents * maxAppeals
  const avgPerInstructor = MOCK_INSTRUCTORS > 0 ? Math.round(totalCapacity / MOCK_INSTRUCTORS) : 0
  const warnings = []
  if (avgPerInstructor > 50) warnings.push(`High instructor load: ~${avgPerInstructor} appeals per instructor.`)
  if (activeLevels.length === 0) warnings.push('No levels selected — no students are eligible.')
  if (maxAppeals > 5) warnings.push('Max appeals per student is very high (>5).')
  if (!warnings.length) return null
  return (
    <div className="capacity-warnings">
      {warnings.map((w, i) => (
        <div key={i} className="capacity-warning"><AlertTriangle size={13} /><span>{w}</span></div>
      ))}
    </div>
  )
}

/* ─── Estimated Capacity Panel ───────────────────────────── */
const CapacityPanel = ({ activeLevels, exemptCourses, exemptFaculties, maxAppeals }) => {
  const [capacity, setCapacity] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCapacity = async () => {
      setLoading(true)
      try {
        const resp = await api.post('/View/QAView.php?action=capacity', {
          activeLevels: activeLevels.map(l => { const map = {L1:1, L2:2, L3:3, L4:4}; return map[l] || 0 }).filter(x => x > 0),
          exemptFaculties: exemptFaculties.map(f => f.id),
          exemptCourses: exemptCourses.map(c => c.id),
          maxAppeals,
        })
        setCapacity(resp.data?.capacity || {})
      } catch (err) {
        console.error('Failed to fetch capacity:', err)
        setCapacity({})
      } finally {
        setLoading(false)
      }
    }

    fetchCapacity()
  }, [activeLevels, exemptCourses, exemptFaculties, maxAppeals])

  if (loading || !capacity) {
    return <div className="capacity-panel"><p>Loading…</p></div>
  }

  const netEligible        = capacity.netEligible || 0
  const excludedStudents   = capacity.excludedStudents || 0
  const cappacityValue     = capacity.capacity || 0
  const avgPerInstructor   = capacity.avgPerInstructor || 0
  const totalModuleLeaders = capacity.totalModuleLeaders || 0
  const totalInstructors   = capacity.totalInstructors || 0

  return (
    <div className="capacity-panel">
      <p className="capacity-panel__title"><Users size={13} /> Estimated Capacity</p>
      <div className="capacity-panel__rows">
        <div className="capacity-panel__row"><span>Eligible Students</span><strong>{netEligible.toLocaleString()}</strong></div>
        <div className="capacity-panel__row"><span>Excluded Students</span><strong className="capacity-panel__val--muted">{excludedStudents.toLocaleString()}</strong></div>
        <div className="capacity-panel__row"><span>Appeals Capacity</span><strong className="capacity-panel__val--accent">{cappacityValue.toLocaleString()}</strong></div>
        <div className="capacity-panel__row"><span>Avg / Instructor</span><strong className={avgPerInstructor > 50 ? 'capacity-panel__val--warn' : ''}>{avgPerInstructor}</strong></div>
        <div className="capacity-panel__row"><span>Module Leaders</span><strong>{totalModuleLeaders}</strong></div>
        <div className="capacity-panel__row"><span>Instructors</span><strong>{totalInstructors}</strong></div>
      </div>
      <CapacityWarnings eligibleStudents={netEligible} maxAppeals={maxAppeals} activeLevels={activeLevels} />
    </div>
  )
}

/* ─── Publish Preview Modal ──────────────────────────────── */
const PublishPreview = ({ config, onCancel, onPublish }) => {
  const [capacity, setCapacity] = useState(null)

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const resp = await api.post('/View/QAView.php?action=capacity', {
          activeLevels: config.activeLevels.map(l => { const map = {L1:1, L2:2, L3:3, L4:4}; return map[l] || 0 }).filter(x => x > 0),
          exemptFaculties: config.exemptFaculties.map(f => f.id),
          exemptCourses: config.exemptCourses.map(c => c.id),
          maxAppeals: config.maxAppeals,
        })
        setCapacity(resp.data?.capacity || {})
      } catch (err) {
        console.error('Failed to fetch capacity:', err)
      }
    }
    fetchCapacity()
  }, [config])

  const eligibleStudents = capacity?.netEligible || 0
  const cappacityValue   = capacity?.capacity || 0
  const durationDays     = config.startDate && config.endDate
    ? Math.max(0, Math.round((new Date(config.endDate) - new Date(config.startDate)) / 86400000))
    : 0

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <Shield size={18} />
          <h3>Confirm Session</h3>
          <button className="modal__close" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal__body">
          <div className="modal__rows">
            {[
              ['Session Type',           config.sessionType],
              ['Status',                 config.status],
              ['Eligible Levels',        config.activeLevels.join(', ') || 'None'],
              ['Excluded Courses',       config.exemptCourses.length],
              ['Excluded Faculties',     config.exemptFaculties.length],
              ['Max Appeals',            config.maxAppeals],
              ['Duration',              durationDays + ' days'],
              ['Est. Eligible Students', eligibleStudents.toLocaleString()],
              ['Est. Appeals Capacity',  cappacityValue.toLocaleString()],
              ['Open to Students',       config.openToStudents ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} className="modal__row">
                <span className="modal__row-key">{k}</span>
                <span className="modal__row-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal__footer">
          <button className="modal__btn modal__btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="modal__btn modal__btn--primary" onClick={onPublish}>Publish Session</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Validation ─────────────────────────────────────────── */
const validateSession = ({ startDate, endDate, maxAppeals, activeLevels, sessionType }) => {
  const errors = []
  if (!sessionType)        errors.push('Session type is required.')
  if (!startDate)          errors.push('Start date is required.')
  if (!endDate)            errors.push('End date is required.')
  if (startDate && endDate && new Date(startDate) >= new Date(endDate))
                           errors.push('End date must be after start date.')
  if (maxAppeals < 1)      errors.push('Max appeals must be at least 1.')
  if (!activeLevels.length)errors.push('At least one level must be selected.')
  return errors
}

/* ─── Status Stepper ─────────────────────────────────────── */
const StatusStepper = ({ current, onChange }) => (
  <div className="status-stepper">
    {SESSION_STATUSES.map((s, i) => {
      const isCurrent = s === current
      const isPast    = SESSION_STATUSES.indexOf(current) > i
      return (
        <React.Fragment key={s}>
          {i > 0 && <div className={`status-stepper__line${isPast || isCurrent ? ' status-stepper__line--done' : ''}`} />}
          <button
            className={`status-stepper__step${isCurrent ? ' status-stepper__step--active' : ''}${isPast ? ' status-stepper__step--past' : ''}`}
            onClick={() => onChange(s)}
            title={`Set to ${s}`}
          >
            <span className="status-stepper__dot" />
            <span className="status-stepper__label">{s}</span>
          </button>
        </React.Fragment>
      )
    })}
  </div>
)

/* ─── Main Component ─────────────────────────────────────── */
const AppealSessions = () => {
  const [courses,        setCourses]        = useState([])
  const [faculties,      setFaculties]      = useState([])
  const [stats,          setStats]          = useState(null)
  const [sessionHistory, setSessionHistory] = useState([])
  const [sessionWindows, setSessionWindows] = useState({})
  const [loading,        setLoading]        = useState(true)
  const [fetchErr,       setFetchErr]       = useState('')

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false)

  // Appeals search
  const [appealSearchFilters, setAppealSearchFilters] = useState({ courseId: null, facultyId: null, status: 'all', search: '' })
  const [searchedAppeals, setSearchedAppeals] = useState([])
  const [appealsLoading, setAppealsLoading] = useState(false)

  const { user, authReady } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get('/View/QAView.php', { params: { action: 'dashboard' } })
        const body = resp.data || {}
        const data = body.courses || []
        setCourses(data)
        setFaculties(body.faculties || [])
        setStats(body.stats || {})
        setSessionHistory(Array.isArray(body.appealRecords) ? body.appealRecords : [])
        setSessionWindows(body.sessionWindows && typeof body.sessionWindows === 'object' ? body.sessionWindows : {})
      } catch (err) {
        setFetchErr('Failed to load session data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

   if (authReady) {
      load()
    }
  }, [authReady])

  const today     = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1)
  const defaultEnd = nextMonth.toISOString().split('T')[0]

  const [startDate,        setStartDate]        = useState(today)
  const [endDate,          setEndDate]          = useState(defaultEnd)
  const [maxAppeals,       setMaxAppeals]       = useState(3)
  const [openToStudents,   setOpenToStudents]   = useState(true)
  const [activeLevels,     setActiveLevels]     = useState(['L1', 'L2'])
  const [exemptCourses,    setExemptCourses]    = useState([])
  const [exemptFaculties,  setExemptFaculties]  = useState([])
  const [activeTab,        setActiveTab]        = useState('courses')
  const [sessionType,      setSessionType]      = useState('')
  const [sessionStatus,    setSessionStatus]    = useState('Draft')
  const [validationErrors, setValidationErrors] = useState([])
  const [showPreview,      setShowPreview]      = useState(false)
  const [published,        setPublished]        = useState(false)

  useEffect(() => {
    if (sessionStatus === 'Draft') return
    const auto = computeAutoStatus(startDate, endDate)
    if (sessionStatus !== 'Archived') setSessionStatus(auto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const toggleLevel         = (l) => setActiveLevels((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l])
  const toggleExemptCourse  = (c) => setExemptCourses((p)   => p.some((x) => x.id === c.id) ? p.filter((x) => x.id !== c.id) : [...p, c])
  const toggleExemptFaculty = (f) => setExemptFaculties((p) => p.some((x) => x.id === f.id) ? p.filter((x) => x.id !== f.id) : [...p, f])

  const handlePublishClick = () => {
    const errs = validateSession({ startDate, endDate, maxAppeals, activeLevels, sessionType })
    setValidationErrors(errs)
    if (errs.length === 0) setShowPreview(true)
  }

  const handlePublish = () => {
    setShowPreview(false)
    setPublished(true)
    setSessionStatus('Open')
    // TODO: API call
  }

  const handleSessionAction = (action, session) => {
    console.log('Action:', action, 'Session:', session.id)
    // TODO: wire to real handlers
  }

  const fetchAppeals = async (filters) => {
    setAppealsLoading(true)
    try {
      const resp = await api.get('/View/QAView.php', {
        params: {
          action: 'appeals',
          course_id: filters.courseId || undefined,
          faculty_id: filters.facultyId || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
          limit: 100,
          offset: 0,
        }
      })
      setSearchedAppeals(resp.data?.appeals || [])
    } catch (err) {
      console.error('Failed to fetch appeals:', err)
      setSearchedAppeals([])
    } finally {
      setAppealsLoading(false)
    }
  }

  const normalizedSessionHistory = useMemo(() => [...sessionHistory]
    .map((record) => {
      const windowKey     = getSessionWindowKey(record.semester, record.session)
      const sessionWindow = sessionWindows[windowKey] || {}
      return {
        id:                 `${record.semester}-${record.session}-${record.date}`,
        semester:           record.semester,
        session:            record.session,
        active:             record.status === 'Open' || Number(record.activeCount) > 0,
        status:             record.status,
        totalAppeals:       Number(record.count) || 0,
        acceptedAppeals:    Number(record.acceptedCount) || 0,
        rejectedAppeals:    Math.max(0, (Number(record.count) || 0) - (Number(record.acceptedCount) || 0) - (Number(record.pendingCount) || 0) - (Number(record.inProgressCount) || 0) - (Number(record.activeCount) || 0)),
        changedMarks:       Number(record.failToPassCount) || 0,
        averageGradeChange: Number(record.gradeChangeAverage) || 0,
        pendingAppeals:     Number(record.pendingCount) || 0,
        inProgressAppeals:  Number(record.inProgressCount) || 0,
        activeAppeals:      Number(record.activeCount) || 0,
        startDate:          sessionWindow.startedAt || record.start_date || record.startDate || record.date,
        endDate:            sessionWindow.endedAt   || record.end_date   || record.endDate   || record.date,
        resolutionMinutes:  Number(record.avgResolutionMinutes) || 0,
      }
    })
    .sort((a, b) => new Date(b.startDate || b.id).getTime() - new Date(a.startDate || a.id).getTime()),
  [sessionHistory, sessionWindows])

  const hasActiveSession = Boolean(stats?.hasActiveSession)
  const sessionTypeLabel = stats?.sessionType ? `${stats.sessionType} Session` : 'Active Session'
  const totalAppeals     = Number(stats?.total)    || 0
  const acceptedAppeals  = Number(stats?.accepted) || 0
  const pendingAppeals   = Number(stats?.pending)  || 0
  const lastMidtermTotal = Number(stats?.lastMidtermTotal) || 0
  const lastFinalTotal   = Number(stats?.lastFinalTotal)   || 0

  if (loading) return <div className="ap-page ap-page--loading"><p>Loading…</p></div>
  if (fetchErr) return <div className="ap-page ap-page--error"><p>{fetchErr}</p></div>

  if (authReady && (!user || (user && user.role !== 'QA'))) {
    return (
      <div className="ap-page ap-page--error">
        <p>Access denied — this page is available to Quality Assurance users only.</p>
      </div>
    )
  }

  const publishConfig = { sessionType, status: sessionStatus, startDate, endDate, maxAppeals, activeLevels, exemptCourses, exemptFaculties, openToStudents }

  return (
    <div className="ap-page">
      {showPreview && (
        <PublishPreview config={publishConfig} onCancel={() => setShowPreview(false)} onPublish={handlePublish} />
      )}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Header */}
      <header className="ap-header">
        <p className="ap-header__eyebrow">Quality Assurance Dashboard</p>
        <div className="ap-header__row">
          <h1 className="ap-header__title">Grade Appeals<br />Management</h1>
          <button className="ap-header__import-btn" onClick={() => setShowImportModal(true)}>
            <Upload size={16} />
            Import Data
          </button>
        </div>
      </header>

      {/* Body grid */}
      <div className="ap-body">
        {/* Left: Submission Window */}
        <div className="session-form-card">
          <div className="session-form-card__top">
            <div className="session-form-card__title-row">
              <span className="session-form-card__icon-wrap"><Upload size={16} /></span>
              <h2 className="session-form-card__title">Submission Window</h2>
            </div>
            <label className="toggle-wrap" aria-label="Toggle open to students">
              <input type="checkbox" className="toggle-input" checked={openToStudents} onChange={() => setOpenToStudents((p) => !p)} />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label">Open to<br />Students</span>
            </label>
          </div>

          <div className="field-group" style={{ marginBottom: 20 }}>
            <label className="field-label">Session Status</label>
            <StatusStepper current={sessionStatus} onChange={setSessionStatus} />
          </div>

          <div className="field-group" style={{ marginBottom: 20 }}>
            <label className="field-label">Session Type</label>
            <div className="session-type-pills">
              {SESSION_TYPES.map((t) => (
                <button key={t} className={`session-type-pill${sessionType === t ? ' session-type-pill--active' : ''}`} onClick={() => setSessionType(t)}>{t}</button>
              ))}
            </div>
          </div>

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

          <div className="controls-row">
            <div className="field-group">
              <label className="field-label">Max Appeals Per Student</label>
              <div className="counter">
                <button className="counter__btn" onClick={() => setMaxAppeals((p) => Math.max(1, p - 1))} aria-label="Decrease"><Minus size={14} /></button>
                <span className="counter__value">{maxAppeals}</span>
                <button className="counter__btn" onClick={() => setMaxAppeals((p) => p + 1)} aria-label="Increase"><Plus size={14} /></button>
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Eligible Levels</label>
              <div className="level-pills">
                {LEVELS.map((l) => (
                  <button key={l} className={`level-pill${activeLevels.includes(l) ? ' level-pill--active' : ''}`} onClick={() => toggleLevel(l)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <CapacityPanel activeLevels={activeLevels} exemptCourses={exemptCourses} exemptFaculties={exemptFaculties} maxAppeals={maxAppeals} />

          <div className="exempt-section">
            <p className="field-label">Exemptions</p>
            <div className="exempt-tabs">
              <button className={`exempt-tab${activeTab === 'courses' ? ' exempt-tab--active' : ''}`} onClick={() => setActiveTab('courses')}>
                Courses {exemptCourses.length > 0 && <span className="exempt-tab__badge">{exemptCourses.length}</span>}
              </button>
              <button className={`exempt-tab${activeTab === 'faculties' ? ' exempt-tab--active' : ''}`} onClick={() => setActiveTab('faculties')}>
                Faculties {exemptFaculties.length > 0 && <span className="exempt-tab__badge">{exemptFaculties.length}</span>}
              </button>
            </div>
            {activeTab === 'courses'   && <ExemptSelector label="Exempt Courses"   items={courses}   exempted={exemptCourses}   onToggle={toggleExemptCourse}  displayKey="name" idKey="id" />}
            {activeTab === 'faculties' && <ExemptSelector label="Exempt Faculties" items={faculties} exempted={exemptFaculties} onToggle={toggleExemptFaculty} displayKey="name" idKey="id" />}
          </div>

          {validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map((e, i) => (
                <p key={i} className="validation-error"><AlertCircle size={12} /> {e}</p>
              ))}
            </div>
          )}

          {published
            ? <div className="publish-success"><CheckCircle size={15} /> Session published successfully.</div>
            : (
              <button className="publish-btn" onClick={handlePublishClick}>
                <Shield size={15} /> Preview &amp; Publish Session
              </button>
            )
          }
        </div>

        {/* Right Column — stat card only */}
        <div className="ap-right">
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
                    <div className="stat-card__metric"><span className="stat-card__metric-label">Total Appeals</span><strong className="stat-card__metric-value">{totalAppeals.toLocaleString()}</strong></div>
                    <div className="stat-card__metric"><span className="stat-card__metric-label">Accepted</span><strong className="stat-card__metric-value">{acceptedAppeals.toLocaleString()}</strong></div>
                    <div className="stat-card__metric"><span className="stat-card__metric-label">Pending</span><strong className="stat-card__metric-value">{pendingAppeals.toLocaleString()}</strong></div>
                  </div>
                </>
              ) : (
                <>
                  <p className="stat-card__label">No Active Session</p>
                  <div className="stat-card__history">
                    <div className="stat-card__history-item"><span className="stat-card__history-label">Last Midterm</span><strong className="stat-card__history-value">{lastMidtermTotal.toLocaleString()}</strong></div>
                    <div className="stat-card__history-item"><span className="stat-card__history-label">Last Finals</span><strong className="stat-card__history-value">{lastFinalTotal.toLocaleString()}</strong></div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analytics */}
      {normalizedSessionHistory.length > 0 && (
        <AnalyticsCards sessions={normalizedSessionHistory} />
      )}

      {/* Session History */}
      <section className="session-history-section">
        <div className="session-history-section__header">
          <div>
            <p className="session-history-section__eyebrow">Historical Records</p>
            <h2 className="session-history-section__title">Previous Appeal Sessions</h2>
          </div>
          <div className="session-history-section__actions">
            <p className="session-history-section__subtitle">
              Archive of active and closed appeal sessions, including outcomes and timing.
            </p>
            {normalizedSessionHistory.length > 0 && (
              <Export data={normalizedSessionHistory} title="appeal_sessions" />
            )}
          </div>
        </div>

        <PagificationContainer
          data={normalizedSessionHistory}
          itemName="sessions"
          initialRowsPerPage={6}
          rowsPerPageOptions={[6, 12, 24]}
        >
          {(paginatedSessions) => (
            <div className="session-cards-grid">
              {paginatedSessions.map((session) => (
                <SessionCard key={session.id} session={session} onAction={handleSessionAction} />
              ))}
            </div>
          )}
        </PagificationContainer>
      </section>

      {/* Appeals Search */}
      <section className="appeals-search-section">
        <div className="appeals-search-header">
          <p className="appeals-search-eyebrow">Search & Filter</p>
          <h2 className="appeals-search-title">All Appeals</h2>
        </div>

        <div className="appeals-search-filters">
          <div className="filter-group">
            <label className="filter-label">Course</label>
            <select 
              className="filter-select"
              value={appealSearchFilters.courseId || ''}
              onChange={(e) => {
                const filters = { ...appealSearchFilters, courseId: e.target.value ? parseInt(e.target.value) : null }
                setAppealSearchFilters(filters)
                fetchAppeals(filters)
              }}
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Faculty</label>
            <select 
              className="filter-select"
              value={appealSearchFilters.facultyId || ''}
              onChange={(e) => {
                const filters = { ...appealSearchFilters, facultyId: e.target.value ? parseInt(e.target.value) : null }
                setAppealSearchFilters(filters)
                fetchAppeals(filters)
              }}
            >
              <option value="">All Faculties</option>
              {faculties.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select 
              className="filter-select"
              value={appealSearchFilters.status}
              onChange={(e) => {
                const filters = { ...appealSearchFilters, status: e.target.value }
                setAppealSearchFilters(filters)
                fetchAppeals(filters)
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group filter-group--full">
            <label className="filter-label">Search</label>
            <input 
              type="text"
              className="filter-input"
              placeholder="Search by student name or ID…"
              value={appealSearchFilters.search}
              onChange={(e) => {
                const filters = { ...appealSearchFilters, search: e.target.value }
                setAppealSearchFilters(filters)
                if (e.target.value.length >= 2 || e.target.value.length === 0) {
                  fetchAppeals(filters)
                }
              }}
            />
          </div>
        </div>

        {appealsLoading ? (
          <p className="appeals-loading">Loading appeals…</p>
        ) : searchedAppeals.length > 0 ? (
          <div className="appeals-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedAppeals.map((appeal) => (
                  <tr key={appeal.id}>
                    <td>{appeal.student_name}</td>
                    <td>{appeal.course_code}</td>
                    <td><span className={`status-badge status-badge--${appeal.status || 'pending'}`}>{appeal.status || 'Pending'}</span></td>
                    <td>{appeal.submitted_at ? new Date(appeal.submitted_at).toLocaleDateString() : '—'}</td>
                    <td><button className="appeals-action-btn">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="appeals-empty">No appeals found matching your filters.</p>
        )}
      </section>
    </div>
  )
}

export default AppealSessions
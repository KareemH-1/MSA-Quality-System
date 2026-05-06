import React from 'react';
import '../../Admin/styles/userFormModal.css';

const empty = { code: '', name: '', level: 1, semesters: [], faculty_id: '', module_leader_id: '' };
const SEMESTER_OPTIONS = ['Fall', 'Spring', 'Summer'];

const CourseFormModal = ({ open, mode='add', initial=null, faculties=[], moduleLeaders=[], onClose, onSubmit }) => {
  const [form, setForm] = React.useState(empty);
  const [errors, setErrors] = React.useState({});
  const [semesterChoice, setSemesterChoice] = React.useState('Fall');

  React.useEffect(()=>{
    if (!open) return;
    if (mode === 'edit' && initial) {
      setForm({
        code: initial.code || '',
        name: initial.name || '',
        level: initial.level || 1,
        semesters: initial.semesters || [],
        faculty_id: initial.faculty_id || '',
        module_leader_id: initial.module_leader_id || '',
      });
    } else {
      setForm(empty);
    }
    setSemesterChoice('Fall');
    setErrors({});
  }, [open, mode, initial]);

  if (!open) return null;

  const handleChange = (k, v) => setForm(prev=>({...prev, [k]: v}));

  const addSemesterChoice = () => {
    setForm((prev) => {
      const current = Array.isArray(prev.semesters) ? prev.semesters : [];
      if (current.includes(semesterChoice)) {
        return prev;
      }

      return { ...prev, semesters: [...current, semesterChoice] };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'Course code is required';
    if (!form.name.trim()) e.name = 'Course name is required';
    if (!form.faculty_id) e.faculty_id = 'Faculty is required';
    if (!Array.isArray(form.semesters) || form.semesters.length === 0) e.semesters = 'Select at least one semester';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      action: 'create',
      code: form.code.trim(),
      name: form.name.trim(),
      level: Number(form.level) || 1,
      semesters: Array.isArray(form.semesters) ? form.semesters : String(form.semesters).split(',').map(s=>s.trim()).filter(Boolean),
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
      module_leader_id: form.module_leader_id ? Number(form.module_leader_id) : null,
    };
    if (mode === 'edit') payload.action = 'update';
    onSubmit?.(payload, mode);
  };

  return (
    <div className="userModalOverlay" onMouseDown={onClose}>
      <div className="userModal" onMouseDown={(e)=>e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="userModalHeader">
          <h2>{mode==='edit' ? 'Edit Course' : 'Add Course'}</h2>
          <button className="closeBtn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="userModalBody" onSubmit={submit}>
          <div className="formGrid">
            <div className="formField">
              <label>Code <span className="req">*</span></label>
              <input value={form.code} onChange={e=>handleChange('code', e.target.value)} />
              {errors.code && <div className="err">{errors.code}</div>}
            </div>

            <div className="formField">
              <label>Name <span className="req">*</span></label>
              <input value={form.name} onChange={e=>handleChange('name', e.target.value)} />
              {errors.name && <div className="err">{errors.name}</div>}
            </div>

            <div className="formField">
              <label>Level</label>
              <input type="number" min={1} value={form.level} onChange={e=>handleChange('level', e.target.value)} />
            </div>

            <div className="formField">
              <label>Semesters <span className="req">*</span></label>
              <div className="courseSemesterPicker">
                <select value={semesterChoice} onChange={(e) => setSemesterChoice(e.target.value)}>
                  {SEMESTER_OPTIONS.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
                <button type="button" className="semesterAddBtn" onClick={addSemesterChoice}>
                  Add semester
                </button>
              </div>
              <div className="semesterSelectedList">
                {(Array.isArray(form.semesters) ? form.semesters : []).map((semester) => (
                  <button
                    type="button"
                    key={semester}
                    className="semesterChip active"
                    onClick={() => setForm((prev) => ({ ...prev, semesters: prev.semesters.filter((item) => item !== semester) }))}
                  >
                    {semester} ×
                  </button>
                ))}
              </div>
              {errors.semesters && <div className="err">{errors.semesters}</div>}
            </div>

            <div className="formField">
              <label>Faculty <span className="req">*</span></label>
              <select value={form.faculty_id} onChange={e=>handleChange('faculty_id', e.target.value)}>
                <option value="">Select faculty</option>
                {faculties.map(f=> <option key={f.id || f.faculty_id} value={f.id ?? f.faculty_id}>{f.name}</option>)}
              </select>
              {errors.faculty_id && <div className="err">{errors.faculty_id}</div>}
            </div>

            <div className="formField">
              <label>Module Leader (optional)</label>
              <select value={form.module_leader_id || ''} onChange={e=>handleChange('module_leader_id', e.target.value)}>
                <option value="">-- none --</option>
                {moduleLeaders.map(u=> <option key={u.user_id || u.id} value={u.user_id ?? u.id}>{u.name || u.username} ({u.email})</option>)}
              </select>
            </div>
          </div>

          <div className="userModalFooter">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{mode==='edit' ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;

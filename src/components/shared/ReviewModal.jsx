import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";

const GRADE_OPTIONS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
const REVIEW_STATUSES = ["Resolved", "Rejected"];

export default function ReviewModal({
  appeal,
  onClose,
  onSuccess,
  title = "Review Appeal",
  apiEndpoint,
  initialStatus = "Resolved",
}) {
  const [status, setStatus] = useState(initialStatus);
  const [newGrade, setNewGrade] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid =
    status &&
    (status !== "Resolved" || newGrade) &&
    (status !== "Rejected" || note.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    try {
      await api.post(apiEndpoint, {
        appeal_id: appeal.appeal_id,
        status,
        new_grade: status === "Resolved" ? newGrade : null,
        note: note.trim() || null,
      });

      toast.success("Appeal reviewed successfully.");
      onClose();
      setTimeout(() => onSuccess(), 250);
    } catch {
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-row">
            <span className="summary-label">Student</span>
            <span className="summary-value">{appeal.student_name}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Course</span>
            <span className="summary-value">
              {appeal.course_name} • {appeal.course_code}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Original Grade</span>
            <span className="summary-value grade-badge">
              {appeal.original_grade}
            </span>
          </div>
          <div className="summary-row reason-row">
            <span className="summary-label">Reason</span>
            <span className="summary-value reason-text">{appeal.reason}</span>
          </div>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label>Decision</label>
            <div className="status-options">
              {REVIEW_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-option status-option-${s.toLowerCase()} ${status === s ? "selected" : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {status === "Resolved" && (
            <div className="form-group">
              <label>
                New Grade <span className="required">*</span>
              </label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="grade-select"
              >
                <option value="">Select a grade</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              Note
              {status === "Rejected" ? (
                <span className="required"> *</span>
              ) : (
                <span className="optional"> (optional)</span>
              )}
            </label>
            <textarea
              rows={4}
              className="note-textarea"
              placeholder={
                status === "Rejected"
                  ? "Explain why this appeal is being rejected..."
                  : "Add any additional comments..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

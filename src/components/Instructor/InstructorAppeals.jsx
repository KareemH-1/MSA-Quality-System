import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import api from "../../api/axios";
import "./styles/InstructorAppeals.css";

const STATUS_FILTERS = [
  "All",
  "Pending",
  "Under Review",
  "Resolved",
  "Rejected",
];
const ALLOWED_STATUSES = ["Under Review", "Resolved", "Rejected"];
const GRADE_OPTIONS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

function ReviewModal({ appeal, onClose, onSuccess }) {
  const [status, setStatus] = useState("Under Review");
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

    const payload = {
      appeal_id: appeal.appeal_id,
      status,
      new_grade: status === "Resolved" ? newGrade : null,
      note: note.trim() || null,
    };

    console.log("Sending payload:", payload);
    console.log("Status value:", `'${status}'`);
    console.log("Status length:", status.length);

    try {
      const response = await api.post(
        "/View/InstructorView.php?action=review",
        payload,
      );

      console.log("Review response:", response.data);

      toast.success("Appeal reviewed successfully.");
      onClose();

      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (e) {
      console.error("Error submitting review:", e);
      console.error("Error response:", e.response?.data);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Appeal</h3>
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
              {ALLOWED_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-option status-option-${s.toLowerCase().replace(" ", "-")} ${status === s ? "selected" : ""}`}
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
              {status === "Rejected" && <span className="required"> *</span>}
              {status !== "Rejected" && (
                <span className="optional"> (optional)</span>
              )}
            </label>
            <textarea
              rows={4}
              placeholder={
                status === "Rejected"
                  ? "Explain why this appeal is being rejected..."
                  : "Add any additional comments..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="note-textarea"
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

export default function InstructorAppeals() {
  const [loading, setLoading] = useState(true);
  const [allAppeals, setAllAppeals] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAppeal, setSelectedAppeal] = useState(null);

  const getSortedAppeals = (appeals) => {
    return [...appeals].sort((a, b) => {
      const dateA = new Date(a.submitted_at);
      const dateB = new Date(b.submitted_at);
      return dateB - dateA;
    });
  };

  const filteredAppeals = getSortedAppeals(
    activeFilter === "All"
      ? allAppeals
      : allAppeals.filter((a) => a.status === activeFilter),
  );

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        "/View/InstructorView.php?action=assigned-appeals",
      );
      setAllAppeals(res.data?.appeals ?? []);
    } catch (e) {
      console.error("Error loading appeals:", e);
      toast.error("Failed to load appeals. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  const countByStatus = (status) =>
    allAppeals.filter((a) => a.status === status).length;

  return (
    <div className="instructor-appeals-page">
      <div className="head">
        <h2>Assigned Appeals</h2>
        <p>Review and manage appeals assigned to you by the module leader.</p>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            className={`filter-tab ${activeFilter === filter ? "active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
            <span className="badge">
              {filter === "All" ? allAppeals.length : countByStatus(filter)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="state-msg">Loading appeals...</p>
      ) : filteredAppeals.length === 0 ? (
        <p className="state-msg">
          No {activeFilter === "All" ? "" : activeFilter} appeals found.
        </p>
      ) : (
        <div className="appeals-grid">
          {filteredAppeals.map((appeal) => (
            <div className="appeal-card" key={appeal.appeal_id}>
              <div className="card-header">
                <h4>{appeal.student_name}</h4>
                <span
                  className={`status-badge status-${appeal.status.toLowerCase().replace(" ", "-")}`}
                >
                  {appeal.status}
                </span>
              </div>
              <span className="course-info">
                {appeal.course_name} • {appeal.course_code}
              </span>
              <div className="card-detail">
                <span className="detail-label">Original Grade</span>
                <span className="grade-badge">{appeal.original_grade}</span>
              </div>
              <div className="card-detail">
                <span className="detail-label">Reason</span>
                <span className="reason-preview">{appeal.reason}</span>
              </div>
              {(appeal.status === "Pending" ||
                appeal.status === "Under Review") && (
                <button
                  className="review-btn"
                  onClick={() => setSelectedAppeal(appeal)}
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedAppeal && (
        <ReviewModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          onSuccess={loadAppeals}
        />
      )}
    </div>
  );
}

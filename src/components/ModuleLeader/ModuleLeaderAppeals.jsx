import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import api from "../../api/axios";
import ReviewModal from "../shared/ReviewModal";
import "./styles/ModuleLeaderAppeals.css";

const STATUS_FILTERS = ["All", "Under Review", "Resolved", "Rejected"];
const GRADE_OPTIONS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

function AssignModal({ appeal, onClose, onSuccess }) {
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const res = await api.get(
          `/View/ModuleLeaderView.php?action=course-instructors&course_id=${appeal.course_id}`,
        );
        setInstructors(res.data?.data ?? []);
      } catch {
        toast.error("Failed to load instructors.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, [appeal.course_id]);

  const handleAssign = async () => {
    if (!selectedInstructor) return;
    setSubmitting(true);

    try {
      await api.post("/View/ModuleLeaderView.php?action=assign", {
        appeal_id: appeal.appeal_id,
        instructor_id: parseInt(selectedInstructor),
      });
      toast.success("Appeal assigned successfully.");
      onSuccess();
    } catch {
      toast.error("Failed to assign appeal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Appeal</h3>
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
          <div className="summary-row">
            <span className="summary-label">Reason</span>
            <span className="summary-value reason-text">{appeal.reason}</span>
          </div>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label>Select Instructor</label>
            {loading ? (
              <p>Loading instructors...</p>
            ) : instructors.length === 0 ? (
              <p className="state-msg">No instructors found for this course.</p>
            ) : (
              <select
                className="grade-select"
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
              >
                <option value="">-- Select an instructor --</option>
                {instructors.map((inst) => (
                  <option key={inst.user_id} value={inst.user_id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            )}
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
            onClick={handleAssign}
            disabled={!selectedInstructor || submitting}
          >
            {submitting ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppealCard({ appeal, showAssign, showReview, onAssign, onReview }) {
  return (
    <div className="appeal-card">
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
        <span className="detail-label">Submitted</span>
        <span>{new Date(appeal.submitted_at).toLocaleDateString()}</span>
      </div>

      <div className="card-detail">
        <span className="detail-label">Reason</span>
        <span className="reason-preview">{appeal.reason}</span>
      </div>

      {(showAssign || showReview) && (
        <div className="appeal-card__actions">
          {showAssign && (
            <button className="assign-btn" onClick={onAssign}>
              Assign to Instructor
            </button>
          )}
          {showReview && (
            <button className="review-btn" onClick={onReview}>
              Review Myself
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModuleLeaderAppeals() {
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [selectedReviewAppeal, setSelectedReviewAppeal] = useState(null);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/View/ModuleLeaderView.php?action=appeals");
      setAppeals(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load appeals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  const pendingAppeals = useMemo(
    () => appeals.filter((a) => a.status === "Pending"),
    [appeals],
  );

  const nonPendingAppeals = useMemo(
    () => appeals.filter((a) => a.status !== "Pending"),
    [appeals],
  );

  const filteredAppeals = useMemo(() => {
    return activeFilter === "All"
      ? nonPendingAppeals
      : nonPendingAppeals.filter((a) => a.status === activeFilter);
  }, [activeFilter, nonPendingAppeals]);

  const summary = {
    total: appeals.length,
    unassigned: pendingAppeals.length,
    inReview: appeals.filter((a) => a.status === "Under Review").length,
    resolved: appeals.filter((a) => a.status === "Resolved").length,
    rejected: appeals.filter((a) => a.status === "Rejected").length,
  };

  if (loading) return <p className="state-msg">Loading appeals...</p>;

  return (
    <div className="ml-appeals-page">
      <div className="summary-cards">
        <div className="summary-card total">
          <span className="summary-number">{summary.total}</span>
          <span className="summary-label">Total</span>
        </div>
        <div className="summary-card unassigned">
          <span className="summary-number">{summary.unassigned}</span>
          <span className="summary-label">Unassigned</span>
        </div>
        <div className="summary-card in-review">
          <span className="summary-number">{summary.inReview}</span>
          <span className="summary-label">In Review</span>
        </div>
        <div className="summary-card resolved">
          <span className="summary-number">{summary.resolved}</span>
          <span className="summary-label">Resolved</span>
        </div>
        <div className="summary-card rejected">
          <span className="summary-number">{summary.rejected}</span>
          <span className="summary-label">Rejected</span>
        </div>
      </div>

      <div className="ml-section">
        <h3 className="section-title">
          Pending Assignment
          {pendingAppeals.length > 0 && (
            <span className="urgent-badge">
              {pendingAppeals.length} need action
            </span>
          )}
        </h3>

        {pendingAppeals.length === 0 ? (
          <p className="state-msg">
            All appeals have been assigned or reviewed.
          </p>
        ) : (
          <div className="appeals-grid">
            {pendingAppeals.map((appeal) => (
              <AppealCard
                key={appeal.appeal_id}
                appeal={appeal}
                showAssign={true}
                showReview={true}
                onAssign={() => setSelectedAppeal(appeal)}
                onReview={() => setSelectedReviewAppeal(appeal)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="ml-section">
        <h3 className="section-title">All Appeals</h3>

        <div className="filter-tabs">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-tab ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
              <span className="badge">
                {filter === "All"
                  ? nonPendingAppeals.length
                  : nonPendingAppeals.filter((a) => a.status === filter).length}
              </span>
            </button>
          ))}
        </div>

        {filteredAppeals.length === 0 ? (
          <p className="state-msg">
            No {activeFilter === "All" ? "" : activeFilter} appeals found.
          </p>
        ) : (
          <div className="appeals-grid">
            {filteredAppeals.map((appeal) => (
              <AppealCard
                key={appeal.appeal_id}
                appeal={appeal}
                showAssign={false}
                showReview={appeal.status === "Under Review"}
                onReview={() => setSelectedReviewAppeal(appeal)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAppeal && (
        <AssignModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          onSuccess={() => {
            setSelectedAppeal(null);
            loadAppeals();
          }}
        />
      )}

      {selectedReviewAppeal && (
        <ReviewModal
          appeal={selectedReviewAppeal}
          onClose={() => setSelectedReviewAppeal(null)}
          onSuccess={() => {
            setSelectedReviewAppeal(null);
            loadAppeals();
          }}
          title="Review Appeal Myself"
          apiEndpoint="/View/ModuleLeaderView.php?action=review"
        />
      )}
    </div>
  );
}

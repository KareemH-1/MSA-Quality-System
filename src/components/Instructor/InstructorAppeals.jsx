import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import ReviewModal from "../shared/ReviewModal";
import "./styles/InstructorAppeals.css";

const STATUS_FILTERS = ["All", "Under Review", "Resolved", "Rejected"];

export default function InstructorAppeals() {
  const [loading, setLoading] = useState(true);
  const [allAppeals, setAllAppeals] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAppeal, setSelectedAppeal] = useState(null);

  const getSortedAppeals = (appeals) =>
    [...appeals].sort(
      (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at),
    );

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
    } catch {
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
              {appeal.status === "Under Review" && (
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
          title="Review Appeal"
          apiEndpoint="/View/InstructorView.php?action=review"
        />
      )}
    </div>
  );
}

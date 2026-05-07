import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./styles/StudentSurveys.css";

export default function StudentSurveys() {
  const [loading, setLoading] = useState(false);
  const [surveys, setSurveys] = useState([]);

  const formatShortDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  };

  const formatWindow = (start, end) => {
    const s = formatShortDate(start);
    const e = formatShortDate(end);
    if (!s && !e) return "No date window";
    if (s && e) return `${s} - ${e}`;
    return s || e;
  };

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        "/View/StudentSurveyView.php?action=my-surveys",
      );
      setSurveys(res.data?.body?.surveys ?? res.data?.surveys ?? []);
    } catch (error) {
      console.error("Failed to load surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleOpenSurvey = (survey) => {
    console.log("Open survey:", survey);
  };

  return (
    <div className="student-surveys-page">
      <div className="header">
        <div>
          <h1>Student Surveys</h1>
          <p>
            Complete your assigned surveys and provide feedback for your
            enrolled courses.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="empty-state">
          <h3>No surveys available</h3>
          <p>You currently do not have any surveys assigned.</p>
        </div>
      ) : (
        <div className="survey-grid">
          {surveys.map((survey) => {
            const submitted =
              survey.is_submitted ??
              survey.submitted ??
              survey.already_submitted ??
              false;

            return (
              <div
                className="survey-card"
                key={`${survey.survey_id}-${survey.course_id}`}
              >
                <div className="survey-card-header">
                  <div>
                    <h3>{survey.title ?? survey.survey_title ?? "Survey"}</h3>
                    <p className="course-name">
                      {survey.course_code ? `${survey.course_code} - ` : ""}
                      {survey.course_name ?? "Course"}
                    </p>
                  </div>

                  <span
                    className={`status-badge ${submitted ? "submitted" : "pending"}`}
                  >
                    {submitted ? "Submitted" : "Pending"}
                  </span>
                </div>

                <div className="survey-card-body">
                  <p className="description">
                    {survey.description ?? "Please complete this survey."}
                  </p>

                  <div className="survey-meta">
                    <p>
                      <strong>Window:</strong>{" "}
                      {formatWindow(survey.start_date, survey.end_date)}
                    </p>
                    {survey.instructor_name && (
                      <p>
                        <strong>Instructor:</strong> {survey.instructor_name}
                      </p>
                    )}
                    {survey.semester && (
                      <p>
                        <strong>Semester:</strong> {survey.semester}
                      </p>
                    )}
                  </div>
                </div>

                <div className="survey-card-footer">
                  <button
                    type="button"
                    onClick={() => handleOpenSurvey(survey)}
                    disabled={submitted}
                  >
                    {submitted ? "Already Submitted" : "Open Survey"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* <SubmitSurveyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSurvey(null);
        }}
        selectedSurvey={selectedSurvey}
        onSuccess={handleSurveySuccess}
      /> */}
    </div>
  );
}

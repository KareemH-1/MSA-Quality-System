import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import SubmitAppealModal from "../../components/Student/SubmitAppealModal";
import "./styles/StudentOverallDashboard.css";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function DeadlineItem({ endAt, title, subtitle, tag }) {
  const date = new Date(endAt);
  const tagClass =
    tag.toLowerCase() === "survey"
      ? "deadline-tag deadline-tag-survey"
      : "deadline-tag deadline-tag-appeal";

  return (
    <div className="deadline-item">
      <div className="deadline-date">
        <span className="month">{MONTHS[date.getMonth()]}</span>
        <span className="day">{date.getDate()}</span>
      </div>
      <div className="deadline-info">
        <p>{title}</p>
        <span>{subtitle}</span>
      </div>
      <span className={tagClass}>{tag}</span>
    </div>
  );
}

function ActivityItem({ submittedAt, title, subtitle, type }) {
  const date = new Date(submittedAt);
  const timeAgo = formatTimeAgo(date);
  const tagClass =
    type === "survey"
      ? "deadline-tag deadline-tag-survey"
      : "deadline-tag deadline-tag-appeal";

  return (
    <div className="activity-item">
      <div className="activity-top">
        <span className="time">{timeAgo}</span>
        <span className={tagClass}>{type}</span>
      </div>
      <span className="description">{title}</span>
      <span className="activity-status">{subtitle}</span>
    </div>
  );
}

function formatTimeAgo(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} days ago`;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export default function StudentOverallDashboard() {
  const [student, setStudent] = useState(null);
  const [pendingAppeals, setPendingAppeals] = useState(0);
  const [completedSurveys, setCompletedSurveys] = useState(0);
  const [allSurveys, setAllSurveys] = useState([]);
  const [appealSessions, setAppealSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          sessionRes,
          appealsRes,
          surveysRes,
          allSurveysRes,
          appealSessionsRes,
          appealRowsRes,
          responsesRes,
        ] = await Promise.all([
          api.get("/View/SessionView.php"),
          api.get("/View/StudentAppealView.php?action=my-appeal-rows"),
          api.get("/View/StudentSurveyView.php?action=my-surveys"),
          api.get("/View/StudentSurveyView.php?action=all-surveys"),
          api.get("/View/StudentAppealView.php?action=sessions"),
          api.get("/View/StudentAppealView.php?action=my-appeal-rows"),
          api.get("/View/StudentSurveyView.php?action=student-responses"),
        ]);

        setStudent(sessionRes.data?.user);

        const appeals = appealsRes.data?.appeals ?? [];
        setPendingAppeals(
          appeals.filter((a) => a.status?.toLowerCase() === "pending").length,
        );

        const temp = allSurveysRes.data?.surveys ?? [];
        setAllSurveys(
          [...temp].sort((a, b) => new Date(a.end_at) - new Date(b.end_at)),
        );

        setAppealSessions(
          [...(appealSessionsRes.data?.sessions ?? [])].sort(
            (a, b) => new Date(a.end_at) - new Date(b.end_at),
          ),
        );

        const surveys = surveysRes.data?.surveys ?? [];
        setCompletedSurveys(
          surveys.filter((s) => s.status?.toLowerCase() === "completed").length,
        );

        const appealActivity = (appealRowsRes.data?.appeals ?? []).map((a) => ({
          id: `appeal-${a.appeal_id}`,
          submittedAt: a.submitted_at,
          title: a.session_type ?? a.type ?? "Appeal Submitted",
          subtitle: a.course_name,
          type: "appeal",
        }));
        console.log("Appeal Activity:", appealActivity);
        console.log("Appeal Rows:", appealRowsRes.data?.appeals ?? []);

        const surveyActivity = (responsesRes.data?.responses ?? []).map(
          (r) => ({
            id: `survey-${r.response_id}`,
            submittedAt: r.submitted_at,
            title: r.title,
            subtitle: r.course_name,
            type: "survey",
          }),
        );
        console.log("Survey Activity:", surveyActivity);
        console.log("Survey Responses:", responsesRes.data?.responses ?? []);

        const merged = [...appealActivity, ...surveyActivity].sort(
          (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
        );

        setRecentActivity(merged.slice(0, 3));
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchAll();
  }, []);

  const handleAppealSuccess = async () => {
    const res = await api.get(
      "/View/StudentAppealView.php?action=my-appeal-rows",
    );
    const appeals = res.data?.appeals ?? [];
    setPendingAppeals(
      appeals.filter((a) => a.status?.toLowerCase() === "pending").length,
    );
  };

  const topSurveys = allSurveys.slice(0, 2);
  const topAppeals = appealSessions.slice(0, 2);

  return (
    <section className="student-home">
      <div className="head">
        <div>
          <h1>Welcome, {student?.name ?? "Student"}!</h1>
          <p>
            Stay updated with your academic appeals and course surveys in one
            place.
          </p>
        </div>
      </div>

      <div className="number-status">
        <div className="box pending-box">
          <p>Pending Appeals</p>
          <h2>{pendingAppeals}</h2>
        </div>
        <div className="box survey-box">
          <p>Completed Surveys</p>
          <h2>{completedSurveys}</h2>
        </div>
        <div className="box notification-box">
          <p>Notifications</p>
          <h2>0</h2>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <div className="appeal-action">
            <h4>Submit Appeal</h4>
            <p>Is there anything you'd like to appeal?</p>
            <p>Start formal review process now.</p>
            <button type="button" onClick={() => setIsModalOpen(true)}>
              Submit New Appeal
            </button>
          </div>
          <div className="survey-action">
            <h4>Take Course Survey</h4>
            <p>Your feedback helps us improve courses.</p>
            <p>Share your thoughts on recent classes.</p>
            <button
              type="button"
              onClick={() =>
                navigate("/student-services", { state: { tab: "Surveys" } })
              }
            >
              View Available Surveys
            </button>
          </div>
          <div className="notification-action">
            <h4>View Notifications</h4>
            <p>Don't miss important updates.</p>
            <p>Check for new messages and alerts.</p>
            <button type="button">Go to Notifications</button>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="upcoming-deadlines">
          <div className="deadline-header">
            <h4>Upcoming Deadlines</h4>
            <span className="view-all">View Calendar</span>
          </div>

          {topSurveys.map((s) => (
            <DeadlineItem
              key={`survey-${s.survey_id}`}
              endAt={s.end_at}
              title={s.title}
              subtitle="Survey"
              tag="Survey"
            />
          ))}

          {topAppeals.map((a) => (
            <DeadlineItem
              key={`appeal-${a.session_id}`}
              endAt={a.end_date}
              title={a.type}
              subtitle={`Appeal • ${a.status}`}
              tag="Appeal"
            />
          ))}

          {topSurveys.length === 0 && topAppeals.length === 0 && (
            <p style={{ color: "var(--text-color)", fontSize: "0.85rem" }}>
              No upcoming deadlines.
            </p>
          )}
        </div>

        <div className="recent-activity">
          <h4>Recent Activity</h4>

          {recentActivity.map((item) => (
            <ActivityItem
              key={item.id}
              submittedAt={item.submittedAt}
              title={item.title}
              subtitle={item.subtitle}
              type={item.type}
            />
          ))}

          {recentActivity.length === 0 && (
            <p style={{ color: "var(--text-color)", fontSize: "0.85rem" }}>
              No recent activity.
            </p>
          )}
        </div>
      </div>

      <SubmitAppealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSession={null}
        onSuccess={handleAppealSuccess}
      />
    </section>
  );
}

import { useState, useEffect } from "react";
import api from "../../api/axios";
import "./styles/StudentAppeals.css";

export default function StudentAppeals() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [appealCounts, setAppealCounts] = useState([]);
  const [appealRows, setAppealRows] = useState([]);

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
    if (!s && !e) return "";
    if (s && e) return `${s} - ${e}`;
    return s || e;
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [sessionsRes, appealsRes, appealRowsRes] = await Promise.all([
          api.get("/View/StudentAppealView.php?action=sessions"),
          api.get("/View/StudentAppealView.php?action=my-appeals"),
          api.get("/View/StudentAppealView.php?action=my-appeal-rows"),
        ]);

        setSessions(sessionsRes.data?.sessions ?? []);
        setAppealCounts(appealsRes.data?.appeals ?? []);
        setAppealRows(appealRowsRes.data?.appeals ?? []);
      } catch (e) {
        console.error("Failed to load appeals data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  return (
    <div className="appeals-page">
      <div className="header">
        <div>
          <h1>Grade Appeals</h1>
          <p>
            Submit and monitor your grade appeals. Formal requests are processed
            within 5-7 business days.
          </p>
        </div>
        <button type="button">New Appeal</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="active-appeals">
            <h2>Active Appeals Sessions</h2>
            <div className="appeal-sessions-grid">
              {(appealCounts?.length
                ? appealCounts
                : sessions.map((s) => ({ session: s, appeal_count: null }))
              ).map((item) => {
                const session = item.session;
                const maxAllowed =
                  session?.max_appeals_per_session ??
                  session?.max_appeals_per_student ??
                  1;
                const used = item.appeal_count;

                return (
                  <div className="appeal-session-box" key={session.session_id}>
                    <h3>
                      {session.type}
                      {session.semester ? ` - ${session.semester}` : ""}
                    </h3>
                    <p>Submission Window</p>
                    <p>{formatWindow(session.start_date, session.end_date)}</p>
                    <p>
                      {used === null
                        ? "Appeals Used: —"
                        : `${used}/${maxAllowed} Appeals Used`}
                    </p>
                    <button type="button">Submit Appeal</button>
                  </div>
                );
              })}

              <div className="appeal-policy-box">
                <h3>Appeal Policy</h3>
                <p>
                  Each student may submit up to 2 appeals per session. Appeals
                  must be based on valid grounds such as grading errors or
                  extenuating circumstances. All appeals are reviewed by the
                  academic committee, and decisions are communicated within 5-7
                  business days.
                </p>
                <p>Supporting documents must be uploaded in PDF format.</p>
              </div>
            </div>
          </div>

          <div className="your-appeals">
            <h2>Your Appeals</h2>
            {appealRows.length === 0 ? (
              <p>No appeals submitted yet.</p>
            ) : (
              appealRows.map((a) => (
                <div className="appeal-card" key={a.appeal_id}>
                  <div className="header-card">
                    <div className="left-header">
                      <h3>
                        {a.course_code} - {a.course_name}
                      </h3>
                      <p>
                        {a.faculty_name
                          ? `Faculty of ${a.faculty_name} - `
                          : ""}
                        {a.submitted_at
                          ? `Submitted ${formatShortDate(a.submitted_at)}`
                          : ""}
                      </p>
                    </div>
                    <div className="right-header">
                      <span
                        className={`status ${a.status?.toLowerCase()}`}
                        data-status={a.status}
                      >
                        {a.status}
                      </span>
                      <div className="grade">
                        <h4>Grade</h4>
                        <p>
                          <span className="new-grade">
                            {a.new_grade ?? "—"}
                          </span>
                          <span className="old-grade">{a.original_grade}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="comment-section">
                    <div className="reason">
                      <h4>Student Reason</h4>
                      <p>{a.reason}</p>
                    </div>
                    <div className="respons">
                      <h4>Instructor Response</h4>
                      <p>{a.note ?? "No response yet."}</p>
                      <p>
                        {a.instructor_name ? a.instructor_name : ""}
                        {a.resolved_at
                          ? ` - ${formatShortDate(a.resolved_at)}`
                          : ""}
                      </p>
                      <p>Status: {a.status}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

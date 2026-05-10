import { useState, useEffect } from "react";
import api from "../../api/axios";
import SubmitAppealModal from "../../components/Student/SubmitAppealModal";
import "./styles/StudentAppeals.css";

export default function StudentAppeals() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [appealCounts, setAppealCounts] = useState([]);
  const [appealRows, setAppealRows] = useState([]);
  const [countdown, setCountdown] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

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

  const getTimeRemaining = (startDate, endDate) => {
    const now = new Date();
    if (new Date(startDate) > now) return "upcoming";
    const total = new Date(endDate) - now;
    if (total <= 0) return null;
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / (1000 * 60)) % 60),
      seconds: Math.floor((total / 1000) % 60),
    };
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sessionsRes, appealsRes, appealRowsRes] = await Promise.all([
        api.get("/View/StudentView.php?action=sessions"),
        api.get("/View/StudentView.php?action=my-appeals"),
        api.get("/View/StudentView.php?action=my-appeal-rows"),
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

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;

    const tick = () => {
      const updated = {};
      sessions.forEach((s) => {
        updated[s.session_id] = getTimeRemaining(s.start_date, s.end_date);
      });
      setCountdown(updated);

      const allDone = Object.values(updated).every((v) => v === null);
      if (allDone) clearInterval(id);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessions]);

  const handleAppealSuccess = async () => {
    const [updatedAppeals, updatedRows] = await Promise.all([
      api.get("/View/StudentView.php?action=my-appeals"),
      api.get("/View/StudentView.php?action=my-appeal-rows"),
    ]);
    setAppealCounts(updatedAppeals.data?.appeals ?? []);
    setAppealRows(updatedRows.data?.appeals ?? []);
  };

  const openSession =
    sessions
      .filter(
        (s) =>
          countdown[s.session_id] && countdown[s.session_id] !== "upcoming",
      )
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))[0] ?? null;

  const upcomingSession =
    sessions
      .filter((s) => countdown[s.session_id] === "upcoming")
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] ??
    null;

  const activeCd = openSession ? countdown[openSession.session_id] : null;

  const CountdownDigits = ({ cd }) => (
    <div className="countdown-digits">
      <div className="countdown-unit">
        <span>{String(cd.days).padStart(2, "0")}</span>
        <small>Days</small>
      </div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit">
        <span>{String(cd.hours).padStart(2, "0")}</span>
        <small>Hrs</small>
      </div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit">
        <span>{String(cd.minutes).padStart(2, "0")}</span>
        <small>Min</small>
      </div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit">
        <span>{String(cd.seconds).padStart(2, "0")}</span>
        <small>Sec</small>
      </div>
    </div>
  );

  return (
    <div className="appeals-page">
      <div className="head">
        <div>
          <h1>Grade Appeals</h1>
          <p>
            Submit and monitor your grade appeals. Formal requests are processed
            within 5-7 business days.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="active-appeals">
            <h2>Active Appeals Sessions</h2>

            {openSession && activeCd && (
              <div className="appeals-banner">
                <div className="banner-left">
                  <span className="banner-urgent">URGENT: APPEALS ACTIVE</span>
                  <h3>Grade Appeals Window is Now Open</h3>
                  <p>
                    Review your current semester results and submit appeals
                    before the institutional deadline.
                  </p>
                </div>
                <div className="banner-countdown">
                  <span className="countdown-label">Deadline Countdown</span>
                  <CountdownDigits cd={activeCd} />
                </div>
              </div>
            )}

            {!openSession && upcomingSession && (
              <div className="appeals-banner upcoming">
                <div className="banner-left">
                  <span className="banner-urgent">UPCOMING</span>
                  <h3>Next Appeal Window Opens Soon</h3>
                  <p>
                    The next appeals session opens on{" "}
                    {formatShortDate(upcomingSession.start_date)}. You will be
                    able to submit your appeals then.
                  </p>
                </div>
              </div>
            )}

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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSession(session);
                        setIsModalOpen(true);
                      }}
                      disabled={used !== null && used >= maxAllowed}
                    >
                      {used !== null && used >= maxAllowed
                        ? "Limit Reached"
                        : "Submit Appeal"}
                    </button>
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <SubmitAppealModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSession(null);
        }}
        selectedSession={selectedSession}
        onSuccess={handleAppealSuccess}
      />
    </div>
  );
}

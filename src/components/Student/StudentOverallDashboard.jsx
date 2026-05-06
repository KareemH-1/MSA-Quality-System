import { useState, useEffect } from "react";
import api from "../../api/axios";
import SubmitAppealModal from "../../components/Student/SubmitAppealModal";
import "./styles/StudentOverallDashboard.css";

export default function StudentOverallDashboard() {
  const [student, setStudent] = useState(null);
  const [pendingAppeals, setPendingAppeals] = useState(0);
  const [completedSurveys, setCompletedSurveys] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sessionRes, appealsRes] = await Promise.all([
          api.get("/View/SessionView.php"),
          api.get("/View/StudentAppealView.php?action=my-appeal-rows"),
        ]);

        setStudent(sessionRes.data?.user);

        const appeals = appealsRes.data?.appeals ?? [];
        const pending = appeals.filter(
          (a) => a.status?.toLowerCase() === "pending",
        ).length;
        setPendingAppeals(pending);
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
    const pending = appeals.filter(
      (a) => a.status?.toLowerCase() === "pending",
    ).length;
    setPendingAppeals(pending);
  };

  return (
    <section>
      <div className="header">
        <h1>Welcome, {student?.name ?? "Student"}!</h1>
        <p>
          Stay updated with your academic appeals and course surveys in one
          place.
        </p>
      </div>

      <div className="number-status">
        <div className="pending-box">
          <p>Pending Appeals</p>
          <h2>{pendingAppeals}</h2>
        </div>
        <div className="survey-box">
          <p>Completed Surveys</p>
          <h2>{completedSurveys}</h2>
        </div>
        <div className="notification-box">
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
            <button type="button">View Available Surveys</button>
          </div>
          <div className="notification-action">
            <h4>View Notifications</h4>
            <p>Don't miss important updates.</p>
            <p>Check for new messages and alerts.</p>
            <button type="button">Go to Notifications</button>
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="upcoming-deadlines">
          <div className="header">
            <h4>Upcoming Deadlines</h4>
            <span>View Calendar</span>
          </div>
          <div>
            <div>
              <p>OCT</p>
              <p>20</p>
            </div>
            <div>
              <p>Grade Appeal Deadline (Sem 1)</p> 
              <span>Your Chance to Appeal Grades</span>
            </div>
            <span className="status">New</span>
          </div>
        </div>
        <div className="recent-activity">
          <h4>Recent Activity</h4>
          <p>2 days ago</p>
          <p>You submitted a new appeal</p>
          <span className="status">approved</span>
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

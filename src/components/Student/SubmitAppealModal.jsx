import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function SubmitAppealModal({
  isOpen,
  onClose,
  selectedSession,
  onSuccess,
}) {
  const [appealReason, setAppealReason] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [originalGrade, setOriginalGrade] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(
          "/View/StudentAppealView.php?action=enrolled-courses",
        );
        setEnrolledCourses(res.data?.courses ?? []);
      } catch (e) {
        console.error("Failed to load courses:", e);
      }
    };

    if (isOpen) fetchData();
  }, [isOpen]);

  const closeModal = () => {
    setAppealReason("");
    setSelectedCourse("");
    setOriginalGrade("");
    setSubmitStatus(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !originalGrade || !appealReason.trim()) {
      setSubmitStatus("validation-error");
      return;
    }

    try {
      await api.post("/View/StudentAppealView.php?action=submit", {
        session_id: selectedSession?.session_id,
        course_id: selectedCourse,
        original_grade: originalGrade,
        reason: appealReason.trim(),
      });

      setSubmitStatus("success");
      onSuccess?.();

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (e) {
      console.error("Failed to submit appeal:", e);
      setSubmitStatus("api-error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Submit New Appeal</h3>
            <p>{selectedSession?.type ?? "General Appeal"}</p>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="" disabled>
                Select a course
              </option>
              {enrolledCourses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label>Your Current Grade</label>
            <select
              value={originalGrade}
              onChange={(e) => setOriginalGrade(e.target.value)}
            >
              <option value="" disabled>
                Select your grade
              </option>
              {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map(
                (g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="modal-field">
            <label>Reason</label>
            <textarea
              placeholder="Enter your reason for the appeal..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          {submitStatus === "success" && (
            <p className="modal-status success">
              ✓ Appeal submitted successfully!
            </p>
          )}
          {submitStatus === "validation-error" && (
            <p className="modal-status error">
              ✗ Please select a course and write a reason.
            </p>
          )}
          {submitStatus === "api-error" && (
            <p className="modal-status error">
              ✗ Submission failed. Please try again.
            </p>
          )}
          <button className="modal-cancel-btn" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="modal-submit-btn"
            type="button"
            onClick={handleSubmit}
          >
            Submit Appeal
          </button>
        </div>
      </div>
    </div>
  );
}

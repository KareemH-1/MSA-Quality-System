import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./styles/TakeSurvey.css";

const SCALE_OPTIONS = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" },
];

function LikertScale({ questionId, value, onChange }) {
  return (
    <div className="likert-scale">
      {SCALE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={`likert-option ${selected ? "selected" : ""}`}
          >
            <input
              type="radio"
              name={`q-${questionId}`}
              value={option.value}
              checked={selected}
              onChange={() => onChange(questionId, option.value)}
              className="likert-radio"
            />
            <span className="likert-value">{option.value}</span>
            <span className="likert-label">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function TakeSurvey() {
  const { surveyId, courseId } = useParams();
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await api.get(
          `/View/StudentSurveyView.php?action=survey-questions&surveyId=${surveyId}&courseId=${courseId}`,
        );
        setSections(res.data?.sections ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [surveyId, courseId]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      survey_id: Number(surveyId),
      course_id: Number(courseId),
      answers: Object.entries(answers).map(([question_id, answer_text]) => ({
        question_id: Number(question_id),
        answer_text,
      })),
    };

    try {
      await api.post("/View/StudentSurveyView.php?action=submit", payload);
      navigate("/student-services");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="loading-state">Loading survey...</p>;

  const totalQuestions = sections.reduce(
    (acc, s) => acc + s.questions.length,
    0,
  );
  const answeredQuestions = Object.keys(answers).length;
  const progress =
    totalQuestions === 0
      ? 0
      : Math.round((answeredQuestions / totalQuestions) * 100);

  return (
    <>
      <div className="sticky-progress">
        <div className="progress-info">
          <span>
            {answeredQuestions} of {totalQuestions} questions answered
          </span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="take-survey-page">
        <div className="survey-header">
          <button
            className="back-btn"
            onClick={() => navigate("/student-services")}
          >
            Back
          </button>
          <h1 className="survey-main-title">Course Evaluation Survey</h1>
          <p className="survey-subtitle">
            Your feedback helps us improve the quality of education.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.section} className="survey-section">
            <h2 className="section-title">{section.section}</h2>
            {section.questions.map((q, index) => (
              <div key={q.question_id} className="question-block">
                <p className="question-text">
                  <span className="question-number">Q{index + 1}.</span>
                  {q.question_text}
                  {q.is_required && <span className="required-star">*</span>}
                </p>
                <LikertScale
                  questionId={q.question_id}
                  value={answers[q.question_id] ?? ""}
                  onChange={handleAnswer}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="survey-footer">
          <p className="footer-note">
            Please answer all required questions before submitting.
          </p>
          <button className="submit-btn" onClick={handleSubmit}>
            Submit Survey
          </button>
        </div>
      </div>
    </>
  );
}

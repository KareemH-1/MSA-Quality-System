import React, { useEffect, useMemo, useState } from "react";
import MiniMetricCard from "../cards/MiniMetricCard.jsx";
import "./styles/Surveys.css";
import RingProgressCard from "../cards/RingProgressCard.jsx";
import { VisualCard } from "../cards/VisualCard.jsx";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import Chart from "../Chart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
);

const STATUS_SERIES = [
  {
    key: "submitted",
    label: "Submitted",
    color: "rgba(59,130,246,0.65)",
    border: "#2563eb",
  },
  {
    key: "completed",
    label: "Completed",
    color: "rgba(16,185,129,0.65)",
    border: "#059669",
  },
  {
    key: "pending",
    label: "Pending",
    color: "rgba(245,158,11,0.65)",
    border: "#d97706",
  },
];

const submissionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" },
    title: { display: false },
  },
  scales: {
    x: {
      stacked: true,
      title: { display: true, text: "Week" },
    },
    y: {
      stacked: true,
      title: { display: true, text: "Number of surveys" },
    },
  },
};

const Surveys = () => {
  const [surveyMockData, setSurveyMockData] = useState(null);
  const [error, setError] = useState("");
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const [draftFaculty, setDraftFaculty] = useState("");
  const [draftCourse, setDraftCourse] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const totalSubmissions = surveyMockData?.overview?.kpis?.totalSubmitted ?? 0;
  const totalCompleted = surveyMockData?.overview?.kpis?.completed ?? 0;
  const totalPending = totalSubmissions - totalCompleted;
  const averageCompletionRate =
    totalSubmissions > 0 ? (totalCompleted / totalSubmissions) * 100 : 0;
  const averageSatisfaction =
    surveyMockData?.overview?.kpis?.averageSatisfaction ?? 0;
  const averageResponseRate = surveyMockData?.overview?.kpis?.responseRate ?? 0;
  const targetResponseRate =
    surveyMockData?.overview?.kpis?.targetResponseRate ?? 75;
  const targetSatisfaction =
    surveyMockData?.overview?.kpis?.targetSatisfaction ?? 85;
  const facultyCount = surveyMockData?.facultySummary?.length ?? 0;
  const currentSemester = surveyMockData?.overview?.semester?.current ?? "N/A";
  const satisfactionDelta = averageSatisfaction - targetSatisfaction;
  const satisfactionDeltaLabel = `${satisfactionDelta >= 0 ? "+" : ""}${satisfactionDelta.toFixed(1)} pts vs target`;

  const submissionSourceData = useMemo(
    () => surveyMockData?.charts?.submissionTrend ?? [],
    [surveyMockData],
  );
  const submissionFilters = useMemo(
    () => [
      { key: "label", label: "Week", placeholder: "Choose Week", multi: true },
    ],
    [],
  );

  const allRecords = useMemo(
    () => surveyMockData?.records ?? [],
    [surveyMockData],
  );

  const facultyOptions = useMemo(() => {
    return Array.from(
      new Set(allRecords.map((record) => record?.faculty).filter(Boolean)),
    ).sort((left, right) => String(left).localeCompare(String(right)));
  }, [allRecords]);

  const courseOptions = useMemo(() => {
    const sourceRecords = draftFaculty
      ? allRecords.filter((record) => record?.faculty === draftFaculty)
      : allRecords;

    return Array.from(
      new Set(sourceRecords.map((record) => record?.course).filter(Boolean)),
    ).sort((left, right) => String(left).localeCompare(String(right)));
  }, [allRecords, draftFaculty]);

  const selectedRecord = useMemo(() => {
    if (!selectedCourse) {
      return null;
    }

    return (
      allRecords.find((record) => {
        const facultyMatches = selectedFaculty
          ? record?.faculty === selectedFaculty
          : true;
        return record?.course === selectedCourse && facultyMatches;
      }) ?? null
    );
  }, [allRecords, selectedCourse, selectedFaculty]);

  const score = selectedRecord?.overallScore ?? 0;
  const label =
    score >= 80 ? "HIGHLY POSITIVE" : score >= 60 ? "GOOD" : "NEEDS REVIEW";

  const supportMetrics = selectedRecord
    ? [
        {
          label: "Course material score",
          value: selectedRecord.courseMaterialScore,
          tone: "cool",
        },
        {
          label: "Instructor satisfaction",
          value: selectedRecord.instructorSatisfaction,
          tone: "cool",
        },
        {
          label: "Response rate",
          value: selectedRecord.responseRate,
          tone: "accent",
        },
      ]
    : [];

  const buildSubmissionChartData = (records) => {
    if (!records.length) {
      return null;
    }

    return {
      labels: records.map((record) => record.label),
      datasets: STATUS_SERIES.map((series) => ({
        label: series.label,
        data: records.map((record) => Number(record[series.key]) || 0),
        backgroundColor: series.color,
        borderColor: series.border,
        borderWidth: 1,
        borderRadius: 6,
      })),
    };
  };

  useEffect(() => {
    const fetchSurveyMockData = async () => {
      try {
        const response = await fetch("/surveyMockData.json");

        if (!response.ok) {
          throw new Error(
            `Failed to load survey mock data: ${response.status}`,
          );
        }

        const payload = await response.json();
        setSurveyMockData(payload);
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load survey mock data.");
      }
    };

    fetchSurveyMockData();
  }, []);

  useEffect(() => {
    if (draftCourse && !courseOptions.includes(draftCourse)) {
      setDraftCourse("");
    }
  }, [courseOptions, draftCourse]);

  const openCoursePicker = () => {
    setDraftFaculty(selectedFaculty || facultyOptions[0] || "");
    setDraftCourse(selectedCourse || "");
    setIsCoursePickerOpen(true);
  };

  const closeCoursePicker = () => {
    setIsCoursePickerOpen(false);
  };

  const applyCourseSelection = () => {
    if (!draftCourse) {
      return;
    }

    setSelectedFaculty(draftFaculty);
    setSelectedCourse(draftCourse);
    setIsCoursePickerOpen(false);
  };

  const clearCourseSelection = () => {
    setSelectedFaculty("");
    setSelectedCourse("");
  };

  return (
    <div className="surveys-page page-cont">
      <div className="surveys-topbar">
        <div>
          <h1 className="surveys-title">Surveys Analytics</h1>
          <p className="surveys-subtitle">
            Semester {currentSemester} overview with drill-down access to each
            faculty and course.
          </p>
        </div>
        <button
          type="button"
          className="course-picker-btn"
          onClick={openCoursePicker}
        >
          Browse Course Details
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!selectedRecord ? (
        <>
          <div className="top-status">
            <MiniMetricCard
              label="total submissions"
              value={totalSubmissions}
              description={`Current semester: ${currentSemester}`}
              tone="cool"
            />
            <MiniMetricCard
              label="total completed surveys"
              value={totalCompleted}
              description={`Current semester: ${currentSemester}`}
              tone="cool"
            />
            <MiniMetricCard
              label="total pending surveys"
              value={totalPending}
              description={`Current semester: ${currentSemester}`}
              tone="cool"
            />
            <RingProgressCard
              title="Survey Completion Rate"
              value={averageCompletionRate}
              suffix="%"
            />
          </div>

          <div className="satisfaction-overview">
            <VisualCard
              title="Satisfaction Scores"
              description="Average satisfaction compared with the semester target."
              value={averageSatisfaction.toFixed(1)}
              percentage={satisfactionDeltaLabel}
              footer={`Target: ${targetSatisfaction}`}
              color="default"
            />
            <VisualCard
              title="Response Rate"
              description="Percentage of surveys that have been submitted."
              value={averageResponseRate.toFixed(1)}
              percentage={`${averageResponseRate - targetResponseRate >= 0 ? "+" : ""}${(averageResponseRate - targetResponseRate).toFixed(1)} pts vs target`}
              footer={`Target: ${targetResponseRate}%`}
              suffix="%"
              color="default"
            />
          </div>

          <div className="faculty-satisfaction">
            <h2 className="section-heading">Faculty Satisfaction</h2>
            <p className="section-note">{facultyCount} faculties included</p>
            <Chart
              className="appeals-chart-shell"
              ChartComponent={Bar}
              sourceData={submissionSourceData}
              buildChartData={buildSubmissionChartData}
              filters={submissionFilters}
              title="Weekly Survey Status"
              subtitle="Submitted vs Completed vs Pending (stacked)"
              chartProps={{ options: submissionChartOptions }}
              emptyMessage="No weekly survey data found."
            />
          </div>
        </>
      ) : (
        <section className="course-detail-view">
          <div className="course-detail-header">
            <div>
              <p className="course-detail-kicker">Detailed course survey</p>
              <h2 className="section-heading">{selectedRecord.course}</h2>
              <p className="section-note">
                {selectedRecord.faculty} | {selectedRecord.instructor} |{" "}
                {selectedRecord.semester}
              </p>
            </div>
            <button
              type="button"
              className="course-back-btn"
              onClick={clearCourseSelection}
            >
              Back To Overview
            </button>
          </div>

          <div className="course-detail-grid">
            <article className="course-performance-card">
              <p className="course-performance-kicker">Core Performance</p>
              <h3 className="course-performance-title">
                Instructor Excellence
              </h3>
              <div className="overall-score-ring">
                <svg viewBox="0 0 100 100" className="ring-svg">
                  <circle className="ring-track" cx="50" cy="50" r="42" />
                  <circle
                    className="ring-fill"
                    cx="50"
                    cy="50"
                    r="42"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)}
                  />
                </svg>

                <div className="ring-center">
                  <strong>{score}%</strong>
                  <span>{label}</span>
                </div>
              </div>

              <div className="course-performance-summary">
                <div className="course-performance-row">
                  <span>Clarity of Delivery</span>
                  <strong>{selectedRecord.courseMaterialScore} / 100</strong>
                </div>
                <div className="course-performance-row">
                  <span>Responsiveness</span>
                  <strong>{selectedRecord.instructorSatisfaction} / 100</strong>
                </div>
              </div>
            </article>

            <article className="support-metrics-card">
              <h3>Support Metrics</h3>
              <div className="support-metrics-list">
                {supportMetrics.map((metric) => (
                  <div key={metric.label} className="support-metric-row">
                    <div className="support-metric-header">
                      <span>{metric.label}</span>
                      <strong>{metric.value}%</strong>
                    </div>
                    <div className="support-metric-track" aria-hidden="true">
                      <div
                        className={`support-metric-fill ${metric.tone}`}
                        style={{ width: `${Math.min(100, metric.value)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
            {/* <ul>
                <li>Overall score: {selectedRecord.overallScore}%</li>
                <li>
                  Course material score: {selectedRecord.courseMaterialScore}%
                </li>
                <li>
                  Instructor satisfaction:{" "}
                  {selectedRecord.instructorSatisfaction}%
                </li>
                <li>Response rate: {selectedRecord.responseRate}%</li>
                <li>Status: {selectedRecord.status}</li>
              </ul> */}
          </div>
          <div className="course-detail-grid course-detail-notes">
            <article className="course-detail-card">
              <h3>Survey Summary</h3>
              <p>{selectedRecord.draftSummary}</p>
              <h3>Detailed Notes</h3>
              <p>{selectedRecord.fullDraft}</p>
            </article>

            <article className="course-detail-card">
              <h3>Course Context</h3>
              <ul>
                <li>Faculty: {selectedRecord.faculty}</li>
                <li>Course: {selectedRecord.course}</li>
                <li>Instructor: {selectedRecord.instructor}</li>
                <li>Submitted at: {selectedRecord.submittedAt}</li>
              </ul>
            </article>
          </div>
        </section>
      )}

      {isCoursePickerOpen && (
        <div className="course-picker-overlay" role="dialog" aria-modal="true">
          <div className="course-picker-modal">
            <h3>Choose a faculty and course</h3>
            <div className="course-picker-fields">
              <label htmlFor="faculty-select">Faculty</label>
              <select
                id="faculty-select"
                value={draftFaculty}
                onChange={(event) => {
                  setDraftFaculty(event.target.value);
                  setDraftCourse("");
                }}
              >
                <option value="">All faculties</option>
                {facultyOptions.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>

              <label htmlFor="course-select">Course</label>
              <select
                id="course-select"
                value={draftCourse}
                onChange={(event) => setDraftCourse(event.target.value)}
              >
                <option value="">Choose course</option>
                {courseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="course-picker-actions">
              <button
                type="button"
                className="course-picker-cancel"
                onClick={closeCoursePicker}
              >
                Cancel
              </button>
              <button
                type="button"
                className="course-picker-apply"
                onClick={applyCourseSelection}
                disabled={!draftCourse}
              >
                Open course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Surveys;

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
import { Quote } from "lucide-react";

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
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFacultyMenuOpen, setIsFacultyMenuOpen] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [sortedComments, setSortedComments] = useState([]);
  const [overallRatings, setOverallRatings] = useState([]);

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
  const instructorRate =
    score >= 80
      ? "Excellent Instructor"
      : score >= 60
        ? "Good Instructor"
        : "Instructor Needs Improvement";

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

  const performSearch = (query) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = trimmedQuery.toLowerCase();

    const results = allRecords.filter((record) => {
      const courseNameMatch = record?.course
        ?.toLowerCase()
        .includes(lowerQuery);
      const courseCodeMatch = record?.courseCode
        ?.toLowerCase()
        .includes(lowerQuery);
      const instructorMatch = record?.instructor
        ?.toLowerCase()
        .includes(lowerQuery);

      return courseNameMatch || courseCodeMatch || instructorMatch;
    });
    setSearchResults(results);
  };

  const getLatestComments = (record, count = 4) => {
    if (!record?.comments?.length) {
      return [];
    }

    const sortedComments = [...record.comments].sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return dateB - dateA;
    });

    return sortedComments.slice(0, count);
  };

  const initializeStarRating = (score) => {
    if (score >= 90) return 5;
    if (score >= 80) return 4.5;
    if (score >= 70) return 4;
    if (score >= 60) return 3.5;
    if (score >= 50) return 3;
    if (score >= 40) return 2.5;
    if (score >= 30) return 2;
    if (score >= 20) return 1.5;
    if (score >= 10) return 1;
    return 0.5;
  };

  const getOverallRatingPerStudent = (record) => {
    if (!record?.comments?.length) {
      return [];
    }

    return [...record.comments]
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt);
        const dateB = new Date(b.submittedAt);
        return dateB - dateA;
      })
      .map((comment) => {
        const rawScore =
          comment?.studentOverallScore ?? comment?.sutdentOverallScore;
        return initializeStarRating(Number(rawScore) || 0);
      });
  };

  const handleSearchResultClick = (record) => {
    setSelectedFaculty(record.faculty);
    setSelectedCourse(record.course);
    setIsCoursePickerOpen(false);
    setSearchInput("");
    setSearchResults([]);
    setIsFacultyMenuOpen(false);
    setIsCourseMenuOpen(false);
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

  useEffect(() => {
    setSortedComments(getLatestComments(selectedRecord));
    setOverallRatings(getOverallRatingPerStudent(selectedRecord));
  }, [selectedRecord]);

  const openCoursePicker = () => {
    setDraftFaculty(selectedFaculty || facultyOptions[0] || "");
    setDraftCourse(selectedCourse || "");
    setIsCoursePickerOpen(true);
    setIsFacultyMenuOpen(false);
    setIsCourseMenuOpen(false);
  };

  const closeCoursePicker = () => {
    setIsCoursePickerOpen(false);
    setSearchInput("");
    setSearchResults([]);
    setIsFacultyMenuOpen(false);
    setIsCourseMenuOpen(false);
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      closeCoursePicker();
    }
  };

  const selectFaculty = (faculty) => {
    setDraftFaculty(faculty);
    setDraftCourse("");
    setIsFacultyMenuOpen(false);
    setIsCourseMenuOpen(false);
  };

  const selectCourse = (course) => {
    setDraftCourse(course);
    setIsCourseMenuOpen(false);
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
    setSortedComments([]);
  };

  return (
    <div className="surveys-page page-cont">
      <div className="surveys-topbar">
        <div>
          <h1 className="surveys-title">Surveys Analytics</h1>
          <p className="surveys-subtitle">
            Semester <span>{currentSemester}</span> overview with drill-down
            access to each faculty and course.
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
        <>
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
                <h3 className="course-performance-title">{instructorRate}</h3>
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
                    <strong>
                      {selectedRecord.instructorSatisfaction} / 100
                    </strong>
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
          <section>
            <div className="course-detail-grid--2 course-detail-comments">
              {sortedComments.length > 0 ? (
                sortedComments.map((comment, index) => (
                  <article className="course-comment-card" key={index}>
                    <Quote size={24} className="comment-icon" />
                    <h3>Representative Comment</h3>
                    <p>{comment.comment}</p>
                    <div className="comment-meta">
                      <span className="comment-date">
                        {new Date(comment.submittedAt).toLocaleDateString()}
                      </span>
                      {(() => {
                        const starRating =
                          overallRatings[index] ?? initializeStarRating(score); // if 

                        return (
                          <div className="course-rating-row">
                            <div
                              className="course-stars"
                              aria-label={`${starRating} out of 5 stars`}
                            >
                              {Array.from({ length: 5 }, (_, starIndex) => {
                                const position = starIndex + 1;
                                let starClass = "empty";

                                if (starRating >= position) {
                                  starClass = "full";
                                } else if (starRating >= position - 0.5) {
                                  starClass = "half";
                                }

                                return (
                                  <span
                                    key={position}
                                    className={`course-star ${starClass}`}
                                  >
                                    ★
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </article>
                ))
              ) : (
                <p>No representative comments found.</p>
              )}
            </div>
          </section>
        </>
      )}
      {isCoursePickerOpen && (
        <div
          className="course-picker-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={handleOverlayMouseDown}
        >
          <div className="course-picker-modal">
            <div className="course-picker-header">
              <h2>Search Courses</h2>
              <div className="course-picker-search">
                <input
                  type="text"
                  placeholder="Enter Course Name or Code"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      performSearch(searchInput);
                    }
                  }}
                />
                <button
                  type="button"
                  className="course-picker-search-btn"
                  onClick={() => performSearch(searchInput)}
                >
                  Search
                </button>
              </div>
            </div>
            {searchInput.trim() && (
              <div className="course-picker-search-results">
                {searchResults.length > 0 ? (
                  <>
                    <p className="course-picker-search-summary">
                      {searchResults.length} result
                      {searchResults.length === 1 ? "" : "s"} found
                    </p>
                    <div className="course-picker-results-list">
                      {searchResults.map((record) => (
                        <button
                          key={record.id}
                          type="button"
                          className="course-picker-result-item"
                          onClick={() => handleSearchResultClick(record)}
                        >
                          <strong>{record.course}</strong>
                          <span>
                            {record.faculty} | {record.instructor}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="course-picker-search-empty">
                    No courses found for “{searchInput.trim()}”.
                  </p>
                )}
              </div>
            )}
            <div className="course-picker-filters">
              <span>OR</span>
            </div>
            <h3>Choose a faculty and course</h3>
            <div className="course-picker-fields">
              <div className="course-picker-field-group">
                <label htmlFor="faculty-trigger">Faculty</label>
                <button
                  id="faculty-trigger"
                  type="button"
                  className="course-picker-dropdown-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isFacultyMenuOpen}
                  onClick={() => {
                    setIsFacultyMenuOpen((current) => !current);
                    setIsCourseMenuOpen(false);
                  }}
                >
                  <span>{draftFaculty || "All faculties"}</span>
                  <span
                    className="course-picker-dropdown-caret"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isFacultyMenuOpen && (
                  <div className="course-picker-dropdown-menu" role="listbox">
                    <button
                      type="button"
                      className={`course-picker-dropdown-item ${!draftFaculty ? "is-selected" : ""}`}
                      onClick={() => selectFaculty("")}
                    >
                      All faculties
                    </button>
                    {facultyOptions.map((faculty) => (
                      <button
                        key={faculty}
                        type="button"
                        className={`course-picker-dropdown-item ${draftFaculty === faculty ? "is-selected" : ""}`}
                        onClick={() => selectFaculty(faculty)}
                      >
                        {faculty}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="course-picker-field-group">
                <label htmlFor="course-trigger">Course</label>
                <button
                  id="course-trigger"
                  type="button"
                  className={`course-picker-dropdown-trigger ${!courseOptions.length ? "is-disabled" : ""}`}
                  aria-haspopup="listbox"
                  aria-expanded={isCourseMenuOpen}
                  disabled={!courseOptions.length}
                  onClick={() => {
                    setIsCourseMenuOpen((current) => !current);
                    setIsFacultyMenuOpen(false);
                  }}
                >
                  <span>{draftCourse || "Choose course"}</span>
                  <span
                    className="course-picker-dropdown-caret"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isCourseMenuOpen && (
                  <div className="course-picker-dropdown-menu" role="listbox">
                    {!courseOptions.length ? (
                      <div className="course-picker-dropdown-empty">
                        No courses available
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`course-picker-dropdown-item ${!draftCourse ? "is-selected" : ""}`}
                          onClick={() => selectCourse("")}
                        >
                          Choose course
                        </button>
                        {courseOptions.map((course) => (
                          <button
                            key={course}
                            type="button"
                            className={`course-picker-dropdown-item ${draftCourse === course ? "is-selected" : ""}`}
                            onClick={() => selectCourse(course)}
                          >
                            {course}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
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

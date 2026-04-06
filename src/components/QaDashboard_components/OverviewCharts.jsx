import React from "react";
import "./styles/Charts.css";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
import {
  Appealinsights,
  SatisfactionInsights,
} from "../../services/Helpers/QaOverviewHelperCharts";
import { CircleMinus, TrendingUp, TrendingDown } from "lucide-react";

const OverviewCharts = ({ overviewChartsJson, errorMessage }) => {
  if (errorMessage) {
    return (
      <div className="charts">
        <div className="section charts-error-box">
          <h1 className="section-title">Overview Charts</h1>
          <p className="charts-error-message">
            Unable to load overview charts data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!overviewChartsJson) {
    return null;
  }

  const midtermTotals = overviewChartsJson?.totals?.midterm || {};
  const finalTotals = overviewChartsJson?.totals?.final || {};
  const satisfactionTotals =
    overviewChartsJson?.totals?.["Satisfaction-Survey"] || {};
  const mergedSemesters = [
    ...Object.keys(midtermTotals),
    ...Object.keys(finalTotals),
    ...Object.keys(satisfactionTotals),
  ];
  const semesters = mergedSemesters.filter(
    (semester, index) => mergedSemesters.indexOf(semester) === index,
  );
  const semesterCount = semesters.length;
  const hasHistory = semesterCount > 0;
  const semesterLabel = hasHistory
    ? `Last ${semesterCount} Semester${semesterCount > 1 ? "s" : ""}`
    : "No Historical Semesters";
  const latestSemester = semesters[semesters.length - 1] || "N/A";
  const currentAppealSession = overviewChartsJson?.currentAppealSession || {};
  const resolutionTimeByDay = currentAppealSession?.resolutionTimeByDay || {};
  const resolutionEntries = Object.entries(resolutionTimeByDay);
  const hasCurrentResolutionData = resolutionEntries.length > 0;
  const sessionStartDateRaw = currentAppealSession?.startDate;
  const sessionStartDate = sessionStartDateRaw
    ? new Date(sessionStartDateRaw)
    : null;
  const hasValidSessionStartDate =
    sessionStartDate instanceof Date &&
    !Number.isNaN(sessionStartDate.getTime());
  const daysSinceSessionStart = hasValidSessionStartDate
    ? Math.floor((Date.now() - sessionStartDate.getTime()) / 86400000) + 1
    : null;
  const currentSessionDay =
    typeof daysSinceSessionStart === "number" && daysSinceSessionStart > 0
      ? daysSinceSessionStart
      : new Date().getDate();
  const resolutionEntriesToRender = resolutionEntries.filter(
    ([dayLabel], index) => {
      const dayMatch = String(dayLabel).match(/day\s*(\d+)/i);
      if (dayMatch) {
        return Number(dayMatch[1]) <= currentSessionDay;
      }
      return index + 1 <= currentSessionDay;
    },
  );
  const hasResolutionDataThroughCurrentDay =
    resolutionEntriesToRender.length > 0;

  if (!hasHistory) {
    return (
      <div className="charts">
        <div className="section charts-error-box">
          <h1 className="section-title">Overview Charts</h1>
          <p className="charts-error-message">
            No historical semester data is available for charts yet.
          </p>
        </div>
      </div>
    );
  }

  const overviewChartsData = {
    labels: semesters,
    datasets: [
      {
        label: "Midterm Appeals",
        data: semesters.map((semester) => midtermTotals[semester] ?? 0),
        borderColor: "#1f77b4",
        backgroundColor: "rgba(31, 119, 180, 0.2)",
        tension: 0.35,
      },
      {
        label: "Final Appeals",
        data: semesters.map((semester) => finalTotals[semester] ?? 0),
        borderColor: "#b22b1d",
        backgroundColor: "rgba(61, 21, 0, 0.2)",
        tension: 0.35,
      },
    ],
  };

  const chartOptions = (yAxisTitle = "", xAxisTitle = "Semester") => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: xAxisTitle,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: yAxisTitle,
          },
          beginAtZero: true,
        },
      },
    };
  };

  const satisfactionData = {
    labels: semesters,
    datasets: [
      {
        label: "Satisfaction Score",
        data: semesters.map((semester) => satisfactionTotals[semester] ?? 0),
        borderColor: "#004369",
        backgroundColor: "rgba(0, 67, 105, 0.2)",
        tension: 0.35,
      },
    ],
  };

  const resolutionData = {
    labels: resolutionEntriesToRender.map(([dayLabel]) => dayLabel),
    datasets: [
      {
        label: "Resolution Time (Days)",
        data: resolutionEntriesToRender.map(([, value]) => value ?? 0),
        borderColor: "#198754",
        backgroundColor: "rgba(25, 135, 84, 0.2)",
        tension: 0.35,
      },
    ],
  };

  return (
    <div className="charts">
      <div className="row1">
        <div className="section big">
          <h1 className="section-title">Total Appeals for {semesterLabel}</h1>
          <p className="section-subtitle">
            Appeal comparison across available semesters for midterm and finals
          </p>
          <div className="chart-wrapper">
            <Line
              data={overviewChartsData}
              options={chartOptions("Number of Appeals")}
            />
          </div>

          <div className="insights">
            <h2 className="insights-title">Insights</h2>
            <ul className="insights-list">
              {Appealinsights(
                overviewChartsJson.totals.midterm,
                overviewChartsJson.totals.final,
              ).map(([insight, type], index) => (
                <li key={index} className={`insight-item ${type}`}>
                  <div className="insight-item-content">
                    {type === "positive" && (
                      <span className="insight-icon positive">
                        <TrendingUp size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    {type === "negative" && (
                      <span className="insight-icon negative">
                        <TrendingDown size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    {type === "neutral" && (
                      <span className="insight-icon neutral">
                        <CircleMinus size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    <span className="insight-text">{insight}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="section small">
          <h1 className="section-title">
            Satisfaction Score for {semesterLabel}
          </h1>
          <p className="section-subtitle">
            Student satisfaction scores from surveys across available semesters
          </p>
          <div className="chart-wrapper">
            <Line
              data={satisfactionData}
              options={chartOptions("Satisfaction Score")}
            />
          </div>

          <div className="insights">
            <h2 className="insights-title">Insights</h2>
            <ul className="insights-list">
              {SatisfactionInsights(
                overviewChartsJson.totals["Satisfaction-Survey"],
              ).map(([insight, type], index) => (
                <li key={index} className={`insight-item ${type}`}>
                  <div className="insight-item-content">
                    {type === "positive" && (
                      <span className="insight-icon positive">
                        <TrendingUp size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    {type === "negative" && (
                      <span className="insight-icon negative">
                        <TrendingDown size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    {type === "neutral" && (
                      <span className="insight-icon neutral">
                        <CircleMinus size={13} strokeWidth={2.25} />
                      </span>
                    )}
                    <span className="insight-text">{insight}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="section small">
          <h1 className="section-title">Resolution Time</h1>
          <p className="section-subtitle">
            {hasCurrentResolutionData
              ? `Resolution time by day for ${currentAppealSession?.label || "the current appeal session"}`
              : `No current-session resolution-time data is available. Showing latest semester: ${latestSemester}`}
          </p>
          {hasResolutionDataThroughCurrentDay && (
            <div className="chart-wrapper resolution-chart-wrapper">
              <Line
                data={resolutionData}
                options={chartOptions("Resolution Time (Days)", "Session Day")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewCharts;

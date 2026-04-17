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
  pluggins: {
    legend: {
      position: "top",
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      title: {
        display: true,
        text: "week",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "number of surveys",
      },
    },
  },
};

const Surveys = () => {
  const [surveyMockData, setSurveyMockData] = useState(null);
  const [error, setError] = useState("");

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
  const satisfactionDelta = averageSatisfaction - targetSatisfaction;
  const satisfactionDeltaLabel = `${satisfactionDelta >= 0 ? "+" : ""}${satisfactionDelta.toFixed(1)} pts vs target`;

  const currentSemester = surveyMockData?.overview?.semester?.current ?? "N/A";

  const submissionSourceData = useMemo(() => {
    return surveyMockData?.charts?.submissionTrend ?? [];
  }, [surveyMockData]);

  const submissionFilters = useMemo(
    () => [
      {
        key: "label",
        label: "Week",
        placeholder: "Choose Week",
        multi: true,
      },
    ],
    [],
  );

  const buildSubmissionChartData = (records) => {
    if (!records.length) {
      return null;
    }

    return {
      labels: records.map((r) => r.label),
      datasets: STATUS_SERIES.map((series) => ({
        label: series.label,
        data: records.map((r) => Number(r[series.key]) || 0),
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

  return (
    <div className="surveys-page page-cont">
      <h1 className="surveys-title">Surveys Analytics</h1>
      {error && <p className="error-message">{error}</p>}
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
          description="Comparison of average and target satisfaction scores for the current semester."
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
    </div>
  );
};

export default Surveys;

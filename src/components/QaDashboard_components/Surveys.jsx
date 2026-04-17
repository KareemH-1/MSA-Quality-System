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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

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
  const targetSatisfaction =
    surveyMockData?.overview?.kpis?.targetSatisfaction ?? 85;
  const facultyCount = surveyMockData?.facultySummary?.length ?? 0;
  const satisfactionDelta = averageSatisfaction - targetSatisfaction;
  const satisfactionDeltaLabel = `${satisfactionDelta >= 0 ? "+" : ""}${satisfactionDelta.toFixed(1)} pts vs target`;

  const currentSemester = surveyMockData?.overview?.semester?.current ?? "N/A";

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
    <div>
      <h1>Surveys Analytics</h1>
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
      <VisualCard
        title="Satisfaction Scores"
        description="Comparison of average and target satisfaction scores for the current semester."
        value={averageSatisfaction.toFixed(1)}
        percentage={satisfactionDeltaLabel}
        footer={`Target: ${targetSatisfaction}`}
        color="default"
      />
      <div className="faculty-satisfaction">
        <h2>Faculty Satisfaction</h2>

      </div>
    </div>
  );
};

export default Surveys;

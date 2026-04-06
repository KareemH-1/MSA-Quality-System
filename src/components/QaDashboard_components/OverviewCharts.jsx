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
import { Appealinsights } from "../../services/Helpers/QaOverviewHelperCharts";
import { CircleMinus, TrendingUp , TrendingDown } from "lucide-react";

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

  const semesters = Object.keys(overviewChartsJson?.totals?.midterm || {});
  const overviewChartsData = {
    labels: semesters,
    datasets: [
      {
        label: "Midterm Appeals",
        data: semesters.map(
          (semester) => overviewChartsJson.totals.midterm[semester] ?? 0,
        ),
        borderColor: "#1f77b4",
        backgroundColor: "rgba(31, 119, 180, 0.2)",
        tension: 0.35,
      },
      {
        label: "Final Appeals",
        data: semesters.map(
          (semester) => overviewChartsJson?.totals?.final?.[semester] ?? 0,
        ),
        borderColor: "#b22b1d",
        backgroundColor: "rgba(61, 21, 0, 0.2)",
        tension: 0.35,
      },
    ],
  };

  const chartOptions = (isAppeal) => {
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
          text: "Semester",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: isAppeal ? "Number of Appeals" : "Satisfaction Score",
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
            data: semesters.map(
                (semester) => overviewChartsJson?.totals?.["Satisfaction-Survey"]?.[semester] ?? 0
            ),
            borderColor: "#004369",
            backgroundColor: "rgba(0, 67, 105, 0.2)",
            tension: 0.35,
        }
    ]
};

  return (
    <div className="charts">
        <div className="row1">
        
        <div className="section big">
          <h1 className="section-title">Total Appeals for Last 5 Semesters</h1>
          <p className="section-subtitle">
            Appeal comparison across last 5 semesters for midterm and finals
          </p>
          <div className="chart-wrapper">
            <Line data={overviewChartsData} options={chartOptions(true)} />
          </div>

            <div className="insights">
                <h2 className="insights-title">Insights</h2>
                <ul className="insights-list">
                    {Appealinsights(overviewChartsJson.totals.midterm, overviewChartsJson.totals.final).map(([insight, type], index) => (
                        <li key={index} className={`insight-item ${type}`}>
                            <div className="insight-item-content">
                                {type === "positive" && <span className="insight-icon positive"><TrendingUp size={13} strokeWidth={2.25} /></span>}
                                {type === "negative" && <span className="insight-icon negative"><TrendingDown size={13} strokeWidth={2.25} /></span>}
                                {type ==="neutral" && <span className="insight-icon neutral"><CircleMinus size={13} strokeWidth={2.25} /></span>}
                            <span className="insight-text">{insight}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
          </div>

          <div className="section small">
            <h1 className="section-title">Satisfaction Score for Last 5 Semesters</h1>
            <p className="section-subtitle">
                Student satisfaction scores from surveys across last 5 semesters
            </p>
            <div className="chart-wrapper">
                <Line data={satisfactionData} options={chartOptions(false)} />
            </div>
          </div>
      </div>
    </div>
  );
};

export default OverviewCharts;

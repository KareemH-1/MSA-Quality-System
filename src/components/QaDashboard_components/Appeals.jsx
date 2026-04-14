import { useEffect, useMemo, useState } from "react";
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
import "./styles/Appeals.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const TERM_ORDER = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
};

const parseSemester = (semester) => {
  const [yearText, termText] = String(semester || "").split("-");
  return {
    year: Number(yearText) || 0,
    term: (termText || "").toUpperCase(),
  };
};

const getStatusFromSessionData = (sessionData) => {
  if (!sessionData) {
    return "Closed";
  }

  if (sessionData.isOpen) {
    return "Open";
  }

  if (sessionData.isFininished) {
    return "Closed";
  }

  return "Not Started";
};

const getSemesterAnchorDate = (semester, session) => {
  const parsed = parseSemester(semester);
  const monthByTerm = {
    SPRING: 3,
    SUMMER: 7,
    FALL: 10,
    WINTER: 1,
  };
  const day = session === "Midterm" ? 5 : 20;
  const month = monthByTerm[parsed.term] || 1;
  return `${String(parsed.year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const sortSemesters = (first, second) => {
  const parsedFirst = parseSemester(first);
  const parsedSecond = parseSemester(second);

  if (parsedFirst.year !== parsedSecond.year) {
    return parsedFirst.year - parsedSecond.year;
  }

  return (TERM_ORDER[parsedFirst.term] || 99) - (TERM_ORDER[parsedSecond.term] || 99);
};

const buildAppealsRecords = (overviewChartsData, overviewData) => {
  const midtermTotals = overviewChartsData?.totals?.midterm || {};
  const finalTotals = overviewChartsData?.totals?.final || {};
  const currentSemester = overviewData?.semester?.current;
  const currentMidtermStatus = getStatusFromSessionData(overviewData?.appeals?.midterm);
  const currentFinalStatus = getStatusFromSessionData(overviewData?.appeals?.final);

  const records = [];

  Object.entries(midtermTotals).forEach(([semester, count]) => {
    const parsed = parseSemester(semester);
    records.push({
      semester,
      session: "Midterm",
      term: parsed.term,
      year: parsed.year,
      count: Number(count) || 0,
      status: semester === currentSemester ? currentMidtermStatus : "Closed",
      date: getSemesterAnchorDate(semester, "Midterm"),
    });
  });

  Object.entries(finalTotals).forEach(([semester, count]) => {
    const parsed = parseSemester(semester);
    records.push({
      semester,
      session: "Final",
      term: parsed.term,
      year: parsed.year,
      count: Number(count) || 0,
      status: semester === currentSemester ? currentFinalStatus : "Closed",
      date: getSemesterAnchorDate(semester, "Final"),
    });
  });

  return records;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Semester",
      },
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Appeals Count",
      },
    },
  },
};

const buildChartData = (records) => {
  if (!records.length) {
    return null;
  }

  const semesters = Array.from(new Set(records.map((record) => record.semester))).sort(sortSemesters);
  const sessions = ["Midterm", "Final"].filter((session) =>
    records.some((record) => record.session === session),
  );

  const colorBySession = {
    Midterm: {
      borderColor: "#1f77b4",
      backgroundColor: "rgba(31, 119, 180, 0.32)",
    },
    Final: {
      borderColor: "#b22b1d",
      backgroundColor: "rgba(178, 43, 29, 0.3)",
    },
  };

  return {
    labels: semesters,
    datasets: sessions.map((session) => ({
      label: `${session} Appeals`,
      data: semesters.map((semester) => {
        const found = records.find(
          (record) => record.semester === semester && record.session === session,
        );
        return found ? found.count : 0;
      }),
      borderColor: colorBySession[session].borderColor,
      backgroundColor: colorBySession[session].backgroundColor,
      borderRadius: 8,
      borderWidth: 1.5,
    })),
  };
};

const Appeals = () => {
  const [overviewChartsData, setOverviewChartsData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppealsData = async () => {
      try {
        const [chartsResponse, overviewResponse] = await Promise.all([
          fetch("/OverviewChartsData.json"),
          fetch("/mockOverviewData.json"),
        ]);

        if (!chartsResponse.ok) {
          throw new Error(`Failed to load appeals chart data: ${chartsResponse.status}`);
        }

        if (!overviewResponse.ok) {
          throw new Error(`Failed to load overview data for filters: ${overviewResponse.status}`);
        }

        const [chartsData, overviewDataResponse] = await Promise.all([
          chartsResponse.json(),
          overviewResponse.json(),
        ]);

        setOverviewChartsData(chartsData);
        setOverviewData(overviewDataResponse);
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load appeals chart data.");
      }
    };

    fetchAppealsData();
  }, []);

  const sourceData = useMemo(
    () => buildAppealsRecords(overviewChartsData, overviewData),
    [overviewChartsData, overviewData],
  );

  const filters = useMemo(
    () => [
      {
        key: "session",
        label: "Session",
        placeholder: "Choose Session",
        multi: true,
        options: [
          { label: "Midterm", value: "Midterm" },
          { label: "Final", value: "Final" },
        ],
      },
      {
        key: "term",
        label: "Term",
        placeholder: "Choose Term",
        multi: true,
      },
      {
        key: "year",
        label: "Year",
        placeholder: "Choose Year",
        multi: true,
      },
      {
        key: "semester",
        label: "Semester",
        placeholder: "Choose Semester",
        multi: true,
      },
      {
        key: "status",
        label: "Status",
        placeholder: "Choose Status",
        multi: true,
      },
      {
        key: "date",
        label: "Date Range",
        type: "date-range",
        field: "date",
      },
    ],
    [],
  );

  return (
    <div className="appeals-page page-cont">
      <div className="section">
        <h2 className="section-title">Appeals Analytics</h2>
        <p className="section-subtitle">
          Explore appeal trends by semester with filters for session, term, year, semester, status, and date range.
        </p>

        {error ? (
          <p className="appeals-error">{error}</p>
        ) : (
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            sourceData={sourceData}
            buildChartData={buildChartData}
            filters={filters}
            title="Midterm vs Final Appeals"
            subtitle="Semester-wise appeal totals"
            chartProps={{ options: chartOptions }}
            emptyMessage="No records found for the selected filters."
          />
        )}
      </div>
    </div>
  );
};

export default Appeals;

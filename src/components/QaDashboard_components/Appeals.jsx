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
import AppealKpiCard from "../cards/AppealKpiCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import "./styles/Appeals.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const TERM_ORDER = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
};

const SEMESTER_OPTIONS = [
  { label: "All Semesters", value: "" },
  { label: "Fall", value: "FALL" },
  { label: "Spring", value: "SPRING" },
  { label: "Summer", value: "SUMMER" },
];

const SESSION_OPTIONS = [
  { label: "All Assessments", value: "" },
  { label: "Midterm", value: "Midterm" },
  { label: "Final", value: "Final" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Open", value: "Open" },
  { label: "Closed", value: "Closed" },
];

const toDateKey = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
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
  const appealRecords = Array.isArray(overviewChartsData?.appealRecords)
    ? overviewChartsData.appealRecords
    : [];

  if (appealRecords.length > 0) {
    return appealRecords.map((record) => {
      const parsed = parseSemester(record.semester);

      return {
        ...record,
        term: parsed.term,
        year: parsed.year,
        count: Number(record.count) || 0,
        acceptedCount: Number(record.acceptedCount) || 0,
        pendingCount: Number(record.pendingCount) || 0,
        inProgressCount: Number(record.inProgressCount) || 0,
        activeCount: Number(record.activeCount) || 0,
        overdueCount: Number(record.overdueCount) || 0,
        unassignedCount: Number(record.unassignedCount) || 0,
        avgResolutionMinutes:
          Number(record.avgResolutionMinutes ?? record.avgResolutionHours) || 0,
        gradeChangeAverage: Number(record.gradeChangeAverage) || 0,
        failToPassCount: Number(record.failToPassCount) || 0,
        status: normalizeStatus(record.status),
        date: record.date || getSemesterAnchorDate(record.semester, record.session),
      };
    });
  }

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

const sumByKey = (records, key) => {
  return records.reduce((total, record) => total + (Number(record?.[key]) || 0), 0);
};

const weightedAverage = (records, key, weightKey = "count") => {
  const totalWeight = sumByKey(records, weightKey);

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedTotal = records.reduce(
    (total, record) => total + (Number(record?.[key]) || 0) * (Number(record?.[weightKey]) || 0),
    0,
  );

  return weightedTotal / totalWeight;
};

const formatSemesterLabel = (semester) => {
  const parsed = parseSemester(semester);
  const termLabel = parsed.term.charAt(0) + parsed.term.slice(1).toLowerCase();
  return `${termLabel} ${parsed.year}`;
};

const formatCycleLabel = (semester, session) => {
  if (!semester) {
    return session ? `${session}` : "current cycle";
  }

  return session ? `${formatSemesterLabel(semester)} ${session}` : formatSemesterLabel(semester);
};

const getPreviousSemester = (records, semester) => {
  const semesters = Array.from(new Set(records.map((record) => record.semester))).sort(sortSemesters);
  const currentIndex = semesters.indexOf(semester);

  if (currentIndex <= 0) {
    return "";
  }

  return semesters[currentIndex - 1];
};

const getActiveSemester = (records, semesterFilter) => {
  if (semesterFilter) {
    return semesterFilter;
  }

  const semesters = Array.from(new Set(records.map((record) => record.semester))).sort(sortSemesters);
  return semesters[semesters.length - 1] || "";
};

const filterRecordsForCycle = (records, filters, semesterOverride = "") => {
  return records.filter((record) => {
    const semesterValue = semesterOverride || filters.semester;

    if (semesterValue && record.semester !== semesterValue) {
      return false;
    }

    if (filters.session && record.session !== filters.session) {
      return false;
    }

    if (filters.academicYear && String(record.year) !== filters.academicYear) {
      return false;
    }

    if (filters.status && normalizeStatus(record.status) !== filters.status) {
      return false;
    }

    const recordDate = toDateKey(record.date);

    if (!recordDate) {
      return false;
    }

    const startDate = toDateKey(filters.dateStart);
    const endDate = toDateKey(filters.dateEnd);

    if (startDate && recordDate < startDate) {
      return false;
    }

    if (endDate && recordDate > endDate) {
      return false;
    }

    return true;
  });
};

const buildSummary = (records) => {
  const totalAppeals = sumByKey(records, "count");
  const acceptedAppeals = sumByKey(records, "acceptedCount");
  const activeAppeals = sumByKey(records, "activeCount");
  const overdueAppeals = sumByKey(records, "overdueCount");
  const unassignedAppeals = sumByKey(records, "unassignedCount");
  const failToPassCount = sumByKey(records, "failToPassCount");

  return {
    totalAppeals,
    acceptanceRate: totalAppeals > 0 ? (acceptedAppeals / totalAppeals) * 100 : 0,
    avgResolutionMinutes: weightedAverage(records, "avgResolutionMinutes"),
    activeAppeals,
    overdueAppeals,
    unassignedAppeals,
    avgGradeChange: weightedAverage(records, "gradeChangeAverage"),
    failToPassCount,
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 260,
    easing: "easeOutQuart",
  },
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
  const countsBySemesterAndSession = records.reduce((accumulator, record) => {
    if (!accumulator[record.semester]) {
      accumulator[record.semester] = {};
    }

    accumulator[record.semester][record.session] = record.count;
    return accumulator;
  }, {});

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
      data: semesters.map((semester) => countsBySemesterAndSession[semester]?.[session] ?? 0),
      borderColor: colorBySession[session].borderColor,
      backgroundColor: colorBySession[session].backgroundColor,
      borderRadius: 8,
      borderWidth: 1.5,
    })),
  };
};

const normalizeStatus = (status) => {
  return String(status || "").toLowerCase() === "open" ? "Open" : "Closed";
};

const toMiniTone = (tone) => {
  return tone === "danger" || tone === "warning" ? "warn" : "cool";
};

const Appeals = () => {
  const [overviewChartsData, setOverviewChartsData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    semester: "",
    session: "",
    academicYear: "",
    status: "",
    dateStart: "",
    dateEnd: "",
  });

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

  const filteredRecords = useMemo(() => {
    return filterRecordsForCycle(sourceData, filters);
  }, [filters, sourceData]);

  const academicYearOptions = useMemo(() => {
    return Array.from(
      new Set(sourceData.map((record) => String(record.year || "")).filter(Boolean)),
    ).sort((left, right) => Number(right) - Number(left));
  }, [sourceData]);

  const activeSemester = useMemo(() => {
    return getActiveSemester(filteredRecords.length > 0 ? filteredRecords : sourceData, filters.semester);
  }, [filteredRecords, sourceData, filters.semester]);

  const activeCycleRecords = useMemo(() => {
    if (!activeSemester) {
      return filteredRecords;
    }

    return filterRecordsForCycle(sourceData, filters, activeSemester);
  }, [activeSemester, filters, sourceData, filteredRecords]);

  const previousSemester = useMemo(() => {
    const comparisonPool = filterRecordsForCycle(sourceData, {
      ...filters,
      semester: "",
    });

    return getPreviousSemester(comparisonPool, activeSemester);
  }, [activeSemester, filters, sourceData]);

  const previousCycleRecords = useMemo(() => {
    if (!previousSemester) {
      return [];
    }

    return filterRecordsForCycle(sourceData, filters, previousSemester);
  }, [filters, previousSemester, sourceData]);

  const currentSummary = useMemo(() => buildSummary(activeCycleRecords), [activeCycleRecords]);
  const previousSummary = useMemo(() => buildSummary(previousCycleRecords), [previousCycleRecords]);

  const chartData = useMemo(() => buildChartData(filteredRecords), [filteredRecords]);

  const activeCycleLabel = formatCycleLabel(activeSemester, filters.session || "");
  const previousCycleLabel = previousSemester
    ? formatCycleLabel(previousSemester, filters.session || "")
    : "";

  const totalAppealsDelta = currentSummary.totalAppeals - previousSummary.totalAppeals;
  const acceptanceDelta = currentSummary.acceptanceRate - previousSummary.acceptanceRate;
  const resolutionDelta = currentSummary.avgResolutionMinutes - previousSummary.avgResolutionMinutes;
  const gradeChangeDelta = currentSummary.avgGradeChange - previousSummary.avgGradeChange;

  const formatSigned = (value, digits = 1) => {
    const numericValue = Number(value) || 0;
    return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(digits)}`;
  };

  const kpiCards = useMemo(() => {
    const hasPreviousData = previousCycleRecords.length > 0;
    const comparisonSuffix = previousCycleLabel || "last cycle";

    return {
      core: [
        {
          label: "total appeals",
          value: currentSummary.totalAppeals,
          description: hasPreviousData
            ? `${formatSigned(totalAppealsDelta, 0)} vs ${comparisonSuffix}`
            : "No previous cycle data",
          tone: totalAppealsDelta >= 0 ? "warning" : "positive",
        },
        {
          label: "acceptance rate",
          value: Number(currentSummary.acceptanceRate.toFixed(1)),
          suffix: "%",
          description: hasPreviousData
            ? `${formatSigned(acceptanceDelta, 1)} from ${comparisonSuffix}`
            : "No previous cycle data",
          tone: acceptanceDelta >= 0 ? "positive" : "warning",
        },
        {
          label: "avg resolution time",
          value: Number(currentSummary.avgResolutionMinutes.toFixed(1)),
          suffix: " min",
          description: hasPreviousData
            ? resolutionDelta <= 0
              ? `Faster than ${comparisonSuffix} by ${Math.abs(resolutionDelta).toFixed(1)} min`
              : `Slower than ${comparisonSuffix} by ${resolutionDelta.toFixed(1)} min`
            : "No previous cycle data",
          tone: resolutionDelta <= 0 ? "positive" : "warning",
        },
        {
          label: "active appeals",
          value: currentSummary.activeAppeals,
          description: hasPreviousData
            ? `${formatSigned(currentSummary.activeAppeals - previousSummary.activeAppeals, 0)} vs ${comparisonSuffix}`
            : "Current workload snapshot",
          tone: currentSummary.activeAppeals > 0 ? "warning" : "positive",
        },
      ],
      risk: [
        {
          title: "Overdue Appeals",
          value: currentSummary.overdueAppeals,
          description: "Appeals that exceeded the allowed turnaround time",
          footer: currentSummary.overdueAppeals > 0 ? "Escalate immediately" : "Within maximum resolution time",
          tone: currentSummary.overdueAppeals > 0 ? "danger" : "positive",
        },
        {
          title: "Unassigned Appeals",
          value: currentSummary.unassignedAppeals,
          description: "Appeals not yet assigned to a module leader",
          footer: currentSummary.unassignedAppeals > 0 ? "Assignment gap detected" : "Fully assigned",
          tone: currentSummary.unassignedAppeals > 0 ? "warning" : "positive",
        },
        {
          title: "Avg Grade Change",
          value: currentSummary.avgGradeChange.toFixed(1),
          suffix: " marks",
          description: "Average score movement after appeal review",
          footer: hasPreviousData
            ? `${formatSigned(gradeChangeDelta, 1)} vs ${comparisonSuffix}`
            : "No previous cycle data",
          tone: gradeChangeDelta >= 0 ? "positive" : "warning",
        },
        {
          title: "Fail then Pass Count",
          value: currentSummary.failToPassCount,
          description: "Students who moved from failing to passing after appeal",
          footer: "Direct academic impact of the appeals process",
          tone: currentSummary.failToPassCount > 0 ? "positive" : "neutral",
        },
      ],
    };
  }, [
    currentSummary.activeAppeals,
    currentSummary.acceptanceRate,
    currentSummary.avgGradeChange,
    currentSummary.avgResolutionMinutes,
    currentSummary.failToPassCount,
    currentSummary.overdueAppeals,
    currentSummary.totalAppeals,
    currentSummary.unassignedAppeals,
    acceptanceDelta,
    gradeChangeDelta,
    previousCycleLabel,
    previousCycleRecords.length,
    previousSummary.activeAppeals,
    resolutionDelta,
    totalAppealsDelta,
  ]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleFilterChange = (filterKey) => (event) => {
    const value = event.target.value;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterKey]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      semester: "",
      session: "",
      academicYear: "",
      status: "",
      dateStart: "",
      dateEnd: "",
    });
  };

  return (
    <div className="appeals-page page-cont">
      <div className="info">
        <h1>Appeals Analytics</h1>
        <p>Filter the appeal workload by semester, assessment, and status.</p>
      </div>
      <div className="filterHeader" aria-label="Appeals filters">
        <div className="appeals-filter-bar">
          <label className="appeals-filter-field">
            <span>Semester</span>
            <select value={filters.semester} onChange={handleFilterChange("semester")}>
              {SEMESTER_OPTIONS.map((option) => (
                <option key={option.value || "all-semesters"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="appeals-filter-field">
            <span>Assessment</span>
            <select value={filters.session} onChange={handleFilterChange("session")}>
              {SESSION_OPTIONS.map((option) => (
                <option key={option.value || "all-sessions"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="appeals-filter-field">
            <span>Academic Year</span>
            <select
              value={filters.academicYear}
              onChange={handleFilterChange("academicYear")}
            >
              <option value="">All Academic Years</option>
              {academicYearOptions.map((academicYear) => (
                <option key={academicYear} value={academicYear}>
                  {academicYear}
                </option>
              ))}
            </select>
          </label>

          <label className="appeals-filter-field">
            <span>Status</span>
            <select value={filters.status} onChange={handleFilterChange("status")}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all-statuses"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="appeals-filter-actions">
            <div className="appeals-filter-count">
              {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
            </div>
            <button
              type="button"
              className="appeals-filter-reset"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear filters
            </button>
          </div>
        </div>
        <div className="appeals-date-row">
          <label className="appeals-filter-field appeals-date-field">
            <span>Date From</span>
            <input
              type="date"
              value={filters.dateStart}
              onChange={handleFilterChange("dateStart")}
            />
          </label>

          <label className="appeals-filter-field appeals-date-field">
            <span>Date To</span>
            <input
              type="date"
              value={filters.dateEnd}
              onChange={handleFilterChange("dateEnd")}
            />
          </label>
        </div>
      </div>

      <section className="appeals-kpi-section">
        <div className="appeals-kpi-grid">
          {kpiCards.core.map((card) => (
            <MiniMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              suffix={card.suffix}
              description={card.description}
              tone={toMiniTone(card.tone)}
            />
          ))}
        </div>

        <div className="appeals-kpi-grid">
          {kpiCards.risk.map((card) => (
            <AppealKpiCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <div className="section">

        {error ? (
          <p className="appeals-error">{error}</p>
        ) : (
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={chartData}
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

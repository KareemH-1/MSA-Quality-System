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
import {Search , SearchCheck , SearchX} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const TERM_ORDER = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

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

const buildAppealsRecords = (appealsData, overviewData) => {
  const appealRecords = Array.isArray(appealsData?.appealRecords)
    ? appealsData.appealRecords
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

  const midtermTotals = appealsData?.totals?.midterm || {};
  const finalTotals = appealsData?.totals?.final || {};
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

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;

const normalizeToDate = (value) => {
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

const startOfWeek = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getSessionWindow = (record, appealsData, overviewData) => {
  const sessionKey = String(record.session || "").toLowerCase();
  const currentSemester = overviewData?.semester?.current;
  const previousSemester = overviewData?.semester?.previous;
  const recordSessionWindowKey = `${record.semester}::${record.session}`;

  let sessionMeta = null;
  const sessionWindowFromAppeals = appealsData?.sessionWindows?.[recordSessionWindowKey] || null;

  if (record.semester === currentSemester) {
    sessionMeta = overviewData?.appeals?.[sessionKey];
  } else if (record.semester === previousSemester) {
    sessionMeta = overviewData?.previousSemesterData?.appeals?.[sessionKey];
  }

  const fallbackStart = normalizeToDate(record.date) || new Date();
  const startedAt = normalizeToDate(sessionWindowFromAppeals?.startedAt)
    || normalizeToDate(sessionMeta?.startedAt)
    || fallbackStart;

  const isOpen =
    sessionWindowFromAppeals?.isOpen
    ?? sessionMeta?.isOpen
    ?? false;

  const endedAt = isOpen
    ? null
    : normalizeToDate(sessionWindowFromAppeals?.endedAt)
    || normalizeToDate(sessionMeta?.endedAt);

  const fallbackEnd = normalizeToDate(record.date) || normalizeToDate(new Date());
  const endDate = isOpen ? normalizeToDate(new Date()) : (endedAt || fallbackEnd);

  if (endDate < startedAt) {
    return {
      start: startedAt,
      end: startedAt,
    };
  }

  return {
    start: startedAt,
    end: endDate,
  };
};

const buildWeeklyAppealsChartData = (records, appealsData, overviewData) => {
  if (!records.length) {
    return null;
  }

  const weekTotals = new Map();

  records.forEach((record) => {
    const { start, end } = getSessionWindow(record, appealsData, overviewData);
    const rangeMs = Math.max(end.getTime() - start.getTime(), 0);
    const weekCount = Math.max(Math.ceil((rangeMs + DAY_IN_MS) / WEEK_IN_MS), 1);
    const countPerWeek = (Number(record.count) || 0) / weekCount;

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const weekDate = new Date(start.getTime() + weekIndex * WEEK_IN_MS);
      const weekStart = startOfWeek(weekDate);
      const weekKey = weekStart.toISOString().slice(0, 10);
      weekTotals.set(weekKey, (weekTotals.get(weekKey) || 0) + countPerWeek);
    }
  });

  const sortedWeeks = Array.from(weekTotals.entries()).sort(
    ([left], [right]) => new Date(left).getTime() - new Date(right).getTime(),
  );

  return {
    labels: sortedWeeks.map(([weekKey]) => {
      const date = new Date(weekKey);
      return `${date.toLocaleString("en-US", { month: "short" })} ${String(date.getDate()).padStart(2, "0")}`;
    }),
    datasets: [
      {
        label: "Appeals",
        data: sortedWeeks.map(([, value]) => Math.round(value)),
        backgroundColor: "rgba(120, 128, 140, 0.82)",
        borderColor: "rgba(65, 76, 92, 0.95)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
};

const weeklyAppealsChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y.toLocaleString()} appeals`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#7d8796",
        font: {
          size: 10,
          weight: "700",
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(23, 53, 79, 0.08)",
      },
      ticks: {
        color: "#7d8796",
        precision: 0,
      },
    },
  },
};

const normalizeStatus = (status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "open") {
    return "Open";
  }

  if (normalizedStatus === "closed") {
    return "Closed";
  }

  if (normalizedStatus === "not started" || normalizedStatus === "not-started") {
    return "Not Started";
  }

  return "Closed";
};

const getStatusClassName = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "open") {
    return "is-open";
  }

  if (normalizedStatus === "closed") {
    return "is-closed";
  }

  return "is-not-started";
};

const toMiniTone = (tone) => {
  return tone === "danger" || tone === "warning" ? "warn" : "cool";
};

const normalizeSearchText = (value) => String(value || "").trim().toLowerCase();

const getCourseMatchScore = (course, query) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const code = normalizeSearchText(course.code);
  const name = normalizeSearchText(course.name);
  const combined = `${code} ${name}`;

  if (code === normalizedQuery || name === normalizedQuery) {
    return 150;
  }

  if (code.startsWith(normalizedQuery) || name.startsWith(normalizedQuery)) {
    return 120;
  }

  if (code.includes(normalizedQuery) || name.includes(normalizedQuery)) {
    return 90;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const matchingTokens = queryTokens.filter((token) => combined.includes(token)).length;

  if (matchingTokens > 0) {
    return 55 + matchingTokens * 8;
  }

  return 0;
};

const getTrendDirection = (delta, invert = false) => {
  const numericDelta = Number(delta) || 0;

  if (Math.abs(numericDelta) < 0.05) {
    return "same";
  }

  if (invert) {
    return numericDelta < 0 ? "up" : "down";
  }

  return numericDelta > 0 ? "up" : "down";
};

const Appeals = () => {
  const [appealsData, setAppealsData] = useState(null);
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
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [courseSearchText, setCourseSearchText] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    const fetchAppealsData = async () => {
      try {
        const [appealsResponse, overviewResponse] = await Promise.all([
          fetch("/appealsMockData.json"),
          fetch("/mockOverviewData.json"),
        ]);

        if (!appealsResponse.ok) {
          throw new Error(`Failed to load appeals data: ${appealsResponse.status}`);
        }

        if (!overviewResponse.ok) {
          throw new Error(`Failed to load overview data for filters: ${overviewResponse.status}`);
        }

        const [appealsDataResponse, overviewDataResponse] = await Promise.all([
          appealsResponse.json(),
          overviewResponse.json(),
        ]);

        setAppealsData(appealsDataResponse);
        setOverviewData(overviewDataResponse);
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load appeals data.");
      }
    };

    fetchAppealsData();
  }, []);

  const sourceData = useMemo(
    () => buildAppealsRecords(appealsData, overviewData),
    [appealsData, overviewData],
  );

  const filteredRecords = useMemo(() => {
    return filterRecordsForCycle(sourceData, filters);
  }, [filters, sourceData]);

  const academicYearOptions = useMemo(() => {
    return Array.from(
      new Set(sourceData.map((record) => String(record.year || "")).filter(Boolean)),
    ).sort((left, right) => Number(right) - Number(left));
  }, [sourceData]);

  const semesterOptions = useMemo(() => {
    const semesters = Array.from(
      new Set(sourceData.map((record) => record.semester).filter(Boolean)),
    ).sort(sortSemesters);

    return [
      { label: "All Semesters", value: "" },
      ...semesters.map((semester) => ({
        label: formatSemesterLabel(semester),
        value: semester,
      })),
    ];
  }, [sourceData]);

  const sessionOptions = useMemo(() => {
    const sessions = Array.from(new Set(sourceData.map((record) => record.session).filter(Boolean)));
    const preferredOrder = ["Midterm", "Final"];

    sessions.sort((left, right) => {
      const leftIndex = preferredOrder.indexOf(left);
      const rightIndex = preferredOrder.indexOf(right);

      if (leftIndex !== -1 && rightIndex !== -1) {
        return leftIndex - rightIndex;
      }

      if (leftIndex !== -1) {
        return -1;
      }

      if (rightIndex !== -1) {
        return 1;
      }

      return left.localeCompare(right);
    });

    return [
      { label: "All Assessments", value: "" },
      ...sessions.map((session) => ({
        label: session,
        value: session,
      })),
    ];
  }, [sourceData]);

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(sourceData.map((record) => normalizeStatus(record.status)).filter(Boolean)),
    );
    const preferredOrder = ["Open", "Closed", "Not Started"];

    statuses.sort((left, right) => {
      const leftIndex = preferredOrder.indexOf(left);
      const rightIndex = preferredOrder.indexOf(right);

      if (leftIndex !== -1 && rightIndex !== -1) {
        return leftIndex - rightIndex;
      }

      if (leftIndex !== -1) {
        return -1;
      }

      if (rightIndex !== -1) {
        return 1;
      }

      return left.localeCompare(right);
    });

    return [
      { label: "All Statuses", value: "" },
      ...statuses.map((status) => ({
        label: status,
        value: status,
      })),
    ];
  }, [sourceData]);

  const courseCatalog = useMemo(() => {
    const courses = Array.isArray(appealsData?.courseCatalog) ? appealsData.courseCatalog : [];
    return courses.map((course) => ({
      ...course,
      id: course.id || course.code,
    }));
  }, [appealsData]);

  const facultyOptions = useMemo(() => {
    const faculties = Array.from(new Set(courseCatalog.map((course) => course.faculty).filter(Boolean))).sort(
      (left, right) => left.localeCompare(right),
    );

    return [{ label: "All Faculties", value: "" }, ...faculties.map((faculty) => ({ label: faculty, value: faculty }))];
  }, [courseCatalog]);

  const courseDropdownOptions = useMemo(() => {
    const facultyScopedCourses = selectedFaculty
      ? courseCatalog.filter((course) => course.faculty === selectedFaculty)
      : courseCatalog;

    const rankedCourses = [...facultyScopedCourses].sort((left, right) => {
      const scoreDiff = getCourseMatchScore(right, courseSearchText) - getCourseMatchScore(left, courseSearchText);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return left.code.localeCompare(right.code);
    });

    return rankedCourses;
  }, [courseCatalog, courseSearchText, selectedFaculty]);

  const closestCourse = useMemo(() => {
    if (!courseSearchText.trim()) {
      return null;
    }

    const [firstCourse] = courseDropdownOptions;

    if (!firstCourse || getCourseMatchScore(firstCourse, courseSearchText) <= 0) {
      return null;
    }

    return firstCourse;
  }, [courseDropdownOptions, courseSearchText]);

  useEffect(() => {
    if (closestCourse) {
      setSelectedCourseId(closestCourse.id);
    }
  }, [closestCourse]);

  const hasCourseInput = Boolean(courseSearchText.trim());
  const hasCourseSelection = Boolean(selectedCourseId);
  const shouldSearchByCourse = hasCourseInput;
  const isCourseSearchDisabled = !selectedFaculty && !hasCourseSelection && !hasCourseInput;

  const handleCourseSearch = () => {
    if (isCourseSearchDisabled) {
      return;
    }

    if (!shouldSearchByCourse) {
      return;
    }

    const nextCourse = closestCourse || courseDropdownOptions[0] || null;

    if (!nextCourse) {
      return;
    }

    setSelectedCourseId(nextCourse.id);
    setCourseSearchText(`${nextCourse.code} ${nextCourse.name}`);
  };

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
          trend: hasPreviousData ? getTrendDirection(totalAppealsDelta) : "same",
        },
        {
          label: "acceptance rate",
          value: Number(currentSummary.acceptanceRate.toFixed(1)),
          suffix: "%",
          description: hasPreviousData
            ? `${formatSigned(acceptanceDelta, 1)} from ${comparisonSuffix}`
            : "No previous cycle data",
          tone: acceptanceDelta >= 0 ? "positive" : "warning",
          trend: hasPreviousData ? getTrendDirection(acceptanceDelta) : "same",
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
          trend: hasPreviousData ? getTrendDirection(resolutionDelta, true) : "same",
        },
        {
          label: "active appeals",
          value: currentSummary.activeAppeals,
          description: hasPreviousData
            ? `${formatSigned(currentSummary.activeAppeals - previousSummary.activeAppeals, 0)} vs ${comparisonSuffix}`
            : "Current workload snapshot",
          tone: currentSummary.activeAppeals > 0 ? "warning" : "positive",
          trend: hasPreviousData
            ? getTrendDirection(currentSummary.activeAppeals - previousSummary.activeAppeals, true)
            : "same",
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
          trend: hasPreviousData ? getTrendDirection(gradeChangeDelta) : "same",
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
  const midtermStatus = getStatusFromSessionData(overviewData?.appeals?.midterm);
  const finalStatus = getStatusFromSessionData(overviewData?.appeals?.final);

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

  const firstColMetrics = useMemo(() => {
    const currentVolume = sumByKey(activeCycleRecords, "count");
    const previousVolume = sumByKey(previousCycleRecords, "count");
    const growthPercent = previousVolume > 0
      ? ((currentVolume - previousVolume) / previousVolume) * 100
      : 0;

    const currentResolution = currentSummary.avgResolutionMinutes;
    const previousResolution = previousSummary.avgResolutionMinutes;
    const speedChangePercent = previousResolution > 0
      ? ((currentResolution - previousResolution) / previousResolution) * 100
      : 0;

    const approvedCount = sumByKey(activeCycleRecords, "acceptedCount");
    const pendingCount = sumByKey(activeCycleRecords, "pendingCount") + sumByKey(activeCycleRecords, "inProgressCount");
    const rejectedCount = Math.max(currentVolume - approvedCount - pendingCount, 0);
    const safeTotal = currentVolume > 0 ? currentVolume : 1;

    const trendWidth = (value) => {
      const absoluteValue = Math.abs(Number(value) || 0);
      return Math.max(8, Math.min(absoluteValue, 100));
    };

    const weeklyChartData = buildWeeklyAppealsChartData(activeCycleRecords, appealsData, overviewData);

    return {
      currentSemesterLabel: formatSemesterLabel(activeSemester || "").toUpperCase(),
      previousSemesterLabel: previousSemester ? formatSemesterLabel(previousSemester).toUpperCase() : "NO BASELINE",
      currentVolume,
      previousVolume,
      growthPercent,
      growthWidth: trendWidth(growthPercent),
      currentResolution,
      previousResolution,
      speedChangePercent,
      speedWidth: trendWidth(speedChangePercent),
      statusItems: [
        {
          key: "approved",
          label: "Approved",
          value: approvedCount,
          subtitle: `${approvedCount.toLocaleString()} cases updated`,
          percent: (approvedCount / safeTotal) * 100,
        },
        {
          key: "rejected",
          label: "Rejected",
          value: rejectedCount,
          subtitle: `${rejectedCount.toLocaleString()} cases upheld`,
          percent: (rejectedCount / safeTotal) * 100,
        },
        {
          key: "pending",
          label: "Pending",
          value: pendingCount,
          subtitle: `${pendingCount.toLocaleString()} in queue`,
          percent: (pendingCount / safeTotal) * 100,
        },
      ],
      weeklyChartData,
    };
  }, [
    activeCycleRecords,
    activeSemester,
    appealsData,
    currentSummary.avgResolutionMinutes,
    overviewData,
    previousCycleRecords,
    previousSemester,
    previousSummary.avgResolutionMinutes,
  ]);

  return (
    <div className="appeals-page page-cont">
      <div className="appeals-top-header">
      <div className="info">
        <h1>Appeals Analytics</h1>
        <p>Filter the appeal workload by semester, assessment, and status.</p>
      </div>
      <div className="appeals-status-panel">
        <h2>Assessment status</h2>
        <div className="appeals-status-items">
          <div className="appeals-status-item">
            <span className="appeals-status-label">Midterm</span>
            <span className={`appeals-status-badge ${getStatusClassName(midtermStatus)}`}>
              {midtermStatus}
            </span>
          </div>
          <div className="appeals-status-item">
            <span className="appeals-status-label">Final</span>
            <span className={`appeals-status-badge ${getStatusClassName(finalStatus)}`}>
              {finalStatus}
            </span>
          </div>
        </div>
      </div>
      </div>
      <div className="filterHeader" aria-label="Appeals filters">
        <div className="appeals-filter-bar">
          <label className="appeals-filter-field">
            <span>Semester</span>
            <select value={filters.semester} onChange={handleFilterChange("semester")}>
              {semesterOptions.map((option) => (
                <option key={option.value || "all-semesters"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="appeals-filter-field">
            <span>Assessment</span>
            <select value={filters.session} onChange={handleFilterChange("session")}>
              {sessionOptions.map((option) => (
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
              {statusOptions.map((option) => (
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
              trend={card.trend}
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

      <div className="section ">

        {error ? (
          <p className="appeals-error">{error}</p>
        ) : (
          <Chart
            className="appeals-chart-shell first-chart"
            ChartComponent={Bar}
            data={chartData}
            title="Midterm vs Final Appeals"
            subtitle="Semester-wise appeal totals"
            chartProps={{ options: chartOptions }}
            emptyMessage="No records found for the selected filters."
          />
        )}
      </div>
      <div className="appeals-contrast-section">
        <div className="appeals-first-col">
          <div className="appeals-contrast-grid">
            <article className="appeals-insight-card">
              <div className="appeals-insight-head">
                <h3>Semester Contrast</h3>
                <span className="appeals-insight-badge">Volume Metrics</span>
              </div>

              <div className="appeals-insight-values">
                <div>
                  <p>{firstColMetrics.currentSemesterLabel} (CURRENT)</p>
                  <strong>{firstColMetrics.currentVolume.toLocaleString()}</strong>
                </div>
                <div className="is-muted">
                  <p>{firstColMetrics.previousSemesterLabel}</p>
                  <strong>{firstColMetrics.previousVolume.toLocaleString()}</strong>
                </div>
              </div>

              <div className="appeals-progress-wrap">
                <div className="appeals-progress-label">
                  <span>Growth Intensity</span>
                  <span className={firstColMetrics.growthPercent >= 0 ? "is-up" : "is-down"}>
                    {firstColMetrics.growthPercent >= 0 ? "+" : ""}{firstColMetrics.growthPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="appeals-progress-track">
                  <div
                    className={`appeals-progress-fill ${firstColMetrics.growthPercent >= 0 ? "is-up" : "is-down"}`}
                    style={{ width: `${firstColMetrics.growthWidth}%` }}
                  />
                </div>
              </div>
            </article>

            <article className="appeals-insight-card">
              <div className="appeals-insight-head">
                <h3>Efficiency in Resolution Time</h3>
                <span className="appeals-insight-badge">Resolution Speed</span>
              </div>

              <div className="appeals-insight-values">
                <div>
                  <p>{firstColMetrics.currentSemesterLabel}</p>
                  <strong>{firstColMetrics.currentResolution.toFixed(1)}m</strong>
                </div>
                <div className="is-muted">
                  <p>{firstColMetrics.previousSemesterLabel}</p>
                  <strong>{firstColMetrics.previousResolution.toFixed(1)}m</strong>
                </div>
              </div>

              <div className="appeals-progress-wrap">
                <div className="appeals-progress-label">
                  <span>Processing Speed Improvement</span>
                  <span className={firstColMetrics.speedChangePercent <= 0 ? "is-up" : "is-down"}>
                    {firstColMetrics.speedChangePercent >= 0 ? "+" : ""}{firstColMetrics.speedChangePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="appeals-progress-track">
                  <div
                    className={`appeals-progress-fill ${firstColMetrics.speedChangePercent <= 0 ? "is-up" : "is-down"}`}
                    style={{ width: `${firstColMetrics.speedWidth}%` }}
                  />
                </div>
              </div>
            </article>
          </div>

          <div className="appeals-bottom-grid">
            <article className="appeals-status-weight-card">
              <h3>Status Weighting</h3>
              {firstColMetrics.statusItems.map((item) => (
                <div key={item.key} className={`appeals-status-row ${item.key}`}>
                  <div className="appeals-status-percent">{item.percent.toFixed(0)}%</div>
                  <div className="appeals-status-copy">
                    <h4>{item.label}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </article>

            <article className="appeals-temporal-card">
              <div className="appeals-temporal-head">
                <h3>Total appeals per week</h3>
                <span>Volume</span>
              </div>
              <div className="appeals-temporal-chart">
                {firstColMetrics.weeklyChartData ? (
                  <Bar data={firstColMetrics.weeklyChartData} options={weeklyAppealsChartOptions} />
                ) : (
                  <p className="appeals-empty-note">No weekly appeal data available.</p>
                )}
              </div>
            </article>
          </div>
        </div>
        <div className="appeals-second-col">
          <div className="AppealsByCourse">
            <div className="backgroundSVG">
              {courseDropdownOptions.length === 0 || isCourseSearchDisabled
              ? <SearchX/>
               :<SearchCheck/>}
            </div>
            <h1>Find appeal trends by course/Faculty</h1>

            <label htmlFor="faculty-select">Choose Faculty:</label>
            <select
              id="faculty-select"
              value={selectedFaculty}
              onChange={(event) => setSelectedFaculty(event.target.value)}
            >
              {facultyOptions.map((option) => (
                <option key={option.value || "all-faculties"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label htmlFor="course-type-search">Course Name:</label>
            <div className="course-combo">
              <input
                type="text"
                id="course-type-search"
                name="course-type-search"
                value={courseSearchText}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCourseSearchText(nextValue);

                  if (!nextValue.trim()) {
                    setSelectedCourseId("");
                  }
                }}
                placeholder="e.g. Data Structures or CS203"
              />

              <span className="course-combo-separator" aria-hidden="true" />
              <button
                type="button"
                className="course-combo-trigger"
                tabIndex={-1}
                aria-hidden="true"
              >
                v
              </button>

              <select
                id="course-dropdown"
                className="course-combo-native"
                value={selectedCourseId || ""}
                onChange={(event) => {
                  const nextCourseId = event.target.value;
                  setSelectedCourseId(nextCourseId);

                  if (!nextCourseId) {
                    setCourseSearchText("");
                    return;
                  }

                  const nextCourse = courseCatalog.find((course) => course.id === nextCourseId);

                  if (nextCourse) {
                    setCourseSearchText(`${nextCourse.code} ${nextCourse.name}`);
                  }
                }}
                aria-label="Course dropdown"
              >
                <option value="">Select course</option>
                {courseDropdownOptions.map((course, index) => {
                  const isClosest = closestCourse?.id === course.id && index === 0;
                  return (
                    <option key={course.id} value={course.id}>
                      {isClosest ? "Closest - " : ""}
                      {course.code} - {course.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="course-search-btn"
              onClick={handleCourseSearch}
              disabled={courseDropdownOptions.length === 0 || isCourseSearchDisabled}
            >
              {shouldSearchByCourse ? "Search by course" : "Search by faculty"}
            </button>
          </div>
        </div>
        </div>
    </div>
  );
};

export default Appeals;

import React, { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { ArrowLeft } from "lucide-react";
import Chart from "../Chart";
import AppealKpiCard from "../cards/AppealKpiCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import "./styles/SearchCourseAppeal.css"; // reuse the same layout styles

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Tooltip, Legend, Title,
);

/* ---------------- helpers (same idioms as SearchCourseAppeal) ---------------- */
const TERM_ORDER = { SPRING: 1, SUMMER: 2, FALL: 3 };

const parseSemester = (semester) => {
  const [y, t] = String(semester || "").split("-");
  return { year: Number(y) || 0, term: (t || "").toUpperCase() };
};

const sortSemesters = (a, b) => {
  const A = parseSemester(a);
  const B = parseSemester(b);
  if (A.year !== B.year) return A.year - B.year;
  return (TERM_ORDER[A.term] || 99) - (TERM_ORDER[B.term] || 99);
};

const formatSemesterLabel = (semester) => {
  const { term, year } = parseSemester(semester);
  if (!term) return "";
  return `${term.charAt(0)}${term.slice(1).toLowerCase()} ${year}`;
};

const sum = (arr) => arr.reduce((s, v) => s + (Number(v) || 0), 0);

const safeAverage = (arr) =>
  arr.length ? sum(arr) / arr.length : 0;

/** Weighted average — used so a course with 300 appeals counts more than one with 30 */
const weightedAverage = (items, valueKey, weightKey = "totalAppeals") => {
  const totalWeight = sum(items.map((i) => i[weightKey]));
  if (totalWeight <= 0) return 0;
  return sum(items.map((i) => (Number(i[valueKey]) || 0) * (Number(i[weightKey]) || 0))) / totalWeight;
};

const pct = (num, den, digits = 0) =>
  den > 0 ? ((num / den) * 100).toFixed(digits) : "0";

const signed = (n, digits = 1) => {
  const v = Number(n) || 0;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;
};

/** Roll up an array of {semester, count}[] entries from many courses into one summed series */
const aggregateBySemester = (courses) => {
  const map = new Map();
  courses.forEach((c) => {
    (c.appealsBySemester || []).forEach((r) => {
      const key = r.semester;
      map.set(key, (map.get(key) || 0) + (Number(r.count) || 0));
    });
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => sortSemesters(a, b))
    .map(([semester, count]) => ({ semester, count }));
};

/** Roll up weekly arrays — assumes "Week 1", "Week 2"... aligned across courses */
const aggregateWeekly = (courses) => {
  const map = new Map();
  courses.forEach((c) => {
    (c.weeklyAppeals || []).forEach((w) => {
      const key = w.week || "Week";
      map.set(key, (map.get(key) || 0) + (Number(w.count) || 0));
    });
  });
  // preserve natural week order
  return Array.from(map.entries()).map(([week, count]) => ({ week, count }));
};

/** Build a per-faculty rollup so we can rank and compare faculties */
const buildFacultyRollups = (catalog) => {
  const groups = new Map();
  catalog.forEach((c) => {
    const key = c.faculty || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  });
  return Array.from(groups.entries()).map(([faculty, courses]) => ({
    faculty,
    courses,
    totalAppeals:        sum(courses.map((c) => c.totalAppeals)),
    openAppeals:         sum(courses.map((c) => c.openAppeals)),
    lastWeekAppeals:     sum(courses.map((c) => c.lastWeekAppeals)),
    acceptanceRate:      weightedAverage(courses, "acceptanceRate"),
    avgResolutionMinutes:weightedAverage(courses, "avgResolutionMinutes"),
    midtermTotal:        sum(courses.map((c) => c.midtermAppeals?.total || 0)),
    midtermOpen:         sum(courses.map((c) => c.midtermAppeals?.open  || 0)),
    midtermClosed:       sum(courses.map((c) => c.midtermAppeals?.closed|| 0)),
    midtermAccepted:     sum(courses.map((c) => c.midtermAppeals?.accepted || 0)),
    finalTotal:          sum(courses.map((c) => c.finalAppeals?.total || 0)),
    finalOpen:           sum(courses.map((c) => c.finalAppeals?.open  || 0)),
    finalClosed:         sum(courses.map((c) => c.finalAppeals?.closed|| 0)),
    finalAccepted:       sum(courses.map((c) => c.finalAppeals?.accepted || 0)),
  }));
};

/* ============================================================
   COMPONENT
   ============================================================ */
const SearchFacultyAppeal = ({
  faculty,           // string — can be "" meaning "All Faculties"
  onBack,
  courseCatalog = [],
  appealsData = {},  // currently unused but accepted for API parity
}) => {
  const isAllFaculties = !faculty;
  const facultyName    = isAllFaculties ? "All Faculties" : faculty;

  /* ---- which courses belong to this view ---- */
  const facultyCourses = useMemo(
    () => (isAllFaculties ? courseCatalog : courseCatalog.filter((c) => c.faculty === faculty)),
    [courseCatalog, faculty, isAllFaculties],
  );

  /* ---- core aggregates ---- */
  const total          = useMemo(() => sum(facultyCourses.map((c) => c.totalAppeals)), [facultyCourses]);
  const open           = useMemo(() => sum(facultyCourses.map((c) => c.openAppeals)), [facultyCourses]);
  const closed         = Math.max(total - open, 0);
  const lastWeek       = useMemo(() => sum(facultyCourses.map((c) => c.lastWeekAppeals)), [facultyCourses]);
  const acceptanceRate = useMemo(() => weightedAverage(facultyCourses, "acceptanceRate"), [facultyCourses]);
  const avgResolution  = useMemo(() => weightedAverage(facultyCourses, "avgResolutionMinutes"), [facultyCourses]);
  const courseCount    = facultyCourses.length;

  /* ---- midterm / final rollup ---- */
  const midterm = useMemo(() => ({
    total:    sum(facultyCourses.map((c) => c.midtermAppeals?.total    || 0)),
    open:     sum(facultyCourses.map((c) => c.midtermAppeals?.open     || 0)),
    closed:   sum(facultyCourses.map((c) => c.midtermAppeals?.closed   || 0)),
    accepted: sum(facultyCourses.map((c) => c.midtermAppeals?.accepted || 0)),
  }), [facultyCourses]);

  const final = useMemo(() => ({
    total:    sum(facultyCourses.map((c) => c.finalAppeals?.total    || 0)),
    open:     sum(facultyCourses.map((c) => c.finalAppeals?.open     || 0)),
    closed:   sum(facultyCourses.map((c) => c.finalAppeals?.closed   || 0)),
    accepted: sum(facultyCourses.map((c) => c.finalAppeals?.accepted || 0)),
  }), [facultyCourses]);

  const midtermAcceptanceRate = pct(midterm.accepted, midterm.total, 1);
  const finalAcceptanceRate   = pct(final.accepted, final.total, 1);

  /* ---- university benchmarks (whole catalog) ---- */
  const universityAvg = useMemo(() => ({
    totalPerCourse:  safeAverage(courseCatalog.map((c) => c.totalAppeals)),
    acceptance:      weightedAverage(courseCatalog, "acceptanceRate"),
    resolution:      weightedAverage(courseCatalog, "avgResolutionMinutes"),
    totalAllCourses: sum(courseCatalog.map((c) => c.totalAppeals)),
  }), [courseCatalog]);

  /* ---- faculty rollup table for ranking & leaderboard ---- */
  const facultyRollups = useMemo(() => buildFacultyRollups(courseCatalog), [courseCatalog]);

  const facultyRank = useMemo(() => {
    if (isAllFaculties) return { rank: "—", outOf: facultyRollups.length };
    const sorted = [...facultyRollups].sort((a, b) => b.totalAppeals - a.totalAppeals);
    const idx = sorted.findIndex((f) => f.faculty === faculty);
    return { rank: idx >= 0 ? idx + 1 : "—", outOf: sorted.length };
  }, [facultyRollups, faculty, isAllFaculties]);

  /* ---- deltas vs university average (per-course basis to be fair) ---- */
  const totalPerCourse  = courseCount > 0 ? total / courseCount : 0;
  const totalDelta      = totalPerCourse - universityAvg.totalPerCourse;
  const acceptanceDelta = acceptanceRate - universityAvg.acceptance;
  const resolutionDelta = avgResolution - universityAvg.resolution;

  const totalTrend      = totalDelta > 0 ? "up" : totalDelta < 0 ? "down" : "same";
  const acceptanceTrend = acceptanceDelta > 0 ? "up" : acceptanceDelta < 0 ? "down" : "same";
  // For resolution, lower is better → invert
  const resolutionTrend = resolutionDelta > 0 ? "down" : resolutionDelta < 0 ? "up" : "same";

  /* ============================================================
     CHART 1 — Status doughnut (open vs closed)
     ============================================================ */
  const statusChart = useMemo(() => {
    if (total === 0) return null;
    return {
      labels: ["Closed", "Open"],
      datasets: [{
        data: [closed, open],
        backgroundColor: ["rgba(46,160,67,0.85)", "rgba(178,43,29,0.85)"],
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 6,
      }],
    };
  }, [total, closed, open]);

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const p = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${ctx.parsed.toLocaleString()} (${p}%)`;
          },
        },
      },
    },
  };

  /* ============================================================
     CHART 2 — Midterm vs Final breakdown (grouped bar)
     ============================================================ */
  const sessionBreakdownChart = useMemo(() => {
    if (midterm.total === 0 && final.total === 0) return null;
    return {
      labels: ["Total", "Accepted", "Open", "Closed"],
      datasets: [
        {
          label: "Midterm",
          data: [midterm.total, midterm.accepted, midterm.open, midterm.closed],
          backgroundColor: "rgba(31,119,180,0.85)",
          borderRadius: 6,
        },
        {
          label: "Final",
          data: [final.total, final.accepted, final.open, final.closed],
          backgroundColor: "rgba(178,43,29,0.85)",
          borderRadius: 6,
        },
      ],
    };
  }, [midterm, final]);

  const sessionBreakdownOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Appeals" } },
    },
  };

  /* ============================================================
     CHART 3 — Faculty leaderboard (this faculty highlighted)
     ============================================================ */
  const leaderboardChart = useMemo(() => {
    if (!facultyRollups.length) return null;
    const sorted = [...facultyRollups].sort((a, b) => b.totalAppeals - a.totalAppeals);

    return {
      labels: sorted.map((f) => f.faculty),
      datasets: [{
        label: "Total appeals",
        data: sorted.map((f) => f.totalAppeals),
        backgroundColor: sorted.map((f) =>
          f.faculty === faculty ? "rgba(31,119,180,0.95)" : "rgba(120,128,140,0.55)"),
        borderColor: sorted.map((f) =>
          f.faculty === faculty ? "#1f77b4" : "rgba(120,128,140,0.7)"),
        borderWidth: sorted.map((f) => (f.faculty === faculty ? 2 : 1)),
        borderRadius: 6,
      }],
    };
  }, [facultyRollups, faculty]);

  const leaderboardOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.x.toLocaleString()} appeals` },
      },
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Total appeals" } },
      y: { ticks: { font: { size: 11, weight: "600" } } },
    },
  };

  /* ============================================================
     CHART 4 — Courses inside this faculty (or top across uni)
     ============================================================ */
  const coursesBreakdownChart = useMemo(() => {
    if (!facultyCourses.length) return null;
    const sorted = [...facultyCourses]
      .sort((a, b) => (b.totalAppeals || 0) - (a.totalAppeals || 0))
      .slice(0, 10); // show up to 10

    return {
      labels: sorted.map((c) => c.code),
      datasets: [
        {
          label: "Closed",
          data: sorted.map((c) => Math.max((c.totalAppeals || 0) - (c.openAppeals || 0), 0)),
          backgroundColor: "rgba(46,160,67,0.85)",
          borderRadius: 4,
        },
        {
          label: "Open",
          data: sorted.map((c) => c.openAppeals || 0),
          backgroundColor: "rgba(178,43,29,0.85)",
          borderRadius: 4,
        },
      ],
    };
  }, [facultyCourses]);

  const coursesBreakdownOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, title: { display: true, text: "Appeals" } },
      y: { stacked: true, ticks: { font: { size: 11, weight: "600" } } },
    },
  };

  /* ============================================================
     CHART 5 — Semester distribution (aggregated)
     ============================================================ */
  const distributionChart = useMemo(() => {
    const records = aggregateBySemester(facultyCourses);
    if (!records.length) return null;
    return {
      labels: records.map((r) => formatSemesterLabel(r.semester)),
      datasets: [{
        label: `${facultyName} · appeals by semester`,
        data: records.map((r) => r.count),
        backgroundColor: "rgba(31,119,180,0.75)",
        borderColor: "#1f77b4",
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [facultyCourses, facultyName]);

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} appeals` },
      },
    },
    scales: {
      x: { title: { display: true, text: "Semester" } },
      y: { beginAtZero: true, title: { display: true, text: "Appeals" } },
    },
  };

  /* ============================================================
     CHART 6 — Weekly trend (aggregated)
     ============================================================ */
  const trendChart = useMemo(() => {
    const records = aggregateWeekly(facultyCourses);
    if (!records.length) return null;
    return {
      labels: records.map((r) => r.week),
      datasets: [{
        label: `${facultyName} · weekly appeals`,
        data: records.map((r) => r.count),
        borderColor: "#1f77b4",
        backgroundColor: "rgba(31,119,180,0.18)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    };
  }, [facultyCourses, facultyName]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} appeals` },
      },
    },
    scales: {
      x: { title: { display: true, text: "Week" } },
      y: { beginAtZero: true, title: { display: true, text: "Weekly appeals" } },
    },
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="search-appeal-page">
      <div className="search-appeal-header">
        <button type="button" onClick={onBack} className="btn-back">
          <ArrowLeft size={16} /> Back to Appeals
        </button>
        <div className="search-appeal-titles">
          <span className="search-appeal-eyebrow">
            {isAllFaculties ? "University-wide" : "Faculty"}
          </span>
          <h2>{facultyName}</h2>
          <p>
            {courseCount} course{courseCount === 1 ? "" : "s"} · Midterm & Final breakdown
          </p>
        </div>
      </div>

      {/* ---------------- Overall KPI Cards ---------------- */}
      <section className="search-appeal-kpi-section">
        <div className="appeals-kpi-grid">
          <AppealKpiCard
            title="Total appeals"
            value={total}
            description={
              universityAvg.totalAllCourses > 0
                ? `${pct(total, universityAvg.totalAllCourses, 1)}% of university total`
                : "No comparison data"
            }
            footer={
              totalPerCourse > universityAvg.totalPerCourse
                ? "Higher per-course load"
                : "Below per-course avg"
            }
            tone={totalPerCourse > universityAvg.totalPerCourse ? "warning" : "positive"}
            trend={totalTrend}
          />
          <AppealKpiCard
            title="Acceptance rate"
            value={Number(acceptanceRate.toFixed(1))}
            suffix="%"
            description={
              universityAvg.acceptance > 0
                ? `${signed(acceptanceDelta, 1)}% vs university avg`
                : "No comparison data"
            }
            footer={
              acceptanceRate >= universityAvg.acceptance
                ? "Higher acceptance"
                : "Lower acceptance"
            }
            tone={acceptanceRate >= universityAvg.acceptance ? "positive" : "warning"}
            trend={acceptanceTrend}
          />
          <AppealKpiCard
            title="Avg resolution time"
            value={Number(avgResolution.toFixed(1))}
            suffix=" min"
            description={
              universityAvg.resolution > 0
                ? `${signed(resolutionDelta, 1)} min vs avg`
                : "No comparison data"
            }
            footer={
              avgResolution < universityAvg.resolution
                ? "Faster than average"
                : "Slower than average"
            }
            tone={avgResolution < universityAvg.resolution ? "positive" : "warning"}
            trend={resolutionTrend}
          />
          <AppealKpiCard
            title={isAllFaculties ? "Courses" : "Ranking"}
            value={isAllFaculties ? courseCount : `#${facultyRank.rank}`}
            description={
              isAllFaculties
                ? `${facultyRollups.length} faculties total`
                : `Faculty rank out of ${facultyRank.outOf}`
            }
            footer={
              isAllFaculties
                ? `${lastWeek.toLocaleString()} appeals last week`
                : `${courseCount} course${courseCount === 1 ? "" : "s"} · ${lastWeek} last week`
            }
            tone="cool"
          />
        </div>
      </section>

      {/* ---------------- Midterm Section ---------------- */}
      <section className="search-appeal-session-section">
        <header className="session-section-header">
          <h3>Midterm Appeals</h3>
          <span className="session-label">Assessment Window</span>
        </header>
        <div className="appeals-kpi-grid">
          <MiniMetricCard
            label="Total submissions"
            value={midterm.total}
            description={`${pct(midterm.total, total)}% of faculty total`}
            tone="cool"
          />
          <MiniMetricCard
            label="Acceptance rate"
            value={Number(midtermAcceptanceRate)}
            suffix="%"
            description={`${midterm.accepted} of ${midterm.total} accepted`}
            tone={Number(midtermAcceptanceRate) >= acceptanceRate ? "cool" : "warn"}
          />
          <MiniMetricCard
            label="Open appeals"
            value={midterm.open}
            description={midterm.open > 0 ? "Pending review" : "All resolved"}
            tone={midterm.open > 0 ? "warn" : "cool"}
          />
          <MiniMetricCard
            label="Closed appeals"
            value={midterm.closed}
            description={`${pct(midterm.closed, midterm.total)}% resolved`}
            tone="cool"
          />
        </div>
      </section>

      {/* ---------------- Final Section ---------------- */}
      <section className="search-appeal-session-section">
        <header className="session-section-header">
          <h3>Final Appeals</h3>
          <span className="session-label">Assessment Window</span>
        </header>
        <div className="appeals-kpi-grid">
          <MiniMetricCard
            label="Total submissions"
            value={final.total}
            description={`${pct(final.total, total)}% of faculty total`}
            tone="cool"
          />
          <MiniMetricCard
            label="Acceptance rate"
            value={Number(finalAcceptanceRate)}
            suffix="%"
            description={`${final.accepted} of ${final.total} accepted`}
            tone={Number(finalAcceptanceRate) >= acceptanceRate ? "cool" : "warn"}
          />
          <MiniMetricCard
            label="Open appeals"
            value={final.open}
            description={final.open > 0 ? "Pending review" : "All resolved"}
            tone={final.open > 0 ? "warn" : "cool"}
          />
          <MiniMetricCard
            label="Closed appeals"
            value={final.closed}
            description={`${pct(final.closed, final.total)}% resolved`}
            tone="cool"
          />
        </div>
      </section>

      {/* ---------------- Charts Section ---------------- */}
      <section className="search-appeal-charts-section">
        <header className="charts-section-header">
          <h3>Performance Analysis</h3>
        </header>

        <div className="charts-grid-row">
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Doughnut}
            data={statusChart}
            title="Status Breakdown"
            subtitle={`${open} open · ${closed} closed`}
            chartProps={{ options: statusOptions }}
            emptyMessage="No appeal data for this faculty."
          />

          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={sessionBreakdownChart}
            title="Midterm vs Final"
            subtitle="Submissions, acceptance, and resolution split"
            chartProps={{ options: sessionBreakdownOptions }}
            emptyMessage="No assessment data available."
          />
        </div>

        <div className="charts-grid-row">
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={leaderboardChart}
            title="Faculty Leaderboard"
            subtitle={isAllFaculties ? "All faculties ranked" : "Selected faculty highlighted"}
            chartProps={{ options: leaderboardOptions }}
            emptyMessage="No faculty data available."
          />

          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={coursesBreakdownChart}
            title={isAllFaculties ? "Top courses (university)" : `Courses in ${facultyName}`}
            subtitle="Closed vs Open per course"
            chartProps={{ options: coursesBreakdownOptions }}
            emptyMessage="No course data available."
          />
        </div>

        <div className="charts-grid-row">
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={distributionChart}
            title="Semester Distribution"
            subtitle="Aggregated appeals by semester"
            chartProps={{ options: distributionOptions }}
            emptyMessage="No semester data available."
          />

          <Chart
            className="appeals-chart-shell"
            ChartComponent={Line}
            data={trendChart}
            title="Weekly Trend"
            subtitle="Rolling weekly appeal count"
            chartProps={{ options: trendOptions }}
            emptyMessage="No weekly data available."
          />
        </div>
      </section>
    </div>
  );
};

export default SearchFacultyAppeal;
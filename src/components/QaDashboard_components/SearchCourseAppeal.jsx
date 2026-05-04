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
import "./styles/SearchCourseAppeal.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Tooltip, Legend, Title,
);

const TERM_ORDER = { SPRING: 1, SUMMER: 2, FALL: 3 };

const parseSemester = (semester) => {
  const [yearText, termText] = String(semester || "").split("-");
  return { year: Number(yearText) || 0, term: (termText || "").toUpperCase() };
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

const safeAverage = (arr) =>
  arr.length ? arr.reduce((s, v) => s + (Number(v) || 0), 0) / arr.length : 0;

const pct = (numerator, denominator, digits = 0) =>
  denominator > 0 ? ((numerator / denominator) * 100).toFixed(digits) : "0";

const signed = (value, digits = 1) => {
  const n = Number(value) || 0;
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;
};

const SearchCourseAppeal = ({
  course,
  onBack,
  courseCatalog = [],
  appealsData = {},
}) => {
    
  const info = useMemo(() => {
    const catalogMatch =
      courseCatalog.find((c) => c.id === course?.id || c.code === course?.code) || {};
    return {
      midtermAppeals: { total: 0, open: 0, closed: 0, accepted: 0 },
      finalAppeals:   { total: 0, open: 0, closed: 0, accepted: 0 },
      appealsBySemester: [],
      weeklyAppeals: [],
      ...course,
      ...catalogMatch,
    };
  }, [course, courseCatalog]);

  const total          = Number(info.totalAppeals || 0);
  const open           = Number(info.openAppeals || 0);
  const closed         = Math.max(total - open, 0);
  const facultyName    = info.faculty || "—";
  const acceptanceRate = Number(info.acceptanceRate || 0);
  const avgResolution  = Number(info.avgResolutionMinutes || 0);

  const midterm = info.midtermAppeals;
  const final   = info.finalAppeals;
  const midtermAcceptanceRate = pct(midterm.accepted, midterm.total, 1);
  const finalAcceptanceRate   = pct(final.accepted, final.total, 1);

  const facultyCourses = useMemo(
    () => courseCatalog.filter((c) => c.faculty === facultyName),
    [courseCatalog, facultyName],
  );

  const universityAvg = useMemo(() => ({
    total:      safeAverage(courseCatalog.map((c) => c.totalAppeals)),
    open:       safeAverage(courseCatalog.map((c) => c.openAppeals)),
    week:       safeAverage(courseCatalog.map((c) => c.lastWeekAppeals)),
    acceptance: safeAverage(courseCatalog.map((c) => c.acceptanceRate)),
    resolution: safeAverage(courseCatalog.map((c) => c.avgResolutionMinutes)),
  }), [courseCatalog]);

  const facultyAvg = useMemo(() => ({
    total:      safeAverage(facultyCourses.map((c) => c.totalAppeals)),
    open:       safeAverage(facultyCourses.map((c) => c.openAppeals)),
    week:       safeAverage(facultyCourses.map((c) => c.lastWeekAppeals)),
    acceptance: safeAverage(facultyCourses.map((c) => c.acceptanceRate)),
    resolution: safeAverage(facultyCourses.map((c) => c.avgResolutionMinutes)),
  }), [facultyCourses]);

  const universityRank = useMemo(() => {
    const sorted = [...courseCatalog].sort(
      (a, b) => (b.totalAppeals || 0) - (a.totalAppeals || 0),
    );
    const idx = sorted.findIndex((c) => c.id === info.id);
    return { rank: idx >= 0 ? idx + 1 : "—", outOf: sorted.length };
  }, [courseCatalog, info.id]);

  const facultyRank = useMemo(() => {
    const sorted = [...facultyCourses].sort(
      (a, b) => (b.totalAppeals || 0) - (a.totalAppeals || 0),
    );
    const idx = sorted.findIndex((c) => c.id === info.id);
    return { rank: idx >= 0 ? idx + 1 : "—", outOf: sorted.length };
  }, [facultyCourses, info.id]);

  const totalDelta      = total - universityAvg.total;
  const acceptanceDelta = acceptanceRate - universityAvg.acceptance;
  const resolutionDelta = avgResolution - universityAvg.resolution;

  // For resolution: lower is better, so invert the trend arrow
  const totalTrend      = totalDelta > 0 ? "up" : totalDelta < 0 ? "down" : "same";
  const acceptanceTrend = acceptanceDelta > 0 ? "up" : acceptanceDelta < 0 ? "down" : "same";
  const resolutionTrend = resolutionDelta > 0 ? "down" : resolutionDelta < 0 ? "up" : "same";

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
  }, [closed, open, total]);

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

  const comparisonChart = useMemo(() => ({
    labels: ["Total appeals", "Acceptance %", "Avg Resolution (min)"],
    datasets: [
      {
        label: info.code || "This course",
        data: [total, acceptanceRate, avgResolution],
        backgroundColor: "rgba(31,119,180,0.85)",
        borderRadius: 6,
      },
      {
        label: `${facultyName} avg`,
        data: [
          +facultyAvg.total.toFixed(1),
          +facultyAvg.acceptance.toFixed(1),
          +facultyAvg.resolution.toFixed(1),
        ],
        backgroundColor: "rgba(255,159,28,0.85)",
        borderRadius: 6,
      },
      {
        label: "University avg",
        data: [
          +universityAvg.total.toFixed(1),
          +universityAvg.acceptance.toFixed(1),
          +universityAvg.resolution.toFixed(1),
        ],
        backgroundColor: "rgba(120,128,140,0.85)",
        borderRadius: 6,
      },
    ],
  }), [info.code, total, acceptanceRate, avgResolution, facultyName, facultyAvg, universityAvg]);

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const labels = ["appeals", "%", "min"];
            const unit = labels[ctx.dataIndex] || "";
            return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} ${unit}`;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Value" } },
    },
  };

  const leaderboardChart = useMemo(() => {
    if (!facultyCourses.length) return null;
    const sorted = [...facultyCourses]
      .sort((a, b) => (b.totalAppeals || 0) - (a.totalAppeals || 0))
      .slice(0, 6);

    return {
      labels: sorted.map((c) => c.code),
      datasets: [{
        label: "Total appeals",
        data: sorted.map((c) => c.totalAppeals || 0),
        backgroundColor: sorted.map((c) =>
          c.id === info.id ? "rgba(31,119,180,0.95)" : "rgba(120,128,140,0.55)"),
        borderColor: sorted.map((c) =>
          c.id === info.id ? "#1f77b4" : "rgba(120,128,140,0.7)"),
        borderWidth: sorted.map((c) => (c.id === info.id ? 2 : 1)),
        borderRadius: 6,
      }],
    };
  }, [facultyCourses, info.id]);

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

  const distributionChart = useMemo(() => {
    const records = info.appealsBySemester || [];
    if (!records.length) return null;
    const sorted = [...records].sort((a, b) => sortSemesters(a.semester, b.semester));

    return {
      labels: sorted.map((r) => formatSemesterLabel(r.semester)),
      datasets: [{
        label: `${info.code || "Course"} · appeals by semester`,
        data: sorted.map((r) => r.count || 0),
        backgroundColor: "rgba(31,119,180,0.75)",
        borderColor: "#1f77b4",
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [info.code, info.appealsBySemester]);

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

  const trendChart = useMemo(() => {
    const weeklyData = info.weeklyAppeals || [];
    if (!weeklyData.length) return null;

    return {
      labels: weeklyData.map((w) => w.week || "Week"),
      datasets: [{
        label: `${info.code || "Course"} · weekly appeals`,
        data: weeklyData.map((w) => w.count || 0),
        borderColor: "#1f77b4",
        backgroundColor: "rgba(31,119,180,0.18)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    };
  }, [info.code, info.weeklyAppeals]);

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

  return (
    <div className="search-appeal-page">
      <div className="search-appeal-header">
        <button type="button" onClick={onBack} className="btn-back">
          <ArrowLeft size={16} /> Back to Appeals
        </button>
        <div className="search-appeal-titles">
          <span className="search-appeal-eyebrow">{facultyName}</span>
          <h2>{info.code ? `${info.code} · ${info.name}` : "Selected course"}</h2>
          <p>Midterm & Final appeals breakdown</p>
        </div>
      </div>

      <section className="search-appeal-kpi-section">
        <div className="appeals-kpi-grid">
          <AppealKpiCard
            title="Total appeals"
            value={total}
            description={
              universityAvg.total > 0
                ? `${signed((totalDelta / universityAvg.total) * 100, 0)}% vs university avg`
                : "No comparison data"
            }
            footer={
              total > universityAvg.total ? "Higher than average" : "Below average"
            }
            tone={total > universityAvg.total ? "warning" : "positive"}
            trend={totalTrend}
          />
          <AppealKpiCard
            title="Acceptance rate"
            value={acceptanceRate}
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
            value={avgResolution}
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
            title="Ranking"
            value={`#${facultyRank.rank}`}
            description={`Faculty rank out of ${facultyRank.outOf}`}
            footer={`University: #${universityRank.rank} of ${universityRank.outOf}`}
            tone="cool"
          />
        </div>
      </section>

      <section className="search-appeal-session-section">
        <header className="session-section-header">
          <h3>Midterm Appeals</h3>
          <span className="session-label">Assessment Window</span>
        </header>
        <div className="appeals-kpi-grid">
          <MiniMetricCard
            label="Total submissions"
            value={midterm.total}
            description={`${pct(midterm.total, total)}% of course total`}
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

      <section className="search-appeal-session-section">
        <header className="session-section-header">
          <h3>Final Appeals</h3>
          <span className="session-label">Assessment Window</span>
        </header>
        <div className="appeals-kpi-grid">
          <MiniMetricCard
            label="Total submissions"
            value={final.total}
            description={`${pct(final.total, total)}% of course total`}
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
            emptyMessage="No appeal data for this course."
          />

          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={comparisonChart}
            title="Course vs Faculty vs University"
            subtitle="Benchmarking analysis"
            chartProps={{ options: comparisonOptions }}
            emptyMessage="Insufficient data for comparison."
          />
        </div>

        <div className="charts-grid-row">
          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={leaderboardChart}
            title={`Top courses in ${facultyName}`}
            subtitle="Selected course highlighted"
            chartProps={{ options: leaderboardOptions }}
            emptyMessage="Faculty data unavailable."
          />

          <Chart
            className="appeals-chart-shell"
            ChartComponent={Bar}
            data={distributionChart}
            title="Semester Distribution"
            subtitle="Appeals by semester for this course"
            chartProps={{ options: distributionOptions }}
            emptyMessage="No semester data available."
          />
        </div>

        <Chart
          className="appeals-chart-shell full-width"
          ChartComponent={Line}
          data={trendChart}
          title="Weekly Trend"
          subtitle="Rolling weekly appeal count"
          chartProps={{ options: trendOptions }}
          emptyMessage="No weekly data available."
        />
      </section>
    </div>
  );
};

export default SearchCourseAppeal;
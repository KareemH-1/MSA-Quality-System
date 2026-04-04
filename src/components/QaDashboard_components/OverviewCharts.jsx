import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Gauge, LineChart, PieChart, UsersRound } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const defaultChartTheme = {
  grid: "rgba(34, 64, 92, 0.12)",
  tick: "#587085",
  legend: "#587085",
  tooltipBackground: "rgba(255, 255, 255, 0.98)",
  tooltipTitle: "#17354f",
  tooltipBody: "#45637e",
  tooltipBorder: "rgba(18, 74, 97, 0.16)",
};

const defaultChartColors = {
  appeals: "#e15d44",
  surveys: "#1b87c9",
  satisfaction: "#2f97b7",
  resolution: "#d9a441",
  target: "#6bb98b",
  facultySatisfaction: "#47c4d8",
  facultyResponse: "#ff9f43",
  facultyAppeal: "#e15d44",
  approved: "#4cc9f0",
  rejected: "#e15d44",
  pending: "#f1b44c",
  coverageOpen: "#47c4d8",
  coverageClosed: "#8aa1b5",
};

const formatChartDate = (isoDate) => {
  if (!isoDate) {
    return "";
  }

  const parsedDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const sortIsoDates = (dates) => {
  return [...new Set(dates)].sort((left, right) => new Date(left) - new Date(right));
};

const toPercentage = (value, total) => {
  if (!total) {
    return 0;
  }

  return (Number(value || 0) / total) * 100;
};

const getPeakPoint = (points, valueKey) => {
  return points.reduce(
    (peak, item) => (Number(item[valueKey] || 0) > Number(peak[valueKey] || 0) ? item : peak),
    points[0] || null,
  );
};

const getLowestPoint = (points, valueKey) => {
  return points.reduce(
    (lowest, item) => (Number(item[valueKey] || 0) < Number(lowest[valueKey] || 0) ? item : lowest),
    points[0] || null,
  );
};

const getHighestPoint = (points, valueKey) => {
  return points.reduce(
    (highest, item) => (Number(item[valueKey] || 0) > Number(highest[valueKey] || 0) ? item : highest),
    points[0] || null,
  );
};

const createLineDataset = (label, values, color, fill = false) => ({
  label,
  data: values,
  borderColor: color,
  backgroundColor: fill ? `${color}26` : color,
  pointBackgroundColor: color,
  pointBorderColor: color,
  pointRadius: 3,
  pointHoverRadius: 5,
  borderWidth: 2.5,
  tension: 0.35,
  fill,
});

const ChartPanel = ({ eyebrow, title, subtitle, insightItems = [], children, className = "" }) => {
  return (
    <article className={`insight-card ${className}`.trim()}>
      <div className="insight-card-head">
        <div>
          <p className="insight-eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>
      {subtitle ? <p className="insight-subtitle">{subtitle}</p> : null}
      <div className="insight-chart-frame">{children}</div>
      {insightItems.length > 0 ? (
        <div className="chart-insights" aria-label={`${title} insights`}>
          {insightItems.map((item) => (
            <div className={`chart-insight ${item.tone || "neutral"}`} key={`${title}-${item.title}`}>
              <div className="chart-insight-icon">{item.icon}</div>
              <div className="chart-insight-copy">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
};

const getChartInsightOptions = (overviewData) => {
  return overviewData?.chartInsightOptions || {};
};

const buildInsightText = (template, replacements) => {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "");
};

const buildAppealsTrendInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).appealsTrend || {};
  const peak = getPeakPoint(data, "count");
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const average = data.length
    ? data.reduce((sum, item) => sum + Number(item.count || 0), 0) / data.length
    : 0;
  const spikePercent = Number(options.spikePercent || 20);
  const peakAboveAverage = average > 0 ? ((Number(peak?.count || 0) - average) / average) * 100 : 0;

  return [
    peak
      ? {
          tone: peakAboveAverage >= spikePercent ? "warning" : "positive",
          icon: peakAboveAverage >= spikePercent ? <AlertTriangle size={16} /> : <ArrowUpRight size={16} />,
          title: "Peak appeal day",
          text: buildInsightText(options.peakMessage || "Spike on {date} with {value} appeals.", {
            date: formatChartDate(peak.date),
            value: Number(peak.count || 0).toLocaleString(),
          }),
        }
      : null,
    firstPoint && lastPoint
      ? {
          tone: Number(lastPoint.count || 0) >= Number(firstPoint.count || 0) ? "warning" : "positive",
          icon: Number(lastPoint.count || 0) >= Number(firstPoint.count || 0) ? <AlertTriangle size={16} /> : <ArrowDownRight size={16} />,
          title: "Trend direction",
          text: buildInsightText(options.growthMessage || "Appeals moved from {start} to {end} across the observed period.", {
            start: Number(firstPoint.count || 0).toLocaleString(),
            end: Number(lastPoint.count || 0).toLocaleString(),
          }),
        }
      : null,
  ].filter(Boolean);
};

const buildComparisonInsights = (overviewData, appealsTrend, surveyTrend) => {
  const options = getChartInsightOptions(overviewData).surveyVsAppeals || {};
  const appealsTotal = appealsTrend.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const surveysTotal = surveyTrend.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const gapPercent = appealsTotal > 0 ? ((appealsTotal - surveysTotal) / appealsTotal) * 100 : 0;
  const gapThreshold = Number(options.gapPercent || 10);

  return [
    {
      tone: gapPercent > gapThreshold ? "warning" : "positive",
      icon: gapPercent > gapThreshold ? <AlertTriangle size={16} /> : <ArrowUpRight size={16} />,
      title: "Survey participation gap",
      text: buildInsightText(
        options.gapMessage || "Surveys are {value}% lower than appeals across the same period.",
        { value: gapPercent.toFixed(1) },
      ),
    },
  ];
};

const buildAppealStatusInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).appealStatusDistribution || {};
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const approved = data.find((item) => item.status === "Approved");
  const rejected = data.find((item) => item.status === "Rejected");
  const pending = data.find((item) => item.status === "Pending");
  const approvedShare = toPercentage(approved?.count, total);
  const pendingShare = toPercentage(pending?.count, total);
  const approvedThreshold = Number(options.approvedSharePercent || 30);
  const pendingThreshold = Number(options.pendingSharePercent || 20);

  return [
    {
      tone: approvedShare > approvedThreshold ? "warning" : "neutral",
      icon: approvedShare > approvedThreshold ? <AlertTriangle size={16} /> : <PieChart size={16} />,
      title: "Approved share",
      text: buildInsightText(
        options.approvedMessage || "Approved appeals are {value}% of all appeals.",
        { value: approvedShare.toFixed(1) },
      ),
    },
    {
      tone: pendingShare > pendingThreshold ? "warning" : "positive",
      icon: pendingShare > pendingThreshold ? <AlertTriangle size={16} /> : <ArrowUpRight size={16} />,
      title: "Pending queue",
      text: buildInsightText(
        options.pendingMessage || "Pending appeals account for {value}% of the total queue.",
        { value: pendingShare.toFixed(1) },
      ),
    },
    rejected
      ? {
          tone: "neutral",
          icon: <PieChart size={16} />,
          title: "Rejected cases",
          text: buildInsightText(
            options.rejectedMessage || "Rejected appeals represent {value} submissions.",
            { value: Number(rejected.count || 0).toLocaleString() },
          ),
        }
      : null,
  ].filter(Boolean);
};

const buildSatisfactionInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).satisfactionTrend || {};
  const target = Number(overviewData?.metrics?.satisfactionScore?.targetPercent || options.targetPercent || 85);
  const latest = data[data.length - 1];
  const lowest = getLowestPoint(data, "score");
  const latestGap = Number(target) - Number(latest?.score || 0);

  return [
    latest
      ? {
          tone: latestGap > 0 ? "warning" : "positive",
          icon: latestGap > 0 ? <AlertTriangle size={16} /> : <ArrowUpRight size={16} />,
          title: "Latest satisfaction score",
          text: buildInsightText(
            options.latestMessage || "Current satisfaction is {value}% against a {target}% target.",
            {
              value: Number(latest.score || 0).toFixed(1),
              target: target.toFixed(1),
            },
          ),
        }
      : null,
    lowest
      ? {
          tone: "neutral",
          icon: <LineChart size={16} />,
          title: "Lowest point",
          text: buildInsightText(options.lowestMessage || "Lowest satisfaction point is {value}% on {date}.", {
            value: Number(lowest.score || 0).toFixed(1),
            date: formatChartDate(lowest.date),
          }),
        }
      : null,
  ].filter(Boolean);
};

const buildFacultyPerformanceInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).facultyPerformance || {};
  const performanceScore = (item) => {
    return (Number(item.satisfaction || 0) + Number(item.responseRate || 0) + (100 - Number(item.appealRate || 0))) / 3;
  };

  const best = data.reduce((winner, item) => (performanceScore(item) > performanceScore(winner) ? item : winner), data[0] || null);
  const weakest = data.reduce((loser, item) => (performanceScore(item) < performanceScore(loser) ? item : loser), data[0] || null);

  return [
    best
      ? {
          tone: "positive",
          icon: <ArrowUpRight size={16} />,
          title: "Top performer",
          text: buildInsightText(options.topMessage || "{faculty} is the strongest overall faculty in this comparison.", {
            faculty: best.faculty,
          }),
        }
      : null,
    weakest
      ? {
          tone: "warning",
          icon: <AlertTriangle size={16} />,
          title: "Needs attention",
          text: buildInsightText(options.weakestMessage || "{faculty} is the weakest overall performer.", {
            faculty: weakest.faculty,
          }),
        }
      : null,
  ].filter(Boolean);
};

const buildResponseRateInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).responseRateByFaculty || {};
  const benchmark = Number(overviewData?.metrics?.facultyResponseRates?.benchmarkPercent || options.benchmarkPercent || 70);
  const belowBenchmark = data.filter((item) => Number(item.responseRate || 0) < benchmark);
  const lowest = getLowestPoint(data, "responseRate");

  return [
    {
      tone: belowBenchmark.length > 0 ? "warning" : "positive",
      icon: belowBenchmark.length > 0 ? <AlertTriangle size={16} /> : <Gauge size={16} />,
      title: "Benchmark check",
      text: buildInsightText(
        options.benchmarkMessage || "{count} faculties are below the {benchmark}% response benchmark.",
        {
          count: belowBenchmark.length.toString(),
          benchmark: benchmark.toFixed(0),
        },
      ),
    },
    lowest
      ? {
          tone: "neutral",
          icon: <UsersRound size={16} />,
          title: "Lowest response rate",
          text: buildInsightText(options.lowestMessage || "{faculty} has the lowest response rate at {value}%.", {
            faculty: lowest.name,
            value: Number(lowest.responseRate || 0).toFixed(1),
          }),
        }
      : null,
  ].filter(Boolean);
};

const buildResolutionInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).resolutionTimeTrend || {};
  const target = Number(overviewData?.metrics?.appealResolutionTime?.targetMinutes || options.targetMinutes || 15);
  const latest = data[data.length - 1];
  const first = data[0];
  const changePercent = first && latest && Number(first.minutes || 0) > 0
    ? ((Number(first.minutes || 0) - Number(latest.minutes || 0)) / Number(first.minutes || 0)) * 100
    : 0;

  return [
    latest
      ? {
          tone: Number(latest.minutes || 0) > target ? "warning" : "positive",
          icon: Number(latest.minutes || 0) > target ? <AlertTriangle size={16} /> : <ArrowDownRight size={16} />,
          title: "Latest resolution time",
          text: buildInsightText(
            options.latestMessage || "Current resolution time is {value} minutes against a {target} minute target.",
            {
              value: Number(latest.minutes || 0).toFixed(1),
              target: target.toFixed(1),
            },
          ),
        }
      : null,
    first && latest
      ? {
          tone: changePercent > 0 ? "positive" : "neutral",
          icon: changePercent > 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />,
          title: "Trend direction",
          text: buildInsightText(
            options.trendMessage || "Resolution time improved by {value}% from the first measured point.",
            { value: Math.abs(changePercent).toFixed(1) },
          ),
        }
      : null,
  ].filter(Boolean);
};

const buildCoverageInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).coverageStatusDistribution || {};
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const openTotal = data
    .filter((item) => item.status !== "Closed")
    .reduce((sum, item) => sum + Number(item.count || 0), 0);
  const openShare = toPercentage(openTotal, total);
  const dominant = getHighestPoint(data, "count");

  return [
    dominant
      ? {
          tone: "neutral",
          icon: <PieChart size={16} />,
          title: "Coverage balance",
          text: buildInsightText(options.balanceMessage || "{category} is the largest coverage segment at {value} units.", {
            category: dominant.status,
            value: Number(dominant.count || 0).toLocaleString(),
          }),
        }
      : null,
    {
      tone: openShare > Number(options.openShareThresholdPercent || 60) ? "warning" : "positive",
      icon: openShare > Number(options.openShareThresholdPercent || 60) ? <AlertTriangle size={16} /> : <Gauge size={16} />,
      title: "Open course share",
      text: buildInsightText(options.openShareMessage || "Open coverage represents {value}% of tracked courses.", {
        value: openShare.toFixed(1),
      }),
    },
  ].filter(Boolean);
};

const buildCriticalIssuesInsights = (overviewData, data) => {
  const options = getChartInsightOptions(overviewData).criticalIssuesDistribution || {};
  const threshold = Number(options.highIssueThreshold || 6);
  const highest = getHighestPoint(data, "issues");
  const lowest = getLowestPoint(data, "issues");

  return [
    highest
      ? {
          tone: Number(highest.issues || 0) > threshold ? "warning" : "neutral",
          icon: Number(highest.issues || 0) > threshold ? <AlertTriangle size={16} /> : <Gauge size={16} />,
          title: "Highest issue load",
          text: buildInsightText(
            options.highIssueMessage || "{faculty} is above the critical issue threshold with {value} issues.",
            {
              faculty: highest.faculty,
              value: Number(highest.issues || 0).toFixed(0),
            },
          ),
        }
      : null,
    lowest
      ? {
          tone: "positive",
          icon: <ArrowUpRight size={16} />,
          title: "Lowest issue load",
          text: buildInsightText(options.lowestMessage || "{faculty} is the lowest-risk faculty with {value} issues.", {
            faculty: lowest.faculty,
            value: Number(lowest.issues || 0).toFixed(0),
          }),
        }
      : null,
  ].filter(Boolean);
};

const OverviewCharts = ({ overviewData }) => {
  if (!overviewData) {
    return null;
  }

  const chartTheme = { ...defaultChartTheme, ...(overviewData.chartTheme || {}) };
  const chartColors = { ...defaultChartColors, ...(overviewData.chartColors || {}) };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: chartTheme.legend,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            family: "Space Grotesk, Inter, sans-serif",
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackground,
        titleColor: chartTheme.tooltipTitle,
        bodyColor: chartTheme.tooltipBody,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.tick,
          font: {
            family: "Inter, sans-serif",
          },
        },
      },
      y: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.tick,
          font: {
            family: "Inter, sans-serif",
          },
        },
      },
    },
  };

  const appealTrendData = overviewData?.charts?.appealsTrend || [];
  const surveyTrendData = overviewData?.charts?.surveyTrend || [];
  const satisfactionTrendData = overviewData?.charts?.satisfactionTrend || [];
  const resolutionTrendData = overviewData?.charts?.resolutionTimeTrend || [];
  const appealStatusData = overviewData?.charts?.appealStatusDistribution || [];
  const facultyPerformanceData = overviewData?.charts?.facultyPerformance || [];
  const facultyRates = overviewData?.metrics?.facultyResponseRates?.faculties || [];
  const coverageStatusData = overviewData?.charts?.coverageStatusDistribution || [];
  const criticalIssuesData = overviewData?.charts?.criticalIssuesByFaculty || [];
  const comparisonLabels = sortIsoDates([
    ...appealTrendData.map((item) => item.date),
    ...surveyTrendData.map((item) => item.date),
  ]);

  const appealMap = new Map(appealTrendData.map((item) => [item.date, Number(item.count || 0)]));
  const surveyMap = new Map(surveyTrendData.map((item) => [item.date, Number(item.count || 0)]));

  const appealsTrendChart = {
    labels: appealTrendData.map((item) => formatChartDate(item.date)),
    datasets: [
      createLineDataset(
        "Appeals submitted",
        appealTrendData.map((item) => Number(item.count || 0)),
        chartColors.appeals,
        true,
      ),
    ],
  };

  const comparisonSeries = {
    labels: comparisonLabels.map(formatChartDate),
    datasets: [
      createLineDataset(
        "Appeals",
        comparisonLabels.map((date) => appealMap.get(date) ?? null),
        chartColors.appeals,
        false,
      ),
      createLineDataset(
        "Surveys",
        comparisonLabels.map((date) => surveyMap.get(date) ?? null),
        chartColors.surveys,
        false,
      ),
    ],
  };

  const satisfactionTrendChart = {
    labels: satisfactionTrendData.map((item) => formatChartDate(item.date)),
    datasets: [
      createLineDataset(
        "Satisfaction score",
        satisfactionTrendData.map((item) => Number(item.score || 0)),
        chartColors.satisfaction,
        true,
      ),
    ],
  };

  const resolutionTrendChart = {
    labels: resolutionTrendData.map((item) => formatChartDate(item.date)),
    datasets: [
      createLineDataset(
        "Average resolution time",
        resolutionTrendData.map((item) => Number(item.minutes || 0)),
        chartColors.resolution,
        true,
      ),
      {
        label: "Target",
        data: resolutionTrendData.map(() => Number(overviewData?.metrics?.appealResolutionTime?.targetMinutes || 15)),
        borderColor: chartColors.target,
        backgroundColor: chartColors.target,
        borderDash: [6, 6],
        pointRadius: 0,
        borderWidth: 2,
        tension: 0,
      },
    ],
  };

  const facultyPerformanceChart = {
    labels: facultyPerformanceData.map((item) => item.faculty),
    datasets: [
      {
        label: "Satisfaction",
        data: facultyPerformanceData.map((item) => Number(item.satisfaction || 0)),
        backgroundColor: chartColors.facultySatisfaction,
        borderColor: chartColors.facultySatisfaction,
        borderWidth: 1,
        borderRadius: 10,
      },
      {
        label: "Response rate",
        data: facultyPerformanceData.map((item) => Number(item.responseRate || 0)),
        backgroundColor: chartColors.facultyResponse,
        borderColor: chartColors.facultyResponse,
        borderWidth: 1,
        borderRadius: 10,
      },
      {
        label: "Appeal rate",
        data: facultyPerformanceData.map((item) => Number(item.appealRate || 0)),
        backgroundColor: chartColors.facultyAppeal,
        borderColor: chartColors.facultyAppeal,
        borderWidth: 1,
        borderRadius: 10,
      },
    ],
  };

  const horizontalBarOptions = {
    ...chartOptions,
    indexAxis: "y",
    scales: {
      x: {
        grid: {
          color: chartTheme.grid,
        },
        ticks: {
          color: chartTheme.tick,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: chartTheme.tick,
        },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: "68%",
    scales: undefined,
  };

  return (
    <section className="overview-insights" aria-label="Insight charts and trend breakdowns">
      <div className="overview-section-head">
        <div>
          <p className="section-eyebrow">Trends</p>
          <h3>What changed over time</h3>
        </div>
        <p className="section-note">This Section provides a comprehensive view of how key metrics have evolved over time.</p>
      </div>

      <div className="insight-grid insight-grid-trends">
        <ChartPanel
          eyebrow="Appeals Trend Over Time"
          title="Appeals submitted per day"
          subtitle="Spike detection for deadline pressure and unusual submission bursts."
          insightItems={buildAppealsTrendInsights(overviewData, appealTrendData)}
          className="insight-card-wide"
        >
          <Line data={appealsTrendChart} options={chartOptions} />
        </ChartPanel>

        <ChartPanel
          eyebrow="Satisfaction Trend"
          title="Student satisfaction over time"
          subtitle="Tracks whether the overall score is trending toward the target."
          insightItems={buildSatisfactionInsights(overviewData, satisfactionTrendData)}
        >
          <Line data={satisfactionTrendChart} options={chartOptions} />
        </ChartPanel>

        <ChartPanel
          eyebrow="Surveys vs Appeals"
          title="Survey volume compared with appeals"
          subtitle="Survey vs appeal trends can be compared to satisfaction to detect potential causes of satisfaction changes."
          insightItems={buildComparisonInsights(overviewData, appealTrendData, surveyTrendData)}
          className="insight-card-wide"
        >
          <Line data={comparisonSeries} options={chartOptions} />
        </ChartPanel>

        <ChartPanel
          eyebrow="Resolution Time Trend"
          title="Average appeal resolution time"
          subtitle="Shows whether the appeal team is keeping up with the target resolution time and detects significant changes in resolution time."
          insightItems={buildResolutionInsights(overviewData, resolutionTrendData)}
        >
          <Line data={resolutionTrendChart} options={chartOptions} />
        </ChartPanel>
      </div>

      <div className="overview-section-head">
        <div>
          <p className="section-eyebrow">Comparisons</p>
          <h3>Which faculties need attention</h3>
        </div>
        <p className="section-note">The comparison cards highlight weak faculties and the response-rate benchmark.</p>
      </div>

      <div className="insight-grid insight-grid-comparison">
        <ChartPanel
          eyebrow="Faculty Performance Comparison"
          title="Satisfaction, response rate, and appeal rate by faculty"
          subtitle="A single view that quickly shows highest vs lowest satisfaction, response, and appeal rates across faculties."
          insightItems={buildFacultyPerformanceInsights(overviewData, facultyPerformanceData)}
          className="insight-card-wide"
        >
          <Bar data={facultyPerformanceChart} options={horizontalBarOptions} />
        </ChartPanel>

        <ChartPanel
          eyebrow="Response Rate by Faculty"
          title="Survey response rate per faculty"
          subtitle="Faculties below the benchmark are highlighted automatically."
          insightItems={buildResponseRateInsights(overviewData, facultyRates)}
        >
          <Bar
            data={{
              labels: facultyRates.map((item) => item.name),
              datasets: [
                {
                  label: "Response rate",
                  data: facultyRates.map((item) => Number(item.responseRate || 0)),
                  backgroundColor: facultyRates.map((item) =>
                    Number(item.responseRate || 0) < Number(overviewData?.metrics?.facultyResponseRates?.benchmarkPercent || 70)
                      ? chartColors.rejected
                      : chartColors.coverageOpen,
                  ),
                  borderRadius: 10,
                  borderSkipped: false,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartPanel>
      </div>

      <div className="overview-section-head">
        <div>
          <p className="section-eyebrow">BreakDown</p>
          <h3>Where the data comes from</h3>
        </div>
        <p className="section-note">These charts turn the totals into status and coverage breakdowns.</p>
      </div>

      <div className="insight-grid insight-grid-breakdown">
        <ChartPanel
          eyebrow="Appeal Status Distribution"
          title="Approved vs rejected vs pending"
          subtitle="Shows how the appeal queue is being resolved." 
          insightItems={buildAppealStatusInsights(overviewData, appealStatusData)}
        >
          <Doughnut
            data={{
              labels: appealStatusData.map((item) => item.status),
              datasets: [
                {
                  data: appealStatusData.map((item) => Number(item.count || 0)),
                  backgroundColor: [chartColors.approved, chartColors.rejected, chartColors.pending],
                  borderColor: ["#ffffff", "#ffffff", "#ffffff"],
                  borderWidth: 2,
                  hoverOffset: 6,
                },
              ],
            }}
            options={doughnutOptions}
          />
        </ChartPanel>

        <ChartPanel
          eyebrow="Coverage Visualization"
          title="Courses open to appeals, surveys, and closed"
          subtitle="Provides context for course availability and remaining closed coverage."
          insightItems={buildCoverageInsights(overviewData, coverageStatusData)}
        >
          <Bar
            data={{
              labels: coverageStatusData.map((item) => item.status),
              datasets: [
                {
                  label: "Courses",
                  data: coverageStatusData.map((item) => Number(item.count || 0)),
                  backgroundColor: coverageStatusData.map((item) => {
                    if (item.status === "Open to appeals") return chartColors.coverageOpen;
                    if (item.status === "Open to surveys") return chartColors.pending;
                    return chartColors.coverageClosed;
                  }),
                  borderRadius: 12,
                  borderSkipped: false,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartPanel>

        <ChartPanel
          eyebrow="Critical Issues Distribution"
          title="Critical issues by faculty"
          subtitle="The final breakdown chart shows which faculty has the most urgent issue load."
          insightItems={buildCriticalIssuesInsights(overviewData, criticalIssuesData)}
        >
          <Bar
            data={{
              labels: criticalIssuesData.map((item) => item.faculty),
              datasets: [
                {
                  label: "Critical issues",
                  data: criticalIssuesData.map((item) => Number(item.issues || 0)),
                  backgroundColor: criticalIssuesData.map((item) =>
                    Number(item.issues || 0) > Number(getChartInsightOptions(overviewData).criticalIssuesDistribution?.highIssueThreshold || 6)
                      ? chartColors.rejected
                      : chartColors.coverageClosed,
                  ),
                  borderRadius: 12,
                  borderSkipped: false,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartPanel>
      </div>
    </section>
  );
};

export default OverviewCharts;

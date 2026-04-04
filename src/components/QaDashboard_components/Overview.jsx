import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import "./styles/Overview.css";
import { VisualCard } from "../cards/VisualCard";
import BarCard from "../cards/BarCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import RingProgressCard from "../cards/RingProgressCard";
import generateInsights from "../../services/QAHelpers/generateInsights";
import qaOptions from "../../services/QAHelpers/QAOptions.json";
import OverviewCharts from "./OverviewCharts";

const OverviewInsightPanel = ({ insight }) => {
  const typeClass = insight.type || "info";
  const metricLabel = insight.context?.metric ? insight.context.metric : null;
  const facultyLabel = insight.context?.faculty ? insight.context.faculty : null;

  return (
    <article className={`dashboard-insight ${typeClass}`}>
      <div className="dashboard-insight-top">
        <span className={`dashboard-insight-badge ${typeClass}`}>{insight.type}</span>
        <span className={`dashboard-insight-severity ${insight.severity}`}>{insight.severity}</span>
      </div>
      <h4>{insight.title}</h4>
      <p>{insight.message}</p>
      {(metricLabel || facultyLabel) ? (
        <div className="dashboard-insight-context">
          {metricLabel ? <span>Metric: {metricLabel}</span> : null}
          {facultyLabel ? <span>Faculty: {facultyLabel}</span> : null}
        </div>
      ) : null}
    </article>
  );
};

const Overview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await fetch("/mockOverviewData.json");
        if (!response.ok) {
          throw new Error(`Failed to load overview data: ${response.status}`);
        }

        const data = await response.json();
        setOverviewData(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const icons = {
    hourglass: <Hourglass size={24} />,
  };

  const formatDate = (isoDate) => {
    if (!isoDate) {
      return null;
    }

    const parsedDate = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return isoDate;
    }

    return parsedDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSignedPercent = (value) => {
    const numericValue = Number(value) || 0;
    const sign = numericValue >= 0 ? "+" : "";
    return `${sign}${numericValue}%`;
  };

  const calculatePercentDelta = (currentValue, previousValue) => {
    const current = Number(currentValue) || 0;
    const previous = Number(previousValue) || 0;

    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return ((current - previous) / previous) * 100;
  };

  const calculateDeltaValue = (currentValue, previousValue) => {
    const current = Number(currentValue) || 0;
    const previous = Number(previousValue) || 0;
    return current - previous;
  };

  const sessionTypeLabels = {
    appeals: "Appeals",
    surveys: "Surveys",
  };

  const headerContent = {
    eyebrow: "Semester performance",
    title: "Quality Performance Overview",
    subtitle:
      "Live indicators for student feedback, surveys, and appeal handling efficiency across all faculties.",
  };

  const appealsCurrent = Number(overviewData?.metrics?.appealsSubmitted?.currentSemester || 0);
  const appealsLast = Number(overviewData?.metrics?.appealsSubmitted?.lastSemester || 0);
  const appealsDeltaPercent = calculatePercentDelta(appealsCurrent, appealsLast);

  const satisfactionCurrent = Number(overviewData?.metrics?.satisfactionScore?.currentSemester || 0);
  const satisfactionLast = Number(overviewData?.metrics?.satisfactionScore?.lastSemester || 0);
  const satisfactionDeltaPercent = calculatePercentDelta(satisfactionCurrent, satisfactionLast);

  const surveyResponsesCurrent = Number(overviewData?.metrics?.surveyResponses?.currentSemester || 0);
  const surveyResponsesLast = Number(overviewData?.metrics?.surveyResponses?.lastSemester || 0);
  const surveyResponsesDeltaPercent = calculatePercentDelta(
    surveyResponsesCurrent,
    surveyResponsesLast,
  );

  const resolutionCurrent = Number(
    overviewData?.metrics?.appealResolutionTime?.currentSemesterMinutes || 0,
  );
  const resolutionLast = Number(overviewData?.metrics?.appealResolutionTime?.lastSemesterMinutes || 0);
  const resolutionDeltaMinutes = calculateDeltaValue(resolutionCurrent, resolutionLast);

  const generatedInsights = generateInsights(overviewData, qaOptions);
  const globalInsights = generatedInsights.global || [];
  const thresholds = qaOptions.thresholds || {};

  const facultyRates = overviewData?.metrics?.facultyResponseRates?.faculties || [];
  const benchmarkPercent = Number(
    thresholds.responseRateBenchmark
      ?? overviewData?.metrics?.facultyResponseRates?.benchmarkPercent
      ?? 70,
  );
  const averageFacultyResponseRate = facultyRates.length
    ? facultyRates.reduce((sum, item) => sum + Number(item.responseRate || 0), 0) / facultyRates.length
    : 0;
  const belowBenchmarkCount = facultyRates.filter(
    (item) => Number(item.responseRate || 0) < benchmarkPercent,
  ).length;

  const statStrip = [
    {
      key: "surveyResponses",
      label: "Survey Responses",
      value: surveyResponsesCurrent.toLocaleString(),
    },
    {
      key: "appeals",
      label: "Appeals",
      value: appealsCurrent.toLocaleString(),
    },
    {
      key: "coverage",
      label: "Coverage",
      value: overviewData?.coverage?.allFaculties
        ? "All Faculties"
        : overviewData?.coverage?.faculties?.length
          ? overviewData.coverage.faculties.join(", ")
          : "No Faculties",
    },
    {
      key: "semester",
      label: "Current Session",
      value: overviewData?.semester?.current || "N/A",
    },
  ];

  const uiCards = [
    {
      type: "visual",
      tileClass: "tile-appeals",
      props: {
        color: "white",
        title: "Total Appeals Submitted",
        percentage: `${formatSignedPercent(appealsDeltaPercent.toFixed(1))} vs last semester`,
        description: "Appeals submitted across all faculties in the current appeal session",
        value: appealsCurrent,
        footer: "More details in the appeals section",
        borderRadius: 20,
      },
    },
    {
      type: "bar",
      tileClass: "tile-satisfaction",
      props: {
        title: "Student Satisfaction Score",
        value: satisfactionCurrent,
        valueSuffix: "%",
        trend: `${Math.abs(satisfactionDeltaPercent).toFixed(1)}%`,
        trendDirection: satisfactionDeltaPercent < 0 ? "down" : "up",
        target: `${Number(thresholds.satisfactionTarget ?? overviewData?.metrics?.satisfactionScore?.targetPercent ?? 0)}%`,
        progress: satisfactionCurrent,
        barColorClass: "info",
      },
    },
    {
      type: "mini",
      tileClass: "tile-mini-alert",
      props: {
        label: "Coverage Health Score",
        value: overviewData?.metrics?.coverageHealthScore?.currentSemester,
        suffix: "%",
        description: "A quick read on how balanced the current course coverage is.",
        tone: "cool",
      },
    },
    {
      type: "mini",
      tileClass: "tile-mini-appeal-courses",
      props: {
        label: "Active Courses Open to Appeal",
        value: overviewData?.metrics?.activeCoursesOpenToAppeal?.count,
        description: "Courses currently accepting appeal submissions.",
        tone: "cool",
      },
    },
    {
      type: "mini",
      tileClass: "tile-mini-survey-courses",
      props: {
        label: "Active Courses Open to Surveys",
        value: overviewData?.metrics?.activeCoursesOpenToSurvey?.count,
        description: "Courses currently collecting survey responses.",
        tone: "cool",
      },
    },
    {
      type: "ring",
      tileClass: "tile-mini-response",
      props: {
        title: "Survey Response Rate",
        value: averageFacultyResponseRate,
        maxValue: 100,
        suffix: "%",
        note: `${belowBenchmarkCount} faculties are below the ${benchmarkPercent}% benchmark.`,
      },
    },
    {
      type: "visual",
      tileClass: "tile-surveys",
      props: {
        color: "dark",
        title: "Total Surveys Submitted",
        percentage: `${formatSignedPercent(surveyResponsesDeltaPercent.toFixed(1))} vs last semester`,
        description: "Surveys submitted across all faculties in the current survey session",
        value: surveyResponsesCurrent,
        footer: "More details in the surveys section",
        icon: "hourglass",
        borderRadius: 20,
      },
    },
    {
      type: "bar",
      tileClass: "tile-resolution",
      props: {
        title: "Average Appeal Resolution Time",
        value: resolutionCurrent,
        valueSuffix: " min",
        trend: `${resolutionDeltaMinutes} min`,
        trendDirection: resolutionDeltaMinutes < 0 ? "down" : "up",
        target: `${Number(thresholds.resolutionTimeTarget ?? overviewData?.metrics?.appealResolutionTime?.targetMinutes ?? 0)} minutes`,
        progress:
          resolutionCurrent > 0
            ? (Number(thresholds.resolutionTimeTarget ?? overviewData?.metrics?.appealResolutionTime?.targetMinutes ?? 0) / resolutionCurrent) *
              100
            : 0,
        barColorClass: "warning",
      },
    },
  ];

  const renderCard = (card) => {
    const sharedProps = {
      ...card.props,
      icon: typeof card.props.icon === "string" ? icons[card.props.icon] : card.props.icon,
    };

    const cardTypeByTileClass = {
      "tile-appeals": "visual",
      "tile-surveys": "visual",
      "tile-satisfaction": "bar",
      "tile-resolution": "bar",
      "tile-mini-alert": "mini",
      "tile-mini-appeal-courses": "mini",
      "tile-mini-survey-courses": "mini",
      "tile-mini-response": "ring",
    };

    const cardType = cardTypeByTileClass[card.tileClass];

    if (cardType === "visual") {
      return <VisualCard {...sharedProps} />;
    }

    if (cardType === "bar") {
      return <BarCard {...sharedProps} />;
    }

    if (cardType === "mini") {
      return <MiniMetricCard {...sharedProps} />;
    }

    if (cardType === "ring") {
      return <RingProgressCard {...sharedProps} />;
    }

    return null;
  };

  if (loading) {
    return (
      <div id="overview">
        <div className="overview-shell">Loading overview data...</div>
      </div>
    );
  }

  if (error || !overviewData) {
    return (
      <div id="overview">
        <div className="overview-shell">Unable to load overview data.</div>
      </div>
    );
  }

  return (
    <div id="overview">
      <div className="overview-shell">
        <header className="overview-head">
          <div className="overview-head-copy">
            <p className="overview-eyebrow">{headerContent.eyebrow}</p>
            <h2>{headerContent.title}</h2>
            <p>{headerContent.subtitle}</p>
          </div>

          <div className="overview-stat-strip" aria-label="overview highlights">
            {statStrip.map((item) => (
              <div className="stat-chip" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </header>

        <section className="overview-status" aria-label="Appeals and surveys session status">
          {overviewData.sessions.map((item) => {
            const isOpen = Boolean(item.isOpen);
            const sessionName = sessionTypeLabels[item.sessionType] || item.sessionType;

            return (
              <article className="status-card" key={item.sessionType}>
                <div className="status-card-head">
                  <h3>{sessionName} Session</h3>
                  <span className={isOpen ? "status-badge open" : "status-badge closed"}>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="status-card-dates">
                  <p>
                    <span>Started:</span> {formatDate(item.startedAt)}
                  </p>
                  <p>
                    <span>{isOpen ? "Ends:" : "Ended:"}</span> {isOpen ? "Not announced" : formatDate(item.endedAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <div className="kpis">
          <div className="overview-mosaic">
            {uiCards.map((card) => (
              <article
                className={`overview-tile ${card.tileClass}`}
                key={`${card.tileClass}-${card.props.title || card.props.label}`}
              >
                {renderCard(card)}
              </article>
            ))}
          </div>
        </div>

        {globalInsights.length > 0 ? (
          <section className="overview-insights" aria-label="Global dashboard insights">
            <div className="overview-section-head">
              <div>
                <p className="section-eyebrow">Global Insights</p>
                <h3>Top-priority findings</h3>
              </div>
              <p className="section-note">These are the most important dashboard signals derived from the current QA data.</p>
            </div>

            <div className="dashboard-insights-grid" aria-label="Global insights">
              {globalInsights.map((insight) => (
                <OverviewInsightPanel key={`${insight.type}-${insight.title}-${insight.message}`} insight={insight} />
              ))}
            </div>
          </section>
        ) : null}

        <OverviewCharts overviewData={overviewData} />
      </div>
    </div>
  );
};

export default Overview;

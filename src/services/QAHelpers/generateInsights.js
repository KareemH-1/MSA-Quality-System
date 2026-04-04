const severityRank = {
  alert: 3,
  warning: 2,
  info: 1,
  success: 0,
};

const defaultInsightSettings = {
  maxInsights: 8,
  globalMaxInsights: 6,
  chartMaxInsights: 2,
  enableSpikeDetection: true,
  enableCorrelationChecks: true,
  includeTrendInsights: true,
  includePerformanceInsights: true,
  includeThresholdInsights: true,
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function percentageChange(currentValue, previousValue) {
  const current = toNumber(currentValue);
  const previous = toNumber(previousValue);

  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function createInsight({ type, title, message, severity, context = {}, priority = 0 }) {
  return {
    type,
    title,
    message,
    severity,
    context,
    priority,
  };
}

function addUniqueInsight(collection, seen, insight) {
  if (!insight || !insight.title || !insight.message) {
    return;
  }

  const signature = [
    insight.type,
    insight.title,
    insight.message,
    insight.context?.metric || "",
    insight.context?.faculty || "",
  ].join("|");

  if (seen.has(signature)) {
    return;
  }

  seen.add(signature);
  collection.push({
    type: insight.type,
    title: insight.title,
    message: insight.message,
    severity: insight.severity,
    context: insight.context || {},
    priority: insight.priority || 0,
  });
}

function sortInsights(insights) {
  return [...insights].sort((left, right) => {
    const severityDiff = severityRank[right.type] - severityRank[left.type];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const priorityDiff = (right.priority || 0) - (left.priority || 0);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.title.localeCompare(right.title);
  });
}

function finalizeInsights(insights, maxInsights) {
  return sortInsights(insights)
    .slice(0, maxInsights)
    .map((insight) => {
      const result = { ...insight };
      delete result.priority;
      return result;
    });
}

function buildThresholdInsights(data, options) {
  const insights = [];
  const thresholds = options.thresholds || {};
  const metrics = data?.metrics || {};

  const benchmark = toNumber(thresholds.responseRateBenchmark);
  const faculties = safeArray(metrics.facultyResponseRates?.faculties);
  if (faculties.length) {
    const belowBenchmark = faculties.filter((faculty) => toNumber(faculty.responseRate) < benchmark);
    const lowestFaculty = faculties.reduce((lowest, current) => {
      if (!lowest) {
        return current;
      }

      return toNumber(current.responseRate) < toNumber(lowest.responseRate) ? current : lowest;
    }, null);

    if (belowBenchmark.length > 0) {
      addUniqueInsight(insights, new Set(), createInsight({
        type: belowBenchmark.length === faculties.length ? "alert" : "warning",
        title: `${belowBenchmark.length} faculties below response benchmark`,
        message: `${lowestFaculty?.name || "A faculty"} is the lowest at ${formatPercent(lowestFaculty?.responseRate)} against a ${formatPercent(benchmark)} benchmark.`,
        severity: belowBenchmark.length === faculties.length ? "high" : "medium",
        context: {
          metric: "responseRate",
          faculty: lowestFaculty?.name,
          benchmark,
        },
        priority: 80,
      }));
    } else {
      addUniqueInsight(insights, new Set(), createInsight({
        type: "success",
        title: "Response rate benchmark met",
        message: `All faculties are at or above the ${formatPercent(benchmark)} response-rate benchmark.`,
        severity: "low",
        context: {
          metric: "responseRate",
          benchmark,
        },
        priority: 40,
      }));
    }
  }

  const satisfactionTarget = toNumber(thresholds.satisfactionTarget);
  const satisfactionCurrent = toNumber(metrics.satisfactionScore?.currentSemester);
  const satisfactionGap = satisfactionTarget - satisfactionCurrent;
  addUniqueInsight(insights, new Set(), createInsight({
    type: satisfactionCurrent >= satisfactionTarget ? "success" : "warning",
    title: satisfactionCurrent >= satisfactionTarget ? "Satisfaction target met" : "Satisfaction below target",
    message: satisfactionCurrent >= satisfactionTarget
      ? `Current satisfaction is ${formatPercent(satisfactionCurrent)}, above the ${formatPercent(satisfactionTarget)} target.`
      : `Current satisfaction is ${formatPercent(satisfactionCurrent)}, ${formatPercent(Math.abs(satisfactionGap))} below the ${formatPercent(satisfactionTarget)} target.`,
    severity: satisfactionCurrent >= satisfactionTarget ? "low" : "medium",
    context: {
      metric: "satisfactionScore",
      target: satisfactionTarget,
    },
    priority: 78,
  }));

  const resolutionTarget = toNumber(thresholds.resolutionTimeTarget);
  const resolutionCurrent = toNumber(metrics.appealResolutionTime?.currentSemesterMinutes);
  addUniqueInsight(insights, new Set(), createInsight({
    type: resolutionCurrent <= resolutionTarget ? "success" : "warning",
    title: resolutionCurrent <= resolutionTarget ? "Resolution time target met" : "Resolution time above target",
    message: resolutionCurrent <= resolutionTarget
      ? `Average resolution time is ${resolutionCurrent.toFixed(1)} minutes, within the ${resolutionTarget.toFixed(1)} minute target.`
      : `Average resolution time is ${resolutionCurrent.toFixed(1)} minutes, above the ${resolutionTarget.toFixed(1)} minute target.`,
    severity: resolutionCurrent <= resolutionTarget ? "low" : "medium",
    context: {
      metric: "appealResolutionTime",
      target: resolutionTarget,
    },
    priority: 76,
  }));

  const criticalIssuesThreshold = toNumber(thresholds.criticalIssuesHigh);
  const criticalIssuesCount = toNumber(metrics.surveyCriticalIssues?.count);
  if (criticalIssuesCount > criticalIssuesThreshold) {
    addUniqueInsight(insights, new Set(), createInsight({
      type: "alert",
      title: "Critical issues exceed threshold",
      message: `${criticalIssuesCount} critical issues exceed the threshold of ${criticalIssuesThreshold}.`,
      severity: "high",
      context: {
        metric: "surveyCriticalIssues",
        threshold: criticalIssuesThreshold,
      },
      priority: 100,
    }));
  }

  return insights;
}

function buildTrendInsights(data, options) {
  const insights = [];
  const settings = options.insightSettings || {};
  const metrics = data?.metrics || {};
  const add = (insight) => addUniqueInsight(insights, new Set(), insight);

  if (settings.includeTrendInsights !== false) {
    const trendPairs = [
      {
        metric: "appealsSubmitted",
        label: "Appeals submitted",
        current: metrics.appealsSubmitted?.currentSemester,
        previous: metrics.appealsSubmitted?.lastSemester,
        higherIsBetter: false,
      },
      {
        metric: "surveyResponses",
        label: "Survey responses",
        current: metrics.surveyResponses?.currentSemester,
        previous: metrics.surveyResponses?.lastSemester,
        higherIsBetter: true,
      },
      {
        metric: "satisfactionScore",
        label: "Satisfaction score",
        current: metrics.satisfactionScore?.currentSemester,
        previous: metrics.satisfactionScore?.lastSemester,
        higherIsBetter: true,
        suffix: "%",
      },
      {
        metric: "appealResolutionTime",
        label: "Resolution time",
        current: metrics.appealResolutionTime?.currentSemesterMinutes,
        previous: metrics.appealResolutionTime?.lastSemesterMinutes,
        higherIsBetter: false,
        suffix: " minutes",
      },
    ];

    trendPairs.forEach((item) => {
      const current = toNumber(item.current);
      const previous = toNumber(item.previous);
      const changePercent = percentageChange(current, previous);
      const isImprovement = item.higherIsBetter ? current >= previous : current <= previous;
      const type = isImprovement ? "success" : "info";
      const severity = isImprovement ? "low" : "medium";
      const direction = changePercent >= 0 ? "increased" : "decreased";

      add(
        createInsight({
          type,
          title: `${item.label} trend`,
          message: `${item.label} ${direction} by ${Math.abs(changePercent).toFixed(1)}% from ${formatNumber(previous)} to ${formatNumber(current)}${item.suffix || ""}.`,
          severity,
          context: {
            metric: item.metric,
            current,
            previous,
          },
          priority: 50,
        }),
      );
    });
  }

  return insights;
}

function buildSpikeInsight(data, options) {
  if (options.insightSettings?.enableSpikeDetection === false) {
    return null;
  }

  const multiplier = toNumber(options.thresholds?.appealSpikeMultiplier);
  const trends = safeArray(data?.charts?.appealsTrend);
  if (trends.length < 2 || multiplier <= 0) {
    return null;
  }

  let strongestSpike = null;

  for (let index = 1; index < trends.length; index += 1) {
    const previousPoint = trends[index - 1];
    const currentPoint = trends[index];
    const previous = toNumber(previousPoint.count);
    const current = toNumber(currentPoint.count);

    if (previous <= 0) {
      continue;
    }

    const ratio = current / previous;
    if (ratio >= multiplier) {
      if (!strongestSpike || ratio > strongestSpike.ratio) {
        strongestSpike = {
          ratio,
          previousPoint,
          currentPoint,
          previous,
          current,
        };
      }
    }
  }

  if (!strongestSpike) {
    return null;
  }

  const percentIncrease = ((strongestSpike.current - strongestSpike.previous) / strongestSpike.previous) * 100;

  return createInsight({
    type: "warning",
    title: "Appeals spike detected",
    message: `Appeals jumped by ${percentIncrease.toFixed(1)}% on ${strongestSpike.currentPoint.date}, from ${formatNumber(strongestSpike.previous)} to ${formatNumber(strongestSpike.current)}.`,
    severity: "medium",
    context: {
      metric: "appealsTrend",
      date: strongestSpike.currentPoint.date,
      multiplier: options.thresholds?.appealSpikeMultiplier,
    },
    priority: 90,
  });
}

function buildPerformanceSummaryInsights(data, options) {
  const weights = {
    ...options.performanceWeights,
    ...{},
  };
  const resolvedWeights = {
    responseRate: toNumber(weights.responseRate) || 0.4,
    satisfaction: toNumber(weights.satisfaction) || 0.4,
    appealRate: toNumber(weights.appealRate) || 0.2,
  };

  const metrics = safeArray(data?.charts?.facultyPerformance);
  if (!metrics.length) {
    return [];
  }

  const scoreFaculty = (item) => (
    toNumber(item.responseRate) * resolvedWeights.responseRate
    + toNumber(item.satisfaction) * resolvedWeights.satisfaction
    + (100 - toNumber(item.appealRate)) * resolvedWeights.appealRate
  );

  const sorted = [...metrics].sort((left, right) => scoreFaculty(left) - scoreFaculty(right));
  const weakest = sorted[0];
  const best = sorted[sorted.length - 1];

  return [
    best
      ? createInsight({
          type: "success",
          title: "Top overall faculty",
          message: `${best.faculty} is the strongest overall performer using response rate, satisfaction, and appeal rate.`,
          severity: "low",
          context: { metric: "facultyPerformance", faculty: best.faculty },
          priority: 72,
        })
      : null,
    weakest
      ? createInsight({
          type: "warning",
          title: "Lowest overall faculty",
          message: `${weakest.faculty} is the weakest overall performer and needs attention.`,
          severity: "medium",
          context: { metric: "facultyPerformance", faculty: weakest.faculty },
          priority: 70,
        })
      : null,
  ].filter(Boolean);
}

function buildCorrelationInsights(data, options) {
  const settings = options.insightSettings || {};
  if (settings.enableCorrelationChecks === false) {
    return [];
  }

  const metrics = data?.metrics || {};
  const thresholds = options.thresholds || {};
  const correlationRules = options.correlationRules || {};
  const faculties = safeArray(metrics.facultyResponseRates?.faculties);
  const belowBenchmark = faculties.filter((faculty) => toNumber(faculty.responseRate) < toNumber(thresholds.responseRateBenchmark));
  const satisfactionCurrent = toNumber(metrics.satisfactionScore?.currentSemester);
  const satisfactionTarget = toNumber(thresholds.satisfactionTarget);
  const appealsCurrent = toNumber(metrics.appealsSubmitted?.currentSemester);
  const appealsPrevious = toNumber(metrics.appealsSubmitted?.lastSemester);
  const surveyCurrent = toNumber(metrics.surveyResponses?.currentSemester);
  const surveyPrevious = toNumber(metrics.surveyResponses?.lastSemester);

  const insights = [];

  const lowSatisfactionRule = correlationRules.lowSatisfactionHighAppeals;
  if (lowSatisfactionRule?.enabled !== false) {
    const satisfactionGapThreshold = toNumber(lowSatisfactionRule?.satisfactionGapPercent || thresholds.satisfactionGapPercent);
    const appealsGrowthThreshold = toNumber(lowSatisfactionRule?.appealsGrowthPercent || thresholds.appealsGrowthPercent);
    const satisfactionGap = satisfactionTarget - satisfactionCurrent;
    const appealsGrowth = percentageChange(appealsCurrent, appealsPrevious);

    if (satisfactionGap >= satisfactionGapThreshold && appealsGrowth >= appealsGrowthThreshold) {
      insights.push(createInsight({
        type: "warning",
        title: "Low satisfaction with rising appeals",
        message: `Satisfaction is ${formatPercent(satisfactionCurrent)}, ${formatPercent(satisfactionGap)} below target, while appeals grew by ${appealsGrowth.toFixed(1)}% from the previous semester.`,
        severity: "medium",
        context: {
          metric: "satisfactionScore",
        },
        priority: 88,
      }));
    }
  }

  const lowResponseRule = correlationRules.lowResponseUnreliableSurveys;
  if (lowResponseRule?.enabled !== false) {
    const responseBelowCount = toNumber(lowResponseRule?.responseRateBelowBenchmarkCount || 0);
    const surveyDropThreshold = toNumber(lowResponseRule?.surveyDropPercent || thresholds.surveyDropPercent);
    const surveyDrop = percentageChange(surveyPrevious, surveyCurrent);
    const isSurveyDrop = surveyPrevious > 0 && surveyCurrent < surveyPrevious;
    const hasResponseIssue = belowBenchmark.length >= responseBelowCount && responseBelowCount > 0;

    if (hasResponseIssue && isSurveyDrop && surveyDrop >= surveyDropThreshold) {
      insights.push(createInsight({
        type: "warning",
        title: "Low response rates may weaken survey reliability",
        message: `${belowBenchmark.length} faculties are below the response benchmark and survey responses dropped by ${surveyDrop.toFixed(1)}%, which can make the survey sample less reliable.`,
        severity: "medium",
        context: {
          metric: "surveyResponses",
        },
        priority: 86,
      }));
    }
  }

  return insights;
}

function buildGlobalInsights(data, options) {
  const insightSettings = {
    ...defaultInsightSettings,
    ...(options.insightSettings || {}),
  };

  const maxInsights = Number(
    insightSettings.globalMaxInsights
      ?? insightSettings.maxInsights
      ?? defaultInsightSettings.globalMaxInsights,
  );

  const insights = [];
  const seen = new Set();
  const buckets = [];

  if (insightSettings.includeThresholdInsights !== false) {
    buckets.push(...buildThresholdInsights(data, options));
  }

  if (insightSettings.includeTrendInsights !== false) {
    buckets.push(...buildTrendInsights(data, options));
  }

  if (insightSettings.enableSpikeDetection !== false) {
    buckets.push(buildSpikeInsight(data, options));
  }

  if (insightSettings.includePerformanceInsights !== false) {
    buckets.push(...buildPerformanceSummaryInsights(data, options));
  }

  if (insightSettings.enableCorrelationChecks !== false) {
    buckets.push(...buildCorrelationInsights(data, options));
  }

  const filteredBuckets = buckets.filter(Boolean);

  filteredBuckets.forEach((insight) => addUniqueInsight(insights, seen, insight));
  return finalizeInsights(insights, maxInsights);
}

export function generateInsights(data, options) {
  const normalizedOptions = options || {};
  return {
    global: buildGlobalInsights(data, normalizedOptions),
    byChart: {},
  };
}

export default generateInsights;

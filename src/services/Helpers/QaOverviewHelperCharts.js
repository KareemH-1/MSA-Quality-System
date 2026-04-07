const formatPercentage = (value) => `${value.toFixed(2)}%`;

const Appealinsights = (midterms, finals) => {
  if (!midterms || !finals) {
    return [["No historical appeal data is available yet.", "neutral"]];
  }

  let insights = [];

  const midtermValues = Object.values(midterms).filter((count) =>
    Number.isFinite(Number(count)),
  );
  const finalValues = Object.values(finals).filter((count) =>
    Number.isFinite(Number(count)),
  );

  if (midtermValues.length === 0 && finalValues.length === 0) {
    return [["No historical appeal data is available yet.", "neutral"]];
  }

  let totalMidtermAppeals = 0;
  let totalFinalAppeals = 0;
  Object.values(midterms).forEach((count) => {
    totalMidtermAppeals += Number(count) || 0;
  });
  Object.values(finals).forEach((count) => {
    totalFinalAppeals += Number(count) || 0;
  });

  if (totalMidtermAppeals > totalFinalAppeals && totalFinalAppeals > 0) {
    const str = `Midterm appeals are higher than final appeals by ${formatPercentage((totalMidtermAppeals / totalFinalAppeals) * 100)}.`;

    insights.push([str, "positive"]);
  } else if (
    totalFinalAppeals > totalMidtermAppeals &&
    totalMidtermAppeals > 0
  ) {
    const str = `Final appeals are higher than midterm appeals by ${formatPercentage((totalFinalAppeals / totalMidtermAppeals) * 100)}.`;
    insights.push([str, "negative"]);
  } else {
    insights.push([
      "Not enough historical data to compare midterm and final appeals.",
      "neutral",
    ]);
  }

  let maxMidtermSemester = null;
  let maxFinalSemester = null;
  let maxMidtermAppeals = 0;
  let maxFinalAppeals = 0;
  Object.entries(midterms).forEach(([semester, count]) => {
    if (count > maxMidtermAppeals) {
      maxMidtermAppeals = count;
      maxMidtermSemester = semester;
    }
  });
  Object.entries(finals).forEach(([semester, count]) => {
    if (count > maxFinalAppeals) {
      maxFinalAppeals = count;
      maxFinalSemester = semester;
    }
  });

  if (maxMidtermSemester != null) {
    insights.push([
      `The semester with the highest midterm appeals is ${maxMidtermSemester} with ${maxMidtermAppeals} appeals.`,
      "neutral",
    ]);
  }
  if (maxFinalSemester != null) {
    insights.push([
      `The semester with the highest final appeals iis ${maxFinalSemester} with ${maxFinalAppeals} appeals.`,
      "neutral",
    ]);
  }

  if (insights.length === 0) {
    insights.push(["No historical appeal data is available yet.", "neutral"]);
  }

  return insights;
};

const SatisfactionInsights = (satisfactionData) => {
  if (!satisfactionData) {
    return [
      ["No historical satisfaction survey data is available yet.", "neutral"],
    ];
  }
  const insights = [];
  const satisfactionValues = Object.values(satisfactionData).filter((value) =>
    Number.isFinite(Number(value)),
  );
  if (satisfactionValues.length === 0) {
    return [
      ["No historical satisfaction survey data is available yet.", "neutral"],
    ];
  }
  let totalSatisfaction = 0;
  Object.values(satisfactionData).forEach((value) => {
    totalSatisfaction += Number(value) || 0;
  });
  const averageSatisfaction = totalSatisfaction / satisfactionValues.length;

  insights.push([
    `The average satisfaction survey score across semesters is ${averageSatisfaction.toFixed(2)}%.`,
    "neutral",
  ]);

  let increase;
  if (satisfactionValues.length >= 2) {
    increase =
      satisfactionValues[satisfactionValues.length - 1] -
      satisfactionValues[satisfactionValues.length - 2];
    const increasePercentage = formatPercentage(increase);
    if (increase > 0) {
      insights.push([
        `The satisfaction survey score has increased by ${increasePercentage} compared to last semester.`,
        "positive",
      ]);
    } else if (increase < 0) {
      insights.push([
        `The satisfaction survey score has decreased by ${increasePercentage} compared to last semester.`,
        "negative",
      ]);
    } else {
      insights.push([
        `The satisfaction survey score has remained the same compared to last semester.`,
        "neutral",
      ]);
    }
  }

  if (insights.length === 0) {
    insights.push([
      "No historical satisfaction survey data is available yet.",
      "neutral",
    ]);
  }

  return insights;
};

const FacultySatisfactionInsights = (satisfactionFaculties) => {
  if (!satisfactionFaculties) {
    return [
      [
        "No historical satisfaction survey data by faculty is available yet.",
        "neutral",
      ],
    ];
  }
  const insights = [];
  const satisfactionValues = Object.values(satisfactionFaculties).filter(
    (value) => Number.isFinite(Number(value)),
  );
  if (satisfactionValues.length === 0) {
    return [
      [
        "No historical satisfaction survey data by faculty is available yet.",
        "neutral",
      ],
    ];
  }
  let totalSatisfaction = 0;
  Object.values(satisfactionFaculties).forEach((value) => {
    totalSatisfaction += Number(value) || 0;
  });
  const averageSatisfaction = totalSatisfaction / satisfactionValues.length;
  insights.push([
    `The average satisfaction survey score across faculties is ${averageSatisfaction.toFixed(2)}%.`,
    "neutral",
  ]);
  const sortedFaculties = Object.entries(satisfactionFaculties).sort(
    (a, b) => b[1] - a[1],
  );
  const [topFaculty, topScore] = sortedFaculties[0];
  const [bottomFaculty, bottomScore] =
    sortedFaculties[sortedFaculties.length - 1];
  insights.push([
    `The faculty with the highest satisfaction score is ${topFaculty} with a score of ${topScore}%.`,
    "positive",
  ]);
  insights.push([
    `The faculty with the lowest satisfaction score is ${bottomFaculty} with a score of ${bottomScore}%.`,
    "negative",
  ]);
  if (insights.length === 0) {
    insights.push([
      "No historical satisfaction survey data by faculty is available yet.",
      "neutral",
    ]);
  }
  return insights;
};
const generateFacultySatisfactionColors = (satisfactionFaculties) => {
  const sortedFaculties = Object.keys(satisfactionFaculties || {}).sort(
    (a, b) => (satisfactionFaculties[b] || 0) - (satisfactionFaculties[a] || 0),
  );

  const backgroundColor = sortedFaculties.map((faculty, index, arr) => {
    const ratio = index / arr.length;
    const alpha = 0.7 - ratio * 0.4;
    return `rgba(40, 167, 69, ${alpha})`;
  });

  const borderColor = "rgba(40, 167, 69, 1)";

  return { backgroundColor, borderColor };
};

const ResolutionTimeInsights = (resolutionEntries) => {
  if (!Array.isArray(resolutionEntries) || resolutionEntries.length === 0) {
    return [
      [
        "No resolution-time data is available for the current session yet.",
        "neutral",
      ],
    ];
  }

  const parsedEntries = resolutionEntries
    .map(([label, value]) => [label, Number(value)])
    .filter(([, value]) => Number.isFinite(value));

  if (parsedEntries.length === 0) {
    return [
      [
        "No resolution-time data is available for the current session yet.",
        "neutral",
      ],
    ];
  }

  const insights = [];
  const total = parsedEntries.reduce((sum, [, value]) => sum + value, 0);
  const average = total / parsedEntries.length;

  insights.push([
    `The average resolution time so far is ${average.toFixed(2)} minutes.`,
    "neutral",
  ]);

  if (parsedEntries.length >= 2) {
    const [firstLabel, firstValue] = parsedEntries[0];
    const [lastLabel, lastValue] = parsedEntries[parsedEntries.length - 1];
    const change = lastValue - firstValue;

    if (change < 0) {
      insights.push([
        `Resolution time improved by ${Math.abs(change).toFixed(2)} minutes from ${firstLabel} to ${lastLabel}.`,
        "positive",
      ]);
    } else if (change > 0) {
      insights.push([
        `Resolution time increased by ${change.toFixed(2)} minutes from ${firstLabel} to ${lastLabel}.`,
        "negative",
      ]);
    } else {
      insights.push([
        `Resolution time remained stable from ${firstLabel} to ${lastLabel}.`,
        "neutral",
      ]);
    }
  }

  const fastestEntry = parsedEntries.reduce((fastest, current) =>
    current[1] < fastest[1] ? current : fastest,
  );
  const slowestEntry = parsedEntries.reduce((slowest, current) =>
    current[1] > slowest[1] ? current : slowest,
  );

  insights.push([
    `Fastest day: ${fastestEntry[0]} (${fastestEntry[1].toFixed(2)} minutes). Slowest day: ${slowestEntry[0]} (${slowestEntry[1].toFixed(2)} minutes).`,
    "neutral",
  ]);

  return insights;
};

const AppealBreakdownInsights = (lastAppealBreakdown) => {
  if (!lastAppealBreakdown) {
    return [["No appeal-breakdown data is available yet.", "neutral"]];
  }

  const total = Number(lastAppealBreakdown?.Total) || 0;
  const accepted = Number(lastAppealBreakdown?.Accepted) || 0;
  const pending = Number(lastAppealBreakdown?.Pending) || 0;
  const rejected = Number(lastAppealBreakdown?.Rejected) || 0;
  const resolved = accepted + rejected;

  if (total <= 0) {
    return [["No appeal-breakdown data is available yet.", "neutral"]];
  }

  const insights = [];
  const acceptedRate = (accepted / resolved) * 100;
  const pendingRate = (pending / total) * 100;
  const rejectedRate = (rejected / resolved) * 100;

  insights.push([
    `Out of ${total} appeals, ${resolved} are resolved and ${pending} are pending.`,
    "neutral",
  ]);

  insights.push([
    `Acceptance rate is ${formatPercentage(acceptedRate)} and rejection rate is ${formatPercentage(rejectedRate)}.`,
    acceptedRate >= rejectedRate ? "positive" : "negative",
  ]);

  if (pendingRate >= 40) {
    insights.push([
      `Pending cases are ${formatPercentage(pendingRate)} of total appeals, indicating a high unresolved workload.`,
      "negative",
    ]);
  } else {
    insights.push([
      `Pending cases are ${formatPercentage(pendingRate)} of total appeals.`,
      "neutral",
    ]);
  }

  return insights;
};

export {
  Appealinsights,
  SatisfactionInsights,
  generateFacultySatisfactionColors,
  FacultySatisfactionInsights,
  ResolutionTimeInsights,
  AppealBreakdownInsights,
};

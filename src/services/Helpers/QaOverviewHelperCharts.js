const formatPercentage = (value) => `${value.toFixed(2)}%`;

const Appealinsights = (midterms , finals) => {
  if(!midterms || !finals) {
    return [["No historical appeal data is available yet.", "neutral"]];
  }

    let insights = [];

    const midtermValues = Object.values(midterms).filter(
      (count) => Number.isFinite(Number(count)),
    );
    const finalValues = Object.values(finals).filter(
      (count) => Number.isFinite(Number(count)),
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
      const str= `Midterm appeals are higher than final appeals by ${formatPercentage((totalMidtermAppeals / totalFinalAppeals) * 100)}.`
      
        insights.push(
            [str , "positive"]
        );
    }
    else if (totalFinalAppeals > totalMidtermAppeals && totalMidtermAppeals > 0) {
      const str= `Final appeals are higher than midterm appeals by ${formatPercentage((totalFinalAppeals / totalMidtermAppeals) * 100)}.`
        insights.push(
            [str , "negative"]
        );
    }
    else {
        insights.push(
            ["Not enough historical data to compare midterm and final appeals." , "neutral"]
        );
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
      insights.push(
          [`The semester with the highest midterm appeals is ${maxMidtermSemester} with ${maxMidtermAppeals} appeals.`, "neutral"]
      );
    }
    if (maxFinalSemester != null) {
      insights.push(
          [`The semester with the highest final appeals is ${maxFinalSemester} with ${maxFinalAppeals} appeals.`, "neutral"]
      );
    }

    if (insights.length === 0) {
      insights.push(["No historical appeal data is available yet.", "neutral"]);
    }
    
    return insights;
}


export { Appealinsights };
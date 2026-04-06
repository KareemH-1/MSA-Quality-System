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
          [`The semester with the highest final appeals iis ${maxFinalSemester} with ${maxFinalAppeals} appeals.`, "neutral"]
      );
    }

    if (insights.length === 0) {
      insights.push(["No historical appeal data is available yet.", "neutral"]);
    }
    
    return insights;
}

const SatisfactionInsights = (satisfactionData) => {
  if(!satisfactionData) {
    return [["No historical satisfaction survey data is available yet.", "neutral"]];
  }
    const insights = [];
    const satisfactionValues = Object.values(satisfactionData).filter(
      (value) => Number.isFinite(Number(value)),
    );
    if (satisfactionValues.length === 0) {
      return [["No historical satisfaction survey data is available yet.", "neutral"]];
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
    if(satisfactionValues.length >= 2) {
        increase = satisfactionValues[satisfactionValues.length-1] - satisfactionValues[satisfactionValues.length-2];
        const increasePercentage = formatPercentage(increase);
        if(increase > 0) {
            insights.push([
                `The satisfaction survey score has increased by ${increasePercentage} compared to last semester.`,
                "positive",
              ]);
        }
        else if(increase < 0) {
            insights.push([
                `The satisfaction survey score has decreased by ${increasePercentage} compared to last semester.`,
                "negative",
              ]);
        }
        else {
            insights.push([
                `The satisfaction survey score has remained the same compared to last semester.`,
                "neutral",
              ]);
        }
    }

    if (insights.length === 0) {
      insights.push(["No historical satisfaction survey data is available yet.", "neutral"]);
    }



    return insights;
}


export { Appealinsights, SatisfactionInsights };
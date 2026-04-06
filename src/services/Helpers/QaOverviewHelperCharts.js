const formatPercentage = (value) => `${value.toFixed(2)}%`;

const Appealinsights = (midterms , finals) => {
  if(!midterms || !finals) return null;

    let insights = [];

    let totalMidtermAppeals = 0;
    let totalFinalAppeals = 0;
    Object.values(midterms).forEach((count) => {
      totalMidtermAppeals += count;
    });
    Object.values(finals).forEach((count) => {
      totalFinalAppeals += count;
    });

    if (totalMidtermAppeals > totalFinalAppeals) {
      const str= `Midterm appeals are higher than final appeals by ${formatPercentage((totalMidtermAppeals / totalFinalAppeals) * 100)}.`
      
        insights.push(
            [str , "positive"]
        );
    }
    else if (totalFinalAppeals > totalMidtermAppeals) {
      const str= `Final appeals are higher than midterm appeals by ${formatPercentage((totalFinalAppeals / totalMidtermAppeals) * 100)}.`
        insights.push(
            [str , "negative"]
        );
    }
    else {
        insights.push(
            ["Midterm and final appeals are equal." , "neutral"]
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

    insights.push(
        [`The semester with the highest midterm appeals is ${maxMidtermSemester} with ${maxMidtermAppeals} appeals.`, "neutral"]
    );
    insights.push(
        [`The semester with the highest final appeals is ${maxFinalSemester} with ${maxFinalAppeals} appeals.`, "neutral"]
    );
    
    return insights;
}


export { Appealinsights };
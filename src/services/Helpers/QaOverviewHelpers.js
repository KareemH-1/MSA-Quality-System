const getAppealStatus = (appeal = {}) => {
  if (appeal.isOpen) return "Open";
  if (appeal.endedAt != null) return "Closed";
  return "Not Started";
};

const getAppealRate = (appeal = {}) => {
  if (appeal.isOpen || appeal.endedAt != null) {
    return Number(appeal.total) || 0;
  }
  return 0;
};

const thisSemestervsLastAppeals = (currentAppeals = {}, last = {}) => {
  let midtermRate = 0;
  let finalRate = 0;

  const currentMidterm = currentAppeals?.midterm ?? {};
  const currentFinal = currentAppeals?.final ?? {};
  const lastMidtermTotal = Number(last?.appeals?.midterm?.total) || 0;
  const lastFinalTotal = Number(last?.appeals?.final?.total) || 0;

  if ((currentMidterm.isOpen || currentMidterm.endedAt != null) && lastMidtermTotal > 0) {
    midtermRate = ((Number(currentMidterm.total) || 0) - lastMidtermTotal) / lastMidtermTotal * 100;
  }

  if ((currentFinal.isOpen || currentFinal.endedAt != null) && lastFinalTotal > 0) {
    finalRate = ((Number(currentFinal.total) || 0) - lastFinalTotal) / lastFinalTotal * 100;
  }

  return { midtermRate, finalRate };
};

export { getAppealStatus, getAppealRate, thisSemestervsLastAppeals };
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles/Overview.css";
import { VisualCard } from "../cards/VisualCard";
import BarCard from "../cards/BarCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import RingProgressCard from "../cards/RingProgressCard";
import Loader from "../Loader";
import { getAppealStatus , getAppealRate , thisSemestervsLastAppeals} from "../../services/Helpers/QaOverviewHelpers";
import OverviewCharts from "./OverviewCharts";
const Overview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingLoads, setPendingLoads] = useState(0);
  const [errors, setErrors] = useState(null);

  const startLoading = () => {
    setPendingLoads((previous) => previous + 1);
  };

  const stopLoading = () => {
    setPendingLoads((previous) => Math.max(0, previous - 1));
  };

  useEffect(() => {
    setLoading(pendingLoads > 0);
  }, [pendingLoads]);


  

  useEffect(() => {
    const fetchOverviewData = async () => {
      startLoading();
      try {
        const response = await fetch("/mockOverviewData.json");
        if (!response.ok) {
          throw new Error(`Failed to load overview data: ${response.status}`);
        }

        const data = await response.json();
        setOverviewData(data);
      } catch (fetchError) {
        setErrors((previous) => [
          ...(previous || []),
          { location: "fetchOverviewData", message: fetchError.message },
        ]);
      } finally {
        stopLoading();
      }
    };

    fetchOverviewData();
  }, []);

  if (
    errors &&
    errors.some(
      (error) =>
        error.location === "fetchOverviewData" ||
        error.location === "fetchOverviewChartsData"
    )
  ) {
    return (
      <div id="overview" className="page-cont">
        <div className="error-message">
          Cannot Load the Overview Data, Please try again and if it persists,
          contact{" "}
          <Link to="/support" style={{ color: "blue" }}>
            support
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div id="overview" className="page-cont">
      {loading && <Loader />}
      {overviewData && (
        <>
          {(() => {
            const semesterAppealDelta = thisSemestervsLastAppeals(
              overviewData.appeals,
              overviewData.previousSemesterData
            );
            const midtermStatus = getAppealStatus(overviewData.appeals.midterm);
            const finalStatus = getAppealStatus(overviewData.appeals.final);

            return (
              <>
              <div className="overview-header">
                <div className="semester">
                  <h1 className="semester-title">Current Semester</h1>
                  <p className="semester-name">
                    {overviewData.semester.current}
                  </p>
                </div>

                <div className="appeal-status">
                  <h1 className="appeal-status-title">Appeal Status</h1>
                  <div className="appeals">
                    <div className="midterm">
                      <h2 className="appeal-title">Midterm</h2>
                      <p className="appeal-description">
                        Appeal Status
                        <span
                          className={`appeal-pill ${midtermStatus.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {midtermStatus}
                        </span>
                      </p>
                    </div>
                    <div className="final">
                      <h2 className="appeal-title">Final</h2>
                      <p className="appeal-description">
                        Appeal Status
                        <span
                          className={`appeal-pill ${finalStatus.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {finalStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="survey-status">
                  <h1 className="survey-status-title">Survey Status</h1>
                  <p className="survey-status-description">
                    {overviewData.survey.isOpen ? "Open" : "Closed"}
                  </p>
                </div>
              </div>

                <div className="section">
                  <h2 className="section-title">Summary</h2>
                  <h3 className="section-subtitle">
                    Summary of Quality Metrics and Critical Issues

                    <div className="summary-metrics">
                      <div className="appeal-totals">
                        <div className="midTerm-total">
                          <h1 className="total-title">Midterm Appeals</h1>
                          <h2 className="total-value">{getAppealRate(overviewData.appeals.midterm)}</h2>
                          <p className={`rate-change ${semesterAppealDelta.midtermRate >= 0 ? 'positive' : 'negative'}`}>
                            {semesterAppealDelta.midtermRate.toFixed(2)}% from last semester
                          </p>
                        </div>
                        <div className="final-total">
                          <h1 className="total-title">Final Appeals</h1>
                          <h2 className="total-value">{getAppealRate(overviewData.appeals.final)}</h2>
                          <p className={`rate-change ${semesterAppealDelta.finalRate >= 0 ? 'positive' : 'negative'}`}>
                            {semesterAppealDelta.finalRate.toFixed(2)}% from last semester
                          </p>
                        </div>
                      </div>
                    </div>
                  </h3>
                </div>
                <OverviewCharts
                  setErrors={setErrors}
                  setLoading={setLoading}
                  onLoadStart={startLoading}
                  onLoadEnd={stopLoading}
                />
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default Overview;

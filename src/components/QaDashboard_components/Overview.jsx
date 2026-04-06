import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles/Overview.css";
import { VisualCard } from "../cards/VisualCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import Loader from "../Loader";
import {
  getAppealStatus,
  getAppealRate,
  thisSemestervsLastAppeals,
} from "../../services/Helpers/QaOverviewHelpers";
import OverviewCharts from "./OverviewCharts";
const Overview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [overviewChartsData, setOverviewChartsData] = useState(null);
  const [pendingLoads, setPendingLoads] = useState(0);
  const [errors, setErrors] = useState([]);
  const loading = pendingLoads > 0;

  const startLoading = () => {
    setPendingLoads((previous) => previous + 1);
  };

  const stopLoading = () => {
    setPendingLoads((previous) => Math.max(0, previous - 1));
  };

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
          ...previous,
          { location: "fetchOverviewData", message: fetchError.message },
        ]);
      } finally {
        stopLoading();
      }
    };

    const fetchOverviewChartsData = async () => {
      startLoading();
      try {
        const response = await fetch("/OverviewChartsData.json");
        if (!response.ok) {
          throw new Error(
            `Failed to load overview charts data: ${response.status}`,
          );
        }

        const data = await response.json();
        setOverviewChartsData(data);
      } catch (fetchError) {
        setErrors((previous) => [
          ...previous,
          { location: "fetchOverviewChartsData", message: fetchError.message },
        ]);
      } finally {
        stopLoading();
      }
    };

    fetchOverviewData();
    fetchOverviewChartsData();
  }, []);

  if (
    errors &&
    errors.some((error) => error.location === "fetchOverviewData")
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
            const kpis = [
              {
                label: "pending appeals",
                value: overviewData?.kpis?.pendingAppeals?.value ?? 0,
                description:
                  overviewData?.kpis?.pendingAppeals?.description ??
                  "Number of appeals pending review",
                tone:
                  overviewData?.kpis?.pendingAppeals?.severity === "warn"
                    ? "warn"
                    : "cool",
              },
              {
                label: "approved appeals",
                value: overviewData?.kpis?.approvedAppeals?.ratePercent ?? 0,
                suffix: "%",
                description: `${overviewData?.kpis?.approvedAppeals?.value ?? 0} approved cases`,
                tone:
                  overviewData?.kpis?.approvedAppeals?.severity === "warn"
                    ? "warn"
                    : "cool",
              },
              {
                label: "rejected appeals",
                value: overviewData?.kpis?.rejectedAppeals?.ratePercent ?? 0,
                suffix: "%",
                description: `${overviewData?.kpis?.rejectedAppeals?.value ?? 0} rejected cases`,
                tone:
                  overviewData?.kpis?.rejectedAppeals?.severity === "cool"
                    ? "cool"
                    : "warn",
              },
              {
                label: "average resolution time",
                value: overviewData?.kpis?.appealResolutionTime?.value ?? 0,
                suffix: " days",
                description:
                  overviewData?.kpis?.appealResolutionTime?.description ??
                  "Average time to resolve an appeal",
                tone: "cool",
              },
            ];

            const semesterAppealDelta = thisSemestervsLastAppeals(
              overviewData.appeals,
              overviewData.previousSemesterData,
            );
            const midtermStatus = getAppealStatus(overviewData.appeals.midterm);
            const finalStatus = getAppealStatus(overviewData.appeals.final);
            const totalAppealsCurrent =
              getAppealRate(overviewData.appeals.midterm) +
              getAppealRate(overviewData.appeals.final);

            const totalAppealsLastSemester =
              (Number(
                overviewData.previousSemesterData?.appeals?.midterm?.total,
              ) || 0) +
              (Number(
                overviewData.previousSemesterData?.appeals?.final?.total,
              ) || 0);
            const totalAppealsDeltaPercent =
              totalAppealsLastSemester > 0
                ? ((totalAppealsCurrent - totalAppealsLastSemester) /
                    totalAppealsLastSemester) *
                  100
                : 0;
            const totalAppealsDeltaLabel = `${totalAppealsDeltaPercent >= 0 ? "+" : ""}${totalAppealsDeltaPercent.toFixed(2)}% vs last semester`;
            const satisfactionScoreValue =
              overviewData?.kpis?.satisfactionScore?.value ?? 0;
            const satisfactionTargetValue =
              overviewData?.kpis?.satisfactionScore?.target ?? 0;
            const satisfactionDeltaPercent =
              overviewData?.kpis?.satisfactionScore?.deltaPercent ?? 0;
            const satisfactionDeltaLabel = `${satisfactionDeltaPercent >= 0 ? "+" : ""}${Number(satisfactionDeltaPercent).toFixed(1)}% vs last semester`;
            const satisfactionGapToTarget =
              satisfactionScoreValue - satisfactionTargetValue;
            const satisfactionTargetLabel = `${satisfactionGapToTarget >= 0 ? "+" : ""}${satisfactionGapToTarget.toFixed(1)} pts vs target`;
            const satisfactionFromLastSemester =
              overviewData?.kpis?.satisfactionScore?.lastSemesterValue ?? 0;
            const satisfactionDescription =
              overviewData?.kpis?.satisfactionScore?.description ??
              "Average satisfaction score from surveys";
            const satisfactionFooter = `Target: ${satisfactionTargetValue}% | Last semester: ${satisfactionFromLastSemester}% (${satisfactionDeltaLabel})`;

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
                          <h2 className="total-value">
                            {getAppealRate(overviewData.appeals.midterm)}
                          </h2>
                          <p
                            className={`rate-change ${semesterAppealDelta.midtermRate >= 0 ? "positive" : "negative"}`}
                          >
                            {semesterAppealDelta.midtermRate.toFixed(2)}% vs
                            last semesters midterm appeals
                          </p>
                        </div>
                        <div className="final-total">
                          <h1 className="total-title">Final Appeals</h1>
                          <h2 className="total-value">
                            {getAppealRate(overviewData.appeals.final)}
                          </h2>
                          <p
                            className={`rate-change ${semesterAppealDelta.finalRate >= 0 ? "positive" : "negative"}`}
                          >
                            {semesterAppealDelta.finalRate.toFixed(2)}% vs last
                            semesters final appeals
                          </p>
                        </div>
                      </div>
                    </div>
                  </h3>
                </div>
                <div className="overview-cards">
                  <VisualCard
                    color="white"
                    title="Total Appeals"
                    value={totalAppealsCurrent}
                    percentage={totalAppealsDeltaLabel}
                    description="Total submitted in this semester"
                    footer="Includes midterm and final appeals"
                    borderRadius={16}
                  />
                  <VisualCard
                    color="white"
                    title="Satisfaction Score"
                    value={satisfactionScoreValue}
                    percentage={satisfactionTargetLabel}
                    description={satisfactionDescription}
                    footer={satisfactionFooter}
                    borderRadius={16}
                  />
                </div>

                <div className="overview-kpi-grid">
                  {kpis.map((kpi, index) => (
                    <MiniMetricCard
                      key={index}
                      label={kpi.label}
                      value={kpi.value}
                      suffix={kpi.suffix}
                      description={kpi.description}
                      tone={kpi.tone}
                    />
                  ))}
                </div>
                <OverviewCharts
                  overviewChartsJson={overviewChartsData}
                  errorMessage={
                    errors.find(
                      (error) => error.location === "fetchOverviewChartsData",
                    )?.message
                  }
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

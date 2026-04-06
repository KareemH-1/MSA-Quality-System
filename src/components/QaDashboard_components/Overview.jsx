import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles/Overview.css";
import { VisualCard } from "../cards/VisualCard";
import BarCard from "../cards/BarCard";
import MiniMetricCard from "../cards/MiniMetricCard";
import RingProgressCard from "../cards/RingProgressCard";
import { Hourglass} from "lucide-react";
import Loader from "../Loader";

const Overview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(null);

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
        setErrors([{ location: "fetchOverviewData", message: fetchError.message }]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);


  if (errors && errors.some(error => error.location === "fetchOverviewData")) {
    return (
      <div id="overview" className="page-cont">
        <div className="error-message">Cannot Load the Overview Data, Please try again and if it persists, contact <Link to="/support" style={{ color: 'blue' }}>support</Link>.</div>
      </div>
    );
  }



  return (
    <div id="overview" className="page-cont">
      {loading && <Loader />}
      {overviewData && (
        <>
          <div className="overview-row">
              
          </div>
        </>
      )}        
    </div>
  );
};

export default Overview;

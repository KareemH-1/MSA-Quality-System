import React from "react";
import "./styles/Overview.css";
import { VisualCard } from "../cards/VisualCard";
import BarCard from "../cards/BarCard";
import { Bell, Hourglass, TrendingUp } from "lucide-react";
const Overview = () => {
  return (
    <div id="overview">
      <div className="content">
        <div className="kpis">
          <div className="flex row gap-5">
            
            <div className="col flex gap-10">
              <VisualCard
                color="white"
                title="Total appeals Submitted"
                percentage="+5% vs last semester"
                description="Appeals submitted accross all faculties in the current appeal session"
                value={1200}
                footer="more details in the appeals section"
                borderRadius={14}
              />

              <VisualCard
                title="Total Surveys Submitted"
                percentage="-8% vs last semester"
                description="Surveys submitted across all faculties in the current survey session"
                value={900}
                footer="more details in the surveys section"
                icon={<Hourglass size={24} />}
                maxWidth={250}
                borderRadius={14}
              />
            </div>

            <div className="col">
             <BarCard
                title="Student Satisfaction Score"
                value={79.8}
                valueSuffix="%"
                trend="2.1%"
                target="85%"
                progress={79.8}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

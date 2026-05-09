import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ModuleLeaderAppeals from "../../components/ModuleLeader/ModuleLeaderAppeals";

export default function ModuleLeaderServices({ currentNavItem, onTabChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    location.state?.tab ?? currentNavItem ?? "Appeals",
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  useEffect(() => {
    if (location.state?.tab) {
      handleTabChange(location.state.tab);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.tab]);

  useEffect(() => {
    if (!location.state?.tab && currentNavItem) {
      setActiveTab(currentNavItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNavItem]);

  if (activeTab === "Surveys") return <ModuleLeaderSurveys />;
  if (activeTab === "Appeals") return <ModuleLeaderAppeals />;
  return <ModuleLeaderAppeals />;
}

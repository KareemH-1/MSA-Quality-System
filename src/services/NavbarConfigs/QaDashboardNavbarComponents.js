export const getQaDashboardNavbarComponents = (currentItem, setCurrentItem) => {
  const handleOverviewClick = () => {
    setCurrentItem("Overview");
  };

  const handleAppealsClick = () => {
    setCurrentItem("Appeals");
  };

  const handleSurveysClick = () => {
    console.log("QaDashboard: Surveys clicked");
    setCurrentItem("Surveys");
  };

  return [
    {
      name: "Overview",
      onClick: handleOverviewClick,
      active: currentItem === "Overview",
    },
    {
      name: "Appeals",
      onClick: handleAppealsClick,
      active: currentItem === "Appeals",
    },
    { name: "Surveys",
      onClick: handleSurveysClick, 
      active: currentItem === "Surveys" }
  ];
};

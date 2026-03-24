export const getHomeNavbarComponents = (currentItem, setCurrentItem) => {
  const handleOverviewClick = () => {
    console.log("Home: Overview clicked");
    setCurrentItem("Overview");
  };

  const handleInsightsClick = () => {
    console.log("Home: Insights clicked");
    setCurrentItem("Insights");
  };

  const handleTasksClick = () => {
    console.log("Home: Tasks clicked");
    setCurrentItem("Tasks");
  };

  return [
    {
      name: "Overview",
      onClick: handleOverviewClick,
      active: currentItem === "Overview",
    },
    {
      name: "Insights",
      onClick: handleInsightsClick,
      active: currentItem === "Insights",
    },
    { name: "Tasks", onClick: handleTasksClick, active: currentItem === "Tasks" },
  ];
};

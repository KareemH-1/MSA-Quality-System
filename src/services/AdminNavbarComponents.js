const getAdminManageUserNavbarComponents = (currentItem, setCurrentItem) => {

  const handleDashboardClick = () => {
    setCurrentItem("Dashboard");
  };
  const handleUserManagementClick = () => {
    setCurrentItem("User Management");
  }

  return [
    {
      name: "Dashboard",
      onClick: handleDashboardClick,
      active: currentItem === "Dashboard",
    },
    {
      name: "User Management",
      onClick: handleUserManagementClick,
      active: currentItem === "User Management",
    }
  ];
};

export { getAdminManageUserNavbarComponents};
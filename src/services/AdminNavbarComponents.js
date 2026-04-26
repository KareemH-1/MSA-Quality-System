const getAdminManageUserNavbarComponents = (currentItem, setCurrentItem) => {
  const handleUserManagementClick = () => {
    setCurrentItem("User Management");
  }

  return [
    {
      name: "User Management",
      onClick: handleUserManagementClick,
      active: currentItem === "User Management",
    }
  ];
};

export { getAdminManageUserNavbarComponents};
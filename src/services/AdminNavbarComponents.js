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

const getAdminFacultyNavbarComponents = (currentItem, setCurrentItem) => {
  const handleFacultyClick = () => {
    setCurrentItem("Faculties");
  };

  return [
    {
      name: "Faculties",
      onClick: handleFacultyClick,
      active: currentItem === "Faculties",
    },
  ];
};

const getAdminCoursesNavbarComponents = (currentItem, setCurrentItem) => {
  const handleCoursesClick = () => {
    setCurrentItem("Courses");
  };

  return [
    {
      name: "Courses",
      onClick: handleCoursesClick,
      active: currentItem === "Courses",
    },
  ];
};

export { getAdminManageUserNavbarComponents, getAdminFacultyNavbarComponents, getAdminCoursesNavbarComponents };
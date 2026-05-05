export const getStudentNavbarComponents = (currentItem, setCurrentItem) => [
  {
    name: "Home",
    active: currentItem === "Home",
    onClick: () => setCurrentItem("Home"),
  },
  {
    name: "Appeals",
    active: currentItem === "Appeals",
    onClick: () => setCurrentItem("Appeals"),
  },
  {
    name: "Surveys",
    active: currentItem === "Surveys",
    onClick: () => setCurrentItem("Surveys"),
  },
];

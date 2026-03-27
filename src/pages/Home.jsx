import React, { useMemo } from "react";
import "../../styles/Home.css";

const Home = ({ currentNavItem }) => {
  const greetingName = useMemo(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return "User";
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      let candidate = "";

      if (parsedUser?.name) {
        candidate = parsedUser.name.trim().split(/\s+/)[0];
      } else if (parsedUser?.email) { 
        const localPart = parsedUser.email.split("@")[0] ?? "";
        candidate = localPart.split(/[._-]/)[0] ?? "";
      }

      if (!candidate) {
        return "User";
      }

      return (
        candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase()
      );
    } catch {
      return "User";
    }
  }, []);

  return (
    <>
      <h1>Welcome to the MSA Quality System</h1>
      <h3>Welcome, {greetingName}</h3>
      {currentNavItem && <p>Current Tab: {currentNavItem}</p>}
    </>
  );
};

export default Home;
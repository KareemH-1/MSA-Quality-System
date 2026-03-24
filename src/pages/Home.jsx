import React, { useMemo, useState } from "react";
import SideBar from "../components/layout/sideBar";
import "../styles/Home.css";
import { Logs, CircleX } from "lucide-react";
import NavBar from "../components/layout/navBar";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="home-page">
      <NavBar isSidebarOpen={isSidebarOpen} />
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <CircleX size={16} /> : <Logs size={16} />}
      </button>

      <SideBar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main
        className={
          isSidebarOpen ? "home-content content-shifted" : "home-content"
        }
      >
        <h1>Welcome to the MSA Quality System</h1>
        <h3>Welcome, {greetingName}</h3>
      </main>
    </div>
  );
};

export default Home;
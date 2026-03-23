import React, { useState } from "react";
import SideBar from "../components/layout/sideBar";
import "../styles/Home.css";
import { Logs, CircleX } from "lucide-react";
import NavBar from "../components/layout/navBar";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <p>Select a section from the left sidebar to continue.</p>
      </main>
    </div>
  );
};

export default Home;

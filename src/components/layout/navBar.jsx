import React from "react";
import { Link } from "react-router-dom";
import "../../styles/NavBar.css";
import { Bell, Info, UserRoundPen } from "lucide-react";

const NavBar = ({ isSidebarOpen }) => {
  return (
    <nav className={isSidebarOpen ? "navbar navbar-shifted" : "navbar"}>
      <h2>Academic Editorial</h2>
      <div className="navbar-links">
        <div className="navbar-item">
          <Link to="/reports" className="navbar-logo">
            Reports
          </Link>
        </div>
        <div className="navbar-item">
          <Link to="/archive" className="navbar-link">
            Archive
          </Link>
        </div>
        <div className="navbar-item">
          <Link to="/settings" className="navbar-link">
            Settings
          </Link>
        </div>
      </div>
      <div className="navbar-actions">
        <input type="text" placeholder="Search..." />
        <div className="navbar-icons">
          <Bell />
          <Info />
          <UserRoundPen />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

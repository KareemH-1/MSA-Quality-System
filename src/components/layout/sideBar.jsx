import React from "react";
import { Link } from "react-router-dom";

const SideBar = ({ isOpen, onClose }) => {
  return (
    <>
      <aside
        className={isOpen ? "sidebar sidebar-open" : "sidebar"}
        aria-hidden={!isOpen}
      >
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/logout">Logout</Link>
        </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />} 
    </>
  );
};

export default SideBar;

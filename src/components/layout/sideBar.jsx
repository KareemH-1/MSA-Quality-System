import React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import MSA_Logo from "../../assets/MSA_Logo.png";
import user_image from "../../assets/user.jpg";

const SideBar = ({ isOpen, onClose }) => {
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

  const role = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return "Unknown Role";
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser.role || "Unknown Role";
    } catch {
      return "Unknown Role";
    }
  }, []);

  return (
    <>
      <aside
        className={isOpen ? "sidebar sidebar-open" : "sidebar"}
        aria-hidden={!isOpen}
      >
        <div className="sidebar-header">
          <h2>MSA Quality Assurance</h2>
          <img src={MSA_Logo} className="logo-image" alt="MSA Logo" />
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/logout">Logout</Link>
        </nav>

        <div className="sidebar-footer">
          <img src={user_image} className="user-image" alt="User Image" />
          <div className="user-info">
            <p className="welcome-message">Welcome, {greetingName}!</p>
            <p className="user-role">{role}</p>
          </div>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
};

export default SideBar;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import MSA_Logo from "../../assets/MSA_Logo.png";

import staff_image from "../../assets/staff.jpg";
import student_image from "../../assets/student.png";


import "../../styles/SideBar.css";
import { HomeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../services/AuthContext";
import api from "../../api/axios";
import { getRoleLabel } from "../../services/roleUtils";


const SideBar = ({ isOpen, pages = [] }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navigate = useNavigate();
  const { setUser, user } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await api.post("/View/LogoutView.php", {});

      if (response?.data?.status === "success") {
        setUser(null);
        toast.success("Logged out");
        navigate("/", { replace: true });
      } else {
        const msg = response?.data?.message || "Logout failed";
        toast.error(msg);
      }
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };

  return (
    <aside
      className={isOpen ? "sidebar sidebar-open" : "sidebar"}
      aria-hidden={!isOpen}
    >
      <div className="sidebar-top">
        <div className="sidebar-header">
          <img src={MSA_Logo} className="logo-image" alt="MSA Logo" />
          <h2>MSA Quality Assurance</h2>
        </div>

        <nav className="sidebar-nav">
          {pages.map((page) => {
            const SidebarIcon = page.sidebarIcon ?? HomeIcon;

            return (
              <div
                key={page.path}
                className={`sidebar-item ${currentPath === page.path ? "active" : ""}`}
              >
                <SidebarIcon size={16} className="sideItemIcon" />
                <Link to={page.path}>{page.sidebarLabel ?? "Home"}</Link>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-divider"></div>
        <div className="sidebar-footer">
          <div className="info-container">
            <img src={getRoleLabel(user?.role) === "Student" ? student_image : staff_image} className="user-image" alt="User Image" />
            <div className="user-info">
              <p className="welcome-message">Welcome, {user?.name || "User"}!</p>
              <p className="user-role">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;

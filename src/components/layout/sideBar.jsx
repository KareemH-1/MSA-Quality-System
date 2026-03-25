import React from "react";
import { Link , useLocation} from "react-router-dom";
import MSA_Logo from "../../assets/MSA_Logo.png";
import user_image from "../../assets/user.jpg";
import "../../styles/SideBar.css";
import { HomeIcon } from "lucide-react";

const SideBar = ({ isOpen, pages = [] }) => {
  const location = useLocation();
  const currentPath = location.pathname;

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
        <img src={user_image} className="user-image" alt="User Image" />
        <div className="user-info">
          <p className="welcome-message">Welcome, Kareem!</p>
          <p className="user-role">QA Adminstrator</p>
        </div>
        </div>
        <button className="logout-btn">Logout</button>
      </div>
      </div>
    </aside>
  );
};

export default SideBar;

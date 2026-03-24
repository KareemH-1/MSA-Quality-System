import React from "react";
import { Link , useLocation} from "react-router-dom";
import MSA_Logo from "../../assets/MSA_Logo.png";
import user_image from "../../assets/user.jpg";
import "../../styles/SideBar.css";
import { Home, HomeIcon, User , Settings } from "lucide-react";

const SideBar = ({ isOpen }) => {
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
        <div className={`sidebar-item ${currentPath === "/home" ? "active" : ""}`}>
          <HomeIcon size={16} className="sideItemIcon"/>
          <Link to="/home">
            Home
          </Link>
        </div>
        <div className={`sidebar-item ${currentPath === "/profile" ? "active" : ""}`}>
          <User size={16} className="sideItemIcon"/>
          <Link to="/profile">
            Profile
          </Link>
        </div>
        <div className={`sidebar-item ${currentPath === "/settings" ? "active" : ""}`}>
          <Settings size={16} className="sideItemIcon"/>
          <Link to="/settings">
            Settings
          </Link>
        </div>
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

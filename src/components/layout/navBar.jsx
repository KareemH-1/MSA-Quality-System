import React from "react";
import "../../styles/NavBar.css";
import { Bell, Info, UserRoundPen } from "lucide-react";
import { motion } from "framer-motion";

const MotionNav = motion.nav;
const MotionSpan = motion.span;

const NavBar = ({ components = [] }) => {
  return (
    <MotionNav
      className="navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="nav-pages">
        {components.length > 0 ? (
          components.map((component, index) => (
            <button
              type="button"
              key={index}
              onClick={() => component.onClick?.()}
              className={`navbar-page-btn ${component.active ? 'active' : ''}`}
            >
              {component.name}
            </button>
          ))
        ) : (
          <h2 className="navbar-title">MSA Quality System</h2>
        )}
      </div>

      <div className="navbar-actions">
        <input className="navbar-search" type="text" placeholder="Search..." />
        <div className="navbar-icons">
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <button type="button" className="navbar-icon-btn" aria-label="Notifications">
              <Bell />
            </button>
          </MotionSpan>
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <button type="button" className="navbar-icon-btn" aria-label="Info">
              <Info />
            </button>
          </MotionSpan>
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <button type="button" className="navbar-icon-btn" aria-label="Profile">
              <UserRoundPen />
            </button>
          </MotionSpan>
        </div>
      </div>
    </MotionNav>
  );
};

export default NavBar;

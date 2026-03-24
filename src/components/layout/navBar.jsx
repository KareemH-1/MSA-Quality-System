import React from "react";
import { Link } from "react-router-dom";
import "../../styles/NavBar.css";
import { Bell, Info, UserRoundPen } from "lucide-react";
import { motion } from "framer-motion";

const MotionNav = motion.nav;
const MotionSpan = motion.span;

const NavBar = () => {
  return (
    <MotionNav
      className="navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
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
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <Bell />
          </MotionSpan>
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <Info />
          </MotionSpan>
          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <UserRoundPen />
          </MotionSpan>
        </div>
      </div>
    </MotionNav>
  );
};

export default NavBar;

import React from "react";
import { Link } from "react-router-dom";
import "../styles/NotFound.css";

const NotFound = () => {
  return (
    <section className="notfound-page">
      <div className="notfound-card">
        <p className="notfound-label">Error 404</p>

        <h1 className="notfound-title">Page not found</h1>

        <p className="notfound-text">
          The page you are trying to access does not exist or has been moved.
        </p>

        <Link to="/" className="notfound-link">
          Back to Home
        </Link>
      </div>
    </section>
  );
};

export default NotFound;

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotFound.css";
import { useAuth } from "../services/AuthContext";
import { getDefaultPageForRole } from "../services/pagesConfig";
import Loader from "../components/Loader";

const NotFound = () => {
  const navigate = useNavigate();
  const { user, authReady } = useAuth();

  useEffect(() => {
    // Redirect to user's default page if logged in, otherwise show 404
    if (authReady && user?.role) {
      const defaultPage = getDefaultPageForRole(user.role);
      navigate(defaultPage, { replace: true });
    }
  }, [authReady, user, navigate]);

  // Only show 404 if user is not authenticated
  if (!authReady) {
    return <Loader />;
  }

  if (user?.role) {
    return null;
  }

  return (
    <section className="notfound-page">
      <div className="notfound-card">
        <p className="notfound-label">Error 404</p>

        <h1 className="notfound-title">Page not found</h1>

        <p className="notfound-text">
          The page you are trying to access does not exist or has been moved.
        </p>

        <button
          type="button"
          className="notfound-link"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </div>
    </section>
  );
};

export default NotFound;

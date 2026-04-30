import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, MoveRight, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { getDefaultPageForRole } from "../../services/pagesConfig";
import { normalizeRole } from "../../services/roleUtils";

import api from "../../api/axios";

const containerVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionForm = motion.form;

const LoginForm = ({ onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setRole, setName } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = showPassword ? "text" : "password";
  const toggleLabel = showPassword ? "Hide password" : "Show password";
  const ToggleIcon = showPassword ? EyeOff : Eye;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await api.post("/Controller/AuthController.php", {
        email,
        password,
        rememberMe,
      });

      if (response.data?.status === "success") {
        const name = response.data.user.name || "";
        const role = normalizeRole(response.data.user.role || "");
        toast.success(`Welcome back${name ? ', ' + name : ''}!`);
        if (rememberMe) {
          setUser({ name, role, _remember: true });
        } else {
          setRole(role);
          setName(name);
        }
        // Redirect to user's default page based on role
        const defaultPage = getDefaultPageForRole(role);
        navigate(defaultPage, { replace: true });
      } else {
        // Server responded 200 but with a failure status
        toast.error(response.data?.message || "Invalid credentials");
        console.log("Login failed:", response.data); // Log full response for debugging
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionDiv
      className="login-panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <MotionDiv className="login-header" variants={itemVariants}>
        <h1>Portal Access</h1>
        <p>Login to your account</p>
      </MotionDiv>

      <MotionForm variants={itemVariants} onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">University Email</label>
        <div className="input-group">
          <div className="input-icon" aria-hidden="true">@</div>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="username"
            placeholder="University Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <label htmlFor="password">Password</label>
        <div className="input-group">
          <div className="input-icon" aria-hidden="true">
            <Lock />
          </div>
          <input
            type={passwordType}
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={toggleLabel}
            aria-pressed={showPassword}
          >
            <ToggleIcon aria-hidden="true" />
          </button>
        </div>

        <div className="form-row">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            className="forgot-password"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        <MotionButton
          type="submit"
          className="submit-btn"
          disabled={loading}
          whileHover={!loading ? { y: -1 } : undefined}
          whileTap={!loading ? { y: 0, scale: 0.99 } : undefined}
        >
          <span>{loading ? "Authenticating..." : "Sign In"}</span>
          {!loading && <MoveRight aria-hidden="true" />}
        </MotionButton>
      </MotionForm>
    </MotionDiv>
  );
};

export default LoginForm;
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, MoveRight, Eye, EyeOff } from "lucide-react";

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
  const [currentRole, setCurrentRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: currentRole }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      //save token to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to home page
      window.location.href = "/home";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let passwordType = "password";
  let toggleLabel = "Show password";
  let ToggleIcon = Eye;

  if (showPassword) {
    passwordType = "text";
    toggleLabel = "Hide password";
    ToggleIcon = EyeOff;
  }

  return (
    <MotionDiv
      className="login-panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <MotionDiv className="Header" variants={itemVariants}>
        <h1>Portal Access</h1>
        <p>Login to your account</p>
      </MotionDiv>
      <MotionDiv className="Portal-Options" variants={itemVariants}>
        <MotionButton
          type="button"
          className={`student-btn btn ${currentRole === "student" ? "is-active" : ""}`}
          onClick={() => setCurrentRole("student")}
          whileTap={{ scale: 0.98 }}
        >
          Student Login
        </MotionButton>

        <MotionButton
          type="button"
          className={`staff-btn btn ${currentRole === "staff" ? "is-active" : ""}`}
          onClick={() => setCurrentRole("staff")}
          whileTap={{ scale: 0.98 }}
        >
          Staff Login
        </MotionButton>
      </MotionDiv>
      <MotionForm variants={itemVariants} onSubmit={handleSubmit}>
        <label htmlFor="username">University Email</label>

        <MotionDiv className="input-group" whileFocus={{ scale: 1.01 }}>
          <div className="input-icon">@</div>
          <input
            type="email"
            id="username"
            placeholder="University Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </MotionDiv>
        <label htmlFor="password">Password</label>

        <MotionDiv className="input-group" whileFocus={{ scale: 1.01 }}>
          <div className="input-icon">
            <Lock />
          </div>
          <input
            type={passwordType}
            id="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={toggleLabel}
          >
            <ToggleIcon />
          </button>
        </MotionDiv>

        {error ? <p className="error-message">{error}</p> : null}

        <div className="form-links">
          <button
            type="button"
            className="forgot-password"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>
        <MotionDiv
          className="submit-div"
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
        >
          <MotionButton
            type="submit"
            whileTap={{ scale: 0.99 }}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </MotionButton>
          <MoveRight />
        </MotionDiv>
      </MotionForm>
    </MotionDiv>
  );
};

export default LoginForm;

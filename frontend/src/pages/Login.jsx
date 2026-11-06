import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./Login.css";

function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : err.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");

    try {
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email first to reset your password.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Could not send the reset email.");
    }
  };

  return (
    <div className="login-page">
      <Navbar />

      <main className="login-main">
        <section className="login-card">

          <div className="login-visual">
            <div className="visual-content">
              <span className="visual-label">YOUR NEXT CHAPTER</span>

              <h1>
                Every book
                <br />
                opens a <span>new world.</span>
              </h1>

              <p>
                Discover stories, explore ideas, and make every page
                a part of your journey.
              </p>

              <div className="visual-quote">
                "A reader lives a thousand lives before he dies."
              </div>
            </div>

            <div className="visual-decoration">bookhub.</div>
          </div>

          <div className="login-form-section">
            <div className="login-heading">
              <span className="form-eyebrow">WELCOME BACK</span>
              <h2>Sign in to Bookhub</h2>
              <p>Your bookshelf is waiting for you.</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>

              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="password-label-row">
                <label htmlFor="login-password">Password</label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {error && <p className="login-error">{error}</p>}
              {message && <p className="login-success">{message}</p>}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="login-divider">
              <span></span>
              <p>OR CONTINUE WITH</p>
              <span></span>
            </div>

            <button
              type="button"
              className="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="google-g">G</span>
              Continue with Google
            </button>

            <p className="signup-prompt">
              Don't have an account?
              <Link to="/signup"> Create one</Link>
            </p>

            <p className="login-footer">
              By continuing, you agree to Bookhub's terms and privacy policy.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}

export default Login;

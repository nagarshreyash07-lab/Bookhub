import "./Signup.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must contain at least 6 characters.");
    }

    try {
      setLoading(true);
      await signup(name.trim(), email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "An account already exists with this email."
          : err.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message || "Google signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <Navbar />

      <main className="signup-main">
        <section className="signup-card">

          {/* LEFT VISUAL SECTION */}

          <div className="signup-visual">
            <div className="signup-visual-content">
              <span className="signup-visual-label">
                BEGIN YOUR JOURNEY
              </span>

              <h1>
                A world of
                <br />
                stories awaits
                <br />
                <span>you.</span>
              </h1>

              <p>
                Build your personal library, discover remarkable books,
                and explore ideas that stay with you.
              </p>

              <div className="signup-quote">
                Every great journey begins with a single page.
              </div>
            </div>

            <div className="signup-decoration">bookhub.</div>
          </div>

          {/* RIGHT FORM SECTION */}

          <div className="signup-form-section">

            <div className="signup-heading">
              <span className="signup-eyebrow">CREATE YOUR ACCOUNT</span>

              <h2>Join Bookhub</h2>

              <p>Your next favourite book is waiting.</p>
            </div>

            <form className="signup-form" onSubmit={handleSignup}>

              <label htmlFor="signup-name">Full name</label>

              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              <label htmlFor="signup-email">Email address</label>

              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="signup-password">Password</label>

              <div className="signup-password-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label htmlFor="signup-confirm-password">
                Confirm password
              </label>

              <div className="signup-password-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="signup-password-hint">
                Use at least 6 characters for your password.
              </p>

              {error && <p className="signup-error">{error}</p>}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

            </form>

            <div className="signup-divider">
              <span></span>
              <p>OR CONTINUE WITH</p>
              <span></span>
            </div>

            <button
              type="button"
              className="signup-google-btn"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <span className="signup-google-g">G</span>
              Continue with Google
            </button>

            <p className="signup-login-prompt">
              Already have an account?
              <Link to="/login"> Sign in</Link>
            </p>

            <p className="signup-footer">
              By creating an account, you agree to Bookhub's terms
              and privacy policy.
            </p>

          </div>
        </section>
      </main>
    </div>
  );
}

export default Signup;
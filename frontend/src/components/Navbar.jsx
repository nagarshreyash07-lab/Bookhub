
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import "./Navbar.css";
import "./Navbar.css";

function Navbar() {
  const { cartCount } = useCart();
  const { currentUser, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  const userName = currentUser?.displayName || "Reader";
  const userInitial = userName.charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="navbar">
      <Link className="logo" to="/">
        book<span>hub.</span>
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/books">Explore Books</Link>
        <Link to="/cart">
          Cart ({cartCount})
        </Link>
      </nav>

      <div className="nav-actions">
        {!currentUser ? (
          <>
            <Link to="/login" className="login-btn">
              Login
            </Link>

            <Link to="/signup" className="signup-btn">
              Sign Up
            </Link>
          </>
        ) : (
          <div className="user-menu">
            <button
              className="user-profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Open account menu"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="user-avatar"
                />
              ) : (
                <span className="user-avatar user-initial">
                  {userInitial}
                </span>
              )}

              <span className="user-name">
                {userName}
              </span>

              <span className={`dropdown-arrow ${menuOpen ? "open" : ""}`}>
                ▼
              </span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="dropdown-overlay"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="user-dropdown">
                  <div className="dropdown-user-info">
                    <strong>{userName}</strong>
                    <span>{currentUser.email}</span>
                  </div>

                  <div className="dropdown-divider" />

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>👤</span> My Profile
                  </Link>

                  <Link
                    to="/library"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>📚</span> My Library
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>📦</span> My Orders
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <span>↪</span>
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

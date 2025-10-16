import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    const userStr = localStorage.getItem("kobutor_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUsername(user.username || user.email || "User");
      } catch (err) {
        console.error("Error parsing user:", err);
        setIsLoggedIn(false);
      }
    }

    const handleStorageChange = () => {
      const token = localStorage.getItem("kobutor_token");
      const userStr = localStorage.getItem("kobutor_user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsLoggedIn(true);
          setUsername(user.username || user.email || "User");
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kobutor_token");
    localStorage.removeItem("kobutor_user");
    setIsLoggedIn(false);
    setUsername("");
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-black/50 backdrop-blur-sm sticky top-0 z-[60] text-white">
      <div className="flex items-center justify-between px-6 py-4 relative">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`text-2xl md:hidden focus:outline-none z-[70] relative transition-opacity duration-200 ${
            menuOpen ? "opacity-100" : "opacity-90 hover:opacity-100"
          }`}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide hover:opacity-80 transition-opacity"
        >
          🕊️ KOBUTOR
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/" className="hover:underline px-3 py-2">Home</Link>
          {isLoggedIn && (
            <>
              <Link to="/release" className="hover:underline px-3 py-2">Release</Link>
              <Link to="/hunt" className="hover:underline px-3 py-2">Hunt</Link>
              <Link to="/chat" className="hover:underline px-3 py-2">Chat</Link>
            </>
          )}
          <Link to="/about" className="hover:underline px-3 py-2">About</Link>
          <Link to="/contact" className="hover:underline px-3 py-2">Contact</Link>
          <Link to="/faq" className="hover:underline px-3 py-2">FAQ</Link>

          {isLoggedIn ? (
            <div className="flex items-center space-x-3 ml-4">
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                👋 {username}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 ml-4">
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 ${
          menuOpen ? "bg-black/50" : "bg-black/0"
        } backdrop-blur-sm z-[50] transform transition-all duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="flex flex-col space-y-6 mt-20 px-6 text-lg font-medium bg-black/90">
          <Link to="/" onClick={closeMenu}>Home</Link>
          {isLoggedIn && (
            <>
              <Link to="/release" onClick={closeMenu}>Release</Link>
              <Link to="/hunt" onClick={closeMenu}>Hunt</Link>
              <Link to="/chat" onClick={closeMenu}>Chat</Link>
            </>
          )}
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/faq" onClick={closeMenu}>FAQ</Link>

          <div className="border-t border-white/30 pt-4">
            {isLoggedIn ? (
              <>
                <span className="block text-white/80 mb-3">👋 {username}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white w-full"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-center text-white mb-2"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="block bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-center text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

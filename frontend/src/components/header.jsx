import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("kobutor_token");
    const userStr = localStorage.getItem("kobutor_user");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUsername(user.username || user.email || "User"); // Use username or fallback to email
      } catch (error) {
        console.error("Error parsing user data:", error);
        setIsLoggedIn(false);
        setUsername("");
      }
    } else {
      setIsLoggedIn(false);
      setUsername("");
    }
    
    // Listen for storage changes (for when login/logout happens in other tabs)
    const handleStorageChange = () => {
      const token = localStorage.getItem("kobutor_token");
      const userStr = localStorage.getItem("kobutor_user");
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsLoggedIn(true);
          setUsername(user.username || user.email || "User");
        } catch (error) {
          console.error("Error parsing user data:", error);
          setIsLoggedIn(false);
          setUsername("");
        }
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kobutor_token");
    localStorage.removeItem("kobutor_user");
    setIsLoggedIn(false);
    setUsername("");
    // Redirect to home page
    window.location.href = "/";
  };

  return (
    <header className="flex justify-between items-center p-6 bg-black/30">
      <Link to="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
        🕊️ KOBUTOR
      </Link>
      <nav className="space-x-4 flex items-center">
        <Link to="/" className="bg-transparent hover:underline px-4 py-2 rounded">Home</Link>
        {isLoggedIn && (
          <>
            <Link to="/release" className="bg-transparent hover:underline px-4 py-2 rounded">Release</Link>
            <Link to="/hunt" className="bg-transparent hover:underline px-4 py-2 rounded">Hunt</Link>
            <Link to="/chat" className="bg-transparent hover:underline px-4 py-2 rounded">Chat</Link>
          </>
        )}
        <Link to="/about" className="bg-transparent hover:underline px-4 py-2 rounded">About</Link>
        <Link to="/contact" className="bg-transparent hover:underline px-4 py-2 rounded">Contact</Link>
        <Link to="/faq" className="bg-transparent hover:underline px-4 py-2 rounded">FAQ</Link>
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4 ml-4">
            <span className="text-white text-sm bg-white/10 px-3 py-1 rounded-full">
              👋 {username}
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 ml-4">
            <Link 
              to="/login" 
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/signup" 
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
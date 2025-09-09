import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("kobutor_token");
    const user = localStorage.getItem("kobutor_user");
    
    if (token && user) {
      setIsLoggedIn(true);
      setUsername(user);
    } else {
      setIsLoggedIn(false);
      setUsername("");
    }
    
    // Listen for storage changes (for when login/logout happens in other tabs)
    const handleStorageChange = () => {
      const token = localStorage.getItem("kobutor_token");
      const user = localStorage.getItem("kobutor_user");
      const username = localStorage.getItem("kobutor_username");
      if (token && user) {
        setIsLoggedIn(true);
        setUsername(username);
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
      <div className="text-2xl font-bold">🕊️ KOBUTOR</div>
      <nav className="space-x-4 flex items-center">
        <Link to="/" className="bg-transparent hover:underline px-4 py-2 rounded">Home</Link>
        {isLoggedIn && (
          <>
            <Link to="/release" className="bg-transparent hover:underline px-4 py-2 rounded">Release</Link>
            <Link to="/hunt" className="bg-transparent hover:underline px-4 py-2 rounded">Hunt</Link>
          </>
        )}
        <Link to="/about" className="bg-transparent hover:underline px-4 py-2 rounded">About</Link>
        <Link to="/contact" className="bg-transparent hover:underline px-4 py-2 rounded">Contact</Link>
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <span className="text-white">Welcome, {username}!</span>
            <button 
              onClick={handleLogout}
              className="bg-transparent hover:underline px-4 py-2 rounded"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-transparent hover:underline px-4 py-2 rounded">Log In</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
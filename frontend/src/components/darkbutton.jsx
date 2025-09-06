import React, { useEffect } from "react";

const DarkButton = ({ isDark, setIsDark }) => {
  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, [setIsDark]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    // Save theme preference to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-36 right-6 z-50 p-3 rounded-full backdrop-blur-md bg-white/80 dark:bg-gray-800/80 shadow-lg hover:scale-110 transition-all"
      aria-label="Toggle theme"
    >
      {isDark ? "🌞" : "🌙"}
    </button>
  );
};

export default DarkButton;
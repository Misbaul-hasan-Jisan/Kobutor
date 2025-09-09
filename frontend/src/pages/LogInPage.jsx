import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Apply theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

 // In your handleLogin function:
const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const response = await fetch("http://localhost:3000/api/auth/login/kobutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password.toString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Invalid email or password");
      return;
    }

    // ✅ Store token and user properly
    localStorage.setItem("kobutor_token", data.token);
    localStorage.setItem("kobutor_user", JSON.stringify(data.user)); // Store as JSON string
    
    navigate("/release");
  } catch (err) {
    console.error("Login error:", err);
    setError("Failed to connect to server");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-xl shadow-lg p-6 sm:p-8 md:p-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 dark:text-white mb-6">
            Log in to Kobutor
          </h2>

          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="you@kobutor.com"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70"
            >
              {isLoading ? "Sending pigeon..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </a>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign up
              </a>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;

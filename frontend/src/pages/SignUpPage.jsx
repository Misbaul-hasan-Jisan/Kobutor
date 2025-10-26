import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
const API = import.meta.env.VITE_API_BASE_URL;

const EyeIcon = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeOffIcon = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6 0-10-7-10-7a18.6 18.6 0 0 1 4.12-4.86"
    />
    <path
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M1 1l22 22"
    />
    <path
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.88 9.88A3 3 0 0 0 14.12 14.12"
    />
  </svg>
);

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

 // In your SignUpPage.jsx - Update handleSignup function
const handleSignup = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch(`${API}/api/auth/signup/kobutor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.requiresVerification) {
        // Redirect to verification page WITHOUT storing user data
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      
      // This should not happen with the new flow
      setError("Unexpected response from server");
    } else {
      const errJson = await response.json();
      setError(errJson?.message || "Failed to sign up");
    }
  } catch (err) {
    setError("Failed to connect to server");
    console.error("Signup error:", err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? backgroundDark : background})`,
      }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-xl shadow-lg p-6 sm:p-8 md:p-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 dark:text-white mb-6">
            Sign up for Kobutor
          </h2>

          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="Choose a username"
              />
            </div>

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

            <div className="relative">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-12 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="Your password"
                aria-describedby="togglePassword"
              />
              <button
                type="button"
                id="togglePassword"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 top-7 flex items-center px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                )}
              </button>
            </div>

            <div className="relative">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-12 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="Confirm your password"
                aria-describedby="toggleConfirmPassword"
              />
              <button
                type="button"
                id="toggleConfirmPassword"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-pressed={showConfirmPassword}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute inset-y-0 right-2 top-7 flex items-center px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70"
            >
              {isLoading ? "Sending pigeon..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Log in
              </a>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SignupPage;
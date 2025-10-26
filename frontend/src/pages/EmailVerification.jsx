// src/pages/EmailVerification.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/Footer";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";

const API = import.meta.env.VITE_API_BASE_URL;

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Use ref to prevent duplicate verification attempts
  const verificationAttempted = useRef(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Only verify if we have a token and haven't attempted verification yet
    if (token && !verificationAttempted.current) {
      verificationAttempted.current = true;
      verifyEmail();
    } else if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      console.log("🔗 Starting email verification...");
      console.log("📧 Token:", token);
      
      const response = await fetch(`${API}/api/auth/verify-email?token=${token}`);
      
      console.log("📨 HTTP Status:", response.status);
      
      const data = await response.json();
      console.log("📨 Verification response:", data);

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
        
        // Store user data and token ONLY after successful verification
        if (data.user && data.token) {
          localStorage.setItem("kobutor_user", JSON.stringify(data.user));
          localStorage.setItem("kobutor_token", data.token);
          console.log("✅ User data stored in localStorage");
        }
        
        // Redirect to home page after successful verification
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to verify email");
      }

    } catch (error) {
      console.error("💥 Network error:", error);
      setStatus("error");
      setMessage("Failed to connect to server. Please check your internet connection and try again.");
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage("No email provided for resending verification");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Verification email sent successfully! Please check your email.");
      } else {
        setMessage(data.message || "Failed to resend verification email");
      }
    } catch (error) {
      setMessage("Failed to connect to server. Please try again.");
    } finally {
      setIsResending(false);
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
        className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-xl shadow-lg p-6 sm:p-8 md:p-10 w-full max-w-md"
      >
        <h2 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          Email Verification
        </h2>

        <div className="text-center">
          {status === "verifying" && token && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-700 dark:text-gray-300">Completing your registration...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 dark:text-green-400 text-lg font-medium">{message}</p>
              <p className="text-gray-600 dark:text-gray-400">Your account has been created and you are now signed in!</p>
              <p className="text-gray-600 dark:text-gray-400">Redirecting to home page...</p>
            </div>
          )}

          {/* Show error OR no-token state, but NOT both */}
          {(status === "error" || !token) && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              {/* Show appropriate message based on condition */}
              {!token ? (
                <p className="text-red-600 dark:text-red-400">No verification token provided</p>
              ) : (
                <p className="text-red-600 dark:text-red-400">{message}</p>
              )}
              
              <p className="text-gray-700 dark:text-gray-300">
                Check your email for a verification link. If you didn't receive it, you can request a new one.
              </p>
              
              {/* SINGLE resend button */}
              {email && (
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-70 transition-colors"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    </main>

    <Footer />
  </div>
);
};

export default EmailVerification;
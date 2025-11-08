// src/pages/EmailVerification.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [status, setStatus] = useState("checking"); // Changed initial state
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const verificationAttempted = useRef(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // First check if we have a token
    if (!token) {
      setStatus("no-token");
      setMessage("No verification token provided");
      return;
    }

    // If we have a token and haven't attempted verification, start verifying
    if (token && !verificationAttempted.current) {
      verificationAttempted.current = true;
      setStatus("verifying");
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      console.log("🔗 Starting email verification...");
      
      const response = await fetch(`${API}/api/auth/verify-email?token=${token}`);
      
      console.log("📨 HTTP Status:", response.status);
      
      const data = await response.json();
      console.log("📨 Verification response:", data);

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        
        if (data.user && data.token) {
          localStorage.setItem("kobutor_user", JSON.stringify(data.user));
          localStorage.setItem("kobutor_token", data.token);
          console.log("✅ User data stored in localStorage");
        }
        
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
      className="w-screen min-h-screen bg-cover bg-fixed bg-center text-white flex flex-col transition-all duration-500"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/15 dark:bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-10 md:p-12 w-full max-w-md border border-white/20 dark:border-white/10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Email Verification
            </h2>
            <p className="text-gray-300 dark:text-gray-400 text-sm">
              {status === "checking" && "Checking verification link..."}
              {status === "verifying" && "Completing your registration..."}
              {status === "success" && "Welcome to Kobutor!"}
              {status === "error" && "Verification failed"}
              {status === "no-token" && "Invalid verification link"}
            </p>
          </div>

          <div className="text-center">
            <AnimatePresence mode="wait">
              {/* Checking State */}
              {status === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
                  </div>
                  <div>
                    <p className="text-gray-200 dark:text-gray-300 font-medium">Checking your verification link...</p>
                  </div>
                </motion.div>
              )}

              {/* Verifying State */}
              {status === "verifying" && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-200 dark:text-gray-300 font-medium mb-2">Verifying your email...</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">This will only take a moment</p>
                  </div>
                </motion.div>
              )}

              {/* Success State */}
              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <div className="space-y-3">
                    <p className="text-green-400 text-lg font-semibold">{message}</p>
                    <p className="text-gray-300 dark:text-gray-400">Your account has been successfully verified!</p>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1, duration: 2 }}
                      className="h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                    ></motion.div>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Redirecting to home page...</p>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <p className="text-red-400 font-semibold">{message}</p>
                    <p className="text-gray-300 dark:text-gray-400">
                      Please check your email for the verification link. If you can't find it, request a new one below.
                    </p>
                  </div>
                  
                  {email && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resendVerification}
                      disabled={isResending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-70 transition-all duration-200 shadow-lg w-full"
                    >
                      {isResending ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* No Token State */}
              {status === "no-token" && (
                <motion.div
                  key="no-token"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <p className="text-yellow-400 font-semibold">Invalid verification link</p>
                    <p className="text-gray-300 dark:text-gray-400">
                      The verification link appears to be incomplete or invalid. Please check your email for the complete verification link.
                    </p>
                  </div>
                  
                  {email && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resendVerification}
                      disabled={isResending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-70 transition-all duration-200 shadow-lg w-full"
                    >
                      {isResending ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        "Get New Verification Email"
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-white/10 text-center"
          >
            <button
              onClick={() => navigate("/login")}
              className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 font-medium transition-colors duration-200 hover:underline"
            >
              ← Back to Login
            </button>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailVerification;
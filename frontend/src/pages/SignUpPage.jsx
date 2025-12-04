import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import emailjs from "@emailjs/browser";
import { auth, googleProvider, signInWithPopup } from "../firebase";

const API = import.meta.env.VITE_API_BASE_URL;

const EyeIcon = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org2000/svg"
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

// Email sending function
const sendVerificationEmail = async (email, username, token) => {
  try {
    const verificationUrl = `${
      window.location.origin
    }/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const templateParams = {
      email: email,
      name: username,
      verification_url: verificationUrl,
      username: username,
    };

    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );

    console.log("✅ Email sent successfully");
    return result;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw error;
  }
};

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
        console.log("📨 Signup response:", data);

        if (data.requiresVerification && data.verificationToken) {
          try {
            await sendVerificationEmail(
              email,
              username,
              data.verificationToken
            );
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
            setError(
              "Account created but failed to send verification email. Please contact support."
            );
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          }
        } else if (data.user && data.token) {
          localStorage.setItem("kobutor_user", JSON.stringify(data.user));
          localStorage.setItem("kobutor_token", data.token);
          navigate("/");
        } else {
          setError("Unexpected response from server");
        }
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

const handleGoogleSignup = async () => {
  setIsGoogleLoading(true);
  setError("");
  
  try {
    // Sign in with Google using Firebase
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log("✅ Google signup successful:", user);
    
    // Extract user information
    const googleUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      authProvider: "google"
    };
    
    // Send user data to your backend to create/verify account
    const response = await fetch(`${API}/api/auth/signup/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      }),
    });
    
    console.log("📨 Backend response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("📨 Backend response data:", data);
      
      // Store user data in localStorage
      localStorage.setItem("kobutor_user", JSON.stringify({
        ...googleUser,
        id: data.user?.id || user.uid,
        username: data.user?.username || user.displayName || user.email.split('@')[0]
      }));
      
      if (data.token) {
        localStorage.setItem("kobutor_token", data.token);
      } else {
        // If no token from backend, store Firebase token
        const token = await user.getIdToken();
        localStorage.setItem("kobutor_token", token);
      }
      
      // Redirect to home page
      navigate("/");
    } else {
      // If backend fails, still allow login with Firebase data
      console.warn("Backend integration failed, using Firebase only");
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      
      localStorage.setItem("kobutor_user", JSON.stringify(googleUser));
      const token = await user.getIdToken();
      localStorage.setItem("kobutor_token", token);
      navigate("/");
    }
    
  } catch (error) {
    console.error("❌ Google signup error:", error);
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      setError("Google signup cancelled. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      setError("Popup blocked by browser. Please allow popups for this site.");
    } else if (error.code === 'auth/network-request-failed') {
      setError("Network error. Please check your internet connection.");
    } else if (error.code === 'auth/unauthorized-domain') {
      setError("This domain is not authorized for Google sign-in.");
    } else if (error.code === 'auth/operation-not-allowed') {
      setError("Google sign-in is not enabled. Please contact support.");
    } else {
      setError(`Google signup failed: ${error.message}`);
    }
  } finally {
    setIsGoogleLoading(false);
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
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}

          {/* Google Signup Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 disabled:opacity-70 border border-gray-300 dark:border-gray-600"
            >
              {isGoogleLoading ? (
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="CurrentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="px-4 text-sm text-gray-600 dark:text-gray-400">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

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
                minLength={6}
                className="w-full px-4 py-2 pr-12 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600"
                placeholder="Your password (min. 6 characters)"
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
                minLength={6}
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
              disabled={isLoading || isGoogleLoading}
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
// Hunt.jsx
import { useState, useEffect } from "react";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import Header from "../components/header";
import DarkButton from "../components/darkbutton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

// Import pigeon images (same assets used in ReleasePigeon)
import pigeonWhite from "../assets/pigeon-white.png";
import pigeonBlack from "../assets/pigeon-black.png";
import pigeonBrown from "../assets/pigeon-brown.png";

// Image-based pigeon component (replaces SVG)
const ImagePigeon = ({ color, onClick, isCaught }) => {
  const getPigeonImage = () => {
    switch (color) {
      case "black":
        return pigeonBlack;
      case "brown":
        return pigeonBrown;
      default:
        return pigeonWhite;
    }
  };

  const pigeonImage = getPigeonImage();

  return (
    <div
      className={`relative cursor-pointer transition-all duration-500 ${
        isCaught ? "opacity-0 scale-50" : "opacity-100 scale-100"
      }`}
      onClick={onClick}
      style={{
        transformOrigin: "center",
        willChange: "transform, opacity",
      }}
      role="button"
      aria-label={`pigeon ${color}`}
    >
      <img
        src={pigeonImage}
        alt={`${color} pigeon`}
        draggable={false}
        className="w-26 h-34 object-contain select-none pointer-events-none"
      />
    </div>
  );
};

// Message popup component (unchanged)
const MessagePopup = ({ message, onClose, color }) => {
  const bgColor =
    color === "white"
      ? "bg-gray-100"
      : color === "black"
      ? "bg-gray-800"
      : "bg-amber-100";

  const textColor =
    color === "white"
      ? "text-gray-800"
      : color === "black"
      ? "text-white"
      : "text-gray-800";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className={`${bgColor} ${textColor} rounded-xl p-6 max-w-md mx-4 relative`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-xl font-bold mb-4">You caught a pigeon!</h3>
        <div className="p-4 rounded-lg bg-white/20">
          <p className="italic">"{message}"</p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Release back to sky
        </button>
      </div>
    </div>
  );
};

function Hunt() {
  const [pigeons, setPigeons] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [huntLocation, setHuntLocation] = useState("Bangladesh");
  const navigate = useNavigate();

  // Apply theme
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

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch pigeons from API
  useEffect(() => {
    const fetchPigeons = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("kobutor_token");
        const response = await fetch(
          `http://localhost:3000/api/pigeons?location=${huntLocation}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Add random positions and animation delays
          const pigeonsWithPositions = data.map((pigeon) => ({
            ...pigeon,
            position: {
              x: Math.random() * 80 + 10, // 10-90% of screen width
              y: Math.random() * 70 + 15, // 15-85% of screen height
            },
            delay: Math.random() * 5, // 0-5s delay
            isCaught: false,
          }));
          setPigeons(pigeonsWithPositions);
        } else {
          console.error("Failed to fetch pigeons");
        }
      } catch (error) {
        console.error("Error fetching pigeons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPigeons();
  }, [huntLocation]);

  const handleCatchPigeon = async (id) => {
    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(`http://localhost:3000/api/pigeons/${id}/catch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        // Visual feedback: mark as caught (so image fades/zooms)
        setPigeons((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isCaught: true } : p))
        );
        // short delay to let animation play, then remove and navigate
        setTimeout(() => {
          setPigeons((prev) => prev.filter((p) => p.id !== id));
          if (data.chatId) {
            navigate(`/chat/${data.chatId}`);
          }
        }, 500);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Error catching pigeon:", err);
    }
  };

  const closeMessage = () => {
    setSelectedMessage(null);
    if (selectedMessage) {
      setTimeout(() => {
        setPigeons((prev) => prev.filter((p) => p.id !== selectedMessage.id));
      }, 500);
    }
  };

  const refreshPigeons = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("kobutor_token");
      const response = await fetch(
        `http://localhost:3000/api/pigeons?location=${huntLocation}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pigeonsWithPositions = data.map((pigeon) => ({
          ...pigeon,
          position: {
            x: Math.random() * 80 + 10,
            y: Math.random() * 70 + 15,
          },
          delay: Math.random() * 5,
          isCaught: false,
        }));
        setPigeons(pigeonsWithPositions);
      }
    } catch (error) {
      console.error("Error refreshing pigeons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center transition-all duration-500 overflow-hidden"
        style={{
          backgroundImage: `url(${isDark ? backgroundDark : background})`,
        }}
      >
        {/* Header should be above everything */}
        <div className="absolute top-0 left-0 w-full z-50">
          <Header />
          <DarkButton isDark={isDark} setIsDark={setIsDark} />
        </div>

        {/* Pigeon counter */}
        <div className="absolute top-20 left-4 z-10 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg text-white">
          <div className="text-sm">
            Pigeons in sky: {pigeons.filter((p) => !p.isCaught).length}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 mx-auto text-center text-white bg-black/50 p-2 rounded-lg max-w-md">
          <p className="text-sm">
            Click on pigeons to catch them and read their messages!
          </p>
        </div>

        {/* Controls */}
        <div className="absolute top-20 right-4 z-40 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm">Hunt in:</span>
            <select
              value={huntLocation}
              onChange={(e) => setHuntLocation(e.target.value)}
              className="bg-white/20 px-2 py-1 rounded text-white dark:bg-gray-700"
            >
              <option>Bangladesh</option>
              <option>Global</option>
              <option>Random</option>
            </select>
          </div>
          <button
            onClick={refreshPigeons}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Refresh"}
          </button>
        </div>

        {/* Pigeons flying in the sky (image-based) */}
        <div className="absolute inset-0 pointer-events-none">
          {pigeons.map((pigeon) => (
            <div
              key={pigeon.id}
              className="absolute animate-float pointer-events-auto"
              style={{
                left: `${pigeon.position.x}%`,
                top: `${pigeon.position.y}%`,
                animationDelay: `${pigeon.delay}s`,
                transition: "left 0.6s linear, top 0.6s linear",
                zIndex: pigeon.isCaught ? 20 : 5,
              }}
            >
              <ImagePigeon
                color={pigeon.color}
                onClick={() => handleCatchPigeon(pigeon.id)}
                isCaught={pigeon.isCaught}
              />
            </div>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="text-white text-xl">Searching for pigeons...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && pigeons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white text-center bg-black/50 p-6 rounded-xl">
              <h3 className="text-xl mb-2">No pigeons in the sky</h3>
              <p className="mb-4">
                Try changing location or refresh to find messages
              </p>
              <button
                onClick={refreshPigeons}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message popup */}
      {selectedMessage && (
        <MessagePopup
          message={selectedMessage.content}
          onClose={closeMessage}
          color={selectedMessage.color}
        />
      )}

      <Footer />

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(-3deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          75% { transform: translateY(-12px) rotate(-1deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default Hunt;

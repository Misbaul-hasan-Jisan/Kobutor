import { useState, useEffect } from "react";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import Header from "../components/header";
import DarkButton from "../components/darkbutton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

// Import pigeon images
import pigeonWhite from "../assets/pigeon-white.png";
import pigeonBlack from "../assets/pigeon-black.png";
import pigeonBrown from "../assets/pigeon-brown.png";

// Image-based pigeon component
const ImagePigeon = ({ color, onClick }) => {
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

  return (
    <div
      className="relative cursor-pointer transition-all duration-500"
      onClick={onClick}
      role="button"
      aria-label={`pigeon ${color}`}
    >
      <img
        src={getPigeonImage()}
        alt={`${color} pigeon`}
        draggable={false}
        className="w-26 h-34 object-contain select-none pointer-events-none"
      />
    </div>
  );
};

// Message popup component
const MessagePopup = ({ message, pigeon, onRelease, onChat, color }) => {
  const bgColor =
    color === "white"
      ? "bg-gray-100"
      : color === "black"
      ? "bg-gray-800"
      : "bg-amber-100";

  const textColor =
    color === "black" ? "text-white" : "text-gray-800";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className={`${bgColor} ${textColor} rounded-xl p-6 max-w-md mx-4 relative`}
      >
        <button
          onClick={onRelease}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-xl font-bold mb-4">You caught a pigeon!</h3>
        <div className="p-4 rounded-lg bg-white/20">
          <p className="italic">"{message}"</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onRelease}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Release back to sky
          </button>
          <button
            onClick={onChat}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
};

function Hunt() {
  const [pigeons, setPigeons] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [selectedPigeon, setSelectedPigeon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [huntLocation, setHuntLocation] = useState("Random");
  const navigate = useNavigate();

  // Location options
const locationOptions = [
  { value: "Random", description: "Pigeons from all locations" },
  { value: "Bangladesh", description: "Local pigeons from Bangladesh" },
  { value: "Global", description: "International pigeons worldwide" },
];

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

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch pigeons
  useEffect(() => {
    const fetchPigeons = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("kobutor_token");
        const response = await fetch(
          `https://kobutor.onrender.com/api/pigeons?location=${huntLocation}`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
          }));
          setPigeons(pigeonsWithPositions);
        }
      } catch (err) {
        console.error("Error fetching pigeons:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPigeons();
  }, [huntLocation]);

  // Catch (open popup only)
  const handleCatchPigeon = (pigeon) => {
    setSelectedPigeon(pigeon);
  };

  // Release back to sky
  const handleReleasePigeon = () => {
    setSelectedPigeon(null);
  };

  // Start chat (API call + remove pigeon)
  const handleStartChat = async () => {
    if (!selectedPigeon) return;
    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `https://kobutor.onrender.com/api/pigeons/${selectedPigeon.id}/catch`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPigeons((prev) => prev.filter((p) => p.id !== selectedPigeon.id));
        navigate(`/chat/${data.chatId}`);
      } else {
        console.error("Chat error:", data.message);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setSelectedPigeon(null);
    }
  };

  // Refresh pigeons
  const refreshPigeons = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("kobutor_token");
      const response = await fetch(
        `https://kobutor.onrender.com/api/pigeons?location=${huntLocation}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
        }));
        setPigeons(pigeonsWithPositions);
      }
    } catch (err) {
      console.error("Error refreshing pigeons:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationDescription = () => {
    const location = locationOptions.find((loc) => loc.value === huntLocation);
    return location?.description || "Search for pigeon messages";
  };

  return (
    <>
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center transition-all duration-500 overflow-hidden"
        style={{
          backgroundImage: `url(${isDark ? backgroundDark : background})`,
        }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full z-50">
          <Header />
          <DarkButton isDark={isDark} setIsDark={setIsDark} />
        </div>

        {/* Pigeon counter */}
        <div className="absolute top-20 left-4 z-10 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg text-white">
          <div className="text-sm">🕊️ Pigeons: {pigeons.length}</div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 mx-auto text-center text-white bg-black/50 p-3 rounded-lg max-w-md z-10">
          <p className="text-sm">Click on pigeons to catch them and read their messages!</p>
        </div>

        {/* Controls */}
        <div className="absolute top-20 right-4 z-40 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm">📍 Hunt in:</span>
            <select
              value={huntLocation}
              onChange={(e) => setHuntLocation(e.target.value)}
              className="bg-white/20 px-2 py-1 rounded text-white dark:bg-gray-700 text-sm"
            >
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-white/70 mb-2 text-center max-w-40">
            {getLocationDescription()}
          </p>
          <button
            onClick={refreshPigeons}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors"
          >
            {isLoading ? "🔍 Searching..." : "🔄 Refresh Pigeons"}
          </button>
        </div>

        {/* Pigeons */}
        <div className="absolute inset-0 pointer-events-none">
          {pigeons.map((pigeon) => (
            <div
              key={pigeon.id}
              className="absolute animate-float pointer-events-auto"
              style={{
                left: `${pigeon.position.x}%`,
                top: `${pigeon.position.y}%`,
                animationDelay: `${pigeon.delay}s`,
              }}
            >
              <ImagePigeon
                color={pigeon.color}
                onClick={() => handleCatchPigeon(pigeon)}
              />
            </div>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
            <div className="text-white text-xl flex flex-col items-center">
              <div className="animate-bounce text-2xl mb-2">🐦</div>
              <p>Searching for pigeons...</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && pigeons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-white text-center bg-black/50 p-6 rounded-xl">
              <div className="text-4xl mb-4">🌌</div>
              <h3 className="text-xl mb-2">No pigeons in the sky</h3>
              <p className="mb-4">Try changing location or refresh to find messages</p>
              <button
                onClick={refreshPigeons}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup */}
      {selectedPigeon && (
        <MessagePopup
          message={selectedPigeon.content}
          pigeon={selectedPigeon}
          onRelease={handleReleasePigeon}
          onChat={handleStartChat}
          color={selectedPigeon.color}
        />
      )}

      <Footer />

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          75% { transform: translateY(-8px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default Hunt;

import { useState, useEffect, useRef } from 'react';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from '../components/header';
import DarkButton from '../components/darkbutton';
import { useNavigate } from 'react-router-dom';

// Import pigeon images
import pigeonWhite from '../assets/pigeon-white.png';
import pigeonBlack from '../assets/pigeon-black.png';
import pigeonBrown from '../assets/pigeon-brown.png';

const API = import.meta.env.VITE_API_BASE_URL;

// 🕊️ Flying pigeon animation
const FlyingPigeon = ({ color, onAnimationEnd }) => {
  const getPigeonImage = () => {
    switch (color) {
      case 'black':
        return pigeonBlack;
      case 'brown':
        return pigeonBrown;
      default:
        return pigeonWhite;
    }
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 animate-pigeon-release pointer-events-none"
      onAnimationEnd={onAnimationEnd}
      style={{ transform: 'translate(-50%, -50%)', zIndex: 15 }}
    >
      <img
        src={getPigeonImage()}
        alt={`${color} pigeon`}
        className="w-24 h-20 sm:w-20 sm:h-16 object-contain select-none"
      />
    </div>
  );
};

function ReleasePigeon() {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('white');
  const [location, setLocation] = useState('Bangladesh');
  const [isDark, setIsDark] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64); // default
  const navigate = useNavigate();
  const headerRef = useRef(null);

  // Detect actual header height dynamically
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // Theme setup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('kobutor_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleRelease = async () => {
    setError('');
    setSuccess('');
    const token = localStorage.getItem('kobutor_token');
    if (!token) {
      setError('You must be logged in to release a pigeon.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message for your pigeon.');
      return;
    }

    setIsReleasing(true);

    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/pigeons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: message, color, location }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Failed to release pigeon.');
          return;
        }

        setSuccess('Your pigeon has been released!');
        setMessage('');
      } catch (err) {
        console.error('Release failed:', err);
        setError('Failed to connect to server.');
      } finally {
        setIsReleasing(false);
      }
    }, 3000);
  };

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? backgroundDark : background})`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div ref={headerRef} className="sticky top-0 z-20">
        <Header />
      </div>

      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      {/* Flying pigeon animation */}
      {isReleasing && <FlyingPigeon color={color} />}

      {/* Main Content - Full screen container */}
      <div
        className="flex items-center justify-center w-full min-h-full px-4 sm:px-6 md:px-8 py-4"
        style={{ 
          minHeight: `calc(100vh - ${headerHeight}px)`,
          height: `calc(100vh - ${headerHeight}px)`
        }}
      >
        <div
          className={`w-full max-w-2xl bg-black/60 dark:bg-gray-800/90 text-white dark:text-white rounded-xl shadow-2xl p-6 sm:p-8 backdrop-blur-md transition-all duration-300 ${
            isReleasing ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
            Release a Pigeon
          </h1>
          <p className="text-center text-base sm:text-lg mb-6 text-gray-60 dark:text-white">
            Enter your message below, then release your pigeon!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm text-center">
              {success}
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full h-36 sm:h-40 p-4 rounded-lg bg-black/30 dark:bg-gray-800/60 border border-white/30 dark:border-gray-600 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-6 resize-none"
            disabled={isReleasing}
          />

          {/* Pigeon color */}
          <div className="mb-6 text-center">
            <p className="mb-3 font-semibold text-g dark:text-gray-200">
              Choose your pigeon color:
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {['black', 'white', 'brown'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={isReleasing}
                  className={`px-4 py-2 rounded-full border transition-all text-sm sm:text-base ${
                    color === c
                      ? 'bg-yellow-400 text-black font-bold border-yellow-500'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white border-gray-300 dark:border-gray-500'
                  } disabled:opacity-50`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6 text-center">
            <p className="mb-3 font-semibold text-white dark:text-gray-200">
              Hunt in:
            </p>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isReleasing}
              className="px-4 py-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
            >
              <option>Bangladesh</option>
              <option>Global</option>
              <option>Random</option>
            </select>
          </div>

          {/* Release button */}
          <button
            onClick={handleRelease}
            disabled={isReleasing}
            className="bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-yellow-300 dark:hover:bg-yellow-400 transition-all mx-auto block disabled:opacity-50 text-base sm:text-lg w-full max-w-xs"
          >
            {isReleasing ? 'Releasing...' : 'Release'}
          </button>

          <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400 italic">
            Hunted pigeons are shared anonymously.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pigeon-release {
          0% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          50% { transform: translate(10vw, -50vh) scale(1.3); opacity: 1; }
          100% { transform: translate(100vw, -120vh) scale(0.6); opacity: 0; }
        }
        .animate-pigeon-release {
          animation: pigeon-release 3s ease-in forwards;
        }
        
        /* Ensure full coverage */
        body, html, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}

export default ReleasePigeon;